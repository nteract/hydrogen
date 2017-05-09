"use babel";

import SelectListView from "atom-select-list";
import _ from "lodash";
import tildify from "tildify";
import v4 from "uuid/v4";

import Config from "./config";
import * as services from "./jupyter-js-services-shim";
import WSKernel from "./ws-kernel";

class CustomListView {
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
  constructor(onChosen) {
    this._onChosen = onChosen;
  }

  toggle(_grammar, _kernelSpecFilter) {
    this._grammar = _grammar;
    this._kernelSpecFilter = _kernelSpecFilter;
    const gateways = Config.getJson("gateways", []);
    if (_.isEmpty(gateways)) {
      atom.notifications.addError("No remote kernel gateways available", {
        description: "Use the Hydrogen package settings to specify the list of remote servers. Hydrogen can use remote kernels on either a Jupyter Kernel Gateway or Jupyter notebook server."
      });
      return;
    }

    this._path = `${atom.workspace.getActiveTextEditor().getPath()}-${v4()}`;
    const gatewayListing = new CustomListView(
      "No gateways available",
      this.onGateway.bind(this)
    );
    this.previouslyFocusedElement = gatewayListing.previouslyFocusedElement;
    gatewayListing.selectListView.update({
      items: gateways,
      infoMessage: "Select a gateway"
    });
  }

  onGateway(gatewayInfo) {
    const sessionListing = new CustomListView(
      "No sessions available",
      this.onSession.bind(this)
    );
    services.Kernel
      .getSpecs(gatewayInfo.options)
      .then(
        specModels => {
          const kernelSpecs = _.filter(specModels.kernelspecs, spec =>
            this._kernelSpecFilter(spec)
          );

          const kernelNames = _.map(kernelSpecs, specModel => specModel.name);

          sessionListing.previouslyFocusedElement = this.previouslyFocusedElement;
          sessionListing.selectListView.update({
            loadingMessage: "Loading sessions..."
          });

          services.Session.listRunning(gatewayInfo.options).then(
            sessionModels => {
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
                return {
                  name,
                  model,
                  options: gatewayInfo.options
                };
              });
              items.unshift({
                name: "[new session]",
                model: null,
                options: gatewayInfo.options,
                kernelSpecs
              });
              return sessionListing.selectListView.update({
                items: items,
                loadingMessage: null
              });
            },
            () =>
              // Gateways offer the option of never listing sessions, for security
              // reasons.
              // Assume this is the case and proceed to creating a new session.
              this.onSession({
                name: "[new session]",
                model: null,
                options: gatewayInfo.options,
                kernelSpecs
              })
          );
        },
        () => atom.notifications.addError("Connection to gateway failed")
      )
      .then(() => {
        sessionListing.selectListView.focus();
        sessionListing.selectListView.reset();
      });
  }

  onSession(sessionInfo) {
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
      kernelListing.selectListView.update({ items: items });
      kernelListing.selectListView.focus();
      kernelListing.selectListView.reset();
      if (!sessionInfo.name) {
        kernelListing.selectListView.update({
          errorMessage: "This gateway does not support listing sessions"
        });
      }
    } else {
      services.Session
        .connectTo(sessionInfo.model.id, sessionInfo.options)
        .then(this.onSessionChosen.bind(this));
    }
  }

  startSession(sessionInfo) {
    services.Session
      .startNew(sessionInfo.options)
      .then(this.onSessionChosen.bind(this));
  }

  onSessionChosen(session) {
    session.kernel.getSpec().then(kernelSpec => {
      const kernel = new WSKernel(kernelSpec, this._grammar, session);
      this._onChosen(kernel);
    });
  }
}
