import { TextEditor } from "atom";
import ResultView from "./components/result-view";
import OutputPane from "./panes/output-area";
import WatchesPane from "./panes/watches";
import { OUTPUT_AREA_URI, openOrShowDock } from "./utils";
import type MarkerStore from "./store/markers";
import type Kernel from "./kernel";
import type { HydrogenCellType } from "./hydrogen";

/**
 * Creates and renders a ResultView.
 *
 * @param {Object} store - Global Hydrogen Store
 * @param {TextEditor} store.editor - TextEditor associated with the result.
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
    markers,
  }: Readonly<{
    editor: TextEditor | null | undefined;
    kernel: Kernel | null | undefined;
    markers: MarkerStore | null | undefined;
  }>,
  {
    code,
    row,
    cellType,
  }: {
    code: string;
    row: number;
    cellType: HydrogenCellType;
  }
) {
  if (!editor || !kernel || !markers) {
    return;
  }

  if (atom.workspace.getActivePaneItem() instanceof WatchesPane) {
    kernel.watchesStore.run();
    return;
  }

  const globalOutputStore =
    atom.config.get("Hydrogen.outputAreaDefault") ||
    atom.workspace.getPaneItems().find((item) => item instanceof OutputPane)
      ? kernel.outputStore
      : null;
  if (globalOutputStore) {
    openOrShowDock(OUTPUT_AREA_URI);
  }
  const { outputStore } = new ResultView(
    markers,
    kernel,
    editor,
    row,
    !globalOutputStore || cellType == "markdown"
  );

  if (code.search(/\S/) != -1) {
    switch (cellType) {
      case "markdown":
        if (globalOutputStore) {
          globalOutputStore.appendOutput(convertMarkdownToOutput(code));
        } else {
          outputStore.appendOutput(convertMarkdownToOutput(code));
        }
        outputStore.appendOutput({
          data: "ok",
          stream: "status",
        });
        break;

      case "codecell":
        kernel.execute(code, (result) => {
          outputStore.appendOutput(result);
          if (globalOutputStore) {
            globalOutputStore.appendOutput(result);
          }
        });
        break;
    }
  } else {
    outputStore.appendOutput({
      data: "ok",
      stream: "status",
    });
  }
}

/**
 * Creates inline results from Kernel Responses without a tie to a kernel.
 *
 * @param {Store} store - Hydrogen store
 * @param {TextEditor} store.editor - The editor to display the results in.
 * @param {MarkerStore} store.markers - Should almost always be the editor's `MarkerStore`
 * @param {Object} bundle - The bundle to display.
 * @param {Object[]} bundle.outputs - The Kernel Responses to display.
 * @param {Number} bundle.row - The editor row to display the results on.
 */
export function importResult(
  {
    editor,
    markers,
  }: {
    editor: TextEditor | null | undefined;
    markers: MarkerStore | null | undefined;
  },
  {
    outputs,
    row,
  }: {
    outputs: Array<Record<string, any>>;
    row: number;
  }
) {
  if (!editor || !markers) {
    return;
  }
  const { outputStore } = new ResultView(
    markers,
    null,
    editor,
    row,
    true // Always show inline
  );

  for (const output of outputs) {
    outputStore.appendOutput(output);
  }
}

/**
 * Clears a ResultView or selection of ResultViews. To select a result to clear,
 * put your cursor on the row on the ResultView. To select multiple ResultViews,
 * select text starting on the row of the first ResultView to remove all the way
 * to text on the row of the last ResultView to remove. *This must be one
 * selection and the last selection made*
 *
 * @param {Object} store - Global Hydrogen Store
 * @param {TextEditor} store.editor - TextEditor associated with the ResultView.
 * @param {MarkerStore} store.markers - MarkerStore that belongs to
 *   `store.editor` and the ResultView.
 */
export function clearResult({
  editor,
  markers,
}: Readonly<{
  editor: TextEditor | null | undefined;
  markers: MarkerStore | null | undefined;
}>) {
  if (!editor || !markers) {
    return;
  }
  const [startRow, endRow] = editor.getLastSelection().getBufferRowRange();

  for (let row = startRow; row <= endRow; row++) {
    markers.clearOnRow(row);
  }
}

/**
 * Clears all ResultViews of a MarkerStore. It also clears the currect kernel results.
 *
 * @param {Object} store - Global Hydrogen Store
 * @param {Kernel} store.kernel - Kernel to clear outputs.
 * @param {MarkerStore} store.markers - MarkerStore to clear.
 */
export function clearResults({
  kernel,
  markers,
}: Readonly<{
  kernel: Kernel | null | undefined;
  markers: MarkerStore | null | undefined;
}>) {
  if (markers) {
    markers.clear();
  }
  if (!kernel) {
    return;
  }
  kernel.outputStore.clear();
}

/**
 * Converts a string of raw markdown to a display_data Kernel Response. This
 * allows for hydrogen to display markdown text as if is was any normal result
 * that came back from the kernel.
 *
 * @param {String} markdownString - A string of raw markdown code.
 * @returns {Object} A fake display_data Kernel Response.
 */
export function convertMarkdownToOutput(markdownString: string) {
  return {
    output_type: "display_data",
    data: {
      "text/markdown": markdownString,
    },
    metadata: {},
  };
}
