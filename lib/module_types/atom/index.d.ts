import { TextEditorElement } from "atom";

declare module "atom/src/text-editor" {
  interface TextEditor {
    element: TextEditorElement;
  }
}

declare module "atom/src/package-manager" {
  interface PackageManager {
    unloadPackage(packageName: string): void;
  }
}
