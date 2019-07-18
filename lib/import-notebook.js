/* @flow */

import * as path from "path";
import { readFile } from "fs";
import _ from "lodash";

import { promisify } from "util";
const { dialog } = require("electron").remote;
import { fromJS } from "@nteract/commutable";
import type { Notebook, Cell } from "@nteract/commutable";

import store from "./store";
import { getCommentStartString } from "./code-manager";
import { importResult, convertMarkdownToOutput } from "./result";

const readFileP = promisify(readFile);
const linesep = process.platform === "win32" ? "\r\n" : "\n";

export function ipynbOpener(uri: string) {
  if (
    path.extname(uri).toLowerCase() === ".ipynb" &&
    atom.config.get("Hydrogen.importNotebookURI") === true
  ) {
    return _loadNotebook(uri);
  }
}

export function importNotebook(event?: atom$CustomEvent) {
  // Use selected filepath if called from tree-view context menu
  const filenameFromTreeView = _.get(event, "target.dataset.path");
  if (filenameFromTreeView && path.extname(filenameFromTreeView) === ".ipynb") {
    return _loadNotebook(filenameFromTreeView);
  }

  dialog.showOpenDialog(
    {
      properties: ["openFile"],
      filters: [{ name: "Notebooks", extensions: ["ipynb"] }]
    },
    (filenames: ?Array<string>) => {
      if (!filenames) {
        atom.notifications.addError("No filenames selected");
        return;
      }
      const filename = filenames[0];
      if (path.extname(filename) !== ".ipynb") {
        atom.notifications.addError("Selected file must have extension .ipynb");
        return;
      }

      _loadNotebook(filename);
    }
  );
}

export async function _loadNotebook(filename: string) {
  let data;
  let nb;
  try {
    data = await readFileP(filename);
    nb = fromJS(JSON.parse(data));
  } catch (err) {
    if (err.name === "SyntaxError") {
      atom.notifications.addError("Error not a valid notebook", {
        detail: err.stack
      });
    } else {
      atom.notifications.addError("Error reading file", {
        detail: err
      });
    }
    return;
  }
  if (nb.nbformat < 4) {
    atom.notifications.addError("Only notebook version 4 currently supported");
    return;
  }
  const editor = await atom.workspace.open();
  const grammar = getGrammarForNotebook(nb);
  if (!grammar) return;
  atom.grammars.assignLanguageMode(editor, grammar.scopeName);
  const commentStartString = getCommentStartString(editor);
  if (!commentStartString) {
    atom.notifications.addError("No comment symbol defined in root scope");
    return;
  }
  const nbCells = nb.cellMap.valueSeq().toArray();
  let sources = [];
  let resultRows = [];
  let previousBreakpoint = -1;
  for (let cell of nbCells) {
    let hydrogenCell = toHydrogenCodeBlock(cell, commentStartString + " ");
    resultRows.push(
      previousBreakpoint + hydrogenCell.code.trim().split(linesep).length
    );
    previousBreakpoint += hydrogenCell.row;
    sources.push(hydrogenCell.code);
  }
  editor.setText(sources.join(linesep));
  let markers = store.markersMapping.get(editor.id);
  markers = markers ? markers : store.newMarkerStore(editor.id);
  let cellNumber = 0;
  for (let cell of nbCells) {
    const row = resultRows[cellNumber];

    switch (cell.cell_type) {
      case "code":
        if (cell.outputs.toArray().length > 0) {
          importResult(
            { editor, markers },
            { outputs: cell.outputs.toArray(), row }
          );
        }
        break;
      case "markdown":
        importResult(
          { editor, markers },
          { outputs: [convertMarkdownToOutput(cell.source)], row }
        );
        break;
    }
    cellNumber++;
  }
}

function getGrammarForNotebook(nb: Notebook) {
  if (!nb.metadata.kernelspec || !nb.metadata.language_info) {
    atom.notifications.addWarning(
      "No language metadata in notebook; assuming Python"
    );
    return atom.grammars.grammarForScopeName("source.python");
  }

  let matchedGrammar = null;
  // metadata.language_info.file_extension is not a required metadata field, but
  // if it exists is the best way to match with Atom Grammar
  if (nb.metadata.language_info && nb.metadata.language_info.file_extension) {
    matchedGrammar = getGrammarForFileExtension(
      nb.metadata.language_info.file_extension
    );
    if (matchedGrammar) return matchedGrammar;
  }

  // If metadata exists, then metadata.kernelspec.name is required (in v4)
  if (nb.metadata.kernelspec.name) {
    matchedGrammar = getGrammarForKernelspecName(nb.metadata.kernelspec.name);
    if (matchedGrammar) return matchedGrammar;
  }

  atom.notifications.addWarning("Unable to determine correct language grammar");
  return atom.grammars.grammarForScopeName("source.python");
}

function getGrammarForFileExtension(ext: string): ?atom$Grammar {
  ext = ext.startsWith(".") ? ext.slice(1) : ext;
  const grammars = atom.grammars.getGrammars();
  return _.find(grammars, grammar => {
    return _.includes(grammar.fileTypes, ext);
  });
}

function getGrammarForKernelspecName(name: string): ?atom$Grammar {
  // Check if there exists an Atom grammar named source.${name}
  const grammars = atom.grammars.getGrammars();
  const matchedGrammar = _.find(grammars, { scopeName: `source.${name}` });
  if (matchedGrammar) return matchedGrammar;

  // Otherwise attempt manual matching from kernelspec name to Atom scope
  const crosswalk = {
    python2: "source.python",
    python3: "source.python",
    bash: "source.shell",
    javascript: "source.js",
    ir: "source.r"
  };
  if (crosswalk[name]) {
    return atom.grammars.grammarForScopeName(crosswalk[name]);
  }
}

function toHydrogenCodeBlock(
  cell: Cell,
  commentStartString: string
): {
  cellType: HydrogenCellType,
  code: string,
  row: number
} {
  const cellType = cell.cell_type === "markdown" ? "markdown" : "codecell";
  const cellHeader = getCellHeader(commentStartString, cellType);
  let source = cell.source;
  let cellLength;
  if (cellType === "markdown") {
    source = source.split("\n");
    source[0] = commentStartString + source[0];
    cellLength = source.length;
    source = source.join(linesep + commentStartString);
  } else {
    cellLength = source.split("\n").length;
  }
  return {
    cellType,
    code: cellHeader + linesep + source,
    row: cellLength + 1 // plus 1 for the header
  };
}

function getCellHeader(commentStartString: string, keyword: ?string) {
  const marker = commentStartString + "%% ";
  return keyword ? marker + keyword : marker;
}
