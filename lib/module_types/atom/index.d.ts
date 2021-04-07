import { TextEditorElement, Disposable } from "atom";

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

declare module "atom/dependencies/event-kit" {
  interface CompositeDisposable {
    disposables: Set<Disposable>;
  }
}
