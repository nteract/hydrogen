import { $, TextEditorView, View } from 'atom-space-pen-views';

export default class InputView extends View {
  constructor(...args) {
    super(...args);
    this.confirm = this.confirm.bind(this);
    this.close = this.close.bind(this);
  }

  static content(prompt) {
    this.prompt = prompt;
    if (this.prompt === '') {
      this.prompt = 'Kernel requires input';
    }
    return this.div(() => {
      this.label(this.prompt, { class: 'icon icon-arrow-right', outlet: 'promptText' });
      return this.subview('miniEditor', new TextEditorView({ mini: true }));
    });
  }

  initialize(prompt, onConfirmed) {
    this.prompt = prompt;
    this.onConfirmed = onConfirmed;
    return atom.commands.add(this.element, { 'core:confirm': this.confirm });
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
    return this.close();
  }

  close() {
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
