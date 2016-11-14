import { SelectListView } from 'atom-space-pen-views';
import _ from 'lodash';

// View to display a list of grammars to apply to the current editor.
export default class SignalListView extends SelectListView {
  initialize(getKernelSpecs) {
    this.getKernelSpecs = getKernelSpecs;
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
    __guard__(this.panel, x => x.destroy());
    this.panel = null;
    this.editor = null;
  }

  confirmed(item) {
    console.log('Selected command:', item);
    __guardMethod__(this, 'onConfirmed', o => o.onConfirmed(item));
    this.cancel();
  }

  attach() {
    this.storeFocusedElement();
    if (this.panel == null) { this.panel = atom.workspace.addModalPanel({ item: this }); }
    this.focusFilterEditor();

    this.getKernelSpecs((kernelSpec) => {
      this.languageOptions = _.map(kernelSpec, spec =>
        ({
          name: spec.display_name,
          spec,
        }));

      this.setItems(this.languageOptions);
    });
  }

  getEmptyMessage() {
    return 'No running kernels found.';
  }

  toggle() {
    if (this.panel != null) {
      this.cancel();
    } else if (atom.workspace.getActiveTextEditor()) {
      this.editor = atom.workspace.getActiveTextEditor();
      this.attach();
    }
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  }
  return undefined;
}
