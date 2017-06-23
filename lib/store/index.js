/* @flow */

import { CompositeDisposable } from "atom";
import { observable, computed, action } from "mobx";
import { isMultilanguageGrammar, getEmbeddedScope } from "./../utils";

import Config from "./../config";
import MarkerStore from "./markers";
import kernelManager from "./../kernel-manager";
import type Kernel from "./../kernel";

class Store {
  subscriptions = new CompositeDisposable();
  markers = new MarkerStore();
  @observable startingKernels: Map<string, boolean> = new Map();
  @observable runningKernels: Map<string, Kernel> = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar: ?atom$Grammar;

  @computed
  get kernel(): ?Kernel {
    for (let kernel of this.runningKernels.values()) {
      const kernelSpec = kernel.kernelSpec;
      if (kernelManager.kernelSpecProvidesGrammar(kernelSpec, this.grammar)) {
        return kernel;
      }
    }
    return null;
  }

  @action
  startKernel(kernelDisplayName: string) {
    this.startingKernels.set(kernelDisplayName, true);
  }

  @action
  newKernel(kernel: Kernel) {
    const mappedLanguage =
      Config.getJson("languageMappings")[kernel.language] || kernel.language;
    this.runningKernels.set(mappedLanguage, kernel);
    // delete startingKernel since store.kernel now in place to prevent duplicate kernel
    this.startingKernels.delete(kernel.kernelSpec.display_name);
  }

  @action
  deleteKernel(kernel: Kernel) {
    for (let [language, runningKernel] of this.runningKernels.entries()) {
      if (kernel === runningKernel) {
        this.runningKernels.delete(language);
      }
    }
  }

  @action
  dispose() {
    this.subscriptions.dispose();
    this.markers.clear();
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels = new Map();
  }

  @action
  updateEditor(editor: ?atom$TextEditor) {
    this.editor = editor;
    this.setGrammar(editor);
  }

  @action
  setGrammar(editor: ?atom$TextEditor) {
    if (!editor) {
      this.grammar = null;
      return;
    }

    let grammar = editor.getGrammar();

    if (isMultilanguageGrammar(grammar)) {
      const embeddedScope = getEmbeddedScope(
        editor,
        editor.getCursorBufferPosition()
      );

      if (embeddedScope) {
        const scope = embeddedScope.replace(".embedded", "");
        grammar = atom.grammars.grammarForScopeName(scope);
      }
    }

    this.grammar = grammar;
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
