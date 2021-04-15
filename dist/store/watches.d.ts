import { TextEditor, CompositeDisposable } from "atom";
import WatchStore from "./watch";
import type Kernel from "../kernel";
export default class WatchesStore {
    kernel: Kernel;
    watches: Array<WatchStore>;
    autocompleteDisposables: CompositeDisposable | null | undefined;
    previouslyFocusedElement: HTMLElement | null | undefined;
    constructor(kernel: Kernel);
    createWatch: () => WatchStore;
    addWatch: () => void;
    addWatchFromEditor: (editor: TextEditor) => void;
    removeWatch: () => void;
    run: () => void;
    destroy(): void;
}
