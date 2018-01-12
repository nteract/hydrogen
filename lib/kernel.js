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
import InputView from "./input-view";

export type ResultsCallback = (
  message: any,
  channel: "shell" | "iopub" | "stdin"
) => void;

interface KernelMiddlewareStack {
  interrupt: () => void;
  shutdown: () => void;
  restart: (onRestarted: ?Function) => void;
  execute: (
    code: string,
    callWatches: boolean,
    onResults: ResultsCallback
  ) => void;
  complete: (code: string, onResults: ResultsCallback) => void;
  inspect: (
    code: string,
    cursorPos: number,
    onResults: ResultsCallback
  ) => void;
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
      execute: (
        code: string,
        callWatches: boolean,
        onResults: ResultsCallback
      ) => this.rawExecute(code, callWatches, onResults),
      complete: (code: string, onResults: ResultsCallback) =>
        this.rawComplete(code, onResults),
      inspect: (code: string, cursorPos: number, onResults: ResultsCallback) =>
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
    this.middlewareStack.execute(
      code,
      true,
      this._translateExecuteResults(onResults)
    );
  }

  executeWatch(code: string, onResults: Function) {
    this.middlewareStack.execute(
      code,
      false,
      this._translateExecuteResults(onResults)
    );
  }

  _translateExecuteResults(onResults: Function) {
    return (message: Message, channel: string) => {
      if (!this._isValidMessage(message)) {
        return;
      }

      if (channel === "shell") {
        const { status } = message.content;
        if (status === "error" || status === "ok") {
          onResults({
            data: status,
            stream: "status"
          });
        } else {
          console.warn(
            "Kernel: ignoring unexpected value for message.content.status"
          );
        }
      } else if (channel === "iopub") {
        if (message.header.msg_type === "execute_input") {
          onResults({
            data: message.content.execution_count,
            stream: "execution_count"
          });
        }

        // TODO(nikita): Consider converting to V5 elsewhere, so that plugins
        // never have to deal with messages in the V4 format
        const result = msgSpecToNotebookFormat(msgSpecV4toV5(message));
        onResults(result);
      } else if (channel === "stdin") {
        if (message.header.msg_type !== "input_request") {
          return;
        }

        const { prompt } = message.content;

        // TODO(nikita): perhaps it would make sense to install middleware for
        // sending input replies
        const inputView = new InputView({ prompt }, (input: string) =>
          this.rawInputReply(input)
        );

        inputView.attach();
      }
    };
  }

  complete(code: string, onResults: Function) {
    this.middlewareStack.complete(code, (message: Message, channel: string) => {
      if (channel !== "shell") {
        log("Invalid reply: wrong channel");
        return;
      }
      if (!this._isValidMessage(message)) {
        return;
      }
      onResults(message.content);
    });
  }

  inspect(code: string, cursorPos: number, onResults: Function) {
    this.middlewareStack.inspect(
      code,
      cursorPos,
      (message: Message, channel: string) => {
        if (channel !== "shell") {
          log("Invalid reply: wrong channel");
          return;
        }
        if (!this._isValidMessage(message)) {
          return;
        }
        onResults({
          data: message.content.data,
          found: message.content.found
        });
      }
    );
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

  rawExecute(code: string, callWatches: boolean, onResults: ResultsCallback) {
    throw new Error("Kernel: rawExecute method not implemented");
  }

  rawComplete(code: string, onResults: ResultsCallback) {
    throw new Error("Kernel: rawComplete method not implemented");
  }

  rawInspect(code: string, cursorPos: number, onResults: ResultsCallback) {
    throw new Error("Kernel: rawInspect method not implemented");
  }

  rawInputReply(input: string) {
    throw new Error("Kernel: rawInputReply method not implemented");
  }

  _isValidMessage(message: Message) {
    if (!message) {
      log("Invalid message: null");
      return false;
    }

    if (!message.content) {
      log("Invalid message: Missing content");
      return false;
    }

    if (message.content.execution_state === "starting") {
      // Kernels send a starting status message with an empty parent_header
      log("Dropped starting status IO message");
      return false;
    }

    if (!message.parent_header) {
      log("Invalid message: Missing parent_header");
      return false;
    }

    if (!message.parent_header.msg_id) {
      log("Invalid message: Missing parent_header.msg_id");
      return false;
    }

    if (!message.parent_header.msg_type) {
      log("Invalid message: Missing parent_header.msg_type");
      return false;
    }

    if (!message.header) {
      log("Invalid message: Missing header");
      return false;
    }

    if (!message.header.msg_id) {
      log("Invalid message: Missing header.msg_id");
      return false;
    }

    if (!message.header.msg_type) {
      log("Invalid message: Missing header.msg_type");
      return false;
    }

    return true;
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
