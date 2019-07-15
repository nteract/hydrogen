/* @flow */
import { CompositeDisposable, Disposable } from "atom";

import type { Store } from "../../store";

export const autocompleteProvider = {
  disposables: new CompositeDisposable(),
  watchEditor: (editor: atom$TextEditor, labels: Array<string>) => {
    return;
  }
};
window.autocomplete = autocompleteProvider;

export function addWatchEditor(
  store: Store,
  watchEditor: atom$AutocompleteWatchEditor
) {
  autocompleteProvider.watchEditor = watchEditor;
  for (let kernel of store.runningKernels) {
    for (let watch of kernel.watchesStore.watches) {
      const disposable = watchEditor(this.editor, [
        "default",
        "workspace-center",
        "symbol-provider"
      ]);
      if (disposable) {
        watch.autocompleteDisposable = disposable;
        kernel.watchesStore.autocompleteDisposables.add(disposable);
      }
    }
    autocompleteProvider.disposables.add(
      kernel.watchesStore.autocompleteDisposables
    );
  }
  return new Disposable(this.disableAutocomplete.bind(this, store));
}

export function disableAutocomplete(store: Store) {
  autocompleteProvider.watchEditor = () => {
    return;
  };
  for (let kernel of store.runningKernels) {
    for (let watch of kernel.watchesStore.watches) {
      watch.autocompleteDisposable = null;
    }
    kernel.watchesStore.autocompleteDisposables = new CompositeDisposable();
  }
  autocompleteProvider.disposables.dispose();
  autocompleteProvider.disposables = new CompositeDisposable();
}
