'use babel';

import { observable, computed, action } from 'mobx';
import { editorToLanguage } from './../utils';

class Store {
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @computed get kernel() {
    return this.runningKernels.get(editorToLanguage(this.editor));
  }
  @computed get language() {
    return editorToLanguage(this.editor);
  }
  @computed get grammar() {
    return this.editor.getGrammar();
  }

  @action newKernel(kernel) {
    this.runningKernels.set(kernel.language, kernel);
  }

  @action deleteKernel(language) {
    this.runningKernels.delete(language);
  }

  @action dispose() {
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels = new Map();
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
