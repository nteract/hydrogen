import { TextEditorElement } from "atom";

declare module "atom/src/text-editor" {
  interface TextEditor {
    element: TextEditorElement;
  }
}

declare module "atom/src/package-manager" {
  interface PackageManager {
    loadPackage(packageName: string): void;
    unloadPackage(packageName: string): void;
  }
}
