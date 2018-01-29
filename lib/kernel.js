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
import KernelTransport from "./kernel-transport";
import ZMQKernel from "./zmq-kernel";
import type { ResultsCallback } from "./kernel-transport";

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
  @observable inspector = { bundle: {} };
  outputStore = new OutputStore();

  watchesStore: WatchesStore;
  emitter = new Emitter();
  pluginWrapper: HydrogenKernel | null = null;
  transport: KernelTransport;
  middlewareStack: KernelMiddlewareStack;

  constructor(kernel: KernelTransport) {
    this.transport = kernel;

    this.watchesStore = new WatchesStore(this);

    this.middlewareStack = {
      interrupt: () => this.transport.interrupt(),
      shutdown: () => this.transport.shutdown(),
      restart: (onRestarted: ?Function) => this.transport.restart(onRestarted),
      execute: (
        code: string,
        callWatches: boolean,
        onResults: ResultsCallback
      ) => this.transport.execute(code, callWatches, onResults),
      complete: (code: string, onResults: ResultsCallback) =>
        this.transport.complete(code, onResults),
      inspect: (code: string, cursorPos: number, onResults: ResultsCallback) =>
        this.transport.inspect(code, cursorPos, onResults)
    };
  }

  get kernelSpec(): Kernelspec {
    return this.transport.kernelSpec;
  }

  get grammar(): atom$Grammar {
    return this.transport.grammar;
  }

  get language(): string {
    return this.transport.language;
  }

  get displayName(): string {
    return this.transport.displayName;
  }

  setMiddlewareStack(middlewareStack: KernelMiddlewareStack) {
    this.middlewareStack = middlewareStack;
  }

  get executionState(): string {
    // XXX(nikita): Does returning an observable do the right thing?
    return this.transport.executionState;
  }

  @action
  setExecutionState(state: string) {
    // XXX(nikita): call this.transport.executionState instead? But in that case
    // what do we do about the @action decorator?
    this.transport.executionState = state;
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
    this.transport.addWatchCallback(watchCallback);
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
      if (!this.transport._isValidMessage(message)) {
        //XXX(nikita): it's private!
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
          this.transport.inputReply(input)
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
      if (!this.transport._isValidMessage(message)) {
        //XXX(nikita): it's private!
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
        if (!this.transport._isValidMessage(message)) {
          //XXX(nikita): it's private!
          return;
        }
        onResults({
          data: message.content.data,
          found: message.content.found
        });
      }
    );
  }

  destroy() {
    log("Kernel: Destroying");
    store.deleteKernel(this);
    this.transport.destroy();
    if (this.pluginWrapper) {
      this.pluginWrapper.destroyed = true;
    }
    this.emitter.emit("did-destroy");
    this.emitter.dispose();
  }
}
