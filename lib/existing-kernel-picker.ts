import { Panel } from "atom";
import SelectListView, { SelectListProperties } from "atom-select-list";
import store from "./store";
import tildify from "tildify";
import {
  kernelSpecProvidesGrammar,
  setPreviouslyFocusedElement,
} from "./utils";
import type Kernel from "./kernel";
import type { KernelspecMetadata } from "@nteract/types";

function getName(kernel: Kernel) {
  const prefix = kernel.transport.gatewayName
    ? `${kernel.transport.gatewayName}: `
    : "";
  return `${prefix + kernel.displayName} - ${store
    .getFilesForKernel(kernel)
    .map(tildify)
    .join(", ")}`;
}

export default class ExistingKernelPicker {
  kernelSpecs: Array<KernelspecMetadata>;
  selectListView: SelectListView;
  panel: Panel | null | undefined;
  previouslyFocusedElement: HTMLElement | null | undefined;

  constructor() {
    this.selectListView = new SelectListView({
      itemsClassList: ["mark-active"],
      items: [] as Kernel[],
      filterKeyForItem: (kernel: Kernel) => getName(kernel),
      elementForItem: (kernel: Kernel) => {
        const element = document.createElement("li");
        element.textContent = getName(kernel);
        return element;
      },
      didConfirmSelection: (kernel: Kernel) => {
        const { filePath, editor, grammar } = store;
        if (!filePath || !editor || !grammar) {
          return this.cancel();
        }
        store.newKernel(kernel, filePath, editor, grammar);
        this.cancel();
      },
      didCancelSelection: () => this.cancel(),
      emptyMessage: "No running kernels for this language.",
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
    } else if (store.filePath && store.grammar) {
      await this.selectListView.update({
        items: store.runningKernels.filter((kernel) =>
          kernelSpecProvidesGrammar(kernel.kernelSpec, store.grammar)
        ),
      } as SelectListProperties);
      const markers = store.markers;
      if (markers) {
        markers.clear();
      }
      this.attach();
    }
  }
}
