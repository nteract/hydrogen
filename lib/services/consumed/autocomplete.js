/* @flow */

import { CompositeDisposable, Disposable } from "atom";

import type { Store } from "../../store";
import type WatchesStore from "../../store/watches";
import type WatchStore from "../../store/watch";

/**
 * This acts as a global storage for the consumed service.
 */
export class AutocompleteWatchEditor {
  disposables: atom$CompositeDisposable;
  /** The `consumed autocompleteWatchEditor` */
  addAutocompleteToEditor = (
    editor: atom$TextEditor,
    labels: Array<string>
  ) => {
    return;
  };
  isEnabeled: boolean = false;

  /**
   * This function is called on activation of autocomplete, or if autocomplete is
   * already active, then it is called when hydrogen activates.
   *
   * @param {Store} store - The global Hydrogen store.
   * @param {Function} watchEditor - The function provided by `autocomplete.watchEditor`.
   * @returns {Disposable} - This is for clean up when autocomplete or hydrogen deactivate.
   */
  consume(store: Store, watchEditor: atom$AutocompleteWatchEditor) {
    this.disposables = new CompositeDisposable();
    this.addAutocompleteToEditor = watchEditor;

    // Add autocomplete capabilities to already existing watches
    for (let kernel of store.runningKernels) {
      const watchesStoreDisposable = new CompositeDisposable();
      kernel.watchesStore.autocompleteDisposables = watchesStoreDisposable;
      this.disposables.add(watchesStoreDisposable);
      for (let watch of kernel.watchesStore.watches) {
        this.addAutocompleteToWatch(kernel.watchesStore, watch);
      }
    }
    this.isEnabeled = true;
    const disposable = new Disposable(() => this.disable(store));
    store.subscriptions.add(disposable);
    return disposable;
  }

  /**
   * This function is just for cleaning up when either autocomplete or hydrogen is deactivating.
   *
   * @param {Store} store - The global Hydrogen store.
   */
  disable(store: Store) {
    // Removes the consumed function `watchEditor`
    this.addAutocompleteToEditor = (
      editor: atom$TextEditor,
      labels: Array<string>
    ) => {
      return;
    };

    /*
     * Removes disposables from all watches (leaves references inside
     * `this.disposables` to be disposed at the end).
     * Autocomplete is only actually disabled on dispose of `this.disposables`
     */
    for (let kernel of store.runningKernels) {
      for (let watch of kernel.watchesStore.watches) {
        watch.autocompleteDisposable = null;
      }
      kernel.watchesStore.autocompleteDisposables = null;
    }

    // Disables autocomplete, Cleans up everything, and Resets.
    this.disposables.dispose();
    this.isEnabeled = false;
  }

  /**
   * This function is for adding autocomplete capabilities to a watch.
   *
   * @param {WatchesStore} watchesStore - This should always be the parent `WatchesStore` of `watch`.
   * @param {WatchStore} watch - The watch to add autocomplete to.
   */
  addAutocompleteToWatch(watchesStore: WatchesStore, watch: WatchStore) {
    const disposable = this.addAutocompleteToEditor(watch.editor, [
      "default",
      "workspace-center",
      "symbol-provider"
    ]);
    if (disposable) {
      watch.autocompleteDisposable = disposable;
      if (watchesStore.autocompleteDisposables)
        watchesStore.autocompleteDisposables.add(disposable);
    }
  }

  /**
   * This function is for removing autocomplete capabilities from a watch.
   *
   * @param {WatchesStore} watchesStore - This should always be the parent `WatchesStore` of `watch`.
   * @param {WatchStore} watch - The watch to remove autocomplete from.
   */
  removeAutocompleteFromWatch(watchesStore: WatchesStore, watch: WatchStore) {
    const disposable = watch.autocompleteDisposable;
    if (disposable) {
      if (watchesStore.autocompleteDisposables)
        watchesStore.autocompleteDisposables.remove(disposable);
      disposable.dispose();
      watch.autocompleteDisposable = null;
    }
  }

  /**
   * Removes and disposes an autocomplete disposable
   *
   * @param {Disposable | CompositeDisposable} disposable
   */
  dispose(disposable: Disposable | CompositeDisposable) {
    this.disposables.remove(disposable);
    disposable.dispose();
  }

  /**
   * Adds a disposable as an autocomplete disposable.
   *
   * @param {Disposable | CompositeDisposable} disposable
   */
  register(disposable: Disposable | CompositeDisposable) {
    this.disposables.add(disposable);
  }
}

const autocompleteConsumer = new AutocompleteWatchEditor();
export default autocompleteConsumer;
