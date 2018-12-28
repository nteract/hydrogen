/* @flow */

import * as path from "path";
import { readFile } from "fs";
import _ from "lodash";

const { dialog } = require("electron").remote;
const { parseNotebook } = require("@nteract/commutable");

import store from "./store";
import { getCommentStartString } from "./code-manager";

const linesep = process.platform === "win32" ? "\r\n" : "\n";

export default function importNotebook() {
  dialog.showOpenDialog({ properties: ["openFile"] }, filenames => {
    if (filenames.length === 0) {
      atom.notifications.addError("No filenames selected");
      return;
    }
    const filename = filenames[0];
    if (path.extname(filename) !== ".ipynb") {
      atom.notifications.addError("Selected file must have extension .ipynb");
      return;
    }
    readFile(filename, loadNotebook);
  });
}

async function loadNotebook(err, data) {
  if (err) {
    atom.notifications.addError("Error reading file", {
      detail: err.message
    });
    return;
  }
  const nb = parseNotebook(data);
  if (nb.nbformat < 4) {
    atom.notifications.addError("Only notebook version 4 currently supported");
    return;
  }
  const editor = await atom.workspace.open();
  const grammar = getGrammarForNotebook(nb);
  if (!grammar) return;
  editor.setGrammar(grammar);
  const commentStartString = getCommentStartString(editor);
  if (!commentStartString) {
    atom.notifications.addError("No comment symbol defined in root scope");
    return;
  }
  const sources = _.map(nb.cells, cell => {
    return getCellSource(cell, commentStartString + " ");
  });
  editor.setText(sources.join(linesep));
}

function getGrammarForNotebook(nb) {
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

function getGrammarForKernelspecName(name: string): atom$Grammar {
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
  if (crosswalk.name) {
    return atom.grammars.grammarForScopeName(crosswalk.name);
  }
  return;
}

function getCellSource(cell, commentStartString: string): string {
  const cellType = cell.cell_type;
  const cellMarkerKeyword = cellType === "markdown" ? "markdown" : null;
  const cellMarker = getCellMarker(commentStartString, cellMarkerKeyword);
  var source = cell.source;
  if (cellType === "markdown") {
    source = _.map(source, line => commentStartString + line);
  }
  return cellMarker + linesep + source.join("");
}

function getCellMarker(commentStartString: string, keyword: ?string) {
  const marker = commentStartString + "%%";
  return keyword ? marker + ` ${keyword}` : marker;
}
