/* @flow */
import ResultView from "./components/result-view";
import OutputPane from "./panes/output-area";
import WatchesPane from "./panes/watches";
import { OUTPUT_AREA_URI, openOrShowDock } from "./utils";

import type MarkerStore from "./store/markers";

// Accepts store as an arg
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
  codeBlock: { code: string, row: number, cellType: HydrogenCellType }
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
    codeBlock.row,
    !globalOutputStore || codeBlock.cellType == "markdown"
  );
  if (codeBlock.code.search(/[\S]/) != -1) {
    switch (codeBlock.cellType) {
      case "markdown":
        outputStore.appendOutput({
          output_type: "display_data",
          data: {
            "text/markdown": codeBlock.code
          },
          metadata: {}
        });
        outputStore.appendOutput({ data: "ok", stream: "status" });
        break;
      case "codecell":
        kernel.execute(codeBlock.code, result => {
          outputStore.appendOutput(result);
          if (globalOutputStore) globalOutputStore.appendOutput(result);
        });
        break;
    }
  } else {
    outputStore.appendOutput({ data: "ok", stream: "status" });
  }
}

// Accepts store as an arg
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

// Accepts store as an arg
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
