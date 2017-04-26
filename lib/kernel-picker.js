"use babel";

import SelectListView from "atom-select-list";
import _ from "lodash";

import { log } from "./utils";

export default class KernelPicker {
  constructor(kernelSpecs) {
    this.kernelSpecs = kernelSpecs;
    this.onConfirmed = null;

    this.selectListView = new SelectListView({
      itemsClassList: ["mark-active"],
      items: [],
      filterKeyForItem: item => item.display_name,
      elementForItem: item => {
        const element = document.createElement("li");
        element.textContent = item.display_name;
        return element;
      },
      didConfirmSelection: item => {
        log("Selected kernel:", item);
        if (this.onConfirmed) this.onConfirmed(item);
        this.cancel();
      },
      didCancelSelection: () => this.cancel(),
      emptyMessage: "No kernels found"
    });
  }

  destroy() {
    this.cancel();
    return this.selectListView.destroy();
  }

  cancel() {
    if (this.panel != null) {
      this.panel.destroy();
    }
    this.panel = null;
    this.editor = null;
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  attach() {
    this.previouslyFocusedElement = document.activeElement;
    if (this.panel == null)
      this.panel = atom.workspace.addModalPanel({ item: this.selectListView });
    this.selectListView.focus();
    this.selectListView.reset();
  }

  async toggle() {
    if (this.panel != null) {
      this.cancel();
    } else {
      await this.selectListView.update({ items: this.kernelSpecs });
      this.attach();
    }
  }
}
