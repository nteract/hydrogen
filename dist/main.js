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
exports.consumeStatusBar = exports.consumeAutocompleteWatchEditor = exports.provideAutocompleteResults = exports.provideHydrogen = exports.deactivate = exports.activate = exports.config = void 0;
const atom_1 = require("atom");
const lodash_1 = __importDefault(require("lodash"));
const mobx_1 = require("mobx");
const inspector_1 = __importDefault(require("./panes/inspector"));
const watches_1 = __importDefault(require("./panes/watches"));
const output_area_1 = __importDefault(require("./panes/output-area"));
const kernel_monitor_1 = __importDefault(require("./panes/kernel-monitor"));
const config_1 = __importDefault(require("./config"));
const zmq_kernel_1 = __importDefault(require("./zmq-kernel"));
const ws_kernel_1 = __importDefault(require("./ws-kernel"));
const kernel_1 = __importDefault(require("./kernel"));
const kernel_picker_1 = __importDefault(require("./kernel-picker"));
const ws_kernel_picker_1 = __importDefault(require("./ws-kernel-picker"));
const existing_kernel_picker_1 = __importDefault(require("./existing-kernel-picker"));
const hydrogen_provider_1 = __importDefault(require("./plugin-api/hydrogen-provider"));
const store_1 = __importDefault(require("./store"));
const kernel_manager_1 = __importDefault(require("./kernel-manager"));
const services_1 = __importDefault(require("./services"));
const commands = __importStar(require("./commands"));
const codeManager = __importStar(require("./code-manager"));
const result = __importStar(require("./result"));
const utils_1 = require("./utils");
const export_notebook_1 = require("./export-notebook");
const import_notebook_1 = require("./import-notebook");
exports.config = config_1.default.schema;
let emitter;
let kernelPicker;
let existingKernelPicker;
let wsKernelPicker;
let hydrogenProvider;
function activate() {
    emitter = new atom_1.Emitter();
    let skipLanguageMappingsChange = false;
    store_1.default.subscriptions.add(atom.config.onDidChange("Hydrogen.languageMappings", ({ newValue, oldValue }) => {
        if (skipLanguageMappingsChange) {
            skipLanguageMappingsChange = false;
            return;
        }
        if (store_1.default.runningKernels.length != 0) {
            skipLanguageMappingsChange = true;
            atom.config.set("Hydrogen.languageMappings", oldValue);
            atom.notifications.addError("Hydrogen", {
                description: "`languageMappings` cannot be updated while kernels are running",
                dismissable: false,
            });
        }
    }));
    store_1.default.subscriptions.add(atom.config.observe("Hydrogen.statusBarDisable", (newValue) => {
        store_1.default.setConfigValue("Hydrogen.statusBarDisable", Boolean(newValue));
    }), atom.config.observe("Hydrogen.statusBarKernelInfo", (newValue) => {
        store_1.default.setConfigValue("Hydrogen.statusBarKernelInfo", Boolean(newValue));
    }));
    store_1.default.subscriptions.add(atom.commands.add("atom-text-editor:not([mini])", {
        "hydrogen:run": () => run(),
        "hydrogen:run-all": () => runAll(),
        "hydrogen:run-all-above": () => runAllAbove(),
        "hydrogen:run-and-move-down": () => run(true),
        "hydrogen:run-cell": () => runCell(),
        "hydrogen:run-cell-and-move-down": () => runCell(true),
        "hydrogen:toggle-watches": () => atom.workspace.toggle(utils_1.WATCHES_URI),
        "hydrogen:toggle-output-area": () => commands.toggleOutputMode(),
        "hydrogen:toggle-kernel-monitor": async () => {
            const lastItem = atom.workspace.getActivePaneItem();
            const lastPane = atom.workspace.paneForItem(lastItem);
            await atom.workspace.toggle(utils_1.KERNEL_MONITOR_URI);
            if (lastPane) {
                lastPane.activate();
            }
        },
        "hydrogen:start-local-kernel": () => startZMQKernel(),
        "hydrogen:connect-to-remote-kernel": () => connectToWSKernel(),
        "hydrogen:connect-to-existing-kernel": () => connectToExistingKernel(),
        "hydrogen:add-watch": () => {
            if (store_1.default.kernel) {
                store_1.default.kernel.watchesStore.addWatchFromEditor(store_1.default.editor);
                utils_1.openOrShowDock(utils_1.WATCHES_URI);
            }
        },
        "hydrogen:remove-watch": () => {
            if (store_1.default.kernel) {
                store_1.default.kernel.watchesStore.removeWatch();
                utils_1.openOrShowDock(utils_1.WATCHES_URI);
            }
        },
        "hydrogen:update-kernels": async () => {
            await kernel_manager_1.default.updateKernelSpecs();
        },
        "hydrogen:toggle-inspector": () => commands.toggleInspector(store_1.default),
        "hydrogen:interrupt-kernel": () => handleKernelCommand({
            command: "interrupt-kernel",
        }, store_1.default),
        "hydrogen:restart-kernel": () => handleKernelCommand({
            command: "restart-kernel",
        }, store_1.default),
        "hydrogen:shutdown-kernel": () => handleKernelCommand({
            command: "shutdown-kernel",
        }, store_1.default),
        "hydrogen:clear-result": () => result.clearResult(store_1.default),
        "hydrogen:export-notebook": () => export_notebook_1.exportNotebook(),
        "hydrogen:fold-current-cell": () => foldCurrentCell(),
        "hydrogen:fold-all-but-current-cell": () => foldAllButCurrentCell(),
        "hydrogen:clear-results": () => result.clearResults(store_1.default),
    }));
    store_1.default.subscriptions.add(atom.commands.add("atom-workspace", {
        "hydrogen:import-notebook": import_notebook_1.importNotebook,
    }));
    if (atom.inDevMode()) {
        store_1.default.subscriptions.add(atom.commands.add("atom-workspace", {
            "hydrogen:hot-reload-package": () => utils_1.hotReloadPackage(),
        }));
    }
    store_1.default.subscriptions.add(atom.workspace.observeActiveTextEditor((editor) => {
        store_1.default.updateEditor(editor);
    }));
    store_1.default.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
        const editorSubscriptions = new atom_1.CompositeDisposable();
        editorSubscriptions.add(editor.onDidChangeGrammar(() => {
            store_1.default.setGrammar(editor);
        }));
        if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
            editorSubscriptions.add(editor.onDidChangeCursorPosition(lodash_1.default.debounce(() => {
                store_1.default.setGrammar(editor);
            }, 75)));
        }
        editorSubscriptions.add(editor.onDidDestroy(() => {
            editorSubscriptions.dispose();
        }));
        editorSubscriptions.add(editor.onDidChangeTitle((newTitle) => store_1.default.forceEditorUpdate()));
        store_1.default.subscriptions.add(editorSubscriptions);
    }));
    hydrogenProvider = null;
    store_1.default.subscriptions.add(atom.workspace.addOpener((uri) => {
        switch (uri) {
            case utils_1.INSPECTOR_URI:
                return new inspector_1.default(store_1.default);
            case utils_1.WATCHES_URI:
                return new watches_1.default(store_1.default);
            case utils_1.OUTPUT_AREA_URI:
                return new output_area_1.default(store_1.default);
            case utils_1.KERNEL_MONITOR_URI:
                return new kernel_monitor_1.default(store_1.default);
            default: {
                return;
            }
        }
    }));
    store_1.default.subscriptions.add(atom.workspace.addOpener(import_notebook_1.ipynbOpener));
    store_1.default.subscriptions.add(new atom_1.Disposable(() => {
        atom.workspace.getPaneItems().forEach((item) => {
            if (item instanceof inspector_1.default ||
                item instanceof watches_1.default ||
                item instanceof output_area_1.default ||
                item instanceof kernel_monitor_1.default) {
                item.destroy();
            }
        });
    }));
    mobx_1.autorun(() => {
        emitter.emit("did-change-kernel", store_1.default.kernel);
    });
}
exports.activate = activate;
function deactivate() {
    store_1.default.dispose();
}
exports.deactivate = deactivate;
function provideHydrogen() {
    if (!hydrogenProvider) {
        hydrogenProvider = new hydrogen_provider_1.default(emitter);
    }
    return hydrogenProvider;
}
exports.provideHydrogen = provideHydrogen;
function provideAutocompleteResults() {
    return services_1.default.provided.autocomplete.provideAutocompleteResults(store_1.default);
}
exports.provideAutocompleteResults = provideAutocompleteResults;
function consumeAutocompleteWatchEditor(watchEditor) {
    return services_1.default.consumed.autocomplete.consume(store_1.default, watchEditor);
}
exports.consumeAutocompleteWatchEditor = consumeAutocompleteWatchEditor;
function consumeStatusBar(statusBar) {
    return services_1.default.consumed.statusBar.addStatusBar(store_1.default, statusBar, handleKernelCommand);
}
exports.consumeStatusBar = consumeStatusBar;
function connectToExistingKernel() {
    if (!existingKernelPicker) {
        existingKernelPicker = new existing_kernel_picker_1.default();
    }
    existingKernelPicker.toggle();
}
function handleKernelCommand({ command, payload }, { kernel, markers }) {
    utils_1.log("handleKernelCommand:", [
        { command, payload },
        { kernel, markers },
    ]);
    if (!kernel) {
        const message = "No running kernel for grammar or editor found";
        atom.notifications.addError(message);
        return;
    }
    if (command === "interrupt-kernel") {
        kernel.interrupt();
    }
    else if (command === "restart-kernel") {
        kernel.restart();
    }
    else if (command === "shutdown-kernel") {
        if (markers) {
            markers.clear();
        }
        kernel.shutdown();
        kernel.destroy();
    }
    else if (command === "rename-kernel" &&
        kernel.transport instanceof ws_kernel_1.default) {
        kernel.transport.promptRename();
    }
    else if (command === "disconnect-kernel") {
        if (markers) {
            markers.clear();
        }
        kernel.destroy();
    }
}
function run(moveDown = false) {
    const editor = store_1.default.editor;
    if (!editor) {
        return;
    }
    atom.commands.dispatch(editor.element, "autocomplete-plus:cancel");
    const codeBlock = codeManager.findCodeBlock(editor);
    if (!codeBlock) {
        return;
    }
    const codeNullable = codeBlock.code;
    if (codeNullable === null) {
        return;
    }
    const { row } = codeBlock;
    const cellType = codeManager.getMetadataForRow(editor, new atom_1.Point(row, 0));
    const code = cellType === "markdown"
        ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
        : codeNullable;
    if (moveDown === true) {
        codeManager.moveDown(editor, row);
    }
    checkForKernel(store_1.default, (kernel) => {
        result.createResult(store_1.default, {
            code,
            row,
            cellType,
        });
    });
}
function runAll(breakpoints) {
    const { editor, kernel, grammar, filePath } = store_1.default;
    if (!editor || !grammar || !filePath) {
        return;
    }
    if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
        atom.notifications.addError('"Run All" is not supported for this file type!');
        return;
    }
    if (editor && kernel) {
        _runAll(editor, kernel, breakpoints);
        return;
    }
    kernel_manager_1.default.startKernelFor(grammar, editor, filePath, (kernel) => {
        _runAll(editor, kernel, breakpoints);
    });
}
function _runAll(editor, kernel, breakpoints) {
    const cells = codeManager.getCells(editor, breakpoints);
    for (const cell of cells) {
        const { start, end } = cell;
        const codeNullable = codeManager.getTextInRange(editor, start, end);
        if (codeNullable === null) {
            continue;
        }
        const row = codeManager.escapeBlankRows(editor, start.row, codeManager.getEscapeBlankRowsEndRow(editor, end));
        const cellType = codeManager.getMetadataForRow(editor, start);
        const code = cellType === "markdown"
            ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
            : codeNullable;
        checkForKernel(store_1.default, (kernel) => {
            result.createResult(store_1.default, {
                code,
                row,
                cellType,
            });
        });
    }
}
function runAllAbove() {
    const { editor, kernel, grammar, filePath } = store_1.default;
    if (!editor || !grammar || !filePath) {
        return;
    }
    if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
        atom.notifications.addError('"Run All Above" is not supported for this file type!');
        return;
    }
    if (editor && kernel) {
        _runAllAbove(editor, kernel);
        return;
    }
    kernel_manager_1.default.startKernelFor(grammar, editor, filePath, (kernel) => {
        _runAllAbove(editor, kernel);
    });
}
function _runAllAbove(editor, kernel) {
    const cursor = editor.getCursorBufferPosition();
    cursor.column = editor.getBuffer().lineLengthForRow(cursor.row);
    const breakpoints = codeManager.getBreakpoints(editor);
    breakpoints.push(cursor);
    const cells = codeManager.getCells(editor, breakpoints);
    for (const cell of cells) {
        const { start, end } = cell;
        const codeNullable = codeManager.getTextInRange(editor, start, end);
        const row = codeManager.escapeBlankRows(editor, start.row, codeManager.getEscapeBlankRowsEndRow(editor, end));
        const cellType = codeManager.getMetadataForRow(editor, start);
        if (codeNullable !== null) {
            const code = cellType === "markdown"
                ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
                : codeNullable;
            checkForKernel(store_1.default, (kernel) => {
                result.createResult(store_1.default, {
                    code,
                    row,
                    cellType,
                });
            });
        }
        if (cell.containsPoint(cursor)) {
            break;
        }
    }
}
function runCell(moveDown = false) {
    const editor = store_1.default.editor;
    if (!editor) {
        return;
    }
    atom.commands.dispatch(editor.element, "autocomplete-plus:cancel");
    const { start, end } = codeManager.getCurrentCell(editor);
    const codeNullable = codeManager.getTextInRange(editor, start, end);
    if (codeNullable === null) {
        return;
    }
    const row = codeManager.escapeBlankRows(editor, start.row, codeManager.getEscapeBlankRowsEndRow(editor, end));
    const cellType = codeManager.getMetadataForRow(editor, start);
    const code = cellType === "markdown"
        ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
        : codeNullable;
    if (moveDown === true) {
        codeManager.moveDown(editor, row);
    }
    checkForKernel(store_1.default, (kernel) => {
        result.createResult(store_1.default, {
            code,
            row,
            cellType,
        });
    });
}
function foldCurrentCell() {
    const editor = store_1.default.editor;
    if (!editor) {
        return;
    }
    codeManager.foldCurrentCell(editor);
}
function foldAllButCurrentCell() {
    const editor = store_1.default.editor;
    if (!editor) {
        return;
    }
    codeManager.foldAllButCurrentCell(editor);
}
function startZMQKernel() {
    kernel_manager_1.default
        .getAllKernelSpecsForGrammar(store_1.default.grammar)
        .then((kernelSpecs) => {
        if (kernelPicker) {
            kernelPicker.kernelSpecs = kernelSpecs;
        }
        else {
            kernelPicker = new kernel_picker_1.default(kernelSpecs);
            kernelPicker.onConfirmed = (kernelSpec) => {
                const { editor, grammar, filePath, markers } = store_1.default;
                if (!editor || !grammar || !filePath || !markers) {
                    return;
                }
                markers.clear();
                kernel_manager_1.default.startKernel(kernelSpec, grammar, editor, filePath);
            };
        }
        kernelPicker.toggle();
    });
}
function connectToWSKernel() {
    if (!wsKernelPicker) {
        wsKernelPicker = new ws_kernel_picker_1.default((transport) => {
            const kernel = new kernel_1.default(transport);
            const { editor, grammar, filePath, markers } = store_1.default;
            if (!editor || !grammar || !filePath || !markers) {
                return;
            }
            markers.clear();
            if (kernel.transport instanceof zmq_kernel_1.default) {
                kernel.destroy();
            }
            store_1.default.newKernel(kernel, filePath, editor, grammar);
        });
    }
    wsKernelPicker.toggle((kernelSpec) => utils_1.kernelSpecProvidesGrammar(kernelSpec, store_1.default.grammar));
}
function checkForKernel({ editor, grammar, filePath, kernel, }, callback) {
    if (!filePath || !grammar) {
        return atom.notifications.addError("The language grammar must be set in order to start a kernel. The easiest way to do this is to save the file.");
    }
    if (kernel) {
        callback(kernel);
        return;
    }
    kernel_manager_1.default.startKernelFor(grammar, editor, filePath, (newKernel) => callback(newKernel));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFPYztBQUVkLG9EQUF1QjtBQUN2QiwrQkFBK0I7QUFFL0Isa0VBQThDO0FBQzlDLDhEQUEwQztBQUMxQyxzRUFBNkM7QUFDN0MsNEVBQXVEO0FBQ3ZELHNEQUE4QjtBQUM5Qiw4REFBcUM7QUFDckMsNERBQW1DO0FBQ25DLHNEQUE4QjtBQUM5QixvRUFBMkM7QUFDM0MsMEVBQWdEO0FBQ2hELHNGQUE0RDtBQUM1RCx1RkFBOEQ7QUFDOUQsb0RBQWtEO0FBQ2xELHNFQUE2QztBQUM3QywwREFBa0M7QUFDbEMscURBQXVDO0FBQ3ZDLDREQUE4QztBQUM5QyxpREFBbUM7QUFFbkMsbUNBV2lCO0FBQ2pCLHVEQUFtRDtBQUNuRCx1REFBZ0U7QUFHbkQsUUFBQSxNQUFNLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLENBQUM7QUFDcEMsSUFBSSxPQUFpRSxDQUFDO0FBQ3RFLElBQUksWUFBc0MsQ0FBQztBQUMzQyxJQUFJLG9CQUFzRCxDQUFDO0FBQzNELElBQUksY0FBMEMsQ0FBQztBQUMvQyxJQUFJLGdCQUE4QyxDQUFDO0FBRW5ELFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxHQUFHLElBQUksY0FBTyxFQUFFLENBQUM7SUFDeEIsSUFBSSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7SUFDdkMsZUFBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUNyQiwyQkFBMkIsRUFDM0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO1FBQ3pCLElBQUksMEJBQTBCLEVBQUU7WUFDOUIsMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLE9BQU87U0FDUjtRQUVELElBQUksZUFBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLElBQUks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Q0osQ0FBQztBQUdELFNBQVMsY0FBYyxDQUNyQixFQUNFLE1BQU0sRUFDTixPQUFPLEVBQ1AsUUFBUSxFQUNSLE1BQU0sR0FNUCxFQUNELFFBQWtDO0lBRWxDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDekIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FDaEMsOEdBQThHLENBQy9HLENBQUM7S0FDSDtJQUVELElBQUksTUFBTSxFQUFFO1FBQ1YsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pCLE9BQU87S0FDUjtJQUVELHdCQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsU0FBaUIsRUFBRSxFQUFFLENBQzVFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FDcEIsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBFbWl0dGVyLFxuICBDb21wb3NpdGVEaXNwb3NhYmxlLFxuICBEaXNwb3NhYmxlLFxuICBQb2ludCxcbiAgVGV4dEVkaXRvcixcbiAgR3JhbW1hcixcbn0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IFN0YXR1c0JhciB9IGZyb20gXCJhdG9tL3N0YXR1cy1iYXJcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IGF1dG9ydW4gfSBmcm9tIFwibW9ieFwiO1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IEluc3BlY3RvclBhbmUgZnJvbSBcIi4vcGFuZXMvaW5zcGVjdG9yXCI7XG5pbXBvcnQgV2F0Y2hlc1BhbmUgZnJvbSBcIi4vcGFuZXMvd2F0Y2hlc1wiO1xuaW1wb3J0IE91dHB1dFBhbmUgZnJvbSBcIi4vcGFuZXMvb3V0cHV0LWFyZWFcIjtcbmltcG9ydCBLZXJuZWxNb25pdG9yUGFuZSBmcm9tIFwiLi9wYW5lcy9rZXJuZWwtbW9uaXRvclwiO1xuaW1wb3J0IENvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBaTVFLZXJuZWwgZnJvbSBcIi4vem1xLWtlcm5lbFwiO1xuaW1wb3J0IFdTS2VybmVsIGZyb20gXCIuL3dzLWtlcm5lbFwiO1xuaW1wb3J0IEtlcm5lbCBmcm9tIFwiLi9rZXJuZWxcIjtcbmltcG9ydCBLZXJuZWxQaWNrZXIgZnJvbSBcIi4va2VybmVsLXBpY2tlclwiO1xuaW1wb3J0IFdTS2VybmVsUGlja2VyIGZyb20gXCIuL3dzLWtlcm5lbC1waWNrZXJcIjtcbmltcG9ydCBFeGlzdGluZ0tlcm5lbFBpY2tlciBmcm9tIFwiLi9leGlzdGluZy1rZXJuZWwtcGlja2VyXCI7XG5pbXBvcnQgSHlkcm9nZW5Qcm92aWRlciBmcm9tIFwiLi9wbHVnaW4tYXBpL2h5ZHJvZ2VuLXByb3ZpZGVyXCI7XG5pbXBvcnQgc3RvcmUsIHsgU3RvcmUsIFN0b3JlTGlrZSB9IGZyb20gXCIuL3N0b3JlXCI7XG5pbXBvcnQga2VybmVsTWFuYWdlciBmcm9tIFwiLi9rZXJuZWwtbWFuYWdlclwiO1xuaW1wb3J0IHNlcnZpY2VzIGZyb20gXCIuL3NlcnZpY2VzXCI7XG5pbXBvcnQgKiBhcyBjb21tYW5kcyBmcm9tIFwiLi9jb21tYW5kc1wiO1xuaW1wb3J0ICogYXMgY29kZU1hbmFnZXIgZnJvbSBcIi4vY29kZS1tYW5hZ2VyXCI7XG5pbXBvcnQgKiBhcyByZXN1bHQgZnJvbSBcIi4vcmVzdWx0XCI7XG5pbXBvcnQgdHlwZSBNYXJrZXJTdG9yZSBmcm9tIFwiLi9zdG9yZS9tYXJrZXJzXCI7XG5pbXBvcnQge1xuICBsb2csXG4gIHJlYWN0RmFjdG9yeSxcbiAgaXNNdWx0aWxhbmd1YWdlR3JhbW1hcixcbiAgSU5TUEVDVE9SX1VSSSxcbiAgV0FUQ0hFU19VUkksXG4gIE9VVFBVVF9BUkVBX1VSSSxcbiAgS0VSTkVMX01PTklUT1JfVVJJLFxuICBob3RSZWxvYWRQYWNrYWdlLFxuICBvcGVuT3JTaG93RG9jayxcbiAga2VybmVsU3BlY1Byb3ZpZGVzR3JhbW1hcixcbn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7IGV4cG9ydE5vdGVib29rIH0gZnJvbSBcIi4vZXhwb3J0LW5vdGVib29rXCI7XG5pbXBvcnQgeyBpbXBvcnROb3RlYm9vaywgaXB5bmJPcGVuZXIgfSBmcm9tIFwiLi9pbXBvcnQtbm90ZWJvb2tcIjtcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBDb25maWcuc2NoZW1hO1xubGV0IGVtaXR0ZXI6IEVtaXR0ZXI8e30sIHsgXCJkaWQtY2hhbmdlLWtlcm5lbFwiOiBLZXJuZWwgfT4gfCB1bmRlZmluZWQ7XG5sZXQga2VybmVsUGlja2VyOiBLZXJuZWxQaWNrZXIgfCB1bmRlZmluZWQ7XG5sZXQgZXhpc3RpbmdLZXJuZWxQaWNrZXI6IEV4aXN0aW5nS2VybmVsUGlja2VyIHwgdW5kZWZpbmVkO1xubGV0IHdzS2VybmVsUGlja2VyOiBXU0tlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcbmxldCBoeWRyb2dlblByb3ZpZGVyOiBIeWRyb2dlblByb3ZpZGVyIHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoKSB7XG4gIGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpO1xuICBsZXQgc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UgPSBmYWxzZTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UoXG4gICAgICBcIkh5ZHJvZ2VuLmxhbmd1YWdlTWFwcGluZ3NcIixcbiAgICAgICh7IG5ld1ZhbHVlLCBvbGRWYWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmIChza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSkge1xuICAgICAgICAgIHNraXBMYW5ndWFnZU1hcHBpbmdzQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0b3JlLnJ1bm5pbmdLZXJuZWxzLmxlbmd0aCAhPSAwKSB7XG4gICAgICAgICAgc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UgPSB0cnVlO1xuICAgICAgICAgIGF0b20uY29uZmlnLnNldChcIkh5ZHJvZ2VuLmxhbmd1YWdlTWFwcGluZ3NcIiwgb2xkVmFsdWUpO1xuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkh5ZHJvZ2VuXCIsIHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICBcImBsYW5ndWFnZU1hcHBpbmdzYCBjYW5ub3QgYmUgdXBkYXRlZCB3aGlsZSBrZXJuZWxzIGFyZSBydW5uaW5nXCIsXG4gICAgICAgICAgICBkaXNtaXNzYWJsZTogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gICk7XG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5zdGF0dXNCYXJEaXNhYmxlXCIsIChuZXdWYWx1ZSkgPT4ge1xuICAgICAgc3RvcmUuc2V0Q29uZmlnVmFsdWUoXCJIeWRyb2dlbi5zdGF0dXNCYXJEaXNhYmxlXCIsIEJvb2xlYW4obmV3VmFsdWUpKTtcbiAgICB9KSxcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwiSHlkcm9nZW4uc3RhdHVzQmFyS2VybmVsSW5mb1wiLCAobmV3VmFsdWUpID0+IHtcbiAgICAgIHN0b3JlLnNldENvbmZpZ1ZhbHVlKFwiSHlkcm9nZW4uc3RhdHVzQmFyS2VybmVsSW5mb1wiLCBCb29sZWFuKG5ld1ZhbHVlKSk7XG4gICAgfSlcbiAgKTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS5jb21tYW5kcy5hZGQ8XCJhdG9tLXRleHQtZWRpdG9yOm5vdChbbWluaV0pXCI+KFxuICAgICAgXCJhdG9tLXRleHQtZWRpdG9yOm5vdChbbWluaV0pXCIsXG4gICAgICB7XG4gICAgICAgIFwiaHlkcm9nZW46cnVuXCI6ICgpID0+IHJ1bigpLFxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1hbGxcIjogKCkgPT4gcnVuQWxsKCksXG4gICAgICAgIFwiaHlkcm9nZW46cnVuLWFsbC1hYm92ZVwiOiAoKSA9PiBydW5BbGxBYm92ZSgpLFxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1hbmQtbW92ZS1kb3duXCI6ICgpID0+IHJ1bih0cnVlKSxcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tY2VsbFwiOiAoKSA9PiBydW5DZWxsKCksXG4gICAgICAgIFwiaHlkcm9nZW46cnVuLWNlbGwtYW5kLW1vdmUtZG93blwiOiAoKSA9PiBydW5DZWxsKHRydWUpLFxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS13YXRjaGVzXCI6ICgpID0+IGF0b20ud29ya3NwYWNlLnRvZ2dsZShXQVRDSEVTX1VSSSksXG4gICAgICAgIFwiaHlkcm9nZW46dG9nZ2xlLW91dHB1dC1hcmVhXCI6ICgpID0+IGNvbW1hbmRzLnRvZ2dsZU91dHB1dE1vZGUoKSxcbiAgICAgICAgXCJoeWRyb2dlbjp0b2dnbGUta2VybmVsLW1vbml0b3JcIjogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGxhc3RJdGVtID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKTtcbiAgICAgICAgICBjb25zdCBsYXN0UGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGxhc3RJdGVtKTtcbiAgICAgICAgICBhd2FpdCBhdG9tLndvcmtzcGFjZS50b2dnbGUoS0VSTkVMX01PTklUT1JfVVJJKTtcbiAgICAgICAgICBpZiAobGFzdFBhbmUpIHtcbiAgICAgICAgICAgIGxhc3RQYW5lLmFjdGl2YXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImh5ZHJvZ2VuOnN0YXJ0LWxvY2FsLWtlcm5lbFwiOiAoKSA9PiBzdGFydFpNUUtlcm5lbCgpLFxuICAgICAgICBcImh5ZHJvZ2VuOmNvbm5lY3QtdG8tcmVtb3RlLWtlcm5lbFwiOiAoKSA9PiBjb25uZWN0VG9XU0tlcm5lbCgpLFxuICAgICAgICBcImh5ZHJvZ2VuOmNvbm5lY3QtdG8tZXhpc3Rpbmcta2VybmVsXCI6ICgpID0+IGNvbm5lY3RUb0V4aXN0aW5nS2VybmVsKCksXG4gICAgICAgIFwiaHlkcm9nZW46YWRkLXdhdGNoXCI6ICgpID0+IHtcbiAgICAgICAgICBpZiAoc3RvcmUua2VybmVsKSB7XG4gICAgICAgICAgICBzdG9yZS5rZXJuZWwud2F0Y2hlc1N0b3JlLmFkZFdhdGNoRnJvbUVkaXRvcihzdG9yZS5lZGl0b3IpO1xuICAgICAgICAgICAgb3Blbk9yU2hvd0RvY2soV0FUQ0hFU19VUkkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJoeWRyb2dlbjpyZW1vdmUtd2F0Y2hcIjogKCkgPT4ge1xuICAgICAgICAgIGlmIChzdG9yZS5rZXJuZWwpIHtcbiAgICAgICAgICAgIHN0b3JlLmtlcm5lbC53YXRjaGVzU3RvcmUucmVtb3ZlV2F0Y2goKTtcbiAgICAgICAgICAgIG9wZW5PclNob3dEb2NrKFdBVENIRVNfVVJJKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaHlkcm9nZW46dXBkYXRlLWtlcm5lbHNcIjogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IGtlcm5lbE1hbmFnZXIudXBkYXRlS2VybmVsU3BlY3MoKTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtaW5zcGVjdG9yXCI6ICgpID0+IGNvbW1hbmRzLnRvZ2dsZUluc3BlY3RvcihzdG9yZSksXG4gICAgICAgIFwiaHlkcm9nZW46aW50ZXJydXB0LWtlcm5lbFwiOiAoKSA9PlxuICAgICAgICAgIGhhbmRsZUtlcm5lbENvbW1hbmQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNvbW1hbmQ6IFwiaW50ZXJydXB0LWtlcm5lbFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlXG4gICAgICAgICAgKSxcbiAgICAgICAgXCJoeWRyb2dlbjpyZXN0YXJ0LWtlcm5lbFwiOiAoKSA9PlxuICAgICAgICAgIGhhbmRsZUtlcm5lbENvbW1hbmQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNvbW1hbmQ6IFwicmVzdGFydC1rZXJuZWxcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yZVxuICAgICAgICAgICksXG4gICAgICAgIFwiaHlkcm9nZW46c2h1dGRvd24ta2VybmVsXCI6ICgpID0+XG4gICAgICAgICAgaGFuZGxlS2VybmVsQ29tbWFuZChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29tbWFuZDogXCJzaHV0ZG93bi1rZXJuZWxcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yZVxuICAgICAgICAgICksXG4gICAgICAgIFwiaHlkcm9nZW46Y2xlYXItcmVzdWx0XCI6ICgpID0+IHJlc3VsdC5jbGVhclJlc3VsdChzdG9yZSksXG4gICAgICAgIFwiaHlkcm9nZW46ZXhwb3J0LW5vdGVib29rXCI6ICgpID0+IGV4cG9ydE5vdGVib29rKCksXG4gICAgICAgIFwiaHlkcm9nZW46Zm9sZC1jdXJyZW50LWNlbGxcIjogKCkgPT4gZm9sZEN1cnJlbnRDZWxsKCksXG4gICAgICAgIFwiaHlkcm9nZW46Zm9sZC1hbGwtYnV0LWN1cnJlbnQtY2VsbFwiOiAoKSA9PiBmb2xkQWxsQnV0Q3VycmVudENlbGwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjpjbGVhci1yZXN1bHRzXCI6ICgpID0+IHJlc3VsdC5jbGVhclJlc3VsdHMoc3RvcmUpLFxuICAgICAgfVxuICAgIClcbiAgKTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCB7XG4gICAgICBcImh5ZHJvZ2VuOmltcG9ydC1ub3RlYm9va1wiOiBpbXBvcnROb3RlYm9vayxcbiAgICB9KVxuICApO1xuXG4gIGlmIChhdG9tLmluRGV2TW9kZSgpKSB7XG4gICAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIHtcbiAgICAgICAgXCJoeWRyb2dlbjpob3QtcmVsb2FkLXBhY2thZ2VcIjogKCkgPT4gaG90UmVsb2FkUGFja2FnZSgpLFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVRleHRFZGl0b3IoKGVkaXRvcikgPT4ge1xuICAgICAgc3RvcmUudXBkYXRlRWRpdG9yKGVkaXRvcik7XG4gICAgfSlcbiAgKTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIGVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKCkgPT4ge1xuICAgICAgICAgIHN0b3JlLnNldEdyYW1tYXIoZWRpdG9yKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XG4gICAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICAgIGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKFxuICAgICAgICAgICAgXy5kZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlLnNldEdyYW1tYXIoZWRpdG9yKTtcbiAgICAgICAgICAgIH0sIDc1KVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICBlZGl0b3Iub25EaWRDaGFuZ2VUaXRsZSgobmV3VGl0bGUpID0+IHN0b3JlLmZvcmNlRWRpdG9yVXBkYXRlKCkpXG4gICAgICApO1xuICAgICAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoZWRpdG9yU3Vic2NyaXB0aW9ucyk7XG4gICAgfSlcbiAgKTtcbiAgaHlkcm9nZW5Qcm92aWRlciA9IG51bGw7XG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpKSA9PiB7XG4gICAgICBzd2l0Y2ggKHVyaSkge1xuICAgICAgICBjYXNlIElOU1BFQ1RPUl9VUkk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnNwZWN0b3JQYW5lKHN0b3JlKTtcblxuICAgICAgICBjYXNlIFdBVENIRVNfVVJJOlxuICAgICAgICAgIHJldHVybiBuZXcgV2F0Y2hlc1BhbmUoc3RvcmUpO1xuXG4gICAgICAgIGNhc2UgT1VUUFVUX0FSRUFfVVJJOlxuICAgICAgICAgIHJldHVybiBuZXcgT3V0cHV0UGFuZShzdG9yZSk7XG5cbiAgICAgICAgY2FzZSBLRVJORUxfTU9OSVRPUl9VUkk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBLZXJuZWxNb25pdG9yUGFuZShzdG9yZSk7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoaXB5bmJPcGVuZXIpKTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgLy8gRGVzdHJveSBhbnkgUGFuZXMgd2hlbiB0aGUgcGFja2FnZSBpcyBkZWFjdGl2YXRlZC5cbiAgICBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRQYW5lSXRlbXMoKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBpdGVtIGluc3RhbmNlb2YgSW5zcGVjdG9yUGFuZSB8fFxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBXYXRjaGVzUGFuZSB8fFxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBPdXRwdXRQYW5lIHx8XG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIEtlcm5lbE1vbml0b3JQYW5lXG4gICAgICAgICkge1xuICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KVxuICApO1xuICBhdXRvcnVuKCgpID0+IHtcbiAgICBlbWl0dGVyLmVtaXQoXCJkaWQtY2hhbmdlLWtlcm5lbFwiLCBzdG9yZS5rZXJuZWwpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XG4gIHN0b3JlLmRpc3Bvc2UoKTtcbn1cblxuLyotLS0tLS0tLS0tLS0tLSBTZXJ2aWNlIFByb3ZpZGVycyAtLS0tLS0tLS0tLS0tLSovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUh5ZHJvZ2VuKCkge1xuICBpZiAoIWh5ZHJvZ2VuUHJvdmlkZXIpIHtcbiAgICBoeWRyb2dlblByb3ZpZGVyID0gbmV3IEh5ZHJvZ2VuUHJvdmlkZXIoZW1pdHRlcik7XG4gIH1cblxuICByZXR1cm4gaHlkcm9nZW5Qcm92aWRlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVBdXRvY29tcGxldGVSZXN1bHRzKCkge1xuICByZXR1cm4gc2VydmljZXMucHJvdmlkZWQuYXV0b2NvbXBsZXRlLnByb3ZpZGVBdXRvY29tcGxldGVSZXN1bHRzKHN0b3JlKTtcbn1cblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbi8qLS0tLS0tLS0tLS0tLS0gU2VydmljZSBDb25zdW1lcnMgLS0tLS0tLS0tLS0tLS0qL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVBdXRvY29tcGxldGVXYXRjaEVkaXRvcihcbiAgd2F0Y2hFZGl0b3I6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnlcbikge1xuICByZXR1cm4gc2VydmljZXMuY29uc3VtZWQuYXV0b2NvbXBsZXRlLmNvbnN1bWUoc3RvcmUsIHdhdGNoRWRpdG9yKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBTdGF0dXNCYXIpIHtcbiAgcmV0dXJuIHNlcnZpY2VzLmNvbnN1bWVkLnN0YXR1c0Jhci5hZGRTdGF0dXNCYXIoXG4gICAgc3RvcmUsXG4gICAgc3RhdHVzQmFyLFxuICAgIGhhbmRsZUtlcm5lbENvbW1hbmRcbiAgKTtcbn1cblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5mdW5jdGlvbiBjb25uZWN0VG9FeGlzdGluZ0tlcm5lbCgpIHtcbiAgaWYgKCFleGlzdGluZ0tlcm5lbFBpY2tlcikge1xuICAgIGV4aXN0aW5nS2VybmVsUGlja2VyID0gbmV3IEV4aXN0aW5nS2VybmVsUGlja2VyKCk7XG4gIH1cblxuICBleGlzdGluZ0tlcm5lbFBpY2tlci50b2dnbGUoKTtcbn1cblxuaW50ZXJmYWNlIEtlcm5lbENvbW1hbmQge1xuICBjb21tYW5kOiBzdHJpbmc7XG4gIHBheWxvYWQ/OiBLZXJuZWxzcGVjTWV0YWRhdGEgfCBudWxsIHwgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVLZXJuZWxDb21tYW5kKFxuICB7IGNvbW1hbmQsIHBheWxvYWQgfTogS2VybmVsQ29tbWFuZCwgLy8gVE9ETyBwYXlsb2FkIGlzIG5vdCB1c2VkIVxuICB7IGtlcm5lbCwgbWFya2VycyB9OiBTdG9yZSB8IFN0b3JlTGlrZVxuKSB7XG4gIGxvZyhcImhhbmRsZUtlcm5lbENvbW1hbmQ6XCIsIFtcbiAgICB7IGNvbW1hbmQsIHBheWxvYWQgfSxcbiAgICB7IGtlcm5lbCwgbWFya2VycyB9LFxuICBdKTtcblxuICBpZiAoIWtlcm5lbCkge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBcIk5vIHJ1bm5pbmcga2VybmVsIGZvciBncmFtbWFyIG9yIGVkaXRvciBmb3VuZFwiO1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoY29tbWFuZCA9PT0gXCJpbnRlcnJ1cHQta2VybmVsXCIpIHtcbiAgICBrZXJuZWwuaW50ZXJydXB0KCk7XG4gIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gXCJyZXN0YXJ0LWtlcm5lbFwiKSB7XG4gICAga2VybmVsLnJlc3RhcnQoKTtcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcInNodXRkb3duLWtlcm5lbFwiKSB7XG4gICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcbiAgICB9XG4gICAgLy8gTm90ZSB0aGF0IGRlc3Ryb3kgYWxvbmUgZG9lcyBub3Qgc2h1dCBkb3duIGEgV1NLZXJuZWxcbiAgICBrZXJuZWwuc2h1dGRvd24oKTtcbiAgICBrZXJuZWwuZGVzdHJveSgpO1xuICB9IGVsc2UgaWYgKFxuICAgIGNvbW1hbmQgPT09IFwicmVuYW1lLWtlcm5lbFwiICYmXG4gICAga2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFdTS2VybmVsXG4gICkge1xuICAgIGtlcm5lbC50cmFuc3BvcnQucHJvbXB0UmVuYW1lKCk7XG4gIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gXCJkaXNjb25uZWN0LWtlcm5lbFwiKSB7XG4gICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcbiAgICB9XG4gICAga2VybmVsLmRlc3Ryb3koKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBydW4obW92ZURvd246IGJvb2xlYW4gPSBmYWxzZSkge1xuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XG4gIGlmICghZWRpdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L2h5ZHJvZ2VuL2lzc3Vlcy8xNDUyXG4gIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWRpdG9yLmVsZW1lbnQsIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y2FuY2VsXCIpO1xuICBjb25zdCBjb2RlQmxvY2sgPSBjb2RlTWFuYWdlci5maW5kQ29kZUJsb2NrKGVkaXRvcik7XG5cbiAgaWYgKCFjb2RlQmxvY2spIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlQmxvY2suY29kZTtcbiAgaWYgKGNvZGVOdWxsYWJsZSA9PT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB7IHJvdyB9ID0gY29kZUJsb2NrO1xuICBjb25zdCBjZWxsVHlwZSA9IGNvZGVNYW5hZ2VyLmdldE1ldGFkYXRhRm9yUm93KGVkaXRvciwgbmV3IFBvaW50KHJvdywgMCkpO1xuICBjb25zdCBjb2RlID1cbiAgICBjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiXG4gICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxuICAgICAgOiBjb2RlTnVsbGFibGU7XG5cbiAgaWYgKG1vdmVEb3duID09PSB0cnVlKSB7XG4gICAgY29kZU1hbmFnZXIubW92ZURvd24oZWRpdG9yLCByb3cpO1xuICB9XG5cbiAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcbiAgICByZXN1bHQuY3JlYXRlUmVzdWx0KHN0b3JlLCB7XG4gICAgICBjb2RlLFxuICAgICAgcm93LFxuICAgICAgY2VsbFR5cGUsXG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBydW5BbGwoYnJlYWtwb2ludHM/OiBBcnJheTxQb2ludD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIGNvbnN0IHsgZWRpdG9yLCBrZXJuZWwsIGdyYW1tYXIsIGZpbGVQYXRoIH0gPSBzdG9yZTtcbiAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAnXCJSdW4gQWxsXCIgaXMgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBmaWxlIHR5cGUhJ1xuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGVkaXRvciAmJiBrZXJuZWwpIHtcbiAgICBfcnVuQWxsKGVkaXRvciwga2VybmVsLCBicmVha3BvaW50cyk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBrZXJuZWxNYW5hZ2VyLnN0YXJ0S2VybmVsRm9yKGdyYW1tYXIsIGVkaXRvciwgZmlsZVBhdGgsIChrZXJuZWw6IEtlcm5lbCkgPT4ge1xuICAgIF9ydW5BbGwoZWRpdG9yLCBrZXJuZWwsIGJyZWFrcG9pbnRzKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9ydW5BbGwoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAga2VybmVsOiBLZXJuZWwsXG4gIGJyZWFrcG9pbnRzPzogQXJyYXk8UG9pbnQ+XG4pIHtcbiAgY29uc3QgY2VsbHMgPSBjb2RlTWFuYWdlci5nZXRDZWxscyhlZGl0b3IsIGJyZWFrcG9pbnRzKTtcblxuICBmb3IgKGNvbnN0IGNlbGwgb2YgY2VsbHMpIHtcbiAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNlbGw7XG4gICAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcbiAgICBpZiAoY29kZU51bGxhYmxlID09PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qgcm93ID0gY29kZU1hbmFnZXIuZXNjYXBlQmxhbmtSb3dzKFxuICAgICAgZWRpdG9yLFxuICAgICAgc3RhcnQucm93LFxuICAgICAgY29kZU1hbmFnZXIuZ2V0RXNjYXBlQmxhbmtSb3dzRW5kUm93KGVkaXRvciwgZW5kKVxuICAgICk7XG4gICAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcbiAgICBjb25zdCBjb2RlID1cbiAgICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcbiAgICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcbiAgICAgICAgOiBjb2RlTnVsbGFibGU7XG4gICAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcbiAgICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcbiAgICAgICAgY29kZSxcbiAgICAgICAgcm93LFxuICAgICAgICBjZWxsVHlwZSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJ1bkFsbEFib3ZlKCkge1xuICBjb25zdCB7IGVkaXRvciwga2VybmVsLCBncmFtbWFyLCBmaWxlUGF0aCB9ID0gc3RvcmU7XG4gIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgJ1wiUnVuIEFsbCBBYm92ZVwiIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHRoaXMgZmlsZSB0eXBlISdcbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChlZGl0b3IgJiYga2VybmVsKSB7XG4gICAgX3J1bkFsbEFib3ZlKGVkaXRvciwga2VybmVsKTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKGtlcm5lbDogS2VybmVsKSA9PiB7XG4gICAgX3J1bkFsbEFib3ZlKGVkaXRvciwga2VybmVsKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9ydW5BbGxBYm92ZShlZGl0b3I6IFRleHRFZGl0b3IsIGtlcm5lbDogS2VybmVsKSB7XG4gIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xuICBjdXJzb3IuY29sdW1uID0gZWRpdG9yLmdldEJ1ZmZlcigpLmxpbmVMZW5ndGhGb3JSb3coY3Vyc29yLnJvdyk7XG4gIGNvbnN0IGJyZWFrcG9pbnRzID0gY29kZU1hbmFnZXIuZ2V0QnJlYWtwb2ludHMoZWRpdG9yKTtcbiAgYnJlYWtwb2ludHMucHVzaChjdXJzb3IpO1xuICBjb25zdCBjZWxscyA9IGNvZGVNYW5hZ2VyLmdldENlbGxzKGVkaXRvciwgYnJlYWtwb2ludHMpO1xuXG4gIGZvciAoY29uc3QgY2VsbCBvZiBjZWxscykge1xuICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY2VsbDtcbiAgICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xuICAgIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcbiAgICAgIGVkaXRvcixcbiAgICAgIHN0YXJ0LnJvdyxcbiAgICAgIGNvZGVNYW5hZ2VyLmdldEVzY2FwZUJsYW5rUm93c0VuZFJvdyhlZGl0b3IsIGVuZClcbiAgICApO1xuICAgIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XG5cbiAgICBpZiAoY29kZU51bGxhYmxlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBjb2RlID1cbiAgICAgICAgY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIlxuICAgICAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXG4gICAgICAgICAgOiBjb2RlTnVsbGFibGU7XG4gICAgICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xuICAgICAgICByZXN1bHQuY3JlYXRlUmVzdWx0KHN0b3JlLCB7XG4gICAgICAgICAgY29kZSxcbiAgICAgICAgICByb3csXG4gICAgICAgICAgY2VsbFR5cGUsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNlbGwuY29udGFpbnNQb2ludChjdXJzb3IpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcnVuQ2VsbChtb3ZlRG93bjogYm9vbGVhbiA9IGZhbHNlKSB7XG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcbiAgaWYgKCFlZGl0b3IpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL250ZXJhY3QvaHlkcm9nZW4vaXNzdWVzLzE0NTJcbiAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChlZGl0b3IuZWxlbWVudCwgXCJhdXRvY29tcGxldGUtcGx1czpjYW5jZWxcIik7XG4gIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY29kZU1hbmFnZXIuZ2V0Q3VycmVudENlbGwoZWRpdG9yKTtcbiAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcbiAgaWYgKGNvZGVOdWxsYWJsZSA9PT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByb3cgPSBjb2RlTWFuYWdlci5lc2NhcGVCbGFua1Jvd3MoXG4gICAgZWRpdG9yLFxuICAgIHN0YXJ0LnJvdyxcbiAgICBjb2RlTWFuYWdlci5nZXRFc2NhcGVCbGFua1Jvd3NFbmRSb3coZWRpdG9yLCBlbmQpXG4gICk7XG4gIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XG4gIGNvbnN0IGNvZGUgPVxuICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcbiAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXG4gICAgICA6IGNvZGVOdWxsYWJsZTtcblxuICBpZiAobW92ZURvd24gPT09IHRydWUpIHtcbiAgICBjb2RlTWFuYWdlci5tb3ZlRG93bihlZGl0b3IsIHJvdyk7XG4gIH1cblxuICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xuICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcbiAgICAgIGNvZGUsXG4gICAgICByb3csXG4gICAgICBjZWxsVHlwZSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZvbGRDdXJyZW50Q2VsbCgpIHtcbiAgY29uc3QgZWRpdG9yID0gc3RvcmUuZWRpdG9yO1xuICBpZiAoIWVkaXRvcikge1xuICAgIHJldHVybjtcbiAgfVxuICBjb2RlTWFuYWdlci5mb2xkQ3VycmVudENlbGwoZWRpdG9yKTtcbn1cblxuZnVuY3Rpb24gZm9sZEFsbEJ1dEN1cnJlbnRDZWxsKCkge1xuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XG4gIGlmICghZWRpdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvZGVNYW5hZ2VyLmZvbGRBbGxCdXRDdXJyZW50Q2VsbChlZGl0b3IpO1xufVxuXG5mdW5jdGlvbiBzdGFydFpNUUtlcm5lbCgpIHtcbiAga2VybmVsTWFuYWdlclxuICAgIC5nZXRBbGxLZXJuZWxTcGVjc0ZvckdyYW1tYXIoc3RvcmUuZ3JhbW1hcilcbiAgICAudGhlbigoa2VybmVsU3BlY3MpID0+IHtcbiAgICAgIGlmIChrZXJuZWxQaWNrZXIpIHtcbiAgICAgICAga2VybmVsUGlja2VyLmtlcm5lbFNwZWNzID0ga2VybmVsU3BlY3M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXJuZWxQaWNrZXIgPSBuZXcgS2VybmVsUGlja2VyKGtlcm5lbFNwZWNzKTtcblxuICAgICAgICBrZXJuZWxQaWNrZXIub25Db25maXJtZWQgPSAoa2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhKSA9PiB7XG4gICAgICAgICAgY29uc3QgeyBlZGl0b3IsIGdyYW1tYXIsIGZpbGVQYXRoLCBtYXJrZXJzIH0gPSBzdG9yZTtcbiAgICAgICAgICBpZiAoIWVkaXRvciB8fCAhZ3JhbW1hciB8fCAhZmlsZVBhdGggfHwgIW1hcmtlcnMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWFya2Vycy5jbGVhcigpO1xuICAgICAgICAgIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWwoa2VybmVsU3BlYywgZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGtlcm5lbFBpY2tlci50b2dnbGUoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29ubmVjdFRvV1NLZXJuZWwoKSB7XG4gIGlmICghd3NLZXJuZWxQaWNrZXIpIHtcbiAgICB3c0tlcm5lbFBpY2tlciA9IG5ldyBXU0tlcm5lbFBpY2tlcigodHJhbnNwb3J0OiBXU0tlcm5lbCkgPT4ge1xuICAgICAgY29uc3Qga2VybmVsID0gbmV3IEtlcm5lbCh0cmFuc3BvcnQpO1xuICAgICAgY29uc3QgeyBlZGl0b3IsIGdyYW1tYXIsIGZpbGVQYXRoLCBtYXJrZXJzIH0gPSBzdG9yZTtcbiAgICAgIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCB8fCAhbWFya2Vycykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBtYXJrZXJzLmNsZWFyKCk7XG4gICAgICBpZiAoa2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFpNUUtlcm5lbCkge1xuICAgICAgICBrZXJuZWwuZGVzdHJveSgpO1xuICAgICAgfVxuICAgICAgc3RvcmUubmV3S2VybmVsKGtlcm5lbCwgZmlsZVBhdGgsIGVkaXRvciwgZ3JhbW1hcik7XG4gICAgfSk7XG4gIH1cblxuICB3c0tlcm5lbFBpY2tlci50b2dnbGUoKGtlcm5lbFNwZWM6IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT5cbiAgICBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyKGtlcm5lbFNwZWMsIHN0b3JlLmdyYW1tYXIpXG4gICk7XG59XG5cbi8vIEFjY2VwdHMgc3RvcmUgYXMgYW4gYXJnXG5mdW5jdGlvbiBjaGVja0Zvcktlcm5lbChcbiAge1xuICAgIGVkaXRvcixcbiAgICBncmFtbWFyLFxuICAgIGZpbGVQYXRoLFxuICAgIGtlcm5lbCxcbiAgfToge1xuICAgIGVkaXRvcjogVGV4dEVkaXRvcjtcbiAgICBncmFtbWFyOiBHcmFtbWFyO1xuICAgIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAga2VybmVsPzogS2VybmVsO1xuICB9LFxuICBjYWxsYmFjazogKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkXG4pIHtcbiAgaWYgKCFmaWxlUGF0aCB8fCAhZ3JhbW1hcikge1xuICAgIHJldHVybiBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICBcIlRoZSBsYW5ndWFnZSBncmFtbWFyIG11c3QgYmUgc2V0IGluIG9yZGVyIHRvIHN0YXJ0IGEga2VybmVsLiBUaGUgZWFzaWVzdCB3YXkgdG8gZG8gdGhpcyBpcyB0byBzYXZlIHRoZSBmaWxlLlwiXG4gICAgKTtcbiAgfVxuXG4gIGlmIChrZXJuZWwpIHtcbiAgICBjYWxsYmFjayhrZXJuZWwpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKG5ld0tlcm5lbDogS2VybmVsKSA9PlxuICAgIGNhbGxiYWNrKG5ld0tlcm5lbClcbiAgKTtcbn1cbiJdfQ==