/* @flow */

import { action, observable } from "mobx";
import SelectListView from "atom-select-list";

import WatchStore from "./watch";

import type Kernel from "./../kernel";
import typeof store from "./index";

export default class WatchesStore {
  kernel: Kernel;
  @observable watches: Array<WatchStore> = [];

  constructor(kernel: Kernel) {
    this.kernel = kernel;

    this.kernel.addWatchCallback(this.run);
    this.addWatch();
  }

  @action
  createWatch = () => {
    const watch = new WatchStore(this.kernel);
    this.watches.push(watch);
    return watch;
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
    const commands = [
      {
        name: "Remove All",
        value: -1,
        type: "command"
      }
    ];
    const watches = this.watches
      .map((v, k) => ({
        name: v.getCode(),
        value: k,
        type: "watch"
      }))
      .filter(obj => obj.value !== 0 || obj.name !== "");

    // give empty list if no watches to remove
    const watchPickerItems =
      watches.length > 0 ? [...watches, ...commands] : [];

    const previouslyFocusedElement = document.activeElement;

    const cancelSelection = () => {
      modalPanel.destroy();
      if (previouslyFocusedElement) previouslyFocusedElement.focus();
      watchesPicker.destroy();
    };

    const watchesPicker = new SelectListView({
      // keep commands at bottom to prevent accidental selection
      items: watchPickerItems,
      elementForItem: item => {
        const element = document.createElement("li");
        element.textContent =
          item.type === "watch" ? item.name || "<empty>" : "";
        if (item.type === "command") {
          const div = document.createElement("div");
          div.classList.add(
            "primary-line",
            "status-removed",
            "icon",
            "icon-diff-removed"
          );
          div.textContent = item.name;
          element.appendChild(div);
        }

        return element;
      },
      didConfirmSelection: item => {
        if (item.type === "watch") {
          this.watches.splice(item.value, 1);
        } else {
          if (item.name === "Remove All") this.removeAll();
        }
        modalPanel.destroy();
        watchesPicker.destroy();
        if (this.watches.length === 0) this.addWatch();
        else if (previouslyFocusedElement) previouslyFocusedElement.focus();
      },
      filterKeyForItem: item => item.name,
      didCancelSelection: () => cancelSelection(),
      didConfirmEmptySelection: () => cancelSelection(),
      emptyMessage: "There are no watches to remove!"
    });

    const modalPanel = atom.workspace.addModalPanel({
      item: watchesPicker
    });

    watchesPicker.focus();
  };

  @action
  run = () => {
    this.watches.forEach(watch => watch.run());
  };

  @action
  removeAll = () => {
    // always keep one
    this.watches.splice(1);
    this.watches[0].setCode("");
  };
}
