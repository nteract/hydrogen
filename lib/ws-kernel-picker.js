/* @flow */

import SelectListView from "atom-select-list";
import _ from "lodash";
import tildify from "tildify";
import v4 from "uuid/v4";

import Config from "./config";
import { Kernel, Session } from "./jupyter-js-services-shim";
import WSKernel from "./ws-kernel";
import store from "./store";

class CustomListView {
  emptyMessage: string;
  onConfirmed: (kernelSpecs: Kernelspec) => mixed;
  previouslyFocusedElement: ?HTMLElement;
  selectListView: SelectListView;
  panel: ?atom$Panel;

  constructor(emptyMessage, onConfirmed) {
    this.emptyMessage = emptyMessage;
    this.onConfirmed = onConfirmed;
    this.previouslyFocusedElement = document.activeElement;
    this.selectListView = new SelectListView({
      itemsClassList: ["mark-active"],
      items: [],
      filterKeyForItem: item => item.name,
      elementForItem: item => {
        const element = document.createElement("li");
        element.textContent = item.name;
        return element;
      },
      didConfirmSelection: item => {
        if (this.onConfirmed) this.onConfirmed(item);
        this.cancel();
      },
      didCancelSelection: () => this.cancel(),
      emptyMessage: this.emptyMessage
    });

    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this.selectListView });
    }
    this.panel.show();
    this.selectListView.focus();
  }

  destroy() {
    this.cancel();
    return this.selectListView.destroy();
  }

  cancel() {
    if (this.panel != null) {
      this.panel.destroy();
    }
    this.panel = null;
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }
}

export default class WSKernelPicker {
  _onChosen: (kernel: Kernel) => void;
  _kernelSpecFilter: (kernelSpec: Kernelspec) => boolean;
  _path: string;
  previouslyFocusedElement: ?HTMLElement;

  constructor(onChosen: (kernel: Kernel) => void) {
    this._onChosen = onChosen;
  }

  async toggle(_kernelSpecFilter: (kernelSpec: Kernelspec) => boolean) {
    this._kernelSpecFilter = _kernelSpecFilter;
    const gateways = Config.getJson("gateways") || [];
    if (_.isEmpty(gateways)) {
      atom.notifications.addError("No remote kernel gateways available", {
        description:
          "Use the Hydrogen package settings to specify the list of remote servers. Hydrogen can use remote kernels on either a Jupyter Kernel Gateway or Jupyter notebook server."
      });
      return;
    }
    const path = store.editor ? store.editor.getPath() : null;

    this._path = `${path || "unsaved"}-${v4()}`;
    const gatewayListing = new CustomListView(
      "No gateways available",
      this.onGateway.bind(this)
    );
    this.previouslyFocusedElement = gatewayListing.previouslyFocusedElement;
    await gatewayListing.selectListView.update({
      items: gateways,
      infoMessage: "Select a gateway"
    });
  }

  async onGateway(gatewayInfo: any) {
    const sessionListing = new CustomListView(
      "No sessions available",
      this.onSession.bind(this)
    );
    try {
      const specModels = await Kernel.getSpecs(gatewayInfo.options);
      const kernelSpecs = _.filter(specModels.kernelspecs, spec =>
        this._kernelSpecFilter(spec)
      );

      const kernelNames = _.map(kernelSpecs, specModel => specModel.name);

      sessionListing.previouslyFocusedElement = this.previouslyFocusedElement;
      await sessionListing.selectListView.update({
        loadingMessage: "Loading sessions..."
      });

      try {
        let sessionModels = await Session.listRunning(gatewayInfo.options);
        sessionModels = sessionModels.filter(model => {
          const name = model.kernel ? model.kernel.name : null;
          return name ? kernelNames.includes(name) : true;
        });
        const items = sessionModels.map(model => {
          let name;
          if (model.notebook && model.notebook.path) {
            name = tildify(model.notebook.path);
          } else {
            name = `Session ${model.id}`;
          }
          return { name, model, options: gatewayInfo.options };
        });
        items.unshift({
          name: "[new session]",
          model: null,
          options: gatewayInfo.options,
          kernelSpecs
        });
        await sessionListing.selectListView.update({
          items: items,
          loadingMessage: null
        });
      } catch (error) {
        if (!error.xhr || error.xhr.status !== 403) throw error;
        // Gateways offer the option of never listing sessions, for security
        // reasons.
        // Assume this is the case and proceed to creating a new session.
        this.onSession({
          name: "[new session]",
          model: null,
          options: gatewayInfo.options,
          kernelSpecs
        });
      }
    } catch (e) {
      atom.notifications.addError("Connection to gateway failed");
    }

    sessionListing.selectListView.focus();
    sessionListing.selectListView.reset();
  }

  async onSession(sessionInfo: any) {
    if (!sessionInfo.model) {
      const kernelListing = new CustomListView(
        "No kernel specs available",
        this.startSession.bind(this)
      );
      kernelListing.previouslyFocusedElement = this.previouslyFocusedElement;

      const items = _.map(sessionInfo.kernelSpecs, spec => {
        const options = Object.assign({}, sessionInfo.options);
        options.kernelName = spec.name;
        options.path = this._path;
        return {
          name: spec.display_name,
          options
        };
      });
      await kernelListing.selectListView.update({ items: items });
      kernelListing.selectListView.focus();
      kernelListing.selectListView.reset();
      if (!sessionInfo.name) {
        await kernelListing.selectListView.update({
          errorMessage: "This gateway does not support listing sessions"
        });
      }
    } else {
      this.onSessionChosen(
        await Session.connectTo(sessionInfo.model.id, sessionInfo.options)
      );
    }
  }

  startSession(sessionInfo: any) {
    Session.startNew(sessionInfo.options).then(this.onSessionChosen.bind(this));
  }

  async onSessionChosen(session: any) {
    const kernelSpec = await session.kernel.getSpec();
    if (!store.grammar) return;

    const kernel = new WSKernel(kernelSpec, store.grammar, session);
    this._onChosen(kernel);
  }
}
