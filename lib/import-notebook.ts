import { TextEditor, Grammar } from "atom";
import * as path from "path";
import { promises } from "fs";
const { readFile } = promises;
import type { HydrogenCellType } from "./hydrogen";

import { remote } from "electron";
const { dialog } = remote;

import { fromJS } from "@nteract/commutable";
import type { Notebook, JSONObject, Cell } from "@nteract/commutable";
import store from "./store";
import { getCommentStartString } from "./code-manager";
import { importResult, convertMarkdownToOutput } from "./result";
const linesep = process.platform === "win32" ? "\r\n" : "\n";

/**
 * Determines if the provided uri is a valid file for Hydrogen to import. Then
 * it loads the notebook.
 *
 * @param {String} uri - Uri of the file to open.
 */
export function ipynbOpener(uri: string) {
  if (
    path.extname(uri).toLowerCase() === ".ipynb" &&
    atom.config.get("Hydrogen.importNotebookURI") === true
  ) {
    return _loadNotebook(
      uri,
      atom.config.get("Hydrogen.importNotebookResults")
    );
  }
}

/**
 * Determines if the provided event is trying to open a valid file for Hydrogen
 * to import. Otherwise it will ask the user to chose a valid file for Hydrogen
 * to import. Then it loads the notebook.
 *
 * @param {Event} event - Atom Event from clicking in a treeview.
 */
export function importNotebook(event?: CustomEvent) {
  // Use selected filepath if called from tree-view context menu
  const filenameFromTreeView = event.target.dataset?.path;

  if (filenameFromTreeView && path.extname(filenameFromTreeView) === ".ipynb") {
    return _loadNotebook(
      filenameFromTreeView,
      atom.config.get("Hydrogen.importNotebookResults")
    );
  }

  dialog.showOpenDialog(
    {
      properties: ["openFile"],
      filters: [
        {
          name: "Notebooks",
          extensions: ["ipynb"],
        },
      ],
    },
    (filenames: Array<string> | null | undefined) => {
      if (!filenames) {
        atom.notifications.addError("No filenames selected");
        return;
      }

      const filename = filenames[0];

      if (path.extname(filename) !== ".ipynb") {
        atom.notifications.addError("Selected file must have extension .ipynb");
        return;
      }

      _loadNotebook(
        filename,
        atom.config.get("Hydrogen.importNotebookResults")
      );
    }
  );
}

/**
 * Reads the given notebook file and coverts it to a text editor format with
 * Hydrogen cell breakpoints. Optionally after opening the notebook, it will
 * also load the previous results and display them.
 *
 * @param {String} filename - Path of the file.
 * @param {Boolean} importResults - Decides whether to display previous results
 */
export async function _loadNotebook(
  filename: string,
  importResults: boolean = false
) {
  let data;
  let nb;

  try {
    data = JSON.parse(await readFile(filename, { encoding: "utf-8" }));

    if (data.nbformat < 3) {
      atom.notifications.addError("Only notebook version 4 is fully supported");
      return;
    } else if (data.nbformat == 3) {
      atom.notifications.addWarning(
        "Only notebook version 4 is fully supported"
      );
    }

    nb = fromJS(data);
  } catch (err) {
    if (err.name === "SyntaxError") {
      atom.notifications.addError("Error not a valid notebook", {
        detail: err.stack,
      });
    } else {
      atom.notifications.addError("Error reading file", {
        detail: err,
      });
    }

    return;
  }

  const editor = await atom.workspace.open();
  const grammar = getGrammarForNotebook(nb);
  if (!grammar) {
    return;
  }
  atom.grammars.assignLanguageMode(editor.getBuffer(), grammar.scopeName);
  const commentStartString = getCommentStartString(editor);

  if (!commentStartString) {
    atom.notifications.addError("No comment symbol defined in root scope");
    return;
  }

  const nbCells = [];
  const sources = [];
  const resultRows = [];
  let previousBreakpoint = -1;
  nb.cellOrder.forEach((value) => {
    const cell = nb.cellMap.get(value).toJS();
    nbCells.push(cell);
    const hyCell = toHydrogenCodeBlock(cell, `${commentStartString} `);
    resultRows.push(previousBreakpoint + hyCell.code.trim().split("\n").length);
    previousBreakpoint += hyCell.row;
    sources.push(hyCell.code);
  });
  editor.setText(sources.join(linesep));
  if (importResults) {
    importNotebookResults(editor, nbCells, resultRows);
  }
}

/**
 * Tries to determine the Atom Grammar of a notebook. Default is Python.
 *
 * @param {Notebook} nb - The Notebook to determine the Atom Grammar of.
 * @returns {Grammar} - The grammar of the notebook.
 */
