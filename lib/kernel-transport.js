/* @flow */

import { observable, action } from "mobx";

import { log } from "./utils";

export type ResultsCallback = (
  message: any,
  channel: "shell" | "iopub" | "stdin"
) => void;

export default class KernelTransport {
  @observable executionState = "loading";
  @observable inspector = { bundle: {} };

  kernelSpec: Kernelspec;
  grammar: atom$Grammar;
  language: string;
  displayName: string;
  watchCallbacks: Array<Function> = [];

  constructor(kernelSpec: Kernelspec, grammar: atom$Grammar) {
    this.kernelSpec = kernelSpec;
    this.grammar = grammar;

    this.language = kernelSpec.language.toLowerCase();
    this.displayName = kernelSpec.display_name;
  }

  @action
  setExecutionState(state: string) {
    this.executionState = state;
  }

  addWatchCallback(watchCallback: Function) {
    this.watchCallbacks.push(watchCallback);
  }

  _callWatchCallbacks() {
    this.watchCallbacks.forEach(watchCallback => watchCallback());
  }

  interrupt() {
    throw new Error("KernelTransport: interrupt method not implemented");
  }

  shutdown() {
    throw new Error("KernelTransport: shutdown method not implemented");
  }

  restart(onRestarted: ?Function) {
    throw new Error("KernelTransport: restart method not implemented");
  }

  execute(code: string, callWatches: boolean, onResults: ResultsCallback) {
    throw new Error("KernelTransport: execute method not implemented");
  }

  complete(code: string, onResults: ResultsCallback) {
    throw new Error("KernelTransport: complete method not implemented");
  }

  inspect(code: string, cursorPos: number, onResults: ResultsCallback) {
    throw new Error("KernelTransport: inspect method not implemented");
  }

  inputReply(input: string) {
    throw new Error("KernelTransport: inputReply method not implemented");
  }

  isValidMessage(message: Message) {
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
    log("KernelTransport: Destroying base kernel");
  }
}
