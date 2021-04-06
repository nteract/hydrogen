import { TextEditorElement } from "atom";

declare module "atom/src/text-editor" {
  interface TextEditor {
    element: TextEditorElement;
  }
}
