/* @flow */

import { CompositeDisposable } from "atom";
import { observable, computed, action } from "mobx";
import { grammarToLanguage, isMultilanguageGrammar } from "./../utils";

import type Kernel from "./../kernel";

class Store {
  subscriptions = new CompositeDisposable();
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar: ?atom$Grammar;

  @computed get kernel(): ?Kernel {
    return this.runningKernels.get(grammarToLanguage(this.grammar));
  }
  @computed get language(): ?string {
    return grammarToLanguage(this.grammar);
  }

  @action setGrammar(editor: ?atom$TextEditor) {
    if (!editor) {
      this.grammar = null;
      return;
    }

    const topLevelGrammar = editor.getGrammar();
    if (!isMultilanguageGrammar(topLevelGrammar)) {
      this.grammar = topLevelGrammar;
    } else {
      const scopes = editor
        .getCursorScope()
        .getScopesArray()
        .filter(s => s.indexOf("source.embedded.") === 0);

      if (scopes.length === 0) {
        this.grammar = topLevelGrammar;
      } else {
        const scope = scopes[0].replace(".embedded", "");
        this.grammar = atom.grammars.grammarForScopeName(scope);
      }
    }
  }

  @action newKernel(kernel: Kernel) {
    this.runningKernels.set(kernel.language, kernel);
  }

  @action deleteKernel(language: string) {
    this.runningKernels.delete(language);
  }

  @action dispose() {
    this.subscriptions.dispose();
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels = new Map();
  }

  @action updateEditor(editor: ?atom$TextEditor) {
    this.editor = editor;
    this.setGrammar(editor);
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
