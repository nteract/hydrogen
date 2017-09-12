/* @flow */

import { CompositeDisposable } from "atom";
import { observable, computed, action } from "mobx";
import { isMultilanguageGrammar, getEmbeddedScope } from "./../utils";
import _ from "lodash";

import Config from "./../config";
import MarkerStore from "./markers";
import kernelManager from "./../kernel-manager";
import Kernel from "./../kernel";

class Store {
  subscriptions = new CompositeDisposable();
  markers = new MarkerStore();
  runningKernels: Set<Kernel> = new Set();
  @observable kernelMapping: KernelMapping = {};
  @observable startingKernels: Map<string, boolean> = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar: ?atom$Grammar;

  @computed
  get kernel(): ?Kernel {
    if (!this.editor) return null;
    const filePath = this.editor.getPath();
    if (!filePath) return null;
    const kernel = this.kernelMapping[filePath];
    if (!kernel || kernel instanceof Kernel) return kernel;
    if (this.grammar) return kernel[this.grammar.name];
  }

  @action
  startKernel(kernelDisplayName: string) {
    this.startingKernels.set(kernelDisplayName, true);
  }

  @action
  newKernel(
    kernel: Kernel,
    filePath: string,
    editor: atom$TextEditor,
    grammar: atom$Grammar
  ) {
    if (isMultilanguageGrammar(editor.getGrammar())) {
      _.merge(this.kernelMapping, { [filePath]: { [grammar.name]: kernel } });
    } else {
      this.kernelMapping[filePath] = kernel;
    }
    this.runningKernels.add(kernel);
    // delete startingKernel since store.kernel now in place to prevent duplicate kernel
    this.startingKernels.delete(kernel.kernelSpec.display_name);
  }

  @action
  deleteKernel(kernel: Kernel) {
    _.forEach(this.kernelMapping, (value, key) => {
      if (value === kernel) delete this.kernelMapping[key];

      if (!(value instanceof Kernel)) {
        _.forEach(value, (k, key) => {
          if (k === kernel) delete value[key];
        });
      }
    });
    this.runningKernels.delete(kernel);
  }

  @action
  dispose() {
    this.subscriptions.dispose();
    this.markers.clear();
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels.clear();
    this.kernelMapping = {};
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
