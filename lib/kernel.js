/* @flow */

import { Emitter } from "atom";
import { observable, action } from "mobx";
import { is, Map as ImmutableMap } from "immutable";

import { log } from "./utils";
import store from "./store";

import WatchSidebar from "./watch-sidebar";
import HydrogenKernel from "./plugin-api/hydrogen-kernel";

export default class Kernel {
  @observable executionState = "loading";
  @observable inspector = {
    visible: false,
    bundle: new ImmutableMap(),
    height: 240
  };

  kernelSpec: Kernelspec;
  grammar: atom$Grammar;
  language: string;
  displayName: string;
  watchSidebar: WatchSidebar;
  watchCallbacks: Array<Function> = [];
  emitter = new Emitter();
  pluginWrapper: HydrogenKernel | null = null;

  constructor(kernelSpec: Kernelspec, grammar: atom$Grammar) {
    this.kernelSpec = kernelSpec;
    this.grammar = grammar;
    this.watchSidebar = new WatchSidebar(this);

    this.language = kernelSpec.language.toLowerCase();
    this.displayName = kernelSpec.display_name;
  }

  @action setExecutionState(state: string) {
    this.executionState = state;
  }

  @action setInspectorVisibility(visible: boolean) {
    this.inspector.visible = visible;
  }

  @action setInspectorHeight(height: number) {
    this.inspector.height = height;
  }

  @action setInspectorResult(bundle: ImmutableMap<string, any>) {
    if (this.inspector.visible === true && is(this.inspector.bundle, bundle)) {
      this.setInspectorVisibility(false);
    } else if (bundle.size !== 0) {
      this.inspector.bundle = bundle;
      this.setInspectorVisibility(true);
    }
  }

  getPluginWrapper() {
    if (!this.pluginWrapper) {
      this.pluginWrapper = new HydrogenKernel(this);
    }

    return this.pluginWrapper;
  }

  addWatchCallback(watchCallback: Function) {
    this.watchCallbacks.push(watchCallback);
  }

  _callWatchCallbacks() {
    this.watchCallbacks.forEach(watchCallback => watchCallback());
  }

  interrupt() {
    throw new Error("Kernel: interrupt method not implemented");
  }

  /* eslint-disable no-unused-vars */
  shutdown() {
    throw new Error("Kernel: shutdown method not implemented");
  }

  restart(onRestarted: ?Function) {
    throw new Error("Kernel: restart method not implemented");
  }

  execute(code: string, onResults: Function) {
    throw new Error("Kernel: execute method not implemented");
  }

  executeWatch(code: string, onResults: Function) {
    throw new Error("Kernel: executeWatch method not implemented");
  }

  complete(code: string, onResults: Function) {
    throw new Error("Kernel: complete method not implemented");
  }

  inspect(code: string, curorPos: number, onResults: Function) {
    throw new Error("Kernel: inspect method not implemented");
  }

  /* eslint-enable no-unused-vars */
  _parseIOMessage(message: Message) {
    let result = this._parseDisplayIOMessage(message);

    if (!result) {
      result = this._parseResultIOMessage(message);
    }

    if (!result) {
      result = this._parseErrorIOMessage(message);
    }

    if (!result) {
      result = this._parseStreamIOMessage(message);
    }

    if (!result) {
      result = this._parseExecuteInputIOMessage(message);
    }

    return result;
  }

  _parseDisplayIOMessage(message: Message) {
    if (message.header.msg_type === "display_data") {
      return this._parseDataMime(message.content.data);
    }
    return null;
  }

  /* eslint-disable camelcase*/
  _parseResultIOMessage(message: Message) {
    const { msg_type } = message.header;

    if (msg_type === "execute_result" || msg_type === "pyout") {
      return this._parseDataMime(message.content.data);
    }
    return null;
  }
  /* eslint-enable camelcase*/

  _parseDataMime(data: Object) {
    if (!data) {
      return null;
    }

    const mime = this._getMimeType(data);

    if (!mime) {
      return null;
    }

    let result;
    if (mime === "text/plain") {
      result = {
        data: {
          "text/plain": data[mime]
        },
        type: "text",
        stream: "pyout"
      };
    } else {
      result = {
        data: {},
        type: mime,
        stream: "pyout"
      };
      result.data[mime] = data[mime];
    }

    return result;
  }

  _getMimeType(data: Object) {
    const imageMimes = Object.getOwnPropertyNames(data).filter(mime =>
      mime.startsWith("image/"));

    let mime;
    if ({}.hasOwnProperty.call(data, "application/json")) {
      mime = "application/json";
    } else if ({}.hasOwnProperty.call(data, "text/html")) {
      mime = "text/html";
    } else if ({}.hasOwnProperty.call(data, "image/svg+xml")) {
      mime = "image/svg+xml";
    } else if (!(imageMimes.length === 0)) {
      mime = imageMimes[0];
    } else if ({}.hasOwnProperty.call(data, "text/markdown")) {
      mime = "text/markdown";
    } else if ({}.hasOwnProperty.call(data, "text/latex")) {
      mime = "text/latex";
    } else if ({}.hasOwnProperty.call(data, "text/plain")) {
      mime = "text/plain";
    }

    return mime;
  }

  /* eslint-disable camelcase*/
  _parseErrorIOMessage(message: Message) {
    const { msg_type } = message.header;

    if (msg_type === "error" || msg_type === "pyerr") {
      return this._parseErrorMessage(message);
    }

    return null;
  }
  /* eslint-enable camelcase*/

  _parseErrorMessage(message: Message) {
    let errorString;
    try {
      errorString = message.content.traceback.join("\n");
    } catch (err) {
      const ename = message.content.ename ? message.content.ename : "";
      const evalue = message.content.evalue ? message.content.evalue : "";
      errorString = `${ename}: ${evalue}`;
    }

    const result = {
      data: {
        "text/plain": errorString
      },
      type: "text",
      stream: "error"
    };

    return result;
  }

  _parseStreamIOMessage(message: Message) {
    let result;
    if (message.header.msg_type === "stream") {
      result = {
        data: {
          "text/plain": message.content.text
            ? message.content.text
            : message.content.data
        },
        type: "text",
        stream: message.content.name
      };

      // For kernels that do not conform to the messaging standard
    } else if (
      message.idents === "stdout" ||
      message.idents === "stream.stdout" ||
      message.content.name === "stdout"
    ) {
      result = {
        data: {
          "text/plain": message.content.text
            ? message.content.text
            : message.content.data
        },
        type: "text",
        stream: "stdout"
      };

      // For kernels that do not conform to the messaging standard
    } else if (
      message.idents === "stderr" ||
      message.idents === "stream.stderr" ||
      message.content.name === "stderr"
    ) {
      result = {
        data: {
          "text/plain": message.content.text
            ? message.content.text
            : message.content.data
        },
        type: "text",
        stream: "stderr"
      };
    }

    return result;
  }

  _parseExecuteInputIOMessage(message: Message) {
    if (message.header.msg_type === "execute_input") {
      return {
        data: message.content.execution_count,
        type: "number",
        stream: "execution_count"
      };
    }

    return null;
  }

  destroy() {
    log("Kernel: Destroying base kernel");
    store.deleteKernel(this.language);
    if (this.pluginWrapper) {
      this.pluginWrapper.destroyed = true;
    }
    this.emitter.emit("did-destroy");
    this.emitter.dispose();
  }
}
