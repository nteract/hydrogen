import { TextEditor, Disposable } from "atom";
import OutputStore from "./output";
import type Kernel from "../kernel";
export default class WatchStore {
    kernel: Kernel;
    editor: TextEditor;
    outputStore: OutputStore;
    autocompleteDisposable: Disposable | null | undefined;
    constructor(kernel: Kernel);
    run: () => void;
    setCode: (code: string) => void;
    getCode: () => string;
    focus: () => void;
}
