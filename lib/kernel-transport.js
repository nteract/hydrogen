/* @flow */

import { observable, action } from "mobx";

import { log } from "./utils";

export type ResultsCallback = (
  message: any,
  channel: "shell" | "iopub" | "stdin"
) => void;

export default class KernelTransport {
  @observable
  executionState = "loading";
  @observable
  executionCount = 0;
  @observable
  lastExecutionTime = "No execution";
  @observable
  inspector = { bundle: {} };

  kernelSpec: Kernelspec;
  grammar: atom$Grammar;
  language: string;
  displayName: string;

  // Only `WSKernel` would have `gatewayName` property and thus not initialize it here,
  // still `KernelTransport` is better to have `gatewayName` property for code simplicity in the other parts of code
  gatewayName: ?string;

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

  @action
  setExecutionCount(count: number) {
    this.executionCount = count;
  }

  @action
  setLastExecutionTime(timeString: string) {
    this.lastExecutionTime = timeString;
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
