'use babel';

import { observable, computed, autorun } from 'mobx';
import { editorToLanguage, grammarToLanguage } from './../utils';
import KernelStore from './kernel-store';

class Store {
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @computed get currentKernel() {
    return this.runningKernels.get(editorToLanguage(this.editor));
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
}

const store = new Store();
export default store;

/* eslint-disable no-console */
// For debugging
window.hydrogen_store = () => {
  autorun(() => {
    console.log(store);
  });
};
