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

  interrupt() {
    throw new Error("KernelTransport: interrupt method not implemented");
  }

  shutdown() {
    throw new Error("KernelTransport: shutdown method not implemented");
  }

  restart(onRestarted: ?Function) {
    throw new Error("KernelTransport: restart method not implemented");
  }

  execute(code: string, onResults: ResultsCallback) {
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

  destroy() {
    log("KernelTransport: Destroying base kernel");
  }
}
