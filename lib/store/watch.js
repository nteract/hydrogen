/* @flow */

import { TextEditor, Disposable } from "atom";
import { action } from "mobx";

import OutputStore from "./output";
import { log } from "./../utils";
import store from "./index";

import type Kernel from "./../kernel";

export default class WatchStore {
  kernel: Kernel;
  editor: TextEditor;
  outputStore = new OutputStore();
  autocompleteDisposable: Disposable;

  constructor(kernel: Kernel) {
    this.kernel = kernel;
    this.editor = atom.workspace.buildTextEditor({
      softWrapped: true,
      lineNumberGutterVisible: false
    });
    const grammar = this.kernel.grammar;
    if (grammar)
      atom.grammars.assignLanguageMode(this.editor, grammar.scopeName);
    if (store.registerAutocomplete) {
      this.autocompleteDisposable = store.registerAutocomplete(this.editor, [
        "default",
        "workspace-center",
        "symbol-provider"
      ]);
    }
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
