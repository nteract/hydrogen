import { $, TextEditorView, View } from 'atom-space-pen-views';

export default class RenameView extends View {
  constructor(...args) {
    super(...args);
    this.confirm = this.confirm.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  static content(prompt) {
    this.prompt = prompt;
    return this.div(() => {
      this.label(this.prompt, { class: 'icon icon-arrow-right', outlet: 'promptText' });
      return this.subview('miniEditor', new TextEditorView({ mini: true }));
    });
  }

  initialize(prompt, defaultText, onConfirmed) {
    this.prompt = prompt;
    this.defaultText = defaultText;
    this.onConfirmed = onConfirmed;
    atom.commands.add(this.element, {
      'core:confirm': this.confirm,
      'core:cancel': this.cancel
    });

    this.miniEditor.on('blur', e => {
      if (!!document.hasFocus()) { return this.cancel(); }
    });

    return this.miniEditor.setText(this.defaultText);
  }

  storeFocusedElement() {
    return this.previouslyFocusedElement = $(document.activeElement);
  }

  restoreFocus() {
    return __guard__(this.previouslyFocusedElement, x => x.focus());
  }

  confirm() {
    let text = this.miniEditor.getText();
    __guardMethod__(this, 'onConfirmed', o => o.onConfirmed(text));
    return this.cancel();
  }

  cancel() {
    __guard__(this.panel, x => x.destroy());
    this.panel = null;
    return this.restoreFocus();
  }

  attach() {
    this.storeFocusedElement();
    this.panel = atom.workspace.addModalPanel({ item: this.element });
    this.miniEditor.focus();
    return this.miniEditor.getModel().scrollToCursorPosition();
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
