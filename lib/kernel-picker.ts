import { Panel } from "atom";
import SelectListView, { SelectListProperties } from "atom-select-list";
import { log, setPreviouslyFocusedElement } from "./utils";
import type { KernelspecMetadata } from "@nteract/types";

export default class KernelPicker {
  kernelSpecs: Array<KernelspecMetadata>;
  onConfirmed: ((kernelSpecs: KernelspecMetadata) => void) | null | undefined;
  selectListView: SelectListView;
  panel: Panel | null | undefined;
  previouslyFocusedElement: HTMLElement | null | undefined;

  constructor(kernelSpecs: Array<KernelspecMetadata>) {
    this.kernelSpecs = kernelSpecs;
    this.onConfirmed = null;
    this.selectListView = new SelectListView({
      itemsClassList: ["mark-active"],
      items: [] as KernelspecMetadata[],
      filterKeyForItem: (item: KernelspecMetadata) => item.display_name,
      elementForItem: (item: KernelspecMetadata) => {
        const element = document.createElement("li");
        element.textContent = item.display_name;
        return element;
      },
      didConfirmSelection: (item: KernelspecMetadata) => {
        log("Selected kernel:", item);
        if (this.onConfirmed) {
          this.onConfirmed(item);
        }
        this.cancel();
      },
      didCancelSelection: () => this.cancel(),
      emptyMessage: "No kernels found",
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

    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  attach() {
    setPreviouslyFocusedElement(this);
    if (this.panel == null) {
      this.panel = atom.workspace.addModalPanel({
        item: this.selectListView,
      });
    }
    this.selectListView.focus();
    this.selectListView.reset();
  }

  async toggle() {
    if (this.panel != null) {
      this.cancel();
    } else {
      await this.selectListView.update({
        items: this.kernelSpecs,
      } as SelectListProperties);
      this.attach();
    }
  }
}
