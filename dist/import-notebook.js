"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._loadNotebook = exports.importNotebook = exports.ipynbOpener = void 0;
const path = __importStar(require("path"));
const fs_1 = require("fs");
const { readFile } = fs_1.promises;
const lodash_1 = __importDefault(require("lodash"));
const electron_1 = require("electron");
const { dialog } = electron_1.remote;
const commutable_1 = require("@nteract/commutable");
const store_1 = __importDefault(require("./store"));
const code_manager_1 = require("./code-manager");
const result_1 = require("./result");
const linesep = process.platform === "win32" ? "\r\n" : "\n";
function ipynbOpener(uri) {
    if (path.extname(uri).toLowerCase() === ".ipynb" &&
        atom.config.get("Hydrogen.importNotebookURI") === true) {
        return _loadNotebook(uri, atom.config.get("Hydrogen.importNotebookResults"));
    }
}
exports.ipynbOpener = ipynbOpener;
function importNotebook(event) {
    const filenameFromTreeView = lodash_1.default.get(event, "target.dataset.path");
    if (filenameFromTreeView && path.extname(filenameFromTreeView) === ".ipynb") {
        return _loadNotebook(filenameFromTreeView, atom.config.get("Hydrogen.importNotebookResults"));
    }
    dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
            {
                name: "Notebooks",
                extensions: ["ipynb"],
            },
        ],
    }, (filenames) => {
        if (!filenames) {
            atom.notifications.addError("No filenames selected");
            return;
        }
        const filename = filenames[0];
        if (path.extname(filename) !== ".ipynb") {
            atom.notifications.addError("Selected file must have extension .ipynb");
            return;
        }
        _loadNotebook(filename, atom.config.get("Hydrogen.importNotebookResults"));
    });
}
exports.importNotebook = importNotebook;
async function _loadNotebook(filename, importResults = false) {
    let data;
    let nb;
    try {
        data = JSON.parse(await readFile(filename, { encoding: "utf-8" }));
        if (data.nbformat < 3) {
            atom.notifications.addError("Only notebook version 4 is fully supported");
            return;
        }
        else if (data.nbformat == 3) {
            atom.notifications.addWarning("Only notebook version 4 is fully supported");
        }
        nb = commutable_1.fromJS(data);
    }
    catch (err) {
        if (err.name === "SyntaxError") {
            atom.notifications.addError("Error not a valid notebook", {
                detail: err.stack,
            });
        }
        else {
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
    const commentStartString = code_manager_1.getCommentStartString(editor);
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
exports._loadNotebook = _loadNotebook;
function getGrammarForNotebook(nb) {
    const metaData = nb.metadata;
    const { kernelspec, language_info, kernel_info, language, } = typeof metaData.toJS === "function" ? metaData.toJS() : metaData;
    const kernel = kernelspec ? kernelspec : kernel_info;
    const lang = language_info
        ? language_info
        : language
            ? {
                name: language,
            }
            : null;
    if (!kernel && !lang) {
        atom.notifications.addWarning("No language metadata in notebook; assuming Python");
        return atom.grammars.grammarForScopeName("source.python");
    }
    let matchedGrammar = null;
    if (lang) {
        matchedGrammar = getGrammarForLanguageName(lang.name);
        if (matchedGrammar) {
            return matchedGrammar;
        }
        if (lang.file_extension) {
            matchedGrammar = getGrammarForFileExtension(lang.file_extension);
        }
        if (matchedGrammar) {
            return matchedGrammar;
        }
    }
    if (kernel) {
        matchedGrammar = getGrammarForLanguageName(kernel.language);
        if (matchedGrammar) {
            return matchedGrammar;
        }
        matchedGrammar = getGrammarForKernelspecName(kernel.name);
        if (matchedGrammar) {
            return matchedGrammar;
        }
    }
    atom.notifications.addWarning("Unable to determine correct language grammar");
    return atom.grammars.grammarForScopeName("source.python");
}
function getGrammarForLanguageName(name) {
    if (!name) {
        return null;
    }
    const formattedName = name.toLowerCase().replace(" ", "-");
    const scopeName = `source.${formattedName}`;
    const grammars = atom.grammars.getGrammars();
    for (const g of grammars) {
        if (g &&
            ((g.name && g.name.toLowerCase() == name.toLowerCase()) ||
                g.scopeName == scopeName)) {
            return g;
        }
    }
    return null;
}
function getGrammarForFileExtension(ext) {
    if (!ext) {
        return null;
    }
    ext = ext.startsWith(".") ? ext.slice(1) : ext;
    const grammars = atom.grammars.getGrammars();
    return lodash_1.default.find(grammars, (grammar) => {
        return lodash_1.default.includes(grammar.fileTypes, ext);
    });
}
function getGrammarForKernelspecName(name) {
    const grammar = getGrammarForLanguageName(name);
    if (grammar) {
        return grammar;
    }
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
function toHydrogenCodeBlock(cell, commentStartString) {
    const cellType = cell.cell_type === "markdown" ? "markdown" : "codecell";
    const cellHeader = getCellHeader(commentStartString, cellType);
    let source = cell.source;
    let cellLength;
    if (cellType === "markdown") {
        source = source.split("\n");
        source[0] = commentStartString + source[0];
        cellLength = source.length;
        source = source.join(linesep + commentStartString);
    }
    else {
        cellLength = source.split("\n").length;
    }
    return {
        cellType,
        code: cellHeader + linesep + source,
        row: cellLength + 1,
    };
}
function getCellHeader(commentStartString, keyword) {
    const marker = `${commentStartString}%% `;
    return keyword ? marker + keyword : marker;
}
function importNotebookResults(editor, nbCells, resultRows) {
    if (nbCells.length != resultRows.length) {
        return;
    }
    let markers = store_1.default.markersMapping.get(editor.id);
    markers = markers ? markers : store_1.default.newMarkerStore(editor.id);
    let cellNumber = 0;
    for (const cell of nbCells) {
        const row = resultRows[cellNumber];
        switch (cell.cell_type) {
            case "code":
                if (cell.outputs.length > 0) {
                    result_1.importResult({
                        editor,
                        markers,
                    }, {
                        outputs: cell.outputs,
                        row,
                    });
                }
                break;
            case "markdown":
                result_1.importResult({
                    editor,
                    markers,
                }, {
                    outputs: [result_1.convertMarkdownToOutput(cell.source)],
                    row,
                });
                break;
        }
        cellNumber++;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LW5vdGVib29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2ltcG9ydC1ub3RlYm9vay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJCQUE4QjtBQUM5QixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsYUFBUSxDQUFDO0FBQzlCLG9EQUF1QjtBQUd2Qix1Q0FBa0M7QUFDbEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLGlCQUFNLENBQUM7QUFFMUIsb0RBQTZDO0FBRTdDLG9EQUE0QjtBQUM1QixpREFBdUQ7QUFDdkQscUNBQWlFO0FBQ2pFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQVE3RCxTQUFnQixXQUFXLENBQUMsR0FBVztJQUNyQyxJQUNFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssUUFBUTtRQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLElBQUksRUFDdEQ7UUFDQSxPQUFPLGFBQWEsQ0FDbEIsR0FBRyxFQUNILElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQ2xELENBQUM7S0FDSDtBQUNILENBQUM7QUFWRCxrQ0FVQztBQVNELFNBQWdCLGNBQWMsQ0FBQyxLQUFtQjtJQUVoRCxNQUFNLG9CQUFvQixHQUFHLGdCQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBRWpFLElBQUksb0JBQW9CLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLFFBQVEsRUFBRTtRQUMzRSxPQUFPLGFBQWEsQ0FDbEIsb0JBQW9CLEVBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQ2xELENBQUM7S0FDSDtJQUVELE1BQU0sQ0FBQyxjQUFjLENBQ25CO1FBQ0UsVUFBVSxFQUFFLENBQUMsVUFBVSxDQUFDO1FBQ3hCLE9BQU8sRUFBRTtZQUNQO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixVQUFVLEVBQUUsQ0FBQyxPQUFPLENBQUM7YUFDdEI7U0FDRjtLQUNGLEVBQ0QsQ0FBQyxTQUEyQyxFQUFFLEVBQUU7UUFDOUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDckQsT0FBTztTQUNSO1FBRUQsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTlCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxRQUFRLEVBQUU7WUFDdkMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUN4RSxPQUFPO1NBQ1I7UUFFRCxhQUFhLENBQ1gsUUFBUSxFQUNSLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQ2xELENBQUM7SUFDSixDQUFDLENBQ0YsQ0FBQztBQUNKLENBQUM7QUF4Q0Qsd0NBd0NDO0FBVU0sS0FBSyxVQUFVLGFBQWEsQ0FDakMsUUFBZ0IsRUFDaEIsZ0JBQXlCLEtBQUs7SUFFOUIsSUFBSSxJQUFJLENBQUM7SUFDVCxJQUFJLEVBQUUsQ0FBQztJQUVQLElBQUk7UUFDRixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRW5FLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUU7WUFDckIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUMxRSxPQUFPO1NBQ1I7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxFQUFFO1lBQzdCLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUMzQiw0Q0FBNEMsQ0FDN0MsQ0FBQztTQUNIO1FBRUQsRUFBRSxHQUFHLG1CQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDbkI7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxhQUFhLEVBQUU7WUFDOUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUU7Z0JBQ3hELE1BQU0sRUFBRSxHQUFHLENBQUMsS0FBSzthQUNsQixDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUU7Z0JBQ2hELE1BQU0sRUFBRSxHQUFHO2FBQ1osQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPO0tBQ1I7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDM0MsTUFBTSxPQUFPLEdBQUcscUJBQXFCLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDMUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU87S0FDUjtJQUNELElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4RSxNQUFNLGtCQUFrQixHQUFHLG9DQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXpELElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1FBQ3ZFLE9BQU87S0FDUjtJQUVELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDbkIsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDNUIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM3QixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25CLE1BQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLElBQUksRUFBRSxHQUFHLGtCQUFrQixHQUFHLENBQUMsQ0FBQztRQUNuRSxVQUFVLENBQUMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVFLGtCQUFrQixJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDakMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0QyxJQUFJLGFBQWEsRUFBRTtRQUNqQixxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ3BEO0FBQ0gsQ0FBQztBQS9ERCxzQ0ErREM7QUFRRCxTQUFTLHFCQUFxQixDQUFDLEVBQVk7SUFDekMsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQztJQUM3QixNQUFNLEVBQ0osVUFBVSxFQUVWLGFBQWEsRUFFYixXQUFXLEVBRVgsUUFBUSxHQUNULEdBQUcsT0FBTyxRQUFRLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7SUFDckUsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUNyRCxNQUFNLElBQUksR0FBRyxhQUFhO1FBQ3hCLENBQUMsQ0FBQyxhQUFhO1FBQ2YsQ0FBQyxDQUFDLFFBQVE7WUFDVixDQUFDLENBQUM7Z0JBQ0UsSUFBSSxFQUFFLFFBQVE7YUFDZjtZQUNILENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFVCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ3BCLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUMzQixtREFBbUQsQ0FDcEQsQ0FBQztRQUNGLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztLQUMzRDtJQUVELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQztJQUUxQixJQUFJLElBQUksRUFBRTtRQUVSLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsSUFBSSxjQUFjLEVBQUU7WUFDbEIsT0FBTyxjQUFjLENBQUM7U0FDdkI7UUFJRCxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDdkIsY0FBYyxHQUFHLDBCQUEwQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUNsRTtRQUVELElBQUksY0FBYyxFQUFFO1lBQ2xCLE9BQU8sY0FBYyxDQUFDO1NBQ3ZCO0tBQ0Y7SUFFRCxJQUFJLE1BQU0sRUFBRTtRQUVWLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUQsSUFBSSxjQUFjLEVBQUU7WUFDbEIsT0FBTyxjQUFjLENBQUM7U0FDdkI7UUFHRCxjQUFjLEdBQUcsMkJBQTJCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFELElBQUksY0FBYyxFQUFFO1lBQ2xCLE9BQU8sY0FBYyxDQUFDO1NBQ3ZCO0tBQ0Y7SUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0lBQzlFLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBUUQsU0FBUyx5QkFBeUIsQ0FBQyxJQUFZO0lBQzdDLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDVCxPQUFPLElBQUksQ0FBQztLQUNiO0lBQ0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDM0QsTUFBTSxTQUFTLEdBQUcsVUFBVSxhQUFhLEVBQUUsQ0FBQztJQUM1QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRTdDLEtBQUssTUFBTSxDQUFDLElBQUksUUFBUSxFQUFFO1FBQ3hCLElBQ0UsQ0FBQztZQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNyRCxDQUFDLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxFQUMzQjtZQUNBLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQVFELFNBQVMsMEJBQTBCLENBQUMsR0FBVztJQUM3QyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ1IsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDL0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM3QyxPQUFPLGdCQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQ2xDLE9BQU8sZ0JBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFRRCxTQUFTLDJCQUEyQixDQUFDLElBQVk7SUFFL0MsTUFBTSxPQUFPLEdBQUcseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEQsSUFBSSxPQUFPLEVBQUU7UUFDWCxPQUFPLE9BQU8sQ0FBQztLQUNoQjtJQUVELE1BQU0sU0FBUyxHQUFHO1FBQ2hCLE9BQU8sRUFBRSxlQUFlO1FBQ3hCLE9BQU8sRUFBRSxlQUFlO1FBQ3hCLElBQUksRUFBRSxjQUFjO1FBQ3BCLFVBQVUsRUFBRSxXQUFXO1FBQ3ZCLEVBQUUsRUFBRSxVQUFVO0tBQ2YsQ0FBQztJQUVGLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUMzRDtBQUNILENBQUM7QUFTRCxTQUFTLG1CQUFtQixDQUMxQixJQUFVLEVBQ1Ysa0JBQTBCO0lBTTFCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztJQUN6RSxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDL0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN6QixJQUFJLFVBQVUsQ0FBQztJQUVmLElBQUksUUFBUSxLQUFLLFVBQVUsRUFBRTtRQUMzQixNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyxDQUFDO0tBQ3BEO1NBQU07UUFDTCxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7S0FDeEM7SUFFRCxPQUFPO1FBQ0wsUUFBUTtRQUNSLElBQUksRUFBRSxVQUFVLEdBQUcsT0FBTyxHQUFHLE1BQU07UUFDbkMsR0FBRyxFQUFFLFVBQVUsR0FBRyxDQUFDO0tBQ3BCLENBQUM7QUFDSixDQUFDO0FBU0QsU0FBUyxhQUFhLENBQ3BCLGtCQUEwQixFQUMxQixPQUFrQztJQUVsQyxNQUFNLE1BQU0sR0FBRyxHQUFHLGtCQUFrQixLQUFLLENBQUM7SUFDMUMsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUM3QyxDQUFDO0FBVUQsU0FBUyxxQkFBcUIsQ0FDNUIsTUFBa0IsRUFDbEIsT0FBb0IsRUFDcEIsVUFBeUI7SUFFekIsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUU7UUFDdkMsT0FBTztLQUNSO0lBQ0QsSUFBSSxPQUFPLEdBQUcsZUFBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDOUQsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBRW5CLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxFQUFFO1FBQzFCLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVuQyxRQUFRLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDdEIsS0FBSyxNQUFNO2dCQUNULElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUMzQixxQkFBWSxDQUNWO3dCQUNFLE1BQU07d0JBQ04sT0FBTztxQkFDUixFQUNEO3dCQUNFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTzt3QkFDckIsR0FBRztxQkFDSixDQUNGLENBQUM7aUJBQ0g7Z0JBRUQsTUFBTTtZQUVSLEtBQUssVUFBVTtnQkFDYixxQkFBWSxDQUNWO29CQUNFLE1BQU07b0JBQ04sT0FBTztpQkFDUixFQUNEO29CQUNFLE9BQU8sRUFBRSxDQUFDLGdDQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0MsR0FBRztpQkFDSixDQUNGLENBQUM7Z0JBQ0YsTUFBTTtTQUNUO1FBRUQsVUFBVSxFQUFFLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RWRpdG9yLCBHcmFtbWFyIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHByb21pc2VzIH0gZnJvbSBcImZzXCI7XG5jb25zdCB7IHJlYWRGaWxlIH0gPSBwcm9taXNlcztcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB0eXBlIHsgSHlkcm9nZW5DZWxsVHlwZSB9IGZyb20gXCIuL2h5ZHJvZ2VuXCI7XG5cbmltcG9ydCB7IHJlbW90ZSB9IGZyb20gXCJlbGVjdHJvblwiO1xuY29uc3QgeyBkaWFsb2cgfSA9IHJlbW90ZTtcblxuaW1wb3J0IHsgZnJvbUpTIH0gZnJvbSBcIkBudGVyYWN0L2NvbW11dGFibGVcIjtcbmltcG9ydCB0eXBlIHsgTm90ZWJvb2ssIEpTT05PYmplY3QsIENlbGwgfSBmcm9tIFwiQG50ZXJhY3QvY29tbXV0YWJsZVwiO1xuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XG5pbXBvcnQgeyBnZXRDb21tZW50U3RhcnRTdHJpbmcgfSBmcm9tIFwiLi9jb2RlLW1hbmFnZXJcIjtcbmltcG9ydCB7IGltcG9ydFJlc3VsdCwgY29udmVydE1hcmtkb3duVG9PdXRwdXQgfSBmcm9tIFwiLi9yZXN1bHRcIjtcbmNvbnN0IGxpbmVzZXAgPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIgPyBcIlxcclxcblwiIDogXCJcXG5cIjtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIHRoZSBwcm92aWRlZCB1cmkgaXMgYSB2YWxpZCBmaWxlIGZvciBIeWRyb2dlbiB0byBpbXBvcnQuIFRoZW5cbiAqIGl0IGxvYWRzIHRoZSBub3RlYm9vay5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJpIC0gVXJpIG9mIHRoZSBmaWxlIHRvIG9wZW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpcHluYk9wZW5lcih1cmk6IHN0cmluZykge1xuICBpZiAoXG4gICAgcGF0aC5leHRuYW1lKHVyaSkudG9Mb3dlckNhc2UoKSA9PT0gXCIuaXB5bmJcIiAmJlxuICAgIGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmltcG9ydE5vdGVib29rVVJJXCIpID09PSB0cnVlXG4gICkge1xuICAgIHJldHVybiBfbG9hZE5vdGVib29rKFxuICAgICAgdXJpLFxuICAgICAgYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4uaW1wb3J0Tm90ZWJvb2tSZXN1bHRzXCIpXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdGhlIHByb3ZpZGVkIGV2ZW50IGlzIHRyeWluZyB0byBvcGVuIGEgdmFsaWQgZmlsZSBmb3IgSHlkcm9nZW5cbiAqIHRvIGltcG9ydC4gT3RoZXJ3aXNlIGl0IHdpbGwgYXNrIHRoZSB1c2VyIHRvIGNob3NlIGEgdmFsaWQgZmlsZSBmb3IgSHlkcm9nZW5cbiAqIHRvIGltcG9ydC4gVGhlbiBpdCBsb2FkcyB0aGUgbm90ZWJvb2suXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBBdG9tIEV2ZW50IGZyb20gY2xpY2tpbmcgaW4gYSB0cmVldmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGltcG9ydE5vdGVib29rKGV2ZW50PzogQ3VzdG9tRXZlbnQpIHtcbiAgLy8gVXNlIHNlbGVjdGVkIGZpbGVwYXRoIGlmIGNhbGxlZCBmcm9tIHRyZWUtdmlldyBjb250ZXh0IG1lbnVcbiAgY29uc3QgZmlsZW5hbWVGcm9tVHJlZVZpZXcgPSBfLmdldChldmVudCwgXCJ0YXJnZXQuZGF0YXNldC5wYXRoXCIpO1xuXG4gIGlmIChmaWxlbmFtZUZyb21UcmVlVmlldyAmJiBwYXRoLmV4dG5hbWUoZmlsZW5hbWVGcm9tVHJlZVZpZXcpID09PSBcIi5pcHluYlwiKSB7XG4gICAgcmV0dXJuIF9sb2FkTm90ZWJvb2soXG4gICAgICBmaWxlbmFtZUZyb21UcmVlVmlldyxcbiAgICAgIGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmltcG9ydE5vdGVib29rUmVzdWx0c1wiKVxuICAgICk7XG4gIH1cblxuICBkaWFsb2cuc2hvd09wZW5EaWFsb2coXG4gICAge1xuICAgICAgcHJvcGVydGllczogW1wib3BlbkZpbGVcIl0sXG4gICAgICBmaWx0ZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcIk5vdGVib29rc1wiLFxuICAgICAgICAgIGV4dGVuc2lvbnM6IFtcImlweW5iXCJdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIChmaWxlbmFtZXM6IEFycmF5PHN0cmluZz4gfCBudWxsIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICBpZiAoIWZpbGVuYW1lcykge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJObyBmaWxlbmFtZXMgc2VsZWN0ZWRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZW5hbWUgPSBmaWxlbmFtZXNbMF07XG5cbiAgICAgIGlmIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpICE9PSBcIi5pcHluYlwiKSB7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIlNlbGVjdGVkIGZpbGUgbXVzdCBoYXZlIGV4dGVuc2lvbiAuaXB5bmJcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgX2xvYWROb3RlYm9vayhcbiAgICAgICAgZmlsZW5hbWUsXG4gICAgICAgIGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmltcG9ydE5vdGVib29rUmVzdWx0c1wiKVxuICAgICAgKTtcbiAgICB9XG4gICk7XG59XG5cbi8qKlxuICogUmVhZHMgdGhlIGdpdmVuIG5vdGVib29rIGZpbGUgYW5kIGNvdmVydHMgaXQgdG8gYSB0ZXh0IGVkaXRvciBmb3JtYXQgd2l0aFxuICogSHlkcm9nZW4gY2VsbCBicmVha3BvaW50cy4gT3B0aW9uYWxseSBhZnRlciBvcGVuaW5nIHRoZSBub3RlYm9vaywgaXQgd2lsbFxuICogYWxzbyBsb2FkIHRoZSBwcmV2aW91cyByZXN1bHRzIGFuZCBkaXNwbGF5IHRoZW0uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lIC0gUGF0aCBvZiB0aGUgZmlsZS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaW1wb3J0UmVzdWx0cyAtIERlY2lkZXMgd2hldGhlciB0byBkaXNwbGF5IHByZXZpb3VzIHJlc3VsdHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIF9sb2FkTm90ZWJvb2soXG4gIGZpbGVuYW1lOiBzdHJpbmcsXG4gIGltcG9ydFJlc3VsdHM6IGJvb2xlYW4gPSBmYWxzZVxuKSB7XG4gIGxldCBkYXRhO1xuICBsZXQgbmI7XG5cbiAgdHJ5IHtcbiAgICBkYXRhID0gSlNPTi5wYXJzZShhd2FpdCByZWFkRmlsZShmaWxlbmFtZSwgeyBlbmNvZGluZzogXCJ1dGYtOFwiIH0pKTtcblxuICAgIGlmIChkYXRhLm5iZm9ybWF0IDwgMykge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiT25seSBub3RlYm9vayB2ZXJzaW9uIDQgaXMgZnVsbHkgc3VwcG9ydGVkXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZGF0YS5uYmZvcm1hdCA9PSAzKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgICAgXCJPbmx5IG5vdGVib29rIHZlcnNpb24gNCBpcyBmdWxseSBzdXBwb3J0ZWRcIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICBuYiA9IGZyb21KUyhkYXRhKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5uYW1lID09PSBcIlN5bnRheEVycm9yXCIpIHtcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkVycm9yIG5vdCBhIHZhbGlkIG5vdGVib29rXCIsIHtcbiAgICAgICAgZGV0YWlsOiBlcnIuc3RhY2ssXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiRXJyb3IgcmVhZGluZyBmaWxlXCIsIHtcbiAgICAgICAgZGV0YWlsOiBlcnIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKCk7XG4gIGNvbnN0IGdyYW1tYXIgPSBnZXRHcmFtbWFyRm9yTm90ZWJvb2sobmIpO1xuICBpZiAoIWdyYW1tYXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgYXRvbS5ncmFtbWFycy5hc3NpZ25MYW5ndWFnZU1vZGUoZWRpdG9yLmdldEJ1ZmZlcigpLCBncmFtbWFyLnNjb3BlTmFtZSk7XG4gIGNvbnN0IGNvbW1lbnRTdGFydFN0cmluZyA9IGdldENvbW1lbnRTdGFydFN0cmluZyhlZGl0b3IpO1xuXG4gIGlmICghY29tbWVudFN0YXJ0U3RyaW5nKSB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiTm8gY29tbWVudCBzeW1ib2wgZGVmaW5lZCBpbiByb290IHNjb3BlXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5iQ2VsbHMgPSBbXTtcbiAgY29uc3Qgc291cmNlcyA9IFtdO1xuICBjb25zdCByZXN1bHRSb3dzID0gW107XG4gIGxldCBwcmV2aW91c0JyZWFrcG9pbnQgPSAtMTtcbiAgbmIuY2VsbE9yZGVyLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgY29uc3QgY2VsbCA9IG5iLmNlbGxNYXAuZ2V0KHZhbHVlKS50b0pTKCk7XG4gICAgbmJDZWxscy5wdXNoKGNlbGwpO1xuICAgIGNvbnN0IGh5Q2VsbCA9IHRvSHlkcm9nZW5Db2RlQmxvY2soY2VsbCwgYCR7Y29tbWVudFN0YXJ0U3RyaW5nfSBgKTtcbiAgICByZXN1bHRSb3dzLnB1c2gocHJldmlvdXNCcmVha3BvaW50ICsgaHlDZWxsLmNvZGUudHJpbSgpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCk7XG4gICAgcHJldmlvdXNCcmVha3BvaW50ICs9IGh5Q2VsbC5yb3c7XG4gICAgc291cmNlcy5wdXNoKGh5Q2VsbC5jb2RlKTtcbiAgfSk7XG4gIGVkaXRvci5zZXRUZXh0KHNvdXJjZXMuam9pbihsaW5lc2VwKSk7XG4gIGlmIChpbXBvcnRSZXN1bHRzKSB7XG4gICAgaW1wb3J0Tm90ZWJvb2tSZXN1bHRzKGVkaXRvciwgbmJDZWxscywgcmVzdWx0Um93cyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmllcyB0byBkZXRlcm1pbmUgdGhlIEF0b20gR3JhbW1hciBvZiBhIG5vdGVib29rLiBEZWZhdWx0IGlzIFB5dGhvbi5cbiAqXG4gKiBAcGFyYW0ge05vdGVib29rfSBuYiAtIFRoZSBOb3RlYm9vayB0byBkZXRlcm1pbmUgdGhlIEF0b20gR3JhbW1hciBvZi5cbiAqIEByZXR1cm5zIHtHcmFtbWFyfSAtIFRoZSBncmFtbWFyIG9mIHRoZSBub3RlYm9vay5cbiAqL1xuZnVuY3Rpb24gZ2V0R3JhbW1hckZvck5vdGVib29rKG5iOiBOb3RlYm9vaykge1xuICBjb25zdCBtZXRhRGF0YSA9IG5iLm1ldGFkYXRhO1xuICBjb25zdCB7XG4gICAga2VybmVsc3BlYyxcbiAgICAvLyBPZmZpY2FsIG5iZm9ybWF0IHY0XG4gICAgbGFuZ3VhZ2VfaW5mbyxcbiAgICAvLyBPZmZpY2FsIG5iZm9ybWF0IHY0XG4gICAga2VybmVsX2luZm8sXG4gICAgLy8gU29tZXRpbWVzIHVzZWQgaW4gbmJmb3JtYXQgdjNcbiAgICBsYW5ndWFnZSwgLy8gU29tZXRpbWVzIHVzZWQgaW4gbmJmb3JtYXQgdjNcbiAgfSA9IHR5cGVvZiBtZXRhRGF0YS50b0pTID09PSBcImZ1bmN0aW9uXCIgPyBtZXRhRGF0YS50b0pTKCkgOiBtZXRhRGF0YTsgLy8gVE9ETyBmaXggdG9KU1xuICBjb25zdCBrZXJuZWwgPSBrZXJuZWxzcGVjID8ga2VybmVsc3BlYyA6IGtlcm5lbF9pbmZvO1xuICBjb25zdCBsYW5nID0gbGFuZ3VhZ2VfaW5mb1xuICAgID8gbGFuZ3VhZ2VfaW5mb1xuICAgIDogbGFuZ3VhZ2VcbiAgICA/IHtcbiAgICAgICAgbmFtZTogbGFuZ3VhZ2UsXG4gICAgICB9XG4gICAgOiBudWxsO1xuXG4gIGlmICgha2VybmVsICYmICFsYW5nKSB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICBcIk5vIGxhbmd1YWdlIG1ldGFkYXRhIGluIG5vdGVib29rOyBhc3N1bWluZyBQeXRob25cIlxuICAgICk7XG4gICAgcmV0dXJuIGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShcInNvdXJjZS5weXRob25cIik7XG4gIH1cblxuICBsZXQgbWF0Y2hlZEdyYW1tYXIgPSBudWxsO1xuXG4gIGlmIChsYW5nKSB7XG4gICAgLy8gbGFuZy5uYW1lIHNob3VsZCBiZSByZXF1aXJlZFxuICAgIG1hdGNoZWRHcmFtbWFyID0gZ2V0R3JhbW1hckZvckxhbmd1YWdlTmFtZShsYW5nLm5hbWUpO1xuICAgIGlmIChtYXRjaGVkR3JhbW1hcikge1xuICAgICAgcmV0dXJuIG1hdGNoZWRHcmFtbWFyO1xuICAgIH1cblxuICAgIC8vIGxhbmcuZmlsZV9leHRlbnNpb24gaXMgbm90IHJlcXVpcmVkLCBidXQgaWYgbGFuZy5uYW1lIHJldHJpZXZlcyBubyBtYXRjaCxcbiAgICAvLyB0aGlzIGlzIHRoZSBuZXh0IGJlc3QgdGhpbmcuXG4gICAgaWYgKGxhbmcuZmlsZV9leHRlbnNpb24pIHtcbiAgICAgIG1hdGNoZWRHcmFtbWFyID0gZ2V0R3JhbW1hckZvckZpbGVFeHRlbnNpb24obGFuZy5maWxlX2V4dGVuc2lvbik7XG4gICAgfVxuXG4gICAgaWYgKG1hdGNoZWRHcmFtbWFyKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZEdyYW1tYXI7XG4gICAgfVxuICB9XG5cbiAgaWYgKGtlcm5lbCkge1xuICAgIC8vIGtlcm5lbC5sYW5ndWFnZSBpcyBub3QgcmVxdWlyZWQsIGJ1dCBpdHMgb2Z0ZW4gbW9yZSBhY2N1cmF0ZSB0aGFuIG5hbWVcbiAgICBtYXRjaGVkR3JhbW1hciA9IGdldEdyYW1tYXJGb3JMYW5ndWFnZU5hbWUoa2VybmVsLmxhbmd1YWdlKTtcbiAgICBpZiAobWF0Y2hlZEdyYW1tYXIpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkR3JhbW1hcjtcbiAgICB9XG4gICAgLy8ga2VybmVsLm5hbWUgc2hvdWxkIGJlIHJlcXVpcmVkLCBidXQgaXMgb2Z0ZW4gYSBrZXJuZWwgbmFtZSwgc28gaXRzIGhhcmRcbiAgICAvLyB0byBtYXRjaCBlZmZjaWVudGx5XG4gICAgbWF0Y2hlZEdyYW1tYXIgPSBnZXRHcmFtbWFyRm9yS2VybmVsc3BlY05hbWUoa2VybmVsLm5hbWUpO1xuICAgIGlmIChtYXRjaGVkR3JhbW1hcikge1xuICAgICAgcmV0dXJuIG1hdGNoZWRHcmFtbWFyO1xuICAgIH1cbiAgfVxuXG4gIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiVW5hYmxlIHRvIGRldGVybWluZSBjb3JyZWN0IGxhbmd1YWdlIGdyYW1tYXJcIik7XG4gIHJldHVybiBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoXCJzb3VyY2UucHl0aG9uXCIpO1xufVxuXG4vKipcbiAqIFRyaWVzIHRvIGZpbmQgYSBtYXRjaGluZyBBdG9tIEdyYW1tYXIgZnJvbSBhIGxhbmd1YWdlIG5hbWVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBsYW5ndWFnZSBuYW1lIHRvIGZpbmQgYSBncmFtbWFyIGZvci5cbiAqIEByZXR1cm5zIHtHcmFtbWFyfSAtIFRoZSBtYXRjaGluZyBBdG9tIEdyYW1tYXIuXG4gKi9cbmZ1bmN0aW9uIGdldEdyYW1tYXJGb3JMYW5ndWFnZU5hbWUobmFtZTogc3RyaW5nKSB7XG4gIGlmICghbmFtZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGZvcm1hdHRlZE5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZShcIiBcIiwgXCItXCIpO1xuICBjb25zdCBzY29wZU5hbWUgPSBgc291cmNlLiR7Zm9ybWF0dGVkTmFtZX1gO1xuICBjb25zdCBncmFtbWFycyA9IGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKTtcblxuICBmb3IgKGNvbnN0IGcgb2YgZ3JhbW1hcnMpIHtcbiAgICBpZiAoXG4gICAgICBnICYmXG4gICAgICAoKGcubmFtZSAmJiBnLm5hbWUudG9Mb3dlckNhc2UoKSA9PSBuYW1lLnRvTG93ZXJDYXNlKCkpIHx8XG4gICAgICAgIGcuc2NvcGVOYW1lID09IHNjb3BlTmFtZSlcbiAgICApIHtcbiAgICAgIHJldHVybiBnO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFRyaWVzIHRvIGZpbmQgYSBtYXRjaGluZyBBdG9tIEdyYW1tYXIgZnJvbSBhIGZpbGUgZXh0ZW5zaW9uc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBleHQgLSBUaGUgZmlsZSBleHRlbnNpb24gdG8gZmluZCBhIGdyYW1tYXIgZm9yLlxuICogQHJldHVybnMge0dyYW1tYXJ9IC0gVGhlIG1hdGNoaW5nIEF0b20gR3JhbW1hci5cbiAqL1xuZnVuY3Rpb24gZ2V0R3JhbW1hckZvckZpbGVFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gIGlmICghZXh0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZXh0ID0gZXh0LnN0YXJ0c1dpdGgoXCIuXCIpID8gZXh0LnNsaWNlKDEpIDogZXh0O1xuICBjb25zdCBncmFtbWFycyA9IGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKTtcbiAgcmV0dXJuIF8uZmluZChncmFtbWFycywgKGdyYW1tYXIpID0+IHtcbiAgICByZXR1cm4gXy5pbmNsdWRlcyhncmFtbWFyLmZpbGVUeXBlcywgZXh0KTtcbiAgfSk7XG59XG5cbi8qKlxuICogVHJpZXMgdG8gZmluZCBhIG1hdGNoaW5nIEF0b20gR3JhbW1hciBmcm9tIEtlcm5lbHNwZWNNZXRhZGF0YSBuYW1lXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgS2VybmVsc3BlY01ldGFkYXRhIG5hbWUgdG8gZmluZCBhIGdyYW1tYXIgZm9yLlxuICogQHJldHVybnMge0dyYW1tYXJ9IC0gVGhlIG1hdGNoaW5nIEF0b20gR3JhbW1hci5cbiAqL1xuZnVuY3Rpb24gZ2V0R3JhbW1hckZvcktlcm5lbHNwZWNOYW1lKG5hbWU6IHN0cmluZyk6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgLy8gQ2hlY2sgaWYgdGhlcmUgZXhpc3RzIGFuIEF0b20gZ3JhbW1hciBuYW1lZCBzb3VyY2UuJHtuYW1lfVxuICBjb25zdCBncmFtbWFyID0gZ2V0R3JhbW1hckZvckxhbmd1YWdlTmFtZShuYW1lKTtcbiAgaWYgKGdyYW1tYXIpIHtcbiAgICByZXR1cm4gZ3JhbW1hcjtcbiAgfVxuICAvLyBPdGhlcndpc2UgYXR0ZW1wdCBtYW51YWwgbWF0Y2hpbmcgZnJvbSBrZXJuZWxzcGVjIG5hbWUgdG8gQXRvbSBzY29wZVxuICBjb25zdCBjcm9zc3dhbGsgPSB7XG4gICAgcHl0aG9uMjogXCJzb3VyY2UucHl0aG9uXCIsXG4gICAgcHl0aG9uMzogXCJzb3VyY2UucHl0aG9uXCIsXG4gICAgYmFzaDogXCJzb3VyY2Uuc2hlbGxcIixcbiAgICBqYXZhc2NyaXB0OiBcInNvdXJjZS5qc1wiLFxuICAgIGlyOiBcInNvdXJjZS5yXCIsXG4gIH07XG5cbiAgaWYgKGNyb3Nzd2Fsa1tuYW1lXSkge1xuICAgIHJldHVybiBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoY3Jvc3N3YWxrW25hbWVdKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnRzIG5vdGVib29rIGNlbGxzIHRvIEh5ZHJvZ2VuIGNvZGUgYmxvY2tzLlxuICpcbiAqIEBwYXJhbSB7Q2VsbH0gY2VsbCAtIE5vdGVib29rIGNlbGwgdG8gY29udmVydFxuICogQHBhcmFtIHtTdHJpbmd9IGNvbW1lbnRTdGFydFN0cmluZyAtIFRoZSBjb21tZW50IHN5bnRheCBvZiB0aGUgY29kZSBsYW5ndWFnZS5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gQSBIeWRyb2dlbiBDb2RlIEJsb2NrLlxuICovXG5mdW5jdGlvbiB0b0h5ZHJvZ2VuQ29kZUJsb2NrKFxuICBjZWxsOiBDZWxsLFxuICBjb21tZW50U3RhcnRTdHJpbmc6IHN0cmluZ1xuKToge1xuICBjZWxsVHlwZTogSHlkcm9nZW5DZWxsVHlwZTtcbiAgY29kZTogc3RyaW5nO1xuICByb3c6IG51bWJlcjtcbn0ge1xuICBjb25zdCBjZWxsVHlwZSA9IGNlbGwuY2VsbF90eXBlID09PSBcIm1hcmtkb3duXCIgPyBcIm1hcmtkb3duXCIgOiBcImNvZGVjZWxsXCI7XG4gIGNvbnN0IGNlbGxIZWFkZXIgPSBnZXRDZWxsSGVhZGVyKGNvbW1lbnRTdGFydFN0cmluZywgY2VsbFR5cGUpO1xuICBsZXQgc291cmNlID0gY2VsbC5zb3VyY2U7XG4gIGxldCBjZWxsTGVuZ3RoO1xuXG4gIGlmIChjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiKSB7XG4gICAgc291cmNlID0gc291cmNlLnNwbGl0KFwiXFxuXCIpO1xuICAgIHNvdXJjZVswXSA9IGNvbW1lbnRTdGFydFN0cmluZyArIHNvdXJjZVswXTtcbiAgICBjZWxsTGVuZ3RoID0gc291cmNlLmxlbmd0aDtcbiAgICBzb3VyY2UgPSBzb3VyY2Uuam9pbihsaW5lc2VwICsgY29tbWVudFN0YXJ0U3RyaW5nKTtcbiAgfSBlbHNlIHtcbiAgICBjZWxsTGVuZ3RoID0gc291cmNlLnNwbGl0KFwiXFxuXCIpLmxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2VsbFR5cGUsXG4gICAgY29kZTogY2VsbEhlYWRlciArIGxpbmVzZXAgKyBzb3VyY2UsXG4gICAgcm93OiBjZWxsTGVuZ3RoICsgMSwgLy8gcGx1cyAxIGZvciB0aGUgaGVhZGVyXG4gIH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIEh5ZHJvZ2VuIGNlbGwgaGVhZGVyXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGNvbW1lbnRTdGFydFN0cmluZyAtIFRoZSBjb21tZW50IHN5bnRheCBvZiB0aGUgY29kZSBsYW5ndWFnZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXl3b3JkIC0gVGhlIGtleXdvcmQgcmVsYXRpbmcgdG8gdGhlIGNlbGwgdHlwZS5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IC0gQSBIeWRyb2dlbiBDZWxsIEhlYWRlci5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2VsbEhlYWRlcihcbiAgY29tbWVudFN0YXJ0U3RyaW5nOiBzdHJpbmcsXG4gIGtleXdvcmQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWRcbikge1xuICBjb25zdCBtYXJrZXIgPSBgJHtjb21tZW50U3RhcnRTdHJpbmd9JSUgYDtcbiAgcmV0dXJuIGtleXdvcmQgPyBtYXJrZXIgKyBrZXl3b3JkIDogbWFya2VyO1xufVxuXG4vKipcbiAqIERpc3BsYXlzIHByZXZpb3VzIGNlbGwgcmVzdWx0cyBpbmxpbmUgb2YgdGhlIHByb3ZpZGVkIGVkaXRvci4gbmJDZWxscyBhbmRcbiAqIHJlc3VsdFJvd3Mgc2hvdWxkIGJlIHRoZSBzYW1lIGxlbmd0aC5cbiAqXG4gKiBAcGFyYW0ge1RleHRFZGl0b3J9IGVkaXRvciAtIFRoZSBlZGl0b3IgdG8gZGlzcGxheSB0aGUgcmVzdWx0cyBpbi5cbiAqIEBwYXJhbSB7Q2VsbFtdfSBuYkNlbGxzIC0gVGhlIG9yaWdpbmFsIG5vdGVib29rIGNlbGxzLlxuICogQHBhcmFtIHtOdW1iZXJbXX0gcmVzdWx0Um93cyAtIFRoZSByb3dzIHRvIGRpc3BsYXkgdGhlIHJlc3VsdHMgb24uXG4gKi9cbmZ1bmN0aW9uIGltcG9ydE5vdGVib29rUmVzdWx0cyhcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICBuYkNlbGxzOiBBcnJheTxDZWxsPixcbiAgcmVzdWx0Um93czogQXJyYXk8bnVtYmVyPlxuKSB7XG4gIGlmIChuYkNlbGxzLmxlbmd0aCAhPSByZXN1bHRSb3dzLmxlbmd0aCkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgbWFya2VycyA9IHN0b3JlLm1hcmtlcnNNYXBwaW5nLmdldChlZGl0b3IuaWQpO1xuICBtYXJrZXJzID0gbWFya2VycyA/IG1hcmtlcnMgOiBzdG9yZS5uZXdNYXJrZXJTdG9yZShlZGl0b3IuaWQpO1xuICBsZXQgY2VsbE51bWJlciA9IDA7XG5cbiAgZm9yIChjb25zdCBjZWxsIG9mIG5iQ2VsbHMpIHtcbiAgICBjb25zdCByb3cgPSByZXN1bHRSb3dzW2NlbGxOdW1iZXJdO1xuXG4gICAgc3dpdGNoIChjZWxsLmNlbGxfdHlwZSkge1xuICAgICAgY2FzZSBcImNvZGVcIjpcbiAgICAgICAgaWYgKGNlbGwub3V0cHV0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgaW1wb3J0UmVzdWx0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlZGl0b3IsXG4gICAgICAgICAgICAgIG1hcmtlcnMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvdXRwdXRzOiBjZWxsLm91dHB1dHMsXG4gICAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICBpbXBvcnRSZXN1bHQoXG4gICAgICAgICAge1xuICAgICAgICAgICAgZWRpdG9yLFxuICAgICAgICAgICAgbWFya2VycyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG91dHB1dHM6IFtjb252ZXJ0TWFya2Rvd25Ub091dHB1dChjZWxsLnNvdXJjZSldLFxuICAgICAgICAgICAgcm93LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2VsbE51bWJlcisrO1xuICB9XG59XG4iXX0=