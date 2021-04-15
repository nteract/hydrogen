import { CompositeDisposable, TextEditor, DisplayMarker } from "atom";
import OutputStore from "../../store/output";
import type MarkerStore from "../../store/markers";
import type Kernel from "../../kernel";
export default class ResultView {
    disposer: CompositeDisposable;
    marker: DisplayMarker;
    outputStore: OutputStore;
    destroy: () => void;
    constructor(markerStore: MarkerStore, kernel: Kernel | null | undefined, editor: TextEditor, row: number, showResult?: boolean);
}
