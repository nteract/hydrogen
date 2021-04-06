import { TextEditor, Disposable } from "atom";

// TODO upstream to @types/atom
declare module "atom/autocomplete-plus" {
  export type AutocompleteWatchEditor = (
    editor: TextEditor,
    labels: Array<string>
  ) => Disposable | null | undefined;
}
