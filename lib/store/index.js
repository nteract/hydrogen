'use babel';

import { CompositeDisposable } from 'atom';
import { observable, computed, action } from 'mobx';
import { grammarToLanguage, isMultilanguageGrammar } from './../utils';

class Store {
  subscriptions = new CompositeDisposable();
  @observable runningKernels = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar;

  @computed get kernel() {
    return this.runningKernels.get(grammarToLanguage(this.grammar));
  }
  @computed get language() {
    return grammarToLanguage(this.grammar);
  }

  @action setGrammar(editor) {
    const topLevelGrammar = editor.getGrammar();
    if (!isMultilanguageGrammar(topLevelGrammar)) {
      this.grammar = topLevelGrammar;
    } else {
      const scopes = editor.getCursorScope().getScopesArray()
        .filter(s => s.indexOf('source.embedded.') === 0);

      if (scopes.length === 0) {
        this.grammar = topLevelGrammar;
      } else {
        const scope = scopes[0].replace('.embedded', '');
        this.grammar = atom.grammars.grammarForScopeName(scope);
      }
    }
  }

  @action newKernel(kernel) {
    this.runningKernels.set(kernel.language, kernel);
  }

  @action deleteKernel(language) {
    this.runningKernels.delete(language);
  }

  @action dispose() {
    this.subscriptions.dispose();
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels = new Map();
  }

  @action updateEditor(editor) {
    this.editor = editor;
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
