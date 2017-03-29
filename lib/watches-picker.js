'use babel';

import { SelectListView } from 'atom-space-pen-views';

import { log } from './utils';

class SignalListView extends SelectListView {
  initialize() {
    super.initialize(...arguments);
    this.onConfirmed = null;
    this.list.addClass('mark-active');
  }

  getFilterKey() {
    return 'name';
  }

  destroy() {
    this.cancel();
  }

  viewForItem(item) {
    const element = document.createElement('li');
    element.textContent = item.name;
    return element;
  }

  cancelled() {
    if (this.panel) this.panel.destroy();
    this.panel = null;
    this.editor = null;
  }

  confirmed(item) {
    log('Selected command:', item);

    if (this.onConfirmed) {
      this.onConfirmed(item);
    }
    this.cancel();
  }

  attach() {
    this.storeFocusedElement();
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this });
    }
    this.focusFilterEditor();
  }

  getEmptyMessage() {
    return 'No watches found.';
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

export default new SignalListView();
