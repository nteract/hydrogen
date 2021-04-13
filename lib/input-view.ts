import { TextEditor, Panel } from "atom";
import { setPreviouslyFocusedElement } from "./utils";

type opts = {
  prompt: string;
  defaultText?: string;
  allowCancel?: boolean;
  password?: boolean;
};
type cb = (s: string) => void;
export default class InputView {
  onConfirmed: cb;
  element: HTMLElement;
  miniEditor: TextEditor;
  panel: Panel | null | undefined;
  previouslyFocusedElement: HTMLElement | null | undefined;

  constructor(
    { prompt, defaultText, allowCancel, password }: opts,
    onConfirmed: cb
  ) {
    this.onConfirmed = onConfirmed;
    this.element = document.createElement("div");
    this.element.classList.add("hydrogen", "input-view");
    if (password) {
      this.element.classList.add("password");
    }
    const label = document.createElement("div");
    label.classList.add("label", "icon", "icon-arrow-right");
    label.textContent = prompt || "Kernel requires input";
    this.miniEditor = new TextEditor({
      mini: true,
    });
    if (defaultText) {
      this.miniEditor.setText(defaultText);
    }
    this.element.appendChild(label);
    this.element.appendChild(this.miniEditor.element);

    if (allowCancel) {
      atom.commands.add(this.element, {
        "core:confirm": () => this.confirm(),
        "core:cancel": () => this.close(),
      });
      this.miniEditor.element.addEventListener("blur", () => {
        if (document.hasFocus()) {
          this.close();
        }
      });
    } else {
      atom.commands.add(this.element, {
        "core:confirm": () => this.confirm(),
      });
    }
  }

  confirm() {
    const text = this.miniEditor.getText();
    if (this.onConfirmed) {
      this.onConfirmed(text);
    }
    this.close();
  }

  close() {
    if (this.panel) {
      this.panel.destroy();
    }
    this.panel = null;
    this.element.remove();
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  attach() {
    setPreviouslyFocusedElement(this);
    this.panel = atom.workspace.addModalPanel({
      item: this.element,
    });
    this.miniEditor.element.focus();
    this.miniEditor.scrollToCursorPosition();
  }
}
