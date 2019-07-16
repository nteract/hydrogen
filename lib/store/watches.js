/* @flow */

import { action, observable } from "mobx";
import SelectListView from "atom-select-list";
import { CompositeDisposable } from "atom";

import WatchStore from "./watch";
import { autocompleteConsumer } from "../services/consumed/autocomplete";

import type Kernel from "./../kernel";
import typeof store from "./index";

export default class WatchesStore {
  kernel: Kernel;
  @observable
  watches: Array<WatchStore> = [];
  autocompleteDisposables = new CompositeDisposable();

  constructor(kernel: Kernel) {
    this.kernel = kernel;

    this.kernel.addWatchCallback(this.run);
    autocompleteConsumer.disposables.add(this.autocompleteDisposables);
    this.addWatch();
  }

  @action
  createWatch = () => {
    const lastWatch = this.watches[this.watches.length - 1];
    if (!lastWatch || lastWatch.getCode().trim() !== "") {
      const watch = new WatchStore(this.kernel);
      this.watches.push(watch);
      const disposable = autocompleteConsumer.watchEditor(watch.editor, [
        "default",
        "workspace-center",
        "symbol-provider"
      ]);
      if (disposable) {
        watch.autocompleteDisposable = disposable;
        this.autocompleteDisposables.add(disposable);
      }
      return watch;
    }
    return lastWatch;
  };

  @action
  addWatch = () => {
    this.createWatch().focus();
  };

  @action
  addWatchFromEditor = (editor: atom$TextEditor) => {
    if (!editor) return;
    const watchText = editor.getSelectedText();
    if (!watchText) {
      this.addWatch();
    } else {
      const watch = this.createWatch();
      watch.setCode(watchText);
      watch.run();
    }
  };

  @action
  removeWatch = () => {
    const watches = this.watches
      .map((v, k) => ({
        name: v.getCode(),
        value: k
      }))
      .filter(obj => obj.value !== 0 || obj.name !== "");

    const watchesPicker = new SelectListView({
      items: watches,
      elementForItem: watch => {
        const element = document.createElement("li");
        element.textContent = watch.name || "<empty>";
        return element;
      },
      didConfirmSelection: watch => {
        const selectedWatch = this.watches[watch.value];
        if (selectedWatch.autocompleteDisposable) {
          selectedWatch.autocompleteDisposable.dispose();
          this.autocompleteDisposables.remove(
            selectedWatch.autocompleteDisposable
          );
        }
        this.watches.splice(watch.value, 1);
        modalPanel.destroy();
        watchesPicker.destroy();
        if (this.watches.length === 0) this.addWatch();
        else if (previouslyFocusedElement) previouslyFocusedElement.focus();
      },
      filterKeyForItem: watch => watch.name,
      didCancelSelection: () => {
        modalPanel.destroy();
        if (previouslyFocusedElement) previouslyFocusedElement.focus();
        watchesPicker.destroy();
      },
      emptyMessage: "There are no watches to remove!"
    });
    const previouslyFocusedElement = document.activeElement;
    const modalPanel = atom.workspace.addModalPanel({
      item: watchesPicker
    });
    watchesPicker.focus();
  };

  @action
  run = () => {
    this.watches.forEach(watch => watch.run());
  };

  destroy() {
    autocompleteConsumer.disposables.remove(this.autocompleteDisposables);
    this.autocompleteDisposables.dispose();
  }
}
