/* @flow */

import { CompositeDisposable } from "atom";
import { observable, computed, action, reaction } from "mobx";
import { isMultilanguageGrammar, getEmbeddedScope } from "./../utils";

import Config from "./../config";
import kernelManager from "./../kernel-manager";
import type Kernel from "./../kernel";

class Store {
  subscriptions = new CompositeDisposable();
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar: ?atom$Grammar;
  @observable busySignalRegistry = null;

  @computed get kernel(): ?Kernel {
    for (let kernel of this.runningKernels.values()) {
      const kernelSpec = kernel.kernelSpec;
      if (kernelManager.kernelSpecProvidesGrammar(kernelSpec, this.grammar)) {
        return kernel;
      }
    }
    return null;
  }

  @action newKernel(kernel: Kernel) {
    const mappedLanguage = Config.getJson("languageMappings")[kernel.language];
    this._registerBusySignal(kernel);
    this.runningKernels.set(mappedLanguage || kernel.language, kernel);
  }

  @action deleteKernel(kernel: Kernel) {
    for (let [language, runningKernel] of this.runningKernels.entries()) {
      if (kernel === runningKernel) {
        this.runningKernels.delete(language);
      }
    }
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

  @action setGrammar(editor: ?atom$TextEditor) {
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

  @action setBusySignalRegistry(registry) {
    this.busySignalRegistry = registry;
    this.runningKernels.forEach(this._registerBusySignal);
  }

  _registerBusySignal(kernel: Kernel) {
    if (this.busySignalRegistry) {
      const busySignalProvider = this.busySignalRegistry.create();
      reaction(
        () => kernel.executionState,
        state => {
          busySignalProvider.clear();
          if (state != "idle") {
            const message = kernel.displayName + " is " + state;
            busySignalProvider.add(message);
          }
        }
      );
    }
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
