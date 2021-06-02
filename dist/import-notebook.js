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
    var _a;
    const filenameFromTreeView = (_a = event.target.dataset) === null || _a === void 0 ? void 0 : _a.path;
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
    return grammars.find((grammar) => {
        return grammar.fileTypes.includes(ext);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LW5vdGVib29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2ltcG9ydC1ub3RlYm9vay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJCQUE4QjtBQUM5QixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsYUFBUSxDQUFDO0FBRzlCLHVDQUFrQztBQUNsQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsaUJBQU0sQ0FBQztBQUUxQixvREFBNkM7QUFFN0Msb0RBQTRCO0FBQzVCLGlEQUF1RDtBQUN2RCxxQ0FBaUU7QUFDakUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBUTdELFNBQWdCLFdBQVcsQ0FBQyxHQUFXO0lBQ3JDLElBQ0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxRQUFRO1FBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEtBQUssSUFBSSxFQUN0RDtRQUNBLE9BQU8sYUFBYSxDQUNsQixHQUFHLEVBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FDbEQsQ0FBQztLQUNIO0FBQ0gsQ0FBQztBQVZELGtDQVVDO0FBU0QsU0FBZ0IsY0FBYyxDQUFDLEtBQW1COztJQUVoRCxNQUFNLG9CQUFvQixHQUFHLE1BQUEsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLDBDQUFFLElBQUksQ0FBQztJQUV4RCxJQUFJLG9CQUFvQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDM0UsT0FBTyxhQUFhLENBQ2xCLG9CQUFvQixFQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLEdB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Q0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUMzQixxQkFBWSxDQUNWO3dCQUNFLE1BQU07d0JBQ04sT0FBTztxQkFDUixFQUNEO3dCQUNFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTzt3QkFDckIsR0FBRztxQkFDSixDQUNGLENBQUM7aUJBQ0g7Z0JBRUQsTUFBTTtZQUVSLEtBQUssVUFBVTtnQkFDYixxQkFBWSxDQUNWO29CQUNFLE1BQU07b0JBQ04sT0FBTztpQkFDUixFQUNEO29CQUNFLE9BQU8sRUFBRSxDQUFDLGdDQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0MsR0FBRztpQkFDSixDQUNGLENBQUM7Z0JBQ0YsTUFBTTtTQUNUO1FBRUQsVUFBVSxFQUFFLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RWRpdG9yLCBHcmFtbWFyIH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBwcm9taXNlcyB9IGZyb20gXCJmc1wiO1xyXG5jb25zdCB7IHJlYWRGaWxlIH0gPSBwcm9taXNlcztcclxuaW1wb3J0IHR5cGUgeyBIeWRyb2dlbkNlbGxUeXBlIH0gZnJvbSBcIi4vaHlkcm9nZW5cIjtcclxuXHJcbmltcG9ydCB7IHJlbW90ZSB9IGZyb20gXCJlbGVjdHJvblwiO1xyXG5jb25zdCB7IGRpYWxvZyB9ID0gcmVtb3RlO1xyXG5cclxuaW1wb3J0IHsgZnJvbUpTIH0gZnJvbSBcIkBudGVyYWN0L2NvbW11dGFibGVcIjtcclxuaW1wb3J0IHR5cGUgeyBOb3RlYm9vaywgSlNPTk9iamVjdCwgQ2VsbCB9IGZyb20gXCJAbnRlcmFjdC9jb21tdXRhYmxlXCI7XHJcbmltcG9ydCBzdG9yZSBmcm9tIFwiLi9zdG9yZVwiO1xyXG5pbXBvcnQgeyBnZXRDb21tZW50U3RhcnRTdHJpbmcgfSBmcm9tIFwiLi9jb2RlLW1hbmFnZXJcIjtcclxuaW1wb3J0IHsgaW1wb3J0UmVzdWx0LCBjb252ZXJ0TWFya2Rvd25Ub091dHB1dCB9IGZyb20gXCIuL3Jlc3VsdFwiO1xyXG5jb25zdCBsaW5lc2VwID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJcXHJcXG5cIiA6IFwiXFxuXCI7XHJcblxyXG4vKipcclxuICogRGV0ZXJtaW5lcyBpZiB0aGUgcHJvdmlkZWQgdXJpIGlzIGEgdmFsaWQgZmlsZSBmb3IgSHlkcm9nZW4gdG8gaW1wb3J0LiBUaGVuXHJcbiAqIGl0IGxvYWRzIHRoZSBub3RlYm9vay5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHVyaSAtIFVyaSBvZiB0aGUgZmlsZSB0byBvcGVuLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlweW5iT3BlbmVyKHVyaTogc3RyaW5nKSB7XHJcbiAgaWYgKFxyXG4gICAgcGF0aC5leHRuYW1lKHVyaSkudG9Mb3dlckNhc2UoKSA9PT0gXCIuaXB5bmJcIiAmJlxyXG4gICAgYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4uaW1wb3J0Tm90ZWJvb2tVUklcIikgPT09IHRydWVcclxuICApIHtcclxuICAgIHJldHVybiBfbG9hZE5vdGVib29rKFxyXG4gICAgICB1cmksXHJcbiAgICAgIGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmltcG9ydE5vdGVib29rUmVzdWx0c1wiKVxyXG4gICAgKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIGlmIHRoZSBwcm92aWRlZCBldmVudCBpcyB0cnlpbmcgdG8gb3BlbiBhIHZhbGlkIGZpbGUgZm9yIEh5ZHJvZ2VuXHJcbiAqIHRvIGltcG9ydC4gT3RoZXJ3aXNlIGl0IHdpbGwgYXNrIHRoZSB1c2VyIHRvIGNob3NlIGEgdmFsaWQgZmlsZSBmb3IgSHlkcm9nZW5cclxuICogdG8gaW1wb3J0LiBUaGVuIGl0IGxvYWRzIHRoZSBub3RlYm9vay5cclxuICpcclxuICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBBdG9tIEV2ZW50IGZyb20gY2xpY2tpbmcgaW4gYSB0cmVldmlldy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnROb3RlYm9vayhldmVudD86IEN1c3RvbUV2ZW50KSB7XHJcbiAgLy8gVXNlIHNlbGVjdGVkIGZpbGVwYXRoIGlmIGNhbGxlZCBmcm9tIHRyZWUtdmlldyBjb250ZXh0IG1lbnVcclxuICBjb25zdCBmaWxlbmFtZUZyb21UcmVlVmlldyA9IGV2ZW50LnRhcmdldC5kYXRhc2V0Py5wYXRoO1xyXG5cclxuICBpZiAoZmlsZW5hbWVGcm9tVHJlZVZpZXcgJiYgcGF0aC5leHRuYW1lKGZpbGVuYW1lRnJvbVRyZWVWaWV3KSA9PT0gXCIuaXB5bmJcIikge1xyXG4gICAgcmV0dXJuIF9sb2FkTm90ZWJvb2soXHJcbiAgICAgIGZpbGVuYW1lRnJvbVRyZWVWaWV3LFxyXG4gICAgICBhdG9tLmNvbmZpZy5nZXQoXCJIeWRyb2dlbi5pbXBvcnROb3RlYm9va1Jlc3VsdHNcIilcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBkaWFsb2cuc2hvd09wZW5EaWFsb2coXHJcbiAgICB7XHJcbiAgICAgIHByb3BlcnRpZXM6IFtcIm9wZW5GaWxlXCJdLFxyXG4gICAgICBmaWx0ZXJzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogXCJOb3RlYm9va3NcIixcclxuICAgICAgICAgIGV4dGVuc2lvbnM6IFtcImlweW5iXCJdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gICAgKGZpbGVuYW1lczogQXJyYXk8c3RyaW5nPiB8IG51bGwgfCB1bmRlZmluZWQpID0+IHtcclxuICAgICAgaWYgKCFmaWxlbmFtZXMpIHtcclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJObyBmaWxlbmFtZXMgc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGZpbGVuYW1lc1swXTtcclxuXHJcbiAgICAgIGlmIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpICE9PSBcIi5pcHluYlwiKSB7XHJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiU2VsZWN0ZWQgZmlsZSBtdXN0IGhhdmUgZXh0ZW5zaW9uIC5pcHluYlwiKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIF9sb2FkTm90ZWJvb2soXHJcbiAgICAgICAgZmlsZW5hbWUsXHJcbiAgICAgICAgYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4uaW1wb3J0Tm90ZWJvb2tSZXN1bHRzXCIpXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlYWRzIHRoZSBnaXZlbiBub3RlYm9vayBmaWxlIGFuZCBjb3ZlcnRzIGl0IHRvIGEgdGV4dCBlZGl0b3IgZm9ybWF0IHdpdGhcclxuICogSHlkcm9nZW4gY2VsbCBicmVha3BvaW50cy4gT3B0aW9uYWxseSBhZnRlciBvcGVuaW5nIHRoZSBub3RlYm9vaywgaXQgd2lsbFxyXG4gKiBhbHNvIGxvYWQgdGhlIHByZXZpb3VzIHJlc3VsdHMgYW5kIGRpc3BsYXkgdGhlbS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lIC0gUGF0aCBvZiB0aGUgZmlsZS5cclxuICogQHBhcmFtIHtCb29sZWFufSBpbXBvcnRSZXN1bHRzIC0gRGVjaWRlcyB3aGV0aGVyIHRvIGRpc3BsYXkgcHJldmlvdXMgcmVzdWx0c1xyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIF9sb2FkTm90ZWJvb2soXHJcbiAgZmlsZW5hbWU6IHN0cmluZyxcclxuICBpbXBvcnRSZXN1bHRzOiBib29sZWFuID0gZmFsc2VcclxuKSB7XHJcbiAgbGV0IGRhdGE7XHJcbiAgbGV0IG5iO1xyXG5cclxuICB0cnkge1xyXG4gICAgZGF0YSA9IEpTT04ucGFyc2UoYXdhaXQgcmVhZEZpbGUoZmlsZW5hbWUsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KSk7XHJcblxyXG4gICAgaWYgKGRhdGEubmJmb3JtYXQgPCAzKSB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIk9ubHkgbm90ZWJvb2sgdmVyc2lvbiA0IGlzIGZ1bGx5IHN1cHBvcnRlZFwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfSBlbHNlIGlmIChkYXRhLm5iZm9ybWF0ID09IDMpIHtcclxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXHJcbiAgICAgICAgXCJPbmx5IG5vdGVib29rIHZlcnNpb24gNCBpcyBmdWxseSBzdXBwb3J0ZWRcIlxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIG5iID0gZnJvbUpTKGRhdGEpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5uYW1lID09PSBcIlN5bnRheEVycm9yXCIpIHtcclxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiRXJyb3Igbm90IGEgdmFsaWQgbm90ZWJvb2tcIiwge1xyXG4gICAgICAgIGRldGFpbDogZXJyLnN0YWNrLFxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkVycm9yIHJlYWRpbmcgZmlsZVwiLCB7XHJcbiAgICAgICAgZGV0YWlsOiBlcnIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oKTtcclxuICBjb25zdCBncmFtbWFyID0gZ2V0R3JhbW1hckZvck5vdGVib29rKG5iKTtcclxuICBpZiAoIWdyYW1tYXIpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgYXRvbS5ncmFtbWFycy5hc3NpZ25MYW5ndWFnZU1vZGUoZWRpdG9yLmdldEJ1ZmZlcigpLCBncmFtbWFyLnNjb3BlTmFtZSk7XHJcbiAgY29uc3QgY29tbWVudFN0YXJ0U3RyaW5nID0gZ2V0Q29tbWVudFN0YXJ0U3RyaW5nKGVkaXRvcik7XHJcblxyXG4gIGlmICghY29tbWVudFN0YXJ0U3RyaW5nKSB7XHJcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJObyBjb21tZW50IHN5bWJvbCBkZWZpbmVkIGluIHJvb3Qgc2NvcGVcIik7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBuYkNlbGxzID0gW107XHJcbiAgY29uc3Qgc291cmNlcyA9IFtdO1xyXG4gIGNvbnN0IHJlc3VsdFJvd3MgPSBbXTtcclxuICBsZXQgcHJldmlvdXNCcmVha3BvaW50ID0gLTE7XHJcbiAgbmIuY2VsbE9yZGVyLmZvckVhY2goKHZhbHVlKSA9PiB7XHJcbiAgICBjb25zdCBjZWxsID0gbmIuY2VsbE1hcC5nZXQodmFsdWUpLnRvSlMoKTtcclxuICAgIG5iQ2VsbHMucHVzaChjZWxsKTtcclxuICAgIGNvbnN0IGh5Q2VsbCA9IHRvSHlkcm9nZW5Db2RlQmxvY2soY2VsbCwgYCR7Y29tbWVudFN0YXJ0U3RyaW5nfSBgKTtcclxuICAgIHJlc3VsdFJvd3MucHVzaChwcmV2aW91c0JyZWFrcG9pbnQgKyBoeUNlbGwuY29kZS50cmltKCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoKTtcclxuICAgIHByZXZpb3VzQnJlYWtwb2ludCArPSBoeUNlbGwucm93O1xyXG4gICAgc291cmNlcy5wdXNoKGh5Q2VsbC5jb2RlKTtcclxuICB9KTtcclxuICBlZGl0b3Iuc2V0VGV4dChzb3VyY2VzLmpvaW4obGluZXNlcCkpO1xyXG4gIGlmIChpbXBvcnRSZXN1bHRzKSB7XHJcbiAgICBpbXBvcnROb3RlYm9va1Jlc3VsdHMoZWRpdG9yLCBuYkNlbGxzLCByZXN1bHRSb3dzKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBkZXRlcm1pbmUgdGhlIEF0b20gR3JhbW1hciBvZiBhIG5vdGVib29rLiBEZWZhdWx0IGlzIFB5dGhvbi5cclxuICpcclxuICogQHBhcmFtIHtOb3RlYm9va30gbmIgLSBUaGUgTm90ZWJvb2sgdG8gZGV0ZXJtaW5lIHRoZSBBdG9tIEdyYW1tYXIgb2YuXHJcbiAqIEByZXR1cm5zIHtHcmFtbWFyfSAtIFRoZSBncmFtbWFyIG9mIHRoZSBub3RlYm9vay5cclxuICovXHJcbmZ1bmN0aW9uIGdldEdyYW1tYXJGb3JOb3RlYm9vayhuYjogTm90ZWJvb2spIHtcclxuICBjb25zdCBtZXRhRGF0YSA9IG5iLm1ldGFkYXRhO1xyXG4gIGNvbnN0IHtcclxuICAgIGtlcm5lbHNwZWMsXHJcbiAgICAvLyBPZmZpY2FsIG5iZm9ybWF0IHY0XHJcbiAgICBsYW5ndWFnZV9pbmZvLFxyXG4gICAgLy8gT2ZmaWNhbCBuYmZvcm1hdCB2NFxyXG4gICAga2VybmVsX2luZm8sXHJcbiAgICAvLyBTb21ldGltZXMgdXNlZCBpbiBuYmZvcm1hdCB2M1xyXG4gICAgbGFuZ3VhZ2UsIC8vIFNvbWV0aW1lcyB1c2VkIGluIG5iZm9ybWF0IHYzXHJcbiAgfSA9IHR5cGVvZiBtZXRhRGF0YS50b0pTID09PSBcImZ1bmN0aW9uXCIgPyBtZXRhRGF0YS50b0pTKCkgOiBtZXRhRGF0YTsgLy8gVE9ETyBmaXggdG9KU1xyXG4gIGNvbnN0IGtlcm5lbCA9IGtlcm5lbHNwZWMgPyBrZXJuZWxzcGVjIDoga2VybmVsX2luZm87XHJcbiAgY29uc3QgbGFuZyA9IGxhbmd1YWdlX2luZm9cclxuICAgID8gbGFuZ3VhZ2VfaW5mb1xyXG4gICAgOiBsYW5ndWFnZVxyXG4gICAgPyB7XHJcbiAgICAgICAgbmFtZTogbGFuZ3VhZ2UsXHJcbiAgICAgIH1cclxuICAgIDogbnVsbDtcclxuXHJcbiAgaWYgKCFrZXJuZWwgJiYgIWxhbmcpIHtcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFxyXG4gICAgICBcIk5vIGxhbmd1YWdlIG1ldGFkYXRhIGluIG5vdGVib29rOyBhc3N1bWluZyBQeXRob25cIlxyXG4gICAgKTtcclxuICAgIHJldHVybiBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoXCJzb3VyY2UucHl0aG9uXCIpO1xyXG4gIH1cclxuXHJcbiAgbGV0IG1hdGNoZWRHcmFtbWFyID0gbnVsbDtcclxuXHJcbiAgaWYgKGxhbmcpIHtcclxuICAgIC8vIGxhbmcubmFtZSBzaG91bGQgYmUgcmVxdWlyZWRcclxuICAgIG1hdGNoZWRHcmFtbWFyID0gZ2V0R3JhbW1hckZvckxhbmd1YWdlTmFtZShsYW5nLm5hbWUpO1xyXG4gICAgaWYgKG1hdGNoZWRHcmFtbWFyKSB7XHJcbiAgICAgIHJldHVybiBtYXRjaGVkR3JhbW1hcjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBsYW5nLmZpbGVfZXh0ZW5zaW9uIGlzIG5vdCByZXF1aXJlZCwgYnV0IGlmIGxhbmcubmFtZSByZXRyaWV2ZXMgbm8gbWF0Y2gsXHJcbiAgICAvLyB0aGlzIGlzIHRoZSBuZXh0IGJlc3QgdGhpbmcuXHJcbiAgICBpZiAobGFuZy5maWxlX2V4dGVuc2lvbikge1xyXG4gICAgICBtYXRjaGVkR3JhbW1hciA9IGdldEdyYW1tYXJGb3JGaWxlRXh0ZW5zaW9uKGxhbmcuZmlsZV9leHRlbnNpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChtYXRjaGVkR3JhbW1hcikge1xyXG4gICAgICByZXR1cm4gbWF0Y2hlZEdyYW1tYXI7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoa2VybmVsKSB7XHJcbiAgICAvLyBrZXJuZWwubGFuZ3VhZ2UgaXMgbm90IHJlcXVpcmVkLCBidXQgaXRzIG9mdGVuIG1vcmUgYWNjdXJhdGUgdGhhbiBuYW1lXHJcbiAgICBtYXRjaGVkR3JhbW1hciA9IGdldEdyYW1tYXJGb3JMYW5ndWFnZU5hbWUoa2VybmVsLmxhbmd1YWdlKTtcclxuICAgIGlmIChtYXRjaGVkR3JhbW1hcikge1xyXG4gICAgICByZXR1cm4gbWF0Y2hlZEdyYW1tYXI7XHJcbiAgICB9XHJcbiAgICAvLyBrZXJuZWwubmFtZSBzaG91bGQgYmUgcmVxdWlyZWQsIGJ1dCBpcyBvZnRlbiBhIGtlcm5lbCBuYW1lLCBzbyBpdHMgaGFyZFxyXG4gICAgLy8gdG8gbWF0Y2ggZWZmY2llbnRseVxyXG4gICAgbWF0Y2hlZEdyYW1tYXIgPSBnZXRHcmFtbWFyRm9yS2VybmVsc3BlY05hbWUoa2VybmVsLm5hbWUpO1xyXG4gICAgaWYgKG1hdGNoZWRHcmFtbWFyKSB7XHJcbiAgICAgIHJldHVybiBtYXRjaGVkR3JhbW1hcjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiVW5hYmxlIHRvIGRldGVybWluZSBjb3JyZWN0IGxhbmd1YWdlIGdyYW1tYXJcIik7XHJcbiAgcmV0dXJuIGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShcInNvdXJjZS5weXRob25cIik7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBmaW5kIGEgbWF0Y2hpbmcgQXRvbSBHcmFtbWFyIGZyb20gYSBsYW5ndWFnZSBuYW1lXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIGxhbmd1YWdlIG5hbWUgdG8gZmluZCBhIGdyYW1tYXIgZm9yLlxyXG4gKiBAcmV0dXJucyB7R3JhbW1hcn0gLSBUaGUgbWF0Y2hpbmcgQXRvbSBHcmFtbWFyLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0R3JhbW1hckZvckxhbmd1YWdlTmFtZShuYW1lOiBzdHJpbmcpIHtcclxuICBpZiAoIW5hbWUpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBjb25zdCBmb3JtYXR0ZWROYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoXCIgXCIsIFwiLVwiKTtcclxuICBjb25zdCBzY29wZU5hbWUgPSBgc291cmNlLiR7Zm9ybWF0dGVkTmFtZX1gO1xyXG4gIGNvbnN0IGdyYW1tYXJzID0gYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpO1xyXG5cclxuICBmb3IgKGNvbnN0IGcgb2YgZ3JhbW1hcnMpIHtcclxuICAgIGlmIChcclxuICAgICAgZyAmJlxyXG4gICAgICAoKGcubmFtZSAmJiBnLm5hbWUudG9Mb3dlckNhc2UoKSA9PSBuYW1lLnRvTG93ZXJDYXNlKCkpIHx8XHJcbiAgICAgICAgZy5zY29wZU5hbWUgPT0gc2NvcGVOYW1lKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBnO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBmaW5kIGEgbWF0Y2hpbmcgQXRvbSBHcmFtbWFyIGZyb20gYSBmaWxlIGV4dGVuc2lvbnNcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV4dCAtIFRoZSBmaWxlIGV4dGVuc2lvbiB0byBmaW5kIGEgZ3JhbW1hciBmb3IuXHJcbiAqIEByZXR1cm5zIHtHcmFtbWFyfSAtIFRoZSBtYXRjaGluZyBBdG9tIEdyYW1tYXIuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRHcmFtbWFyRm9yRmlsZUV4dGVuc2lvbihleHQ6IHN0cmluZyk6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkIHtcclxuICBpZiAoIWV4dCkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG4gIGV4dCA9IGV4dC5zdGFydHNXaXRoKFwiLlwiKSA/IGV4dC5zbGljZSgxKSA6IGV4dDtcclxuICBjb25zdCBncmFtbWFycyA9IGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKTtcclxuICByZXR1cm4gZ3JhbW1hcnMuZmluZCgoZ3JhbW1hcikgPT4ge1xyXG4gICAgcmV0dXJuIGdyYW1tYXIuZmlsZVR5cGVzLmluY2x1ZGVzKGV4dCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBmaW5kIGEgbWF0Y2hpbmcgQXRvbSBHcmFtbWFyIGZyb20gS2VybmVsc3BlY01ldGFkYXRhIG5hbWVcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgS2VybmVsc3BlY01ldGFkYXRhIG5hbWUgdG8gZmluZCBhIGdyYW1tYXIgZm9yLlxyXG4gKiBAcmV0dXJucyB7R3JhbW1hcn0gLSBUaGUgbWF0Y2hpbmcgQXRvbSBHcmFtbWFyLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0R3JhbW1hckZvcktlcm5lbHNwZWNOYW1lKG5hbWU6IHN0cmluZyk6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkIHtcclxuICAvLyBDaGVjayBpZiB0aGVyZSBleGlzdHMgYW4gQXRvbSBncmFtbWFyIG5hbWVkIHNvdXJjZS4ke25hbWV9XHJcbiAgY29uc3QgZ3JhbW1hciA9IGdldEdyYW1tYXJGb3JMYW5ndWFnZU5hbWUobmFtZSk7XHJcbiAgaWYgKGdyYW1tYXIpIHtcclxuICAgIHJldHVybiBncmFtbWFyO1xyXG4gIH1cclxuICAvLyBPdGhlcndpc2UgYXR0ZW1wdCBtYW51YWwgbWF0Y2hpbmcgZnJvbSBrZXJuZWxzcGVjIG5hbWUgdG8gQXRvbSBzY29wZVxyXG4gIGNvbnN0IGNyb3Nzd2FsayA9IHtcclxuICAgIHB5dGhvbjI6IFwic291cmNlLnB5dGhvblwiLFxyXG4gICAgcHl0aG9uMzogXCJzb3VyY2UucHl0aG9uXCIsXHJcbiAgICBiYXNoOiBcInNvdXJjZS5zaGVsbFwiLFxyXG4gICAgamF2YXNjcmlwdDogXCJzb3VyY2UuanNcIixcclxuICAgIGlyOiBcInNvdXJjZS5yXCIsXHJcbiAgfTtcclxuXHJcbiAgaWYgKGNyb3Nzd2Fsa1tuYW1lXSkge1xyXG4gICAgcmV0dXJuIGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShjcm9zc3dhbGtbbmFtZV0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIG5vdGVib29rIGNlbGxzIHRvIEh5ZHJvZ2VuIGNvZGUgYmxvY2tzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0NlbGx9IGNlbGwgLSBOb3RlYm9vayBjZWxsIHRvIGNvbnZlcnRcclxuICogQHBhcmFtIHtTdHJpbmd9IGNvbW1lbnRTdGFydFN0cmluZyAtIFRoZSBjb21tZW50IHN5bnRheCBvZiB0aGUgY29kZSBsYW5ndWFnZS5cclxuICogQHJldHVybnMge09iamVjdH0gLSBBIEh5ZHJvZ2VuIENvZGUgQmxvY2suXHJcbiAqL1xyXG5mdW5jdGlvbiB0b0h5ZHJvZ2VuQ29kZUJsb2NrKFxyXG4gIGNlbGw6IENlbGwsXHJcbiAgY29tbWVudFN0YXJ0U3RyaW5nOiBzdHJpbmdcclxuKToge1xyXG4gIGNlbGxUeXBlOiBIeWRyb2dlbkNlbGxUeXBlO1xyXG4gIGNvZGU6IHN0cmluZztcclxuICByb3c6IG51bWJlcjtcclxufSB7XHJcbiAgY29uc3QgY2VsbFR5cGUgPSBjZWxsLmNlbGxfdHlwZSA9PT0gXCJtYXJrZG93blwiID8gXCJtYXJrZG93blwiIDogXCJjb2RlY2VsbFwiO1xyXG4gIGNvbnN0IGNlbGxIZWFkZXIgPSBnZXRDZWxsSGVhZGVyKGNvbW1lbnRTdGFydFN0cmluZywgY2VsbFR5cGUpO1xyXG4gIGxldCBzb3VyY2UgPSBjZWxsLnNvdXJjZTtcclxuICBsZXQgY2VsbExlbmd0aDtcclxuXHJcbiAgaWYgKGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCIpIHtcclxuICAgIHNvdXJjZSA9IHNvdXJjZS5zcGxpdChcIlxcblwiKTtcclxuICAgIHNvdXJjZVswXSA9IGNvbW1lbnRTdGFydFN0cmluZyArIHNvdXJjZVswXTtcclxuICAgIGNlbGxMZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xyXG4gICAgc291cmNlID0gc291cmNlLmpvaW4obGluZXNlcCArIGNvbW1lbnRTdGFydFN0cmluZyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNlbGxMZW5ndGggPSBzb3VyY2Uuc3BsaXQoXCJcXG5cIikubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGNlbGxUeXBlLFxyXG4gICAgY29kZTogY2VsbEhlYWRlciArIGxpbmVzZXAgKyBzb3VyY2UsXHJcbiAgICByb3c6IGNlbGxMZW5ndGggKyAxLCAvLyBwbHVzIDEgZm9yIHRoZSBoZWFkZXJcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIEh5ZHJvZ2VuIGNlbGwgaGVhZGVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBjb21tZW50U3RhcnRTdHJpbmcgLSBUaGUgY29tbWVudCBzeW50YXggb2YgdGhlIGNvZGUgbGFuZ3VhZ2UuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXl3b3JkIC0gVGhlIGtleXdvcmQgcmVsYXRpbmcgdG8gdGhlIGNlbGwgdHlwZS5cclxuICogQHJldHVybnMge1N0cmluZ30gLSBBIEh5ZHJvZ2VuIENlbGwgSGVhZGVyLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0Q2VsbEhlYWRlcihcclxuICBjb21tZW50U3RhcnRTdHJpbmc6IHN0cmluZyxcclxuICBrZXl3b3JkOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkXHJcbikge1xyXG4gIGNvbnN0IG1hcmtlciA9IGAke2NvbW1lbnRTdGFydFN0cmluZ30lJSBgO1xyXG4gIHJldHVybiBrZXl3b3JkID8gbWFya2VyICsga2V5d29yZCA6IG1hcmtlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIERpc3BsYXlzIHByZXZpb3VzIGNlbGwgcmVzdWx0cyBpbmxpbmUgb2YgdGhlIHByb3ZpZGVkIGVkaXRvci4gbmJDZWxscyBhbmRcclxuICogcmVzdWx0Um93cyBzaG91bGQgYmUgdGhlIHNhbWUgbGVuZ3RoLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1RleHRFZGl0b3J9IGVkaXRvciAtIFRoZSBlZGl0b3IgdG8gZGlzcGxheSB0aGUgcmVzdWx0cyBpbi5cclxuICogQHBhcmFtIHtDZWxsW119IG5iQ2VsbHMgLSBUaGUgb3JpZ2luYWwgbm90ZWJvb2sgY2VsbHMuXHJcbiAqIEBwYXJhbSB7TnVtYmVyW119IHJlc3VsdFJvd3MgLSBUaGUgcm93cyB0byBkaXNwbGF5IHRoZSByZXN1bHRzIG9uLlxyXG4gKi9cclxuZnVuY3Rpb24gaW1wb3J0Tm90ZWJvb2tSZXN1bHRzKFxyXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICBuYkNlbGxzOiBBcnJheTxDZWxsPixcclxuICByZXN1bHRSb3dzOiBBcnJheTxudW1iZXI+XHJcbikge1xyXG4gIGlmIChuYkNlbGxzLmxlbmd0aCAhPSByZXN1bHRSb3dzLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBsZXQgbWFya2VycyA9IHN0b3JlLm1hcmtlcnNNYXBwaW5nLmdldChlZGl0b3IuaWQpO1xyXG4gIG1hcmtlcnMgPSBtYXJrZXJzID8gbWFya2VycyA6IHN0b3JlLm5ld01hcmtlclN0b3JlKGVkaXRvci5pZCk7XHJcbiAgbGV0IGNlbGxOdW1iZXIgPSAwO1xyXG5cclxuICBmb3IgKGNvbnN0IGNlbGwgb2YgbmJDZWxscykge1xyXG4gICAgY29uc3Qgcm93ID0gcmVzdWx0Um93c1tjZWxsTnVtYmVyXTtcclxuXHJcbiAgICBzd2l0Y2ggKGNlbGwuY2VsbF90eXBlKSB7XHJcbiAgICAgIGNhc2UgXCJjb2RlXCI6XHJcbiAgICAgICAgaWYgKGNlbGwub3V0cHV0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBpbXBvcnRSZXN1bHQoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBlZGl0b3IsXHJcbiAgICAgICAgICAgICAgbWFya2VycyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIG91dHB1dHM6IGNlbGwub3V0cHV0cyxcclxuICAgICAgICAgICAgICByb3csXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxyXG4gICAgICAgIGltcG9ydFJlc3VsdChcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZWRpdG9yLFxyXG4gICAgICAgICAgICBtYXJrZXJzLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgb3V0cHV0czogW2NvbnZlcnRNYXJrZG93blRvT3V0cHV0KGNlbGwuc291cmNlKV0sXHJcbiAgICAgICAgICAgIHJvdyxcclxuICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIGNlbGxOdW1iZXIrKztcclxuICB9XHJcbn1cclxuIl19