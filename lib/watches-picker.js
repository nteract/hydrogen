import { SelectListView } from 'atom-space-pen-views';

class SignalListView extends SelectListView {
    initialize() {
        super.initialize(...arguments);
        this.onConfirmed = null;
        return this.list.addClass('mark-active');
    }

    getFilterKey() { return 'name'; }

    destroy() {
        return this.cancel();
    }

    viewForItem(item) {
        let element = document.createElement('li');
        element.textContent = item.name;
        return element;
    }

    cancelled() {
        __guard__(this.panel, x => x.destroy());
        this.panel = null;
        return this.editor = null;
    }

    confirmed(item) {
        console.log('Selected command:', item);

        if (this.onConfirmed != null) {
            this.onConfirmed(item);
        }
        return this.cancel();
    }

    attach() {
        this.storeFocusedElement();
        if (this.panel == null) { this.panel = atom.workspace.addModalPanel({item: this}); }
        return this.focusFilterEditor();
    }

    getEmptyMessage() {
        return 'No watches found.';
    }

    toggle() {
        if (this.panel != null) {
            return this.cancel();
        } else if (this.editor = atom.workspace.getActiveTextEditor()) {
            return this.attach();
        }
    }
}

export default new SignalListView;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}