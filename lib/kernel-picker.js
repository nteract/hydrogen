import { SelectListView } from 'atom-space-pen-views';
import _ from 'lodash';

// View to display a list of grammars to apply to the current editor.
export default class SignalListView extends SelectListView {
  initialize(getKernelSpecs) {
    this.getKernelSpecs = getKernelSpecs;
    super.initialize(...arguments);

    this.onConfirmed = null;
    return this.list.addClass('mark-active');
  }


  getFilterKey() {
    return 'name';
  }

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
    __guardMethod__(this, 'onConfirmed', o => o.onConfirmed(item));
    return this.cancel();
  }

  attach() {
    this.storeFocusedElement();
    if (this.panel == null) { this.panel = atom.workspace.addModalPanel({ item: this }); }
    this.focusFilterEditor();

    return this.getKernelSpecs(kernelSpec => {
      this.languageOptions = _.map(kernelSpec, kernelSpec =>
        ({
          name: kernelSpec.display_name,
          kernelSpec
        }));

      return this.setItems(this.languageOptions);
    });
  }

  getEmptyMessage() {
    return 'No running kernels found.';
  }

  toggle() {
    if (this.panel != null) {
      return this.cancel();
    } else if (this.editor = atom.workspace.getActiveTextEditor()) {
      return this.attach();
    }
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}
