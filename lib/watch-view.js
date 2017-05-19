/* @flow */

import React from "react";
import { TextEditor, CompositeDisposable } from "atom";

import OutputStore from "./store/output";
import History from "./components/result-view/history";
import { log, reactFactory } from "./utils";

import type Kernel from "./kernel";

export default class WatchView {
  kernel: Kernel;
  inputEditor = new TextEditor();
  element = document.createElement("div");
  outputElement = document.createElement("div");
  disposer = new CompositeDisposable();
  outputStore = new OutputStore();

  constructor(kernel: Kernel) {
    this.kernel = kernel;

    this.inputEditor.element.classList.add("watch-input");
    this.inputEditor.setGrammar(this.kernel.grammar);
    this.inputEditor.setSoftWrapped(true);
    this.inputEditor.setLineNumberGutterVisible(false);
    this.inputEditor.moveToTop();

    this.element.classList.add("hydrogen", "watch-view");
    this.element.appendChild(this.inputEditor.element);

    reactFactory(
      <History store={this.outputStore} />,
      this.outputElement,
      null,
      this.disposer
    );

    this.element.appendChild(this.outputElement);
  }

  run() {
    const code = this.getCode();
    log("watchview running:", code);
    if (code && code.length > 0) {
      this.kernel.executeWatch(code, result => {
        this.outputStore.appendOutput(result);
      });
    }
  }

  setCode(code: string) {
    this.inputEditor.setText(code);
  }

  getCode() {
    return this.inputEditor.getText();
  }

  focus() {
    this.inputEditor.element.focus();
  }

  destroy() {
    this.disposer.dispose();
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
