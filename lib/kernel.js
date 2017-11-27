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

interface KernelMiddlewareStack {
  interrupt: () => void;
  shutdown: () => void;
  restart: (onRestarted: ?Function) => void;
  execute: (code: string, callWatches: boolean, onResults: Function) => void;
  complete: (code: string, onResults: Function) => void;
  inspect: (code: string, cursorPos: number, onResults: Function) => void;
}

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
  middlewareStack: KernelMiddlewareStack;

  constructor(kernelSpec: Kernelspec, grammar: atom$Grammar) {
    this.kernelSpec = kernelSpec;
    this.grammar = grammar;

    this.language = kernelSpec.language.toLowerCase();
    this.displayName = kernelSpec.display_name;

    this.watchesStore = new WatchesStore(this);

    this.middlewareStack = {
      interrupt: () => this.rawInterrupt(),
      shutdown: () => this.rawShutdown(),
      restart: (onRestarted: ?Function) => this.rawRestart(onRestarted),
      execute: (code: string, callWatches: boolean, onResults: Function) =>
        this.rawExecute(code, callWatches, onResults),
      complete: (code: string, onResults: Function) =>
        this.rawComplete(code, onResults),
      inspect: (code: string, cursorPos: number, onResults: Function) =>
        this.rawInspect(code, cursorPos, onResults)
    };
  }

  setMiddlewareStack(middlewareStack: KernelMiddlewareStack) {
    this.middlewareStack = middlewareStack;
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
    this.middlewareStack.interrupt();
  }

  shutdown() {
    this.middlewareStack.shutdown();
  }

  restart(onRestarted: ?Function) {
    this.middlewareStack.restart(onRestarted);
  }

  execute(code: string, onResults: Function) {
    this.middlewareStack.execute(code, true, onResults);
  }

  executeWatch(code: string, onResults: Function) {
    this.middlewareStack.execute(code, false, onResults);
  }

  complete(code: string, onResults: Function) {
    this.middlewareStack.complete(code, onResults);
  }

  inspect(code: string, cursorPos: number, onResults: Function) {
    this.middlewareStack.inspect(code, cursorPos, onResults);
  }

  // The "raw" family of methods directly perform their functions without
  // activating any plugins along the way. Subclasses override these.

  rawInterrupt() {
    throw new Error("Kernel: rawInterrupt method not implemented");
  }

  rawShutdown() {
    throw new Error("Kernel: rawShutdown method not implemented");
  }

  rawRestart(onRestarted: ?Function) {
    throw new Error("Kernel: rawRestart method not implemented");
  }

  rawExecute(code: string, callWatches: boolean, onResults: Function) {
    throw new Error("Kernel: rawExecute method not implemented");
  }

  rawComplete(code: string, onResults: Function) {
    throw new Error("Kernel: rawComplete method not implemented");
  }

  rawInspect(code: string, cursorPos: number, onResults: Function) {
    throw new Error("Kernel: rawInspect method not implemented");
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
