/* @flow */

import { Emitter } from "atom";
import { observable, action } from "mobx";
import { isEqual } from "lodash";

import {
  log,
  focus,
  msgSpecToNotebookFormat,
  msgSpecV4toV5,
  INSPECTOR_URI
} from "./utils";
import store from "./store";

import WatchesStore from "./store/watches";
import OutputStore from "./store/output";
import HydrogenKernel from "./plugin-api/hydrogen-kernel";

export default class Kernel {
  @observable executionState = "loading";
  @observable inspector = { bundle: {} };
  outputStore = new OutputStore();

  kernelSpec: Kernelspec;
  grammar: atom$Grammar;
  language: string;
  displayName: string;
  watchesStore: WatchesStore;
  watchCallbacks: Array<Function> = [];
  emitter = new Emitter();
  pluginWrapper: HydrogenKernel | null = null;

  constructor(kernelSpec: Kernelspec, grammar: atom$Grammar) {
    this.kernelSpec = kernelSpec;
    this.grammar = grammar;

    this.language = kernelSpec.language.toLowerCase();
    this.displayName = kernelSpec.display_name;

    this.watchesStore = new WatchesStore(this);
  }

  @action
  setExecutionState(state: string) {
    this.executionState = state;
  }

  @action
  async setInspectorResult(bundle: Object, editor: ?atom$TextEditor) {
    if (isEqual(this.inspector.bundle, bundle)) {
      await atom.workspace.toggle(INSPECTOR_URI);
    } else if (bundle.size !== 0) {
      this.inspector.bundle = bundle;
      await atom.workspace.open(INSPECTOR_URI, { searchAllPanes: true });
    }
    focus(editor);
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

  _parseIOMessage(message: Message) {
    let result = this._parseExecuteInputIOMessage(message);

    if (!result) {
      result = msgSpecToNotebookFormat(msgSpecV4toV5(message));
    }

    return result;
  }

  _parseExecuteInputIOMessage(message: Message) {
    if (message.header.msg_type === "execute_input") {
      return {
        data: message.content.execution_count,
        stream: "execution_count"
      };
    }

    return null;
  }

  destroy() {
    log("Kernel: Destroying base kernel");
    store.deleteKernel(this);
    if (this.pluginWrapper) {
      this.pluginWrapper.destroyed = true;
    }
    this.emitter.emit("did-destroy");
    this.emitter.dispose();
  }
}
