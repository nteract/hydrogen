/* @flow */

import { CompositeDisposable } from "atom";
import { observable, computed, action } from "mobx";
import { isMultilanguageGrammar, getEmbeddedScope } from "./../utils";

import Config from "./../config";
import kernelManager from "./../kernel-manager";
import type Kernel from "./../kernel";

class Store {
  subscriptions = new CompositeDisposable();
  @observable startingKernels: Map<string, boolean> = new Map();
  @observable runningKernels: Map<string, Kernel> = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar: ?atom$Grammar;

  // XXX(nikita): I can't find a way to create a stateless event signal in mobx,
  // so I'm resorting to toggling a boolean whenever a new kernel is created.
  @observable newKernelEvent: boolean = false;

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
    // This hack signals to the plugin API that a new kernel has been created
    this.newKernelEvent = !this.newKernelEvent;
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
