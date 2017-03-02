'use babel';

import { observable, computed } from 'mobx';
import { editorToLanguage } from './../utils';

class Store {
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @computed get currentKernel() {
    return this.runningKernels.get(editorToLanguage(this.editor));
  }
  @computed get currentLanguage() {
    return editorToLanguage(this.editor);
  }
  @computed get currentGrammar() {
    return this.editor.getGrammar();
  }

  newKernel(kernel) {
    this.runningKernels.set(kernel.language, kernel);
  }

  dispose() {
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels = new Map();
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
