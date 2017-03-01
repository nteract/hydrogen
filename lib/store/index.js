'use babel';

import { observable, computed } from 'mobx';
import { editorToLanguage, grammarToLanguage } from './../utils';
import KernelStore from './kernel-store';

class Store {
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @computed get currentKernel() {
    // Returns a Object to make sure store.currentKernel.xxx doesn't throw.
    // Therefor `if (store.currentKernel)` doesn't work.
    // Use `if (_.isEmpty(store.currentKernel))` or `if (store.currentKernel.name)` instead.
    return this.runningKernels.get(editorToLanguage(this.editor)) || {};
  }
  @computed get currentLanguage() {
    return editorToLanguage(this.editor);
  }
  @computed get currentGrammar() {
    return this.editor.getGrammar();
  }

  newKernel(kernelClass) {
    this.runningKernels.set(
      grammarToLanguage(kernelClass.grammar),
      new KernelStore(kernelClass),
    );
  }

  setExecutionState(kernelClass, executionState) {
    const kernel = this.runningKernels.get(grammarToLanguage(kernelClass.grammar));
    kernel.executionState = executionState;
  }

  dispose() {
    this.runningKernels.forEach(kernel => kernel.kernelClass.destroy());
    this.runningKernels = new Map();
  }

  disposeCurrentKernel() {
    this.currentKernel.kernelClass.destroy();
    this.runningKernels.delete(this.currentKernel.name);
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
