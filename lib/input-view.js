'use babel';

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
    this.div(() => {
      this.label(this.prompt, { class: 'icon icon-arrow-right', outlet: 'promptText' });
      this.subview('miniEditor', new TextEditorView({ mini: true }));
    });
  }

  initialize(prompt, onConfirmed) {
    this.prompt = prompt;
    this.onConfirmed = onConfirmed;
    atom.commands.add(this.element, { 'core:confirm': () => this.confirm() });
  }


  storeFocusedElement() {
    this.previouslyFocusedElement = $(document.activeElement);
  }

  restoreFocus() {
    if (this.previouslyFocusedElement) this.previouslyFocusedElement.focus();
  }

  confirm() {
    const text = this.miniEditor.getText();
    if (this.onConfirmed) this.onConfirmed(text);
    this.close();
  }

  close() {
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
