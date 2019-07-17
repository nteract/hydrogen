/* @flow */
import { CompositeDisposable, Disposable } from "atom";

import type { Store } from "../../store";
import type WatchesStore from "../../store/watches";
import type WatchStore from "../../store/watch";

/**
 * This acts as a global storage for the consumed service.
 *
 * @namespace autocompleteConsumer
 * @property {CompositeDisposable} disposables - The disposables for when autocomplete is to be deactivated.
 * @property {Function} addAutocompleteToEditor - The function provided by `autocomplete.watchEditor`.
 */
export const autocompleteConsumer = {
  disposables: new CompositeDisposable(),
  addAutocompleteToEditor: (editor: atom$TextEditor, labels: Array<string>) => {
    return;
  }
};

/**
 * This function is called on activation of autocomplete, or if autocomplete is
 * already active, then it is called when hydrogen activates.
 *
 * @function consumeWatchEditor
 * @param {Store} store - The global Hydrogen store.
 * @param {Function} watchEditor - The function provided by `autocomplete.watchEditor`.
 * @returns {Disposable} This is for clean up when autocomplete or hydrogen deactivate.
 */
export function consumeWatchEditor(
  store: Store,
  watchEditor: atom$AutocompleteWatchEditor
) {
  autocompleteConsumer.addAutocompleteToEditor = watchEditor;

  // Add autocomplete capabilities to already existing watches
  for (let kernel of store.runningKernels) {
    for (let watch of kernel.watchesStore.watches) {
      addAutocompleteToWatch(kernel.watchesStore, watch);
    }
    autocompleteConsumer.disposables.add(
      kernel.watchesStore.autocompleteDisposables
    );
  }

  return new Disposable(() => disableAutocomplete(store));
}

/**
 * This function is just for cleaning up when either autocomplete or hydrogen is deactivating.
 *
 * @function disableAutocomplete
 * @param {Store} store - The global Hydrogen store.
 */
export function disableAutocomplete(store: Store) {
  autocompleteConsumer.addAutocompleteToEditor = () => {};

  /*
   * Removes disposables from all watches (leaves references inside
   * `autocompleteConsumer.disposables` to be disposed at the end).
   * Autocomplete is only actually disabled on dispose of `autocompleteConsumer.disposables`
   */
  for (let kernel of store.runningKernels) {
    for (let watch of kernel.watchesStore.watches) {
      watch.autocompleteDisposable = null;
    }
    kernel.watchesStore.autocompleteDisposables = new CompositeDisposable();
  }

  // Disables autocomplete, Cleans up everything, and Resets.
  autocompleteConsumer.disposables.dispose();
  autocompleteConsumer.disposables = new CompositeDisposable();
}

/**
 * This function is for adding autocomplete capabilities to a watch.
 *
 * @function addAutocompleteToWatch
 * @param {WatchesStore} watchesStore - This should always be the parent `WatchesStore` of `watch`.
 * @param {WatchStore} watch - The watch to add autocomplete to.
 */
export function addAutocompleteToWatch(
  watchesStore: WatchesStore,
  watch: WatchStore
) {
  const disposable = autocompleteConsumer.addAutocompleteToEditor(
    watch.editor,
    ["default", "workspace-center", "symbol-provider"]
  );
  if (disposable) {
    watch.autocompleteDisposable = disposable;
    watchesStore.autocompleteDisposables.add(disposable);
  }
}

/**
 * This function is for removing autocomplete capabilities from a watch.
 *
 * @function removeAutocompleteFromWatch
 * @param {WatchesStore} watchesStore - This should always be the parent `WatchesStore` of `watch`.
 * @param {WatchStore} watch - The watch to remove autocomplete from.
 */
export function removeAutocompleteFromWatch(
  watchesStore: WatchesStore,
  watch: WatchStore
) {
  const disposable = watch.autocompleteDisposable;
  if (disposable) {
    watchesStore.autocompleteDisposables.remove(disposable);
    disposable.dispose();
    watch.autocompleteDisposable = null;
  }
}
