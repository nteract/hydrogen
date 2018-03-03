/* @flow */

import SelectListView from "atom-select-list";
import _ from "lodash";
import tildify from "tildify";
import v4 from "uuid/v4";
import ws from "ws";
import xhr from "xmlhttprequest";
import { URL } from "url";
import { Kernel, Session, ServerConnection } from "@jupyterlab/services";

import Config from "./config";
import WSKernel from "./ws-kernel";
import InputView from "./input-view";
import store from "./store";

class CustomListView {
  onConfirmed: ?Function = null;
  onCancelled: ?Function = null;
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
      didCancelSelection: () => {
        this.cancel();
        if (this.onCancelled) this.onCancelled();
      }
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

  async promptForText(prompt: string) {
    const previouslyFocusedElement = this.listView.previouslyFocusedElement;
    this.listView.cancel();

    const inputPromise = new Promise((resolve, reject) => {
      const inputView = new InputView({ prompt }, resolve);
      atom.commands.add(inputView.element, {
        "core:cancel": () => {
          inputView.close();
          reject();
        }
      });
      inputView.attach();
    });

    let response;
    try {
      response = await inputPromise;
      if (response === "") {
        return null;
      }
    } catch (e) {
      return null;
    }

    // Assume that no response to the prompt will cancel the entire flow, so
    // only restore listView if a response was received
    this.listView.show();
    this.listView.previouslyFocusedElement = previouslyFocusedElement;
    return response;
  }

  async promptForCookie(options: any) {
    const cookie = await this.promptForText("Cookie:");
    if (cookie === null) {
      return false;
    }

    if (options.requestHeaders === undefined) {
      options.requestHeaders = {};
    }
    options.requestHeaders.Cookie = cookie;
    options.xhrFactory = () => {
      let request = new xhr.XMLHttpRequest();
      // Disable protections against setting the Cookie header
      request.setDisableHeaderCheck(true);
      return request;
    };
    options.wsFactory = (url, protocol) => {
      // Authentication requires requests to appear to be same-origin
      let parsedUrl = new URL(url);
      if (parsedUrl.protocol == "wss:") {
        parsedUrl.protocol = "https:";
      } else {
        parsedUrl.protocol = "http:";
      }
      const headers = { Cookie: cookie };
      const origin = parsedUrl.origin;
      const host = parsedUrl.host;
      return new ws(url, protocol, { headers, origin, host });
    };
    return true;
  }

  async promptForToken(options: any) {
    const token = await this.promptForText("Token:");
    if (token === null) {
      return false;
    }

    options.token = token;
    return true;
  }

  async promptForCredentials(options: any) {
    await this.listView.selectListView.update({
      items: [
        {
          name: "Authenticate with a token",
          action: "token"
        },
        {
          name: "Authenticate with a cookie",
          action: "cookie"
        },
        {
          name: "Cancel",
          action: "cancel"
        }
      ],
      infoMessage:
        "Connection to gateway failed. Your settings may be incorrect, the server may be unavailable, or you may lack sufficient privileges to complete the connection.",
      loadingMessage: null,
      emptyMessage: null
    });

    const action = await new Promise((resolve, reject) => {
      this.listView.onConfirmed = item => resolve(item.action);
      this.listView.onCancelled = () => resolve("cancel");
    });
    if (action === "token") {
      return await this.promptForToken(options);
    } else if (action === "cookie") {
      return await this.promptForCookie(options);
    } else {
      // action === "cancel"
      this.listView.cancel();
      return false;
    }
  }

  async onGateway(gatewayInfo: any) {
    this.listView.onConfirmed = null;
    await this.listView.selectListView.update({
      items: [],
      infoMessage: null,
      loadingMessage: "Loading sessions...",
      emptyMessage: "No sessions available"
    });

    const gatewayOptions = Object.assign(
      {
        xhrFactory: () => new xhr.XMLHttpRequest(),
        wsFactory: (url, protocol) => new ws(url, protocol)
      },
      gatewayInfo.options
    );

    let serverSettings = ServerConnection.makeSettings(gatewayOptions);
    let specModels;

    try {
      specModels = await Kernel.getSpecs(serverSettings);
    } catch (error) {
      // The error types you get back at this stage are fairly opaque. In
      // particular, having invalid credentials typically triggers ECONNREFUSED
      // rather than 403 Forbidden. This does some basic checks and then assumes
      // that all remaining error types could be caused by invalid credentials.
      if (!error.xhr || !error.xhr.responseText) {
        throw error;
      } else if (error.xhr.responseText.includes("ETIMEDOUT")) {
        atom.notifications.addError("Connection to gateway failed");
        this.listView.cancel();
        return;
      } else {
        const promptSucceeded = await this.promptForCredentials(gatewayOptions);
        if (!promptSucceeded) {
          return;
        }
        serverSettings = ServerConnection.makeSettings(gatewayOptions);
        await this.listView.selectListView.update({
          items: [],
          infoMessage: null,
          loadingMessage: "Loading sessions...",
          emptyMessage: "No sessions available"
        });
      }
    }

    try {
      if (!specModels) {
        specModels = await Kernel.getSpecs(serverSettings);
      }

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
          if (model.path) {
            name = tildify(model.path);
          } else if (model.notebook && model.notebook.path) {
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
        this.listView.onConfirmed = this.onSession.bind(this, gatewayInfo.name);
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
