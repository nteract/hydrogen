/* @flow */
import { CompositeDisposable, Disposable } from "atom";

import type { Store } from "../../store";

/**
 * This acts as a global storage for the consumed service.
 *
 * @namespace autocompleteConsumer
 * @property {CompositeDisposable} disposables - The disposables for when autocomplete is to be deactivated.
 * @property {Function} watchEditor - The function provided by `autocomplete.watchEditor`.
 */
export const autocompleteConsumer = {
  disposables: new CompositeDisposable(),
  watchEditor: (editor: atom$TextEditor, labels: Array<string>) => {
    return;
  }
};

/**
 * This function is called on activation of autocomplete, or if autocomplete is
 * already active, then it is called when hydrogen activates.
 *
 * @function addWatchEditor
 * @param {Store} store - The global Hydrogen store.
 * @param {Function} watchEditor - The function provided by `autocomplete.watchEditor`.
 * @returns {Disposable} This is for clean up when autocomplete or hydrogen deactivate.
 */
export function addWatchEditor(
  store: Store,
  watchEditor: atom$AutocompleteWatchEditor
) {
  autocompleteConsumer.watchEditor = watchEditor;
  for (let kernel of store.runningKernels) {
    for (let watch of kernel.watchesStore.watches) {
      const disposable = watchEditor(watch.editor, [
        "default",
        "workspace-center",
        "symbol-provider"
      ]);
      if (disposable) {
        watch.autocompleteDisposable = disposable;
        kernel.watchesStore.autocompleteDisposables.add(disposable);
      }
    }
    autocompleteConsumer.disposables.add(
      kernel.watchesStore.autocompleteDisposables
    );
  }
  return new Disposable(() => disableAutocomplete(store));
}

/**
 * This function is just for cleaning up when either autocomplete of hydrogen is deactivating.
 *
 * @function disableAutocomplete
 * @param {Store} store - The global Hydrogen store.
 */
export function disableAutocomplete(store: Store) {
  autocompleteConsumer.watchEditor = () => {
    return;
  };
  for (let kernel of store.runningKernels) {
    for (let watch of kernel.watchesStore.watches) {
      watch.autocompleteDisposable = null;
    }
    kernel.watchesStore.autocompleteDisposables = new CompositeDisposable();
  }
  autocompleteConsumer.disposables.dispose();
  autocompleteConsumer.disposables = new CompositeDisposable();
}
