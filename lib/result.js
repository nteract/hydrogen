/* @flow */
import ResultView from "./components/result-view";
import OutputPane from "./panes/output-area";
import WatchesPane from "./panes/watches";
import { OUTPUT_AREA_URI, openOrShowDock } from "./utils";

import type MarkerStore from "./store/markers";

/**
 * Creates and renders a ResultView.
 *
 * @param {Object} store - Global Hydrogen Store
 * @param {atom$TextEditor} store.editor - TextEditor associated with the result.
 * @param {Kernel} store.kernel - Kernel to run code and associate with the result.
 * @param {MarkerStore} store.markers - MarkerStore that belongs to `store.editor`.
 * @param {Object} codeBlock - A Hydrogen Cell.
 * @param {String} codeBlock.code - Source string of the cell.
 * @param {Number} codeBlock.row - Row to display the result on.
 * @param {HydrogenCellType} codeBlock.cellType - Cell type of the cell.
 */
export function createResult(
  {
    editor,
    kernel,
    markers
  }: $ReadOnly<{
    editor: ?atom$TextEditor,
    kernel: ?Kernel,
    markers: ?MarkerStore
  }>,
  {
    code,
    row,
    cellType
  }: { code: string, row: number, cellType: HydrogenCellType }
) {
  if (!editor || !kernel || !markers) return;

  if (atom.workspace.getActivePaneItem() instanceof WatchesPane) {
    kernel.watchesStore.run();
    return;
  }
  const globalOutputStore =
    atom.config.get("Hydrogen.outputAreaDefault") ||
    atom.workspace.getPaneItems().find(item => item instanceof OutputPane)
      ? kernel.outputStore
      : null;

  if (globalOutputStore) openOrShowDock(OUTPUT_AREA_URI);

  const { outputStore } = new ResultView(
    markers,
    kernel,
    editor,
    row,
    !globalOutputStore || cellType == "markdown"
  );
  if (code.search(/[\S]/) != -1) {
    switch (cellType) {
      case "markdown":
        outputStore.appendOutput({
          output_type: "display_data",
          data: {
            "text/markdown": code
          },
          metadata: {}
        });
        outputStore.appendOutput({ data: "ok", stream: "status" });
        break;
      case "codecell":
        kernel.execute(code, result => {
          outputStore.appendOutput(result);
          if (globalOutputStore) globalOutputStore.appendOutput(result);
        });
        break;
    }
  } else {
    outputStore.appendOutput({ data: "ok", stream: "status" });
  }
}

/**
 * Clears a ResultView or selection of ResultViews.
 * To select a result to clear, put your cursor on the row on the ResultView.
 * To select multiple ResultViews, select text starting on the row of
 * the first ResultView to remove all the way to text on the row of the
 * last ResultView to remove. *This must be one selection and
 * the last selection made*
 *
 * @param {Object} store - Global Hydrogen Store
 * @param {atom$TextEditor} store.editor - TextEditor associated with the ResultView.
 * @param {MarkerStore} store.markers - MarkerStore that belongs to `store.editor` and the ResultView.
 */
export function clearResult({
  editor,
  markers
}: $ReadOnly<{
  editor: ?atom$TextEditor,
  markers: ?MarkerStore
}>) {
  if (!editor || !markers) return;
  const [startRow, endRow] = editor.getLastSelection().getBufferRowRange();

  for (let row = startRow; row <= endRow; row++) {
    markers.clearOnRow(row);
  }
}

/**
 * Clears all ResultViews of a MarkerStore.
 * It also clears the currect kernel results.
 *
 * @param {Object} store - Global Hydrogen Store
 * @param {Kernel} store.kernel - Kernel to clear outputs.
 * @param {MarkerStore} store.markers - MarkerStore to clear.
 */
export function clearResults({
  kernel,
  markers
}: $ReadOnly<{
  kernel: ?Kernel,
  markers: ?MarkerStore
}>) {
  if (markers) markers.clear();
  if (!kernel) return;
  kernel.outputStore.clear();
}
