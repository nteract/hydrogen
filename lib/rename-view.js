'use babel';

import { $, TextEditorView, View } from 'atom-space-pen-views';

export default class RenameView extends View {
  constructor(...args) {
    super(...args);
    this.confirm = this.confirm.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  static content(prompt) {
    this.prompt = prompt;
    this.div(() => {
      this.label(this.prompt, { class: 'icon icon-arrow-right', outlet: 'promptText' });
      this.subview('miniEditor', new TextEditorView({ mini: true }));
    });
  }

  initialize(prompt, defaultText, onConfirmed = () => {}) {
    this.prompt = prompt;
    this.defaultText = defaultText;
    this.onConfirmed = onConfirmed;
    atom.commands.add(this.element, {
      'core:confirm': this.confirm,
      'core:cancel': this.cancel,
    });

    this.miniEditor.on('blur', () => {
      if (document.hasFocus()) this.cancel();
    });

    this.miniEditor.setText(this.defaultText);
  }

  storeFocusedElement() {
    this.previouslyFocusedElement = $(document.activeElement);
  }

  restoreFocus() {
    if (this.previouslyFocusedElement) this.previouslyFocusedElement.focus();
  }

  confirm() {
    const text = this.miniEditor.getText();
    this.onConfirmed(text);
    this.cancel();
  }

  cancel() {
    if (this.panel) this.panel.destroy();
    this.panel = null;
    this.restoreFocus();
  }

  attach() {
    this.storeFocusedElement();
    this.panel = atom.workspace.addModalPanel({ item: this.element });
    this.miniEditor.focus();
    this.miniEditor.getModel().scrollToCursorPosition();
  }
}