function getGrammarForNotebook(nb: Notebook) {
  const metaData = nb.metadata;
  const {
    kernelspec,
    // Offical nbformat v4
    language_info,
    // Offical nbformat v4
    kernel_info,
    // Sometimes used in nbformat v3
    language, // Sometimes used in nbformat v3
  } = typeof metaData.toJS === "function" ? metaData.toJS() : metaData; // TODO fix toJS
  const kernel = kernelspec ? kernelspec : kernel_info;
  const lang = language_info
    ? language_info
    : language
    ? {
        name: language,
      }
    : null;

  if (!kernel && !lang) {
    atom.notifications.addWarning(
      "No language metadata in notebook; assuming Python"
    );
    return atom.grammars.grammarForScopeName("source.python");
  }

  let matchedGrammar = null;

  if (lang) {
    // lang.name should be required
    matchedGrammar = getGrammarForLanguageName(lang.name);
    if (matchedGrammar) {
      return matchedGrammar;
    }

    // lang.file_extension is not required, but if lang.name retrieves no match,
    // this is the next best thing.
    if (lang.file_extension) {
      matchedGrammar = getGrammarForFileExtension(lang.file_extension);
    }

    if (matchedGrammar) {
      return matchedGrammar;
    }
  }

  if (kernel) {
    // kernel.language is not required, but its often more accurate than name
    matchedGrammar = getGrammarForLanguageName(kernel.language);
    if (matchedGrammar) {
      return matchedGrammar;
    }
    // kernel.name should be required, but is often a kernel name, so its hard
    // to match effciently
    matchedGrammar = getGrammarForKernelspecName(kernel.name);
    if (matchedGrammar) {
      return matchedGrammar;
    }
  }

  atom.notifications.addWarning("Unable to determine correct language grammar");
  return atom.grammars.grammarForScopeName("source.python");
}

/**
 * Tries to find a matching Atom Grammar from a language name
 *
 * @param {String} name - The language name to find a grammar for.
 * @returns {Grammar} - The matching Atom Grammar.
 */
function getGrammarForLanguageName(name: string) {
  if (!name) {
    return null;
  }
  const formattedName = name.toLowerCase().replace(" ", "-");
  const scopeName = `source.${formattedName}`;
  const grammars = atom.grammars.getGrammars();

  for (const g of grammars) {
    if (
      g &&
      ((g.name && g.name.toLowerCase() == name.toLowerCase()) ||
        g.scopeName == scopeName)
    ) {
      return g;
    }
  }

  return null;
}

/**
 * Tries to find a matching Atom Grammar from a file extensions
 *
 * @param {String} ext - The file extension to find a grammar for.
 * @returns {Grammar} - The matching Atom Grammar.
 */
function getGrammarForFileExtension(ext: string): Grammar | null | undefined {
  if (!ext) {
    return null;
  }
  ext = ext.startsWith(".") ? ext.slice(1) : ext;
  const grammars = atom.grammars.getGrammars();
  return grammars.find((grammar) => {
    return grammar.fileTypes.includes(ext);
  });
}

/**
 * Tries to find a matching Atom Grammar from KernelspecMetadata name
 *
 * @param {String} name - The KernelspecMetadata name to find a grammar for.
 * @returns {Grammar} - The matching Atom Grammar.
 */
function getGrammarForKernelspecName(name: string): Grammar | null | undefined {
  // Check if there exists an Atom grammar named source.${name}
  const grammar = getGrammarForLanguageName(name);
  if (grammar) {
    return grammar;
  }
  // Otherwise attempt manual matching from kernelspec name to Atom scope
  const crosswalk = {
    python2: "source.python",
    python3: "source.python",
    bash: "source.shell",
    javascript: "source.js",
    ir: "source.r",
  };

  if (crosswalk[name]) {
    return atom.grammars.grammarForScopeName(crosswalk[name]);
  }
}

/**
 * Converts notebook cells to Hydrogen code blocks.
 *
 * @param {Cell} cell - Notebook cell to convert
 * @param {String} commentStartString - The comment syntax of the code language.
 * @returns {Object} - A Hydrogen Code Block.
 */
function toHydrogenCodeBlock(
  cell: Cell,
  commentStartString: string
): {
  cellType: HydrogenCellType;
  code: string;
  row: number;
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
    row: cellLength + 1, // plus 1 for the header
  };
}

/**
 * Creates a Hydrogen cell header
 *
 * @param {String} commentStartString - The comment syntax of the code language.
 * @param {String} keyword - The keyword relating to the cell type.
 * @returns {String} - A Hydrogen Cell Header.
 */
function getCellHeader(
  commentStartString: string,
  keyword: string | null | undefined
) {
  const marker = `${commentStartString}%% `;
  return keyword ? marker + keyword : marker;
}

/**
 * Displays previous cell results inline of the provided editor. nbCells and
 * resultRows should be the same length.
 *
 * @param {TextEditor} editor - The editor to display the results in.
 * @param {Cell[]} nbCells - The original notebook cells.
 * @param {Number[]} resultRows - The rows to display the results on.
 */
function importNotebookResults(
  editor: TextEditor,
  nbCells: Array<Cell>,
  resultRows: Array<number>
) {
  if (nbCells.length != resultRows.length) {
    return;
  }
  let markers = store.markersMapping.get(editor.id);
  markers = markers ? markers : store.newMarkerStore(editor.id);
  let cellNumber = 0;

  for (const cell of nbCells) {
    const row = resultRows[cellNumber];

    switch (cell.cell_type) {
      case "code":
        if (cell.outputs.length > 0) {
          importResult(
            {
              editor,
              markers,
            },
            {
              outputs: cell.outputs,
              row,
            }
          );
        }

        break;

      case "markdown":
        importResult(
          {
            editor,
            markers,
          },
          {
            outputs: [convertMarkdownToOutput(cell.source)],
            row,
          }
        );
        break;
    }

    cellNumber++;
  }
}
