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
const export_notebook_1 = __importDefault(require("./export-notebook"));
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
        "hydrogen:export-notebook": () => export_notebook_1.default(),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFPYztBQUVkLG9EQUF1QjtBQUN2QiwrQkFBK0I7QUFFL0Isa0VBQThDO0FBQzlDLDhEQUEwQztBQUMxQyxzRUFBNkM7QUFDN0MsNEVBQXVEO0FBQ3ZELHNEQUE4QjtBQUM5Qiw4REFBcUM7QUFDckMsNERBQW1DO0FBQ25DLHNEQUE4QjtBQUM5QixvRUFBMkM7QUFDM0MsMEVBQWdEO0FBQ2hELHNGQUE0RDtBQUM1RCx1RkFBOEQ7QUFDOUQsb0RBQWtEO0FBQ2xELHNFQUE2QztBQUM3QywwREFBa0M7QUFDbEMscURBQXVDO0FBQ3ZDLDREQUE4QztBQUM5QyxpREFBbUM7QUFFbkMsbUNBV2lCO0FBQ2pCLHdFQUErQztBQUMvQyx1REFBZ0U7QUFHbkQsUUFBQSxNQUFNLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLENBQUM7QUFDcEMsSUFBSSxPQUFpRSxDQUFDO0FBQ3RFLElBQUksWUFBc0MsQ0FBQztBQUMzQyxJQUFJLG9CQUFzRCxDQUFDO0FBQzNELElBQUksY0FBMEMsQ0FBQztBQUMvQyxJQUFJLGdCQUE4QyxDQUFDO0FBRW5ELFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxHQUFHLElBQUksY0FBTyxFQUFFLENBQUM7SUFDeEIsSUFBSSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7SUFDdkMsZUFBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUNyQiwyQkFBMkIsRUFDM0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO1FBQ3pCLElBQUksMEJBQTBCLEVBQUU7WUFDOUIsMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLE9BQU87U0FDUjtRQUVELElBQUksZUFBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLElBQUks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Q0osQ0FBQztBQUdELFNBQVMsY0FBYyxDQUNyQixFQUNFLE1BQU0sRUFDTixPQUFPLEVBQ1AsUUFBUSxFQUNSLE1BQU0sR0FNUCxFQUNELFFBQWtDO0lBRWxDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDekIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FDaEMsOEdBQThHLENBQy9HLENBQUM7S0FDSDtJQUVELElBQUksTUFBTSxFQUFFO1FBQ1YsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pCLE9BQU87S0FDUjtJQUVELHdCQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsU0FBaUIsRUFBRSxFQUFFLENBQzVFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FDcEIsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBFbWl0dGVyLFxuICBDb21wb3NpdGVEaXNwb3NhYmxlLFxuICBEaXNwb3NhYmxlLFxuICBQb2ludCxcbiAgVGV4dEVkaXRvcixcbiAgR3JhbW1hcixcbn0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IFN0YXR1c0JhciB9IGZyb20gXCJhdG9tL3N0YXR1cy1iYXJcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IGF1dG9ydW4gfSBmcm9tIFwibW9ieFwiO1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IEluc3BlY3RvclBhbmUgZnJvbSBcIi4vcGFuZXMvaW5zcGVjdG9yXCI7XG5pbXBvcnQgV2F0Y2hlc1BhbmUgZnJvbSBcIi4vcGFuZXMvd2F0Y2hlc1wiO1xuaW1wb3J0IE91dHB1dFBhbmUgZnJvbSBcIi4vcGFuZXMvb3V0cHV0LWFyZWFcIjtcbmltcG9ydCBLZXJuZWxNb25pdG9yUGFuZSBmcm9tIFwiLi9wYW5lcy9rZXJuZWwtbW9uaXRvclwiO1xuaW1wb3J0IENvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBaTVFLZXJuZWwgZnJvbSBcIi4vem1xLWtlcm5lbFwiO1xuaW1wb3J0IFdTS2VybmVsIGZyb20gXCIuL3dzLWtlcm5lbFwiO1xuaW1wb3J0IEtlcm5lbCBmcm9tIFwiLi9rZXJuZWxcIjtcbmltcG9ydCBLZXJuZWxQaWNrZXIgZnJvbSBcIi4va2VybmVsLXBpY2tlclwiO1xuaW1wb3J0IFdTS2VybmVsUGlja2VyIGZyb20gXCIuL3dzLWtlcm5lbC1waWNrZXJcIjtcbmltcG9ydCBFeGlzdGluZ0tlcm5lbFBpY2tlciBmcm9tIFwiLi9leGlzdGluZy1rZXJuZWwtcGlja2VyXCI7XG5pbXBvcnQgSHlkcm9nZW5Qcm92aWRlciBmcm9tIFwiLi9wbHVnaW4tYXBpL2h5ZHJvZ2VuLXByb3ZpZGVyXCI7XG5pbXBvcnQgc3RvcmUsIHsgU3RvcmUsIFN0b3JlTGlrZSB9IGZyb20gXCIuL3N0b3JlXCI7XG5pbXBvcnQga2VybmVsTWFuYWdlciBmcm9tIFwiLi9rZXJuZWwtbWFuYWdlclwiO1xuaW1wb3J0IHNlcnZpY2VzIGZyb20gXCIuL3NlcnZpY2VzXCI7XG5pbXBvcnQgKiBhcyBjb21tYW5kcyBmcm9tIFwiLi9jb21tYW5kc1wiO1xuaW1wb3J0ICogYXMgY29kZU1hbmFnZXIgZnJvbSBcIi4vY29kZS1tYW5hZ2VyXCI7XG5pbXBvcnQgKiBhcyByZXN1bHQgZnJvbSBcIi4vcmVzdWx0XCI7XG5pbXBvcnQgdHlwZSBNYXJrZXJTdG9yZSBmcm9tIFwiLi9zdG9yZS9tYXJrZXJzXCI7XG5pbXBvcnQge1xuICBsb2csXG4gIHJlYWN0RmFjdG9yeSxcbiAgaXNNdWx0aWxhbmd1YWdlR3JhbW1hcixcbiAgSU5TUEVDVE9SX1VSSSxcbiAgV0FUQ0hFU19VUkksXG4gIE9VVFBVVF9BUkVBX1VSSSxcbiAgS0VSTkVMX01PTklUT1JfVVJJLFxuICBob3RSZWxvYWRQYWNrYWdlLFxuICBvcGVuT3JTaG93RG9jayxcbiAga2VybmVsU3BlY1Byb3ZpZGVzR3JhbW1hcixcbn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBleHBvcnROb3RlYm9vayBmcm9tIFwiLi9leHBvcnQtbm90ZWJvb2tcIjtcbmltcG9ydCB7IGltcG9ydE5vdGVib29rLCBpcHluYk9wZW5lciB9IGZyb20gXCIuL2ltcG9ydC1ub3RlYm9va1wiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IENvbmZpZy5zY2hlbWE7XG5sZXQgZW1pdHRlcjogRW1pdHRlcjx7fSwgeyBcImRpZC1jaGFuZ2Uta2VybmVsXCI6IEtlcm5lbCB9PiB8IHVuZGVmaW5lZDtcbmxldCBrZXJuZWxQaWNrZXI6IEtlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcbmxldCBleGlzdGluZ0tlcm5lbFBpY2tlcjogRXhpc3RpbmdLZXJuZWxQaWNrZXIgfCB1bmRlZmluZWQ7XG5sZXQgd3NLZXJuZWxQaWNrZXI6IFdTS2VybmVsUGlja2VyIHwgdW5kZWZpbmVkO1xubGV0IGh5ZHJvZ2VuUHJvdmlkZXI6IEh5ZHJvZ2VuUHJvdmlkZXIgfCB1bmRlZmluZWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcbiAgZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gIGxldCBza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSA9IGZhbHNlO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZShcbiAgICAgIFwiSHlkcm9nZW4ubGFuZ3VhZ2VNYXBwaW5nc1wiLFxuICAgICAgKHsgbmV3VmFsdWUsIG9sZFZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKHNraXBMYW5ndWFnZU1hcHBpbmdzQ2hhbmdlKSB7XG4gICAgICAgICAgc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RvcmUucnVubmluZ0tlcm5lbHMubGVuZ3RoICE9IDApIHtcbiAgICAgICAgICBza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSA9IHRydWU7XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KFwiSHlkcm9nZW4ubGFuZ3VhZ2VNYXBwaW5nc1wiLCBvbGRWYWx1ZSk7XG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiSHlkcm9nZW5cIiwge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICAgIFwiYGxhbmd1YWdlTWFwcGluZ3NgIGNhbm5vdCBiZSB1cGRhdGVkIHdoaWxlIGtlcm5lbHMgYXJlIHJ1bm5pbmdcIixcbiAgICAgICAgICAgIGRpc21pc3NhYmxlOiBmYWxzZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgKTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIkh5ZHJvZ2VuLnN0YXR1c0JhckRpc2FibGVcIiwgKG5ld1ZhbHVlKSA9PiB7XG4gICAgICBzdG9yZS5zZXRDb25maWdWYWx1ZShcIkh5ZHJvZ2VuLnN0YXR1c0JhckRpc2FibGVcIiwgQm9vbGVhbihuZXdWYWx1ZSkpO1xuICAgIH0pLFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5zdGF0dXNCYXJLZXJuZWxJbmZvXCIsIChuZXdWYWx1ZSkgPT4ge1xuICAgICAgc3RvcmUuc2V0Q29uZmlnVmFsdWUoXCJIeWRyb2dlbi5zdGF0dXNCYXJLZXJuZWxJbmZvXCIsIEJvb2xlYW4obmV3VmFsdWUpKTtcbiAgICB9KVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLmNvbW1hbmRzLmFkZDxcImF0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSlcIj4oXG4gICAgICBcImF0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSlcIixcbiAgICAgIHtcbiAgICAgICAgXCJoeWRyb2dlbjpydW5cIjogKCkgPT4gcnVuKCksXG4gICAgICAgIFwiaHlkcm9nZW46cnVuLWFsbFwiOiAoKSA9PiBydW5BbGwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tYWxsLWFib3ZlXCI6ICgpID0+IHJ1bkFsbEFib3ZlKCksXG4gICAgICAgIFwiaHlkcm9nZW46cnVuLWFuZC1tb3ZlLWRvd25cIjogKCkgPT4gcnVuKHRydWUpLFxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1jZWxsXCI6ICgpID0+IHJ1bkNlbGwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tY2VsbC1hbmQtbW92ZS1kb3duXCI6ICgpID0+IHJ1bkNlbGwodHJ1ZSksXG4gICAgICAgIFwiaHlkcm9nZW46dG9nZ2xlLXdhdGNoZXNcIjogKCkgPT4gYXRvbS53b3Jrc3BhY2UudG9nZ2xlKFdBVENIRVNfVVJJKSxcbiAgICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtb3V0cHV0LWFyZWFcIjogKCkgPT4gY29tbWFuZHMudG9nZ2xlT3V0cHV0TW9kZSgpLFxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS1rZXJuZWwtbW9uaXRvclwiOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbGFzdEl0ZW0gPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpO1xuICAgICAgICAgIGNvbnN0IGxhc3RQYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0obGFzdEl0ZW0pO1xuICAgICAgICAgIGF3YWl0IGF0b20ud29ya3NwYWNlLnRvZ2dsZShLRVJORUxfTU9OSVRPUl9VUkkpO1xuICAgICAgICAgIGlmIChsYXN0UGFuZSkge1xuICAgICAgICAgICAgbGFzdFBhbmUuYWN0aXZhdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaHlkcm9nZW46c3RhcnQtbG9jYWwta2VybmVsXCI6ICgpID0+IHN0YXJ0Wk1RS2VybmVsKCksXG4gICAgICAgIFwiaHlkcm9nZW46Y29ubmVjdC10by1yZW1vdGUta2VybmVsXCI6ICgpID0+IGNvbm5lY3RUb1dTS2VybmVsKCksXG4gICAgICAgIFwiaHlkcm9nZW46Y29ubmVjdC10by1leGlzdGluZy1rZXJuZWxcIjogKCkgPT4gY29ubmVjdFRvRXhpc3RpbmdLZXJuZWwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjphZGQtd2F0Y2hcIjogKCkgPT4ge1xuICAgICAgICAgIGlmIChzdG9yZS5rZXJuZWwpIHtcbiAgICAgICAgICAgIHN0b3JlLmtlcm5lbC53YXRjaGVzU3RvcmUuYWRkV2F0Y2hGcm9tRWRpdG9yKHN0b3JlLmVkaXRvcik7XG4gICAgICAgICAgICBvcGVuT3JTaG93RG9jayhXQVRDSEVTX1VSSSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImh5ZHJvZ2VuOnJlbW92ZS13YXRjaFwiOiAoKSA9PiB7XG4gICAgICAgICAgaWYgKHN0b3JlLmtlcm5lbCkge1xuICAgICAgICAgICAgc3RvcmUua2VybmVsLndhdGNoZXNTdG9yZS5yZW1vdmVXYXRjaCgpO1xuICAgICAgICAgICAgb3Blbk9yU2hvd0RvY2soV0FUQ0hFU19VUkkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJoeWRyb2dlbjp1cGRhdGUta2VybmVsc1wiOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQga2VybmVsTWFuYWdlci51cGRhdGVLZXJuZWxTcGVjcygpO1xuICAgICAgICB9LFxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS1pbnNwZWN0b3JcIjogKCkgPT4gY29tbWFuZHMudG9nZ2xlSW5zcGVjdG9yKHN0b3JlKSxcbiAgICAgICAgXCJoeWRyb2dlbjppbnRlcnJ1cHQta2VybmVsXCI6ICgpID0+XG4gICAgICAgICAgaGFuZGxlS2VybmVsQ29tbWFuZChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29tbWFuZDogXCJpbnRlcnJ1cHQta2VybmVsXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmVcbiAgICAgICAgICApLFxuICAgICAgICBcImh5ZHJvZ2VuOnJlc3RhcnQta2VybmVsXCI6ICgpID0+XG4gICAgICAgICAgaGFuZGxlS2VybmVsQ29tbWFuZChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29tbWFuZDogXCJyZXN0YXJ0LWtlcm5lbFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlXG4gICAgICAgICAgKSxcbiAgICAgICAgXCJoeWRyb2dlbjpzaHV0ZG93bi1rZXJuZWxcIjogKCkgPT5cbiAgICAgICAgICBoYW5kbGVLZXJuZWxDb21tYW5kKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjb21tYW5kOiBcInNodXRkb3duLWtlcm5lbFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlXG4gICAgICAgICAgKSxcbiAgICAgICAgXCJoeWRyb2dlbjpjbGVhci1yZXN1bHRcIjogKCkgPT4gcmVzdWx0LmNsZWFyUmVzdWx0KHN0b3JlKSxcbiAgICAgICAgXCJoeWRyb2dlbjpleHBvcnQtbm90ZWJvb2tcIjogKCkgPT4gZXhwb3J0Tm90ZWJvb2soKSxcbiAgICAgICAgXCJoeWRyb2dlbjpmb2xkLWN1cnJlbnQtY2VsbFwiOiAoKSA9PiBmb2xkQ3VycmVudENlbGwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjpmb2xkLWFsbC1idXQtY3VycmVudC1jZWxsXCI6ICgpID0+IGZvbGRBbGxCdXRDdXJyZW50Q2VsbCgpLFxuICAgICAgICBcImh5ZHJvZ2VuOmNsZWFyLXJlc3VsdHNcIjogKCkgPT4gcmVzdWx0LmNsZWFyUmVzdWx0cyhzdG9yZSksXG4gICAgICB9XG4gICAgKVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIHtcbiAgICAgIFwiaHlkcm9nZW46aW1wb3J0LW5vdGVib29rXCI6IGltcG9ydE5vdGVib29rLFxuICAgIH0pXG4gICk7XG5cbiAgaWYgKGF0b20uaW5EZXZNb2RlKCkpIHtcbiAgICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwge1xuICAgICAgICBcImh5ZHJvZ2VuOmhvdC1yZWxvYWQtcGFja2FnZVwiOiAoKSA9PiBob3RSZWxvYWRQYWNrYWdlKCksXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlVGV4dEVkaXRvcigoZWRpdG9yKSA9PiB7XG4gICAgICBzdG9yZS51cGRhdGVFZGl0b3IoZWRpdG9yKTtcbiAgICB9KVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcikgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoKSA9PiB7XG4gICAgICAgICAgc3RvcmUuc2V0R3JhbW1hcihlZGl0b3IpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcbiAgICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgICAgZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXG4gICAgICAgICAgICBfLmRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgICAgICAgc3RvcmUuc2V0R3JhbW1hcihlZGl0b3IpO1xuICAgICAgICAgICAgfSwgNzUpXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIGVkaXRvci5vbkRpZENoYW5nZVRpdGxlKChuZXdUaXRsZSkgPT4gc3RvcmUuZm9yY2VFZGl0b3JVcGRhdGUoKSlcbiAgICAgICk7XG4gICAgICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChlZGl0b3JTdWJzY3JpcHRpb25zKTtcbiAgICB9KVxuICApO1xuICBoeWRyb2dlblByb3ZpZGVyID0gbnVsbDtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKCh1cmkpID0+IHtcbiAgICAgIHN3aXRjaCAodXJpKSB7XG4gICAgICAgIGNhc2UgSU5TUEVDVE9SX1VSSTpcbiAgICAgICAgICByZXR1cm4gbmV3IEluc3BlY3RvclBhbmUoc3RvcmUpO1xuXG4gICAgICAgIGNhc2UgV0FUQ0hFU19VUkk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBXYXRjaGVzUGFuZShzdG9yZSk7XG5cbiAgICAgICAgY2FzZSBPVVRQVVRfQVJFQV9VUkk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBPdXRwdXRQYW5lKHN0b3JlKTtcblxuICAgICAgICBjYXNlIEtFUk5FTF9NT05JVE9SX1VSSTpcbiAgICAgICAgICByZXR1cm4gbmV3IEtlcm5lbE1vbml0b3JQYW5lKHN0b3JlKTtcbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICk7XG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcihpcHluYk9wZW5lcikpO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAvLyBEZXN0cm95IGFueSBQYW5lcyB3aGVuIHRoZSBwYWNrYWdlIGlzIGRlYWN0aXZhdGVkLlxuICAgIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGF0b20ud29ya3NwYWNlLmdldFBhbmVJdGVtcygpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBJbnNwZWN0b3JQYW5lIHx8XG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIFdhdGNoZXNQYW5lIHx8XG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIE91dHB1dFBhbmUgfHxcbiAgICAgICAgICBpdGVtIGluc3RhbmNlb2YgS2VybmVsTW9uaXRvclBhbmVcbiAgICAgICAgKSB7XG4gICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pXG4gICk7XG4gIGF1dG9ydW4oKCkgPT4ge1xuICAgIGVtaXR0ZXIuZW1pdChcImRpZC1jaGFuZ2Uta2VybmVsXCIsIHN0b3JlLmtlcm5lbCk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgc3RvcmUuZGlzcG9zZSgpO1xufVxuXG4vKi0tLS0tLS0tLS0tLS0tIFNlcnZpY2UgUHJvdmlkZXJzIC0tLS0tLS0tLS0tLS0tKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlSHlkcm9nZW4oKSB7XG4gIGlmICghaHlkcm9nZW5Qcm92aWRlcikge1xuICAgIGh5ZHJvZ2VuUHJvdmlkZXIgPSBuZXcgSHlkcm9nZW5Qcm92aWRlcihlbWl0dGVyKTtcbiAgfVxuXG4gIHJldHVybiBoeWRyb2dlblByb3ZpZGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUF1dG9jb21wbGV0ZVJlc3VsdHMoKSB7XG4gIHJldHVybiBzZXJ2aWNlcy5wcm92aWRlZC5hdXRvY29tcGxldGUucHJvdmlkZUF1dG9jb21wbGV0ZVJlc3VsdHMoc3RvcmUpO1xufVxuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuLyotLS0tLS0tLS0tLS0tLSBTZXJ2aWNlIENvbnN1bWVycyAtLS0tLS0tLS0tLS0tLSovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUF1dG9jb21wbGV0ZVdhdGNoRWRpdG9yKFxuICB3YXRjaEVkaXRvcjogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueVxuKSB7XG4gIHJldHVybiBzZXJ2aWNlcy5jb25zdW1lZC5hdXRvY29tcGxldGUuY29uc3VtZShzdG9yZSwgd2F0Y2hFZGl0b3IpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IFN0YXR1c0Jhcikge1xuICByZXR1cm4gc2VydmljZXMuY29uc3VtZWQuc3RhdHVzQmFyLmFkZFN0YXR1c0JhcihcbiAgICBzdG9yZSxcbiAgICBzdGF0dXNCYXIsXG4gICAgaGFuZGxlS2VybmVsQ29tbWFuZFxuICApO1xufVxuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cbmZ1bmN0aW9uIGNvbm5lY3RUb0V4aXN0aW5nS2VybmVsKCkge1xuICBpZiAoIWV4aXN0aW5nS2VybmVsUGlja2VyKSB7XG4gICAgZXhpc3RpbmdLZXJuZWxQaWNrZXIgPSBuZXcgRXhpc3RpbmdLZXJuZWxQaWNrZXIoKTtcbiAgfVxuXG4gIGV4aXN0aW5nS2VybmVsUGlja2VyLnRvZ2dsZSgpO1xufVxuXG5pbnRlcmZhY2UgS2VybmVsQ29tbWFuZCB7XG4gIGNvbW1hbmQ6IHN0cmluZztcbiAgcGF5bG9hZD86IEtlcm5lbHNwZWNNZXRhZGF0YSB8IG51bGwgfCB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUtlcm5lbENvbW1hbmQoXG4gIHsgY29tbWFuZCwgcGF5bG9hZCB9OiBLZXJuZWxDb21tYW5kLCAvLyBUT0RPIHBheWxvYWQgaXMgbm90IHVzZWQhXG4gIHsga2VybmVsLCBtYXJrZXJzIH06IFN0b3JlIHwgU3RvcmVMaWtlXG4pIHtcbiAgbG9nKFwiaGFuZGxlS2VybmVsQ29tbWFuZDpcIiwgW1xuICAgIHsgY29tbWFuZCwgcGF5bG9hZCB9LFxuICAgIHsga2VybmVsLCBtYXJrZXJzIH0sXG4gIF0pO1xuXG4gIGlmICgha2VybmVsKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IFwiTm8gcnVubmluZyBrZXJuZWwgZm9yIGdyYW1tYXIgb3IgZWRpdG9yIGZvdW5kXCI7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG1lc3NhZ2UpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChjb21tYW5kID09PSBcImludGVycnVwdC1rZXJuZWxcIikge1xuICAgIGtlcm5lbC5pbnRlcnJ1cHQoKTtcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcInJlc3RhcnQta2VybmVsXCIpIHtcbiAgICBrZXJuZWwucmVzdGFydCgpO1xuICB9IGVsc2UgaWYgKGNvbW1hbmQgPT09IFwic2h1dGRvd24ta2VybmVsXCIpIHtcbiAgICBpZiAobWFya2Vycykge1xuICAgICAgbWFya2Vycy5jbGVhcigpO1xuICAgIH1cbiAgICAvLyBOb3RlIHRoYXQgZGVzdHJveSBhbG9uZSBkb2VzIG5vdCBzaHV0IGRvd24gYSBXU0tlcm5lbFxuICAgIGtlcm5lbC5zaHV0ZG93bigpO1xuICAgIGtlcm5lbC5kZXN0cm95KCk7XG4gIH0gZWxzZSBpZiAoXG4gICAgY29tbWFuZCA9PT0gXCJyZW5hbWUta2VybmVsXCIgJiZcbiAgICBrZXJuZWwudHJhbnNwb3J0IGluc3RhbmNlb2YgV1NLZXJuZWxcbiAgKSB7XG4gICAga2VybmVsLnRyYW5zcG9ydC5wcm9tcHRSZW5hbWUoKTtcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcImRpc2Nvbm5lY3Qta2VybmVsXCIpIHtcbiAgICBpZiAobWFya2Vycykge1xuICAgICAgbWFya2Vycy5jbGVhcigpO1xuICAgIH1cbiAgICBrZXJuZWwuZGVzdHJveSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJ1bihtb3ZlRG93bjogYm9vbGVhbiA9IGZhbHNlKSB7XG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcbiAgaWYgKCFlZGl0b3IpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL250ZXJhY3QvaHlkcm9nZW4vaXNzdWVzLzE0NTJcbiAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChlZGl0b3IuZWxlbWVudCwgXCJhdXRvY29tcGxldGUtcGx1czpjYW5jZWxcIik7XG4gIGNvbnN0IGNvZGVCbG9jayA9IGNvZGVNYW5hZ2VyLmZpbmRDb2RlQmxvY2soZWRpdG9yKTtcblxuICBpZiAoIWNvZGVCbG9jaykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNvZGVOdWxsYWJsZSA9IGNvZGVCbG9jay5jb2RlO1xuICBpZiAoY29kZU51bGxhYmxlID09PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHsgcm93IH0gPSBjb2RlQmxvY2s7XG4gIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBuZXcgUG9pbnQocm93LCAwKSk7XG4gIGNvbnN0IGNvZGUgPVxuICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcbiAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXG4gICAgICA6IGNvZGVOdWxsYWJsZTtcblxuICBpZiAobW92ZURvd24gPT09IHRydWUpIHtcbiAgICBjb2RlTWFuYWdlci5tb3ZlRG93bihlZGl0b3IsIHJvdyk7XG4gIH1cblxuICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xuICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcbiAgICAgIGNvZGUsXG4gICAgICByb3csXG4gICAgICBjZWxsVHlwZSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHJ1bkFsbChicmVha3BvaW50cz86IEFycmF5PFBvaW50PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgY29uc3QgeyBlZGl0b3IsIGtlcm5lbCwgZ3JhbW1hciwgZmlsZVBhdGggfSA9IHN0b3JlO1xuICBpZiAoIWVkaXRvciB8fCAhZ3JhbW1hciB8fCAhZmlsZVBhdGgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICdcIlJ1biBBbGxcIiBpcyBub3Qgc3VwcG9ydGVkIGZvciB0aGlzIGZpbGUgdHlwZSEnXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoZWRpdG9yICYmIGtlcm5lbCkge1xuICAgIF9ydW5BbGwoZWRpdG9yLCBrZXJuZWwsIGJyZWFrcG9pbnRzKTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKGtlcm5lbDogS2VybmVsKSA9PiB7XG4gICAgX3J1bkFsbChlZGl0b3IsIGtlcm5lbCwgYnJlYWtwb2ludHMpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX3J1bkFsbChcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICBrZXJuZWw6IEtlcm5lbCxcbiAgYnJlYWtwb2ludHM/OiBBcnJheTxQb2ludD5cbikge1xuICBjb25zdCBjZWxscyA9IGNvZGVNYW5hZ2VyLmdldENlbGxzKGVkaXRvciwgYnJlYWtwb2ludHMpO1xuXG4gIGZvciAoY29uc3QgY2VsbCBvZiBjZWxscykge1xuICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY2VsbDtcbiAgICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xuICAgIGlmIChjb2RlTnVsbGFibGUgPT09IG51bGwpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCByb3cgPSBjb2RlTWFuYWdlci5lc2NhcGVCbGFua1Jvd3MoXG4gICAgICBlZGl0b3IsXG4gICAgICBzdGFydC5yb3csXG4gICAgICBjb2RlTWFuYWdlci5nZXRFc2NhcGVCbGFua1Jvd3NFbmRSb3coZWRpdG9yLCBlbmQpXG4gICAgKTtcbiAgICBjb25zdCBjZWxsVHlwZSA9IGNvZGVNYW5hZ2VyLmdldE1ldGFkYXRhRm9yUm93KGVkaXRvciwgc3RhcnQpO1xuICAgIGNvbnN0IGNvZGUgPVxuICAgICAgY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIlxuICAgICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxuICAgICAgICA6IGNvZGVOdWxsYWJsZTtcbiAgICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xuICAgICAgcmVzdWx0LmNyZWF0ZVJlc3VsdChzdG9yZSwge1xuICAgICAgICBjb2RlLFxuICAgICAgICByb3csXG4gICAgICAgIGNlbGxUeXBlLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcnVuQWxsQWJvdmUoKSB7XG4gIGNvbnN0IHsgZWRpdG9yLCBrZXJuZWwsIGdyYW1tYXIsIGZpbGVQYXRoIH0gPSBzdG9yZTtcbiAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAnXCJSdW4gQWxsIEFib3ZlXCIgaXMgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBmaWxlIHR5cGUhJ1xuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGVkaXRvciAmJiBrZXJuZWwpIHtcbiAgICBfcnVuQWxsQWJvdmUoZWRpdG9yLCBrZXJuZWwpO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbEZvcihncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoLCAoa2VybmVsOiBLZXJuZWwpID0+IHtcbiAgICBfcnVuQWxsQWJvdmUoZWRpdG9yLCBrZXJuZWwpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX3J1bkFsbEFib3ZlKGVkaXRvcjogVGV4dEVkaXRvciwga2VybmVsOiBLZXJuZWwpIHtcbiAgY29uc3QgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XG4gIGN1cnNvci5jb2x1bW4gPSBlZGl0b3IuZ2V0QnVmZmVyKCkubGluZUxlbmd0aEZvclJvdyhjdXJzb3Iucm93KTtcbiAgY29uc3QgYnJlYWtwb2ludHMgPSBjb2RlTWFuYWdlci5nZXRCcmVha3BvaW50cyhlZGl0b3IpO1xuICBicmVha3BvaW50cy5wdXNoKGN1cnNvcik7XG4gIGNvbnN0IGNlbGxzID0gY29kZU1hbmFnZXIuZ2V0Q2VsbHMoZWRpdG9yLCBicmVha3BvaW50cyk7XG5cbiAgZm9yIChjb25zdCBjZWxsIG9mIGNlbGxzKSB7XG4gICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBjZWxsO1xuICAgIGNvbnN0IGNvZGVOdWxsYWJsZSA9IGNvZGVNYW5hZ2VyLmdldFRleHRJblJhbmdlKGVkaXRvciwgc3RhcnQsIGVuZCk7XG4gICAgY29uc3Qgcm93ID0gY29kZU1hbmFnZXIuZXNjYXBlQmxhbmtSb3dzKFxuICAgICAgZWRpdG9yLFxuICAgICAgc3RhcnQucm93LFxuICAgICAgY29kZU1hbmFnZXIuZ2V0RXNjYXBlQmxhbmtSb3dzRW5kUm93KGVkaXRvciwgZW5kKVxuICAgICk7XG4gICAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcblxuICAgIGlmIChjb2RlTnVsbGFibGUgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvZGUgPVxuICAgICAgICBjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiXG4gICAgICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcbiAgICAgICAgICA6IGNvZGVOdWxsYWJsZTtcbiAgICAgIGNoZWNrRm9yS2VybmVsKHN0b3JlLCAoa2VybmVsKSA9PiB7XG4gICAgICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcbiAgICAgICAgICBjb2RlLFxuICAgICAgICAgIHJvdyxcbiAgICAgICAgICBjZWxsVHlwZSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoY2VsbC5jb250YWluc1BvaW50KGN1cnNvcikpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBydW5DZWxsKG1vdmVEb3duOiBib29sZWFuID0gZmFsc2UpIHtcbiAgY29uc3QgZWRpdG9yID0gc3RvcmUuZWRpdG9yO1xuICBpZiAoIWVkaXRvcikge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbnRlcmFjdC9oeWRyb2dlbi9pc3N1ZXMvMTQ1MlxuICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvci5lbGVtZW50LCBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKTtcbiAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBjb2RlTWFuYWdlci5nZXRDdXJyZW50Q2VsbChlZGl0b3IpO1xuICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xuICBpZiAoY29kZU51bGxhYmxlID09PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcbiAgICBlZGl0b3IsXG4gICAgc3RhcnQucm93LFxuICAgIGNvZGVNYW5hZ2VyLmdldEVzY2FwZUJsYW5rUm93c0VuZFJvdyhlZGl0b3IsIGVuZClcbiAgKTtcbiAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcbiAgY29uc3QgY29kZSA9XG4gICAgY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIlxuICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcbiAgICAgIDogY29kZU51bGxhYmxlO1xuXG4gIGlmIChtb3ZlRG93biA9PT0gdHJ1ZSkge1xuICAgIGNvZGVNYW5hZ2VyLm1vdmVEb3duKGVkaXRvciwgcm93KTtcbiAgfVxuXG4gIGNoZWNrRm9yS2VybmVsKHN0b3JlLCAoa2VybmVsKSA9PiB7XG4gICAgcmVzdWx0LmNyZWF0ZVJlc3VsdChzdG9yZSwge1xuICAgICAgY29kZSxcbiAgICAgIHJvdyxcbiAgICAgIGNlbGxUeXBlLFxuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZm9sZEN1cnJlbnRDZWxsKCkge1xuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XG4gIGlmICghZWRpdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvZGVNYW5hZ2VyLmZvbGRDdXJyZW50Q2VsbChlZGl0b3IpO1xufVxuXG5mdW5jdGlvbiBmb2xkQWxsQnV0Q3VycmVudENlbGwoKSB7XG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcbiAgaWYgKCFlZGl0b3IpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29kZU1hbmFnZXIuZm9sZEFsbEJ1dEN1cnJlbnRDZWxsKGVkaXRvcik7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0Wk1RS2VybmVsKCkge1xuICBrZXJuZWxNYW5hZ2VyXG4gICAgLmdldEFsbEtlcm5lbFNwZWNzRm9yR3JhbW1hcihzdG9yZS5ncmFtbWFyKVxuICAgIC50aGVuKChrZXJuZWxTcGVjcykgPT4ge1xuICAgICAgaWYgKGtlcm5lbFBpY2tlcikge1xuICAgICAgICBrZXJuZWxQaWNrZXIua2VybmVsU3BlY3MgPSBrZXJuZWxTcGVjcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtlcm5lbFBpY2tlciA9IG5ldyBLZXJuZWxQaWNrZXIoa2VybmVsU3BlY3MpO1xuXG4gICAgICAgIGtlcm5lbFBpY2tlci5vbkNvbmZpcm1lZCA9IChrZXJuZWxTcGVjOiBLZXJuZWxzcGVjTWV0YWRhdGEpID0+IHtcbiAgICAgICAgICBjb25zdCB7IGVkaXRvciwgZ3JhbW1hciwgZmlsZVBhdGgsIG1hcmtlcnMgfSA9IHN0b3JlO1xuICAgICAgICAgIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCB8fCAhbWFya2Vycykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtYXJrZXJzLmNsZWFyKCk7XG4gICAgICAgICAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbChrZXJuZWxTcGVjLCBncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAga2VybmVsUGlja2VyLnRvZ2dsZSgpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb25uZWN0VG9XU0tlcm5lbCgpIHtcbiAgaWYgKCF3c0tlcm5lbFBpY2tlcikge1xuICAgIHdzS2VybmVsUGlja2VyID0gbmV3IFdTS2VybmVsUGlja2VyKCh0cmFuc3BvcnQ6IFdTS2VybmVsKSA9PiB7XG4gICAgICBjb25zdCBrZXJuZWwgPSBuZXcgS2VybmVsKHRyYW5zcG9ydCk7XG4gICAgICBjb25zdCB7IGVkaXRvciwgZ3JhbW1hciwgZmlsZVBhdGgsIG1hcmtlcnMgfSA9IHN0b3JlO1xuICAgICAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoIHx8ICFtYXJrZXJzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcbiAgICAgIGlmIChrZXJuZWwudHJhbnNwb3J0IGluc3RhbmNlb2YgWk1RS2VybmVsKSB7XG4gICAgICAgIGtlcm5lbC5kZXN0cm95KCk7XG4gICAgICB9XG4gICAgICBzdG9yZS5uZXdLZXJuZWwoa2VybmVsLCBmaWxlUGF0aCwgZWRpdG9yLCBncmFtbWFyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHdzS2VybmVsUGlja2VyLnRvZ2dsZSgoa2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhKSA9PlxuICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoa2VybmVsU3BlYywgc3RvcmUuZ3JhbW1hcilcbiAgKTtcbn1cblxuLy8gQWNjZXB0cyBzdG9yZSBhcyBhbiBhcmdcbmZ1bmN0aW9uIGNoZWNrRm9yS2VybmVsKFxuICB7XG4gICAgZWRpdG9yLFxuICAgIGdyYW1tYXIsXG4gICAgZmlsZVBhdGgsXG4gICAga2VybmVsLFxuICB9OiB7XG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yO1xuICAgIGdyYW1tYXI6IEdyYW1tYXI7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbiAgICBrZXJuZWw/OiBLZXJuZWw7XG4gIH0sXG4gIGNhbGxiYWNrOiAoa2VybmVsOiBLZXJuZWwpID0+IHZvaWRcbikge1xuICBpZiAoIWZpbGVQYXRoIHx8ICFncmFtbWFyKSB7XG4gICAgcmV0dXJuIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgIFwiVGhlIGxhbmd1YWdlIGdyYW1tYXIgbXVzdCBiZSBzZXQgaW4gb3JkZXIgdG8gc3RhcnQgYSBrZXJuZWwuIFRoZSBlYXNpZXN0IHdheSB0byBkbyB0aGlzIGlzIHRvIHNhdmUgdGhlIGZpbGUuXCJcbiAgICApO1xuICB9XG5cbiAgaWYgKGtlcm5lbCkge1xuICAgIGNhbGxiYWNrKGtlcm5lbCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbEZvcihncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoLCAobmV3S2VybmVsOiBLZXJuZWwpID0+XG4gICAgY2FsbGJhY2sobmV3S2VybmVsKVxuICApO1xufVxuIl19