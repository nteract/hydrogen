/* @flow */

import { CompositeDisposable } from "atom";
import { observable, computed, action } from "mobx";
import { isMultilanguageGrammar, getEmbeddedScope } from "./../utils";

import Config from "./../config";
import kernelManager from "./../kernel-manager";
import type Kernel from "./../kernel";

class Store {
  subscriptions = new CompositeDisposable();
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar: ?atom$Grammar;

  @computed get kernel(): ?Kernel {
    for (let kernelLanguage of this.runningKernels.keys().sort()) {
      const kernel = this.runningKernels.get(kernelLanguage);
      const kernelSpec = kernel.kernelSpec;
      if (kernelManager.kernelSpecProvidesGrammar(kernelSpec, this.grammar)) {
        return kernel;
      }
    }
    return null;
  }

  @action newKernel(kernel: Kernel) {
    const mappedLanguage = Config.getJson("languageMappings")[kernel.language];
    this.runningKernels.set(mappedLanguage || kernel.language, kernel);
  }

  @action deleteKernel(language: string) {
    this.runningKernels.delete(language);
  }

  @action dispose() {
    this.subscriptions.dispose();
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels = new Map();
  }

  @action updateEditorAndGrammar(editor: ?atom$TextEditor) {
    this.editor = editor;

    if (!this.editor) {
      this.grammar = null;
      return null;
    }

    let topLevelGrammar = this.editor.getGrammar();

    if (isMultilanguageGrammar(topLevelGrammar)) {
      const embeddedScope = getEmbeddedScope(
        this.editor,
        this.editor.getCursorBufferPosition()
      );

      if (embeddedScope) {
        const scope = embeddedScope.replace(".embedded", "");
        topLevelGrammar = atom.grammars.grammarForScopeName(scope);
      }
    }

    this.grammar = topLevelGrammar;
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
