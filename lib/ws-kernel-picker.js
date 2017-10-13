/* @flow */

import SelectListView from "atom-select-list";
import _ from "lodash";
import tildify from "tildify";
import v4 from "uuid/v4";
import ws from "ws";
import xhr from "xmlhttprequest";
import { Kernel, Session, ServerConnection } from "@jupyterlab/services";

import Config from "./config";
import WSKernel from "./ws-kernel";
import store from "./store";

class CustomListView {
  onConfirmed: Function = () => {};
  previouslyFocusedElement: ?HTMLElement;
  selectListView: SelectListView;
  panel: ?atom$Panel;

  constructor() {
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
      },
      didCancelSelection: () => this.cancel()
    });
  }

  show() {
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
  listView: CustomListView;

  constructor(onChosen: (kernel: Kernel) => void) {
    this._onChosen = onChosen;
    this.listView = new CustomListView();
  }

  async toggle(_kernelSpecFilter: (kernelSpec: Kernelspec) => boolean) {
    this.listView.previouslyFocusedElement = document.activeElement;
    this._kernelSpecFilter = _kernelSpecFilter;
    const gateways = Config.getJson("gateways") || [];
    if (_.isEmpty(gateways)) {
      atom.notifications.addError("No remote kernel gateways available", {
        description:
          "Use the Hydrogen package settings to specify the list of remote servers. Hydrogen can use remote kernels on either a Jupyter Kernel Gateway or Jupyter notebook server."
      });
      return;
    }

    this._path = `${store.filePath || "unsaved"}-${v4()}`;

    this.listView.onConfirmed = this.onGateway.bind(this);

    await this.listView.selectListView.update({
      items: gateways,
      infoMessage: "Select a gateway",
      emptyMessage: "No gateways available",
      loadingMessage: null
    });

    this.listView.show();
  }

  async onGateway(gatewayInfo: any) {
    const serverSettings = ServerConnection.makeSettings(
      Object.assign(
        {
          xhrFactory: () => new xhr.XMLHttpRequest(),
          wsFactory: (url, protocol) => new ws(url, protocol)
        },
        gatewayInfo.options
      )
    );
    this.listView.onConfirmed = this.onSession.bind(this, gatewayInfo.name);
    await this.listView.selectListView.update({
      items: [],
      infoMessage: null,
      loadingMessage: "Loading sessions...",
      emptyMessage: "No sessions available"
    });
    try {
      const specModels = await Kernel.getSpecs(serverSettings);
      const kernelSpecs = _.filter(specModels.kernelspecs, spec =>
        this._kernelSpecFilter(spec)
      );

      const kernelNames = _.map(kernelSpecs, specModel => specModel.name);

      try {
        let sessionModels = await Session.listRunning(serverSettings);
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
          return { name, model, options: serverSettings };
        });
        items.unshift({
          name: "[new session]",
          model: null,
          options: serverSettings,
          kernelSpecs
        });
        await this.listView.selectListView.update({
          items: items,
          loadingMessage: null
        });
      } catch (error) {
        if (!error.xhr || error.xhr.status !== 403) throw error;
        // Gateways offer the option of never listing sessions, for security
        // reasons.
        // Assume this is the case and proceed to creating a new session.
        this.onSession(gatewayInfo.name, {
          name: "[new session]",
          model: null,
          options: serverSettings,
          kernelSpecs
        });
      }
    } catch (e) {
      atom.notifications.addError("Connection to gateway failed");
      this.listView.cancel();
    }
  }

  async onSession(gatewayName: string, sessionInfo: any) {
    if (!sessionInfo.model) {
      if (!sessionInfo.name) {
        await this.listView.selectListView.update({
          items: [],
          errorMessage: "This gateway does not support listing sessions",
          loadingMessage: null,
          infoMessage: null
        });
      }
      const items = _.map(sessionInfo.kernelSpecs, spec => {
        const options = {
          serverSettings: sessionInfo.options,
          kernelName: spec.name,
          path: this._path
        };
        return {
          name: spec.display_name,
          options
        };
      });

      this.listView.onConfirmed = this.startSession.bind(this, gatewayName);
      await this.listView.selectListView.update({
        items: items,
        emptyMessage: "No kernel specs available",
        infoMessage: "Select a session",
        loadingMessage: null
      });
    } else {
      this.onSessionChosen(
        gatewayName,
        await Session.connectTo(sessionInfo.model.id, sessionInfo.options)
      );
    }
  }

  startSession(gatewayName: string, sessionInfo: any) {
    Session.startNew(sessionInfo.options).then(
      this.onSessionChosen.bind(this, gatewayName)
    );
  }

  async onSessionChosen(gatewayName: string, session: any) {
    this.listView.cancel();
    const kernelSpec = await session.kernel.getSpec();
    if (!store.grammar) return;

    const kernel = new WSKernel(
      gatewayName,
      kernelSpec,
      store.grammar,
      session
    );
    this._onChosen(kernel);
  }
}
