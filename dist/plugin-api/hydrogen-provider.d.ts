import { TextEditor, Range, Emitter } from "atom";
import type Kernel from "../kernel";
export default class HydrogenProvider {
    private _emitter;
    constructor(emitter: Emitter<{}, {
        "did-change-kernel": Kernel;
    }>);
    onDidChangeKernel(callback: (...args: Array<any>) => any): void;
    getActiveKernel(): import("./hydrogen-kernel").default;
    getCellRange(editor: TextEditor | null | undefined): Range;
}
