"use babel";

import { SelectListView } from "atom-space-pen-views";
import _ from "lodash";

import { log } from "./utils";

// View to display a list of grammars to apply to the current editor.
export default class SignalListView extends SelectListView {
  initialize(kernelSpecs) {
    this.kernelSpecs = kernelSpecs;
    super.initialize(...arguments);

    this.onConfirmed = null;
    this.list.addClass("mark-active");
  }

  getFilterKey() {
    return "name";
  }

  destroy() {
    this.cancel();
  }

  viewForItem(item) {
    const element = document.createElement("li");
    element.textContent = item.name;
    return element;
  }

  cancelled() {
    if (this.panel) this.panel.destroy();
    this.panel = null;
    this.editor = null;
  }

  confirmed(item) {
    log("Selected command:", item);
    if (this.onConfirmed) this.onConfirmed(item);
    this.cancel();
  }

  attach() {
    this.storeFocusedElement();
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this });
    }
    this.focusFilterEditor();

    this.languageOptions = _.map(this.kernelSpecs, spec => ({
      name: spec.display_name,
      kernelSpec: spec
    }));

    this.setItems(this.languageOptions);
  }

  getEmptyMessage() {
    return "No running kernels found.";
  }

  toggle() {
    if (this.panel) {
      this.cancel();
    } else if (atom.workspace.getActiveTextEditor()) {
      this.editor = atom.workspace.getActiveTextEditor();
      this.attach();
    }
  }
}
