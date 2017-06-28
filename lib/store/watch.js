/* @flow */

import { TextEditor } from "atom";
import { action } from "mobx";

import OutputStore from "./output";
import { log } from "./../utils";

import type Kernel from "./../kernel";

export default class WatchStore {
  kernel: Kernel;
  editor: TextEditor;
  outputStore = new OutputStore();

  constructor(kernel: Kernel) {
    this.kernel = kernel;
    this.editor = new TextEditor({
      softWrapped: true,
      grammar: this.kernel.grammar,
      lineNumberGutterVisible: false
    });
    this.editor.moveToTop();
    this.editor.element.classList.add("watch-input");
  }

  @action
  run = () => {
    const code = this.getCode();
    log("watchview running:", code);
    if (code && code.length > 0) {
      this.kernel.executeWatch(code, result => {
        this.outputStore.appendOutput(result);
      });
    }
  };

  @action
  setCode = (code: string) => {
    this.editor.setText(code);
  };

  getCode = () => {
    return this.editor.getText();
  };

  focus = () => {
    this.editor.element.focus();
  };
}
