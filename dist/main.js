"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const debounce_1 = __importDefault(require("lodash/debounce"));
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
const kernel_manager_1 = require("./kernel-manager");
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
const kernelManager = new kernel_manager_1.KernelManager();
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
                (0, utils_1.openOrShowDock)(utils_1.WATCHES_URI);
            }
        },
        "hydrogen:remove-watch": () => {
            if (store_1.default.kernel) {
                store_1.default.kernel.watchesStore.removeWatch();
                (0, utils_1.openOrShowDock)(utils_1.WATCHES_URI);
            }
        },
        "hydrogen:update-kernels": async () => {
            await kernelManager.updateKernelSpecs();
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
        "hydrogen:export-notebook": () => (0, export_notebook_1.exportNotebook)(),
        "hydrogen:fold-current-cell": () => foldCurrentCell(),
        "hydrogen:fold-all-but-current-cell": () => foldAllButCurrentCell(),
        "hydrogen:clear-results": () => result.clearResults(store_1.default),
    }));
    store_1.default.subscriptions.add(atom.commands.add("atom-workspace", {
        "hydrogen:import-notebook": import_notebook_1.importNotebook,
    }));
    if (atom.inDevMode()) {
        store_1.default.subscriptions.add(atom.commands.add("atom-workspace", {
            "hydrogen:hot-reload-package": () => (0, utils_1.hotReloadPackage)(),
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
        if ((0, utils_1.isMultilanguageGrammar)(editor.getGrammar())) {
            editorSubscriptions.add(editor.onDidChangeCursorPosition((0, debounce_1.default)(() => {
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
    (0, mobx_1.autorun)(() => {
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
    (0, utils_1.log)("handleKernelCommand:", [
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
    if (moveDown) {
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
    if ((0, utils_1.isMultilanguageGrammar)(editor.getGrammar())) {
        atom.notifications.addError('"Run All" is not supported for this file type!');
        return;
    }
    if (editor && kernel) {
        _runAll(editor, kernel, breakpoints);
        return;
    }
    kernelManager.startKernelFor(grammar, editor, filePath, (kernel) => {
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
    if ((0, utils_1.isMultilanguageGrammar)(editor.getGrammar())) {
        atom.notifications.addError('"Run All Above" is not supported for this file type!');
        return;
    }
    if (editor && kernel) {
        _runAllAbove(editor, kernel);
        return;
    }
    kernelManager.startKernelFor(grammar, editor, filePath, (kernel) => {
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
    if (moveDown) {
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
    kernelManager
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
                kernelManager.startKernel(kernelSpec, grammar, editor, filePath);
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
    wsKernelPicker.toggle((kernelSpec) => (0, utils_1.kernelSpecProvidesGrammar)(kernelSpec, store_1.default.grammar));
}
function checkForKernel({ editor, grammar, filePath, kernel, }, callback) {
    if (!filePath || !grammar) {
        return atom.notifications.addError("The language grammar must be set in order to start a kernel. The easiest way to do this is to save the file.");
    }
    if (kernel) {
        callback(kernel);
        return;
    }
    kernelManager.startKernelFor(grammar, editor, filePath, (newKernel) => callback(newKernel));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBT2M7QUFFZCwrREFBdUM7QUFDdkMsK0JBQStCO0FBRS9CLGtFQUE4QztBQUM5Qyw4REFBMEM7QUFDMUMsc0VBQTZDO0FBQzdDLDRFQUF1RDtBQUN2RCxzREFBOEI7QUFDOUIsOERBQXFDO0FBQ3JDLDREQUFtQztBQUNuQyxzREFBOEI7QUFDOUIsb0VBQTJDO0FBQzNDLDBFQUFnRDtBQUNoRCxzRkFBNEQ7QUFDNUQsdUZBQThEO0FBQzlELG9EQUFrRDtBQUNsRCxxREFBaUQ7QUFDakQsMERBQWtDO0FBQ2xDLHFEQUF1QztBQUN2Qyw0REFBOEM7QUFDOUMsaURBQW1DO0FBQ25DLG1DQVVpQjtBQUNqQix1REFBbUQ7QUFDbkQsdURBQWdFO0FBR25ELFFBQUEsTUFBTSxHQUFHLGdCQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3BDLElBQUksT0FBaUUsQ0FBQztBQUN0RSxJQUFJLFlBQXNDLENBQUM7QUFDM0MsSUFBSSxvQkFBc0QsQ0FBQztBQUMzRCxJQUFJLGNBQTBDLENBQUM7QUFDL0MsSUFBSSxnQkFBOEMsQ0FBQztBQUNuRCxNQUFNLGFBQWEsR0FBRyxJQUFJLDhCQUFhLEVBQUUsQ0FBQztBQUUxQyxTQUFnQixRQUFRO0lBQ3RCLE9BQU8sR0FBRyxJQUFJLGNBQU8sRUFBRSxDQUFDO0lBQ3hCLElBQUksMEJBQTBCLEdBQUcsS0FBSyxDQUFDO0lBQ3ZDLGVBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FDckIsMkJBQTJCLEVBQzNCLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtRQUN6QixJQUFJLDBCQUEwQixFQUFFO1lBQzlCLDBCQUEwQixHQUFHLEtBQUssQ0FBQztZQUNuQyxPQUFP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Q3ZELElBQUEsaUNBQXlCLEVBQUMsVUFBVSxFQUFFLGVBQUssQ0FBQyxPQUFPLENBQUMsQ0FDckQsQ0FBQztBQUNKLENBQUM7QUFHRCxTQUFTLGNBQWMsQ0FDckIsRUFDRSxNQUFNLEVBQ04sT0FBTyxFQUNQLFFBQVEsRUFDUixNQUFNLEdBTVAsRUFDRCxRQUFrQztJQUVsQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQ2hDLDhHQUE4RyxDQUMvRyxDQUFDO0tBQ0g7SUFFRCxJQUFJLE1BQU0sRUFBRTtRQUNWLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQixPQUFPO0tBQ1I7SUFFRCxhQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsU0FBaUIsRUFBRSxFQUFFLENBQzVFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FDcEIsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBFbWl0dGVyLFxuICBDb21wb3NpdGVEaXNwb3NhYmxlLFxuICBEaXNwb3NhYmxlLFxuICBQb2ludCxcbiAgVGV4dEVkaXRvcixcbiAgR3JhbW1hcixcbn0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IFN0YXR1c0JhciB9IGZyb20gXCJhdG9tL3N0YXR1cy1iYXJcIjtcbmltcG9ydCBkZWJvdW5jZSBmcm9tIFwibG9kYXNoL2RlYm91bmNlXCI7XG5pbXBvcnQgeyBhdXRvcnVuIH0gZnJvbSBcIm1vYnhcIjtcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBJbnNwZWN0b3JQYW5lIGZyb20gXCIuL3BhbmVzL2luc3BlY3RvclwiO1xuaW1wb3J0IFdhdGNoZXNQYW5lIGZyb20gXCIuL3BhbmVzL3dhdGNoZXNcIjtcbmltcG9ydCBPdXRwdXRQYW5lIGZyb20gXCIuL3BhbmVzL291dHB1dC1hcmVhXCI7XG5pbXBvcnQgS2VybmVsTW9uaXRvclBhbmUgZnJvbSBcIi4vcGFuZXMva2VybmVsLW1vbml0b3JcIjtcbmltcG9ydCBDb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgWk1RS2VybmVsIGZyb20gXCIuL3ptcS1rZXJuZWxcIjtcbmltcG9ydCBXU0tlcm5lbCBmcm9tIFwiLi93cy1rZXJuZWxcIjtcbmltcG9ydCBLZXJuZWwgZnJvbSBcIi4va2VybmVsXCI7XG5pbXBvcnQgS2VybmVsUGlja2VyIGZyb20gXCIuL2tlcm5lbC1waWNrZXJcIjtcbmltcG9ydCBXU0tlcm5lbFBpY2tlciBmcm9tIFwiLi93cy1rZXJuZWwtcGlja2VyXCI7XG5pbXBvcnQgRXhpc3RpbmdLZXJuZWxQaWNrZXIgZnJvbSBcIi4vZXhpc3Rpbmcta2VybmVsLXBpY2tlclwiO1xuaW1wb3J0IEh5ZHJvZ2VuUHJvdmlkZXIgZnJvbSBcIi4vcGx1Z2luLWFwaS9oeWRyb2dlbi1wcm92aWRlclwiO1xuaW1wb3J0IHN0b3JlLCB7IFN0b3JlLCBTdG9yZUxpa2UgfSBmcm9tIFwiLi9zdG9yZVwiO1xuaW1wb3J0IHsgS2VybmVsTWFuYWdlciB9IGZyb20gXCIuL2tlcm5lbC1tYW5hZ2VyXCI7XG5pbXBvcnQgc2VydmljZXMgZnJvbSBcIi4vc2VydmljZXNcIjtcbmltcG9ydCAqIGFzIGNvbW1hbmRzIGZyb20gXCIuL2NvbW1hbmRzXCI7XG5pbXBvcnQgKiBhcyBjb2RlTWFuYWdlciBmcm9tIFwiLi9jb2RlLW1hbmFnZXJcIjtcbmltcG9ydCAqIGFzIHJlc3VsdCBmcm9tIFwiLi9yZXN1bHRcIjtcbmltcG9ydCB7XG4gIGxvZyxcbiAgaXNNdWx0aWxhbmd1YWdlR3JhbW1hcixcbiAgSU5TUEVDVE9SX1VSSSxcbiAgV0FUQ0hFU19VUkksXG4gIE9VVFBVVF9BUkVBX1VSSSxcbiAgS0VSTkVMX01PTklUT1JfVVJJLFxuICBob3RSZWxvYWRQYWNrYWdlLFxuICBvcGVuT3JTaG93RG9jayxcbiAga2VybmVsU3BlY1Byb3ZpZGVzR3JhbW1hcixcbn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7IGV4cG9ydE5vdGVib29rIH0gZnJvbSBcIi4vZXhwb3J0LW5vdGVib29rXCI7XG5pbXBvcnQgeyBpbXBvcnROb3RlYm9vaywgaXB5bmJPcGVuZXIgfSBmcm9tIFwiLi9pbXBvcnQtbm90ZWJvb2tcIjtcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSBDb25maWcuc2NoZW1hO1xubGV0IGVtaXR0ZXI6IEVtaXR0ZXI8e30sIHsgXCJkaWQtY2hhbmdlLWtlcm5lbFwiOiBLZXJuZWwgfT4gfCB1bmRlZmluZWQ7XG5sZXQga2VybmVsUGlja2VyOiBLZXJuZWxQaWNrZXIgfCB1bmRlZmluZWQ7XG5sZXQgZXhpc3RpbmdLZXJuZWxQaWNrZXI6IEV4aXN0aW5nS2VybmVsUGlja2VyIHwgdW5kZWZpbmVkO1xubGV0IHdzS2VybmVsUGlja2VyOiBXU0tlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcbmxldCBoeWRyb2dlblByb3ZpZGVyOiBIeWRyb2dlblByb3ZpZGVyIHwgdW5kZWZpbmVkO1xuY29uc3Qga2VybmVsTWFuYWdlciA9IG5ldyBLZXJuZWxNYW5hZ2VyKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcbiAgZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gIGxldCBza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSA9IGZhbHNlO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZShcbiAgICAgIFwiSHlkcm9nZW4ubGFuZ3VhZ2VNYXBwaW5nc1wiLFxuICAgICAgKHsgbmV3VmFsdWUsIG9sZFZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKHNraXBMYW5ndWFnZU1hcHBpbmdzQ2hhbmdlKSB7XG4gICAgICAgICAgc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RvcmUucnVubmluZ0tlcm5lbHMubGVuZ3RoICE9IDApIHtcbiAgICAgICAgICBza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSA9IHRydWU7XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KFwiSHlkcm9nZW4ubGFuZ3VhZ2VNYXBwaW5nc1wiLCBvbGRWYWx1ZSk7XG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiSHlkcm9nZW5cIiwge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICAgIFwiYGxhbmd1YWdlTWFwcGluZ3NgIGNhbm5vdCBiZSB1cGRhdGVkIHdoaWxlIGtlcm5lbHMgYXJlIHJ1bm5pbmdcIixcbiAgICAgICAgICAgIGRpc21pc3NhYmxlOiBmYWxzZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgKTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIkh5ZHJvZ2VuLnN0YXR1c0JhckRpc2FibGVcIiwgKG5ld1ZhbHVlKSA9PiB7XG4gICAgICBzdG9yZS5zZXRDb25maWdWYWx1ZShcIkh5ZHJvZ2VuLnN0YXR1c0JhckRpc2FibGVcIiwgQm9vbGVhbihuZXdWYWx1ZSkpO1xuICAgIH0pLFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5zdGF0dXNCYXJLZXJuZWxJbmZvXCIsIChuZXdWYWx1ZSkgPT4ge1xuICAgICAgc3RvcmUuc2V0Q29uZmlnVmFsdWUoXCJIeWRyb2dlbi5zdGF0dXNCYXJLZXJuZWxJbmZvXCIsIEJvb2xlYW4obmV3VmFsdWUpKTtcbiAgICB9KVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLmNvbW1hbmRzLmFkZDxcImF0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSlcIj4oXG4gICAgICBcImF0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSlcIixcbiAgICAgIHtcbiAgICAgICAgXCJoeWRyb2dlbjpydW5cIjogKCkgPT4gcnVuKCksXG4gICAgICAgIFwiaHlkcm9nZW46cnVuLWFsbFwiOiAoKSA9PiBydW5BbGwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tYWxsLWFib3ZlXCI6ICgpID0+IHJ1bkFsbEFib3ZlKCksXG4gICAgICAgIFwiaHlkcm9nZW46cnVuLWFuZC1tb3ZlLWRvd25cIjogKCkgPT4gcnVuKHRydWUpLFxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1jZWxsXCI6ICgpID0+IHJ1bkNlbGwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tY2VsbC1hbmQtbW92ZS1kb3duXCI6ICgpID0+IHJ1bkNlbGwodHJ1ZSksXG4gICAgICAgIFwiaHlkcm9nZW46dG9nZ2xlLXdhdGNoZXNcIjogKCkgPT4gYXRvbS53b3Jrc3BhY2UudG9nZ2xlKFdBVENIRVNfVVJJKSxcbiAgICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtb3V0cHV0LWFyZWFcIjogKCkgPT4gY29tbWFuZHMudG9nZ2xlT3V0cHV0TW9kZSgpLFxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS1rZXJuZWwtbW9uaXRvclwiOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbGFzdEl0ZW0gPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpO1xuICAgICAgICAgIGNvbnN0IGxhc3RQYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0obGFzdEl0ZW0pO1xuICAgICAgICAgIGF3YWl0IGF0b20ud29ya3NwYWNlLnRvZ2dsZShLRVJORUxfTU9OSVRPUl9VUkkpO1xuICAgICAgICAgIGlmIChsYXN0UGFuZSkge1xuICAgICAgICAgICAgbGFzdFBhbmUuYWN0aXZhdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaHlkcm9nZW46c3RhcnQtbG9jYWwta2VybmVsXCI6ICgpID0+IHN0YXJ0Wk1RS2VybmVsKCksXG4gICAgICAgIFwiaHlkcm9nZW46Y29ubmVjdC10by1yZW1vdGUta2VybmVsXCI6ICgpID0+IGNvbm5lY3RUb1dTS2VybmVsKCksXG4gICAgICAgIFwiaHlkcm9nZW46Y29ubmVjdC10by1leGlzdGluZy1rZXJuZWxcIjogKCkgPT4gY29ubmVjdFRvRXhpc3RpbmdLZXJuZWwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjphZGQtd2F0Y2hcIjogKCkgPT4ge1xuICAgICAgICAgIGlmIChzdG9yZS5rZXJuZWwpIHtcbiAgICAgICAgICAgIHN0b3JlLmtlcm5lbC53YXRjaGVzU3RvcmUuYWRkV2F0Y2hGcm9tRWRpdG9yKHN0b3JlLmVkaXRvcik7XG4gICAgICAgICAgICBvcGVuT3JTaG93RG9jayhXQVRDSEVTX1VSSSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImh5ZHJvZ2VuOnJlbW92ZS13YXRjaFwiOiAoKSA9PiB7XG4gICAgICAgICAgaWYgKHN0b3JlLmtlcm5lbCkge1xuICAgICAgICAgICAgc3RvcmUua2VybmVsLndhdGNoZXNTdG9yZS5yZW1vdmVXYXRjaCgpO1xuICAgICAgICAgICAgb3Blbk9yU2hvd0RvY2soV0FUQ0hFU19VUkkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJoeWRyb2dlbjp1cGRhdGUta2VybmVsc1wiOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQga2VybmVsTWFuYWdlci51cGRhdGVLZXJuZWxTcGVjcygpO1xuICAgICAgICB9LFxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS1pbnNwZWN0b3JcIjogKCkgPT4gY29tbWFuZHMudG9nZ2xlSW5zcGVjdG9yKHN0b3JlKSxcbiAgICAgICAgXCJoeWRyb2dlbjppbnRlcnJ1cHQta2VybmVsXCI6ICgpID0+XG4gICAgICAgICAgaGFuZGxlS2VybmVsQ29tbWFuZChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29tbWFuZDogXCJpbnRlcnJ1cHQta2VybmVsXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmVcbiAgICAgICAgICApLFxuICAgICAgICBcImh5ZHJvZ2VuOnJlc3RhcnQta2VybmVsXCI6ICgpID0+XG4gICAgICAgICAgaGFuZGxlS2VybmVsQ29tbWFuZChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29tbWFuZDogXCJyZXN0YXJ0LWtlcm5lbFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlXG4gICAgICAgICAgKSxcbiAgICAgICAgXCJoeWRyb2dlbjpzaHV0ZG93bi1rZXJuZWxcIjogKCkgPT5cbiAgICAgICAgICBoYW5kbGVLZXJuZWxDb21tYW5kKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjb21tYW5kOiBcInNodXRkb3duLWtlcm5lbFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlXG4gICAgICAgICAgKSxcbiAgICAgICAgXCJoeWRyb2dlbjpjbGVhci1yZXN1bHRcIjogKCkgPT4gcmVzdWx0LmNsZWFyUmVzdWx0KHN0b3JlKSxcbiAgICAgICAgXCJoeWRyb2dlbjpleHBvcnQtbm90ZWJvb2tcIjogKCkgPT4gZXhwb3J0Tm90ZWJvb2soKSxcbiAgICAgICAgXCJoeWRyb2dlbjpmb2xkLWN1cnJlbnQtY2VsbFwiOiAoKSA9PiBmb2xkQ3VycmVudENlbGwoKSxcbiAgICAgICAgXCJoeWRyb2dlbjpmb2xkLWFsbC1idXQtY3VycmVudC1jZWxsXCI6ICgpID0+IGZvbGRBbGxCdXRDdXJyZW50Q2VsbCgpLFxuICAgICAgICBcImh5ZHJvZ2VuOmNsZWFyLXJlc3VsdHNcIjogKCkgPT4gcmVzdWx0LmNsZWFyUmVzdWx0cyhzdG9yZSksXG4gICAgICB9XG4gICAgKVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIHtcbiAgICAgIFwiaHlkcm9nZW46aW1wb3J0LW5vdGVib29rXCI6IGltcG9ydE5vdGVib29rLFxuICAgIH0pXG4gICk7XG5cbiAgaWYgKGF0b20uaW5EZXZNb2RlKCkpIHtcbiAgICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwge1xuICAgICAgICBcImh5ZHJvZ2VuOmhvdC1yZWxvYWQtcGFja2FnZVwiOiAoKSA9PiBob3RSZWxvYWRQYWNrYWdlKCksXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlVGV4dEVkaXRvcigoZWRpdG9yKSA9PiB7XG4gICAgICBzdG9yZS51cGRhdGVFZGl0b3IoZWRpdG9yKTtcbiAgICB9KVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcikgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoKSA9PiB7XG4gICAgICAgICAgc3RvcmUuc2V0R3JhbW1hcihlZGl0b3IpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcbiAgICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgICAgZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXG4gICAgICAgICAgICBkZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICAgIHN0b3JlLnNldEdyYW1tYXIoZWRpdG9yKTtcbiAgICAgICAgICAgIH0sIDc1KVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICBlZGl0b3Iub25EaWRDaGFuZ2VUaXRsZSgobmV3VGl0bGUpID0+IHN0b3JlLmZvcmNlRWRpdG9yVXBkYXRlKCkpXG4gICAgICApO1xuICAgICAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoZWRpdG9yU3Vic2NyaXB0aW9ucyk7XG4gICAgfSlcbiAgKTtcbiAgaHlkcm9nZW5Qcm92aWRlciA9IG51bGw7XG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpKSA9PiB7XG4gICAgICBzd2l0Y2ggKHVyaSkge1xuICAgICAgICBjYXNlIElOU1BFQ1RPUl9VUkk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnNwZWN0b3JQYW5lKHN0b3JlKTtcblxuICAgICAgICBjYXNlIFdBVENIRVNfVVJJOlxuICAgICAgICAgIHJldHVybiBuZXcgV2F0Y2hlc1BhbmUoc3RvcmUpO1xuXG4gICAgICAgIGNhc2UgT1VUUFVUX0FSRUFfVVJJOlxuICAgICAgICAgIHJldHVybiBuZXcgT3V0cHV0UGFuZShzdG9yZSk7XG5cbiAgICAgICAgY2FzZSBLRVJORUxfTU9OSVRPUl9VUkk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBLZXJuZWxNb25pdG9yUGFuZShzdG9yZSk7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICApO1xuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoaXB5bmJPcGVuZXIpKTtcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgLy8gRGVzdHJveSBhbnkgUGFuZXMgd2hlbiB0aGUgcGFja2FnZSBpcyBkZWFjdGl2YXRlZC5cbiAgICBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRQYW5lSXRlbXMoKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBpdGVtIGluc3RhbmNlb2YgSW5zcGVjdG9yUGFuZSB8fFxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBXYXRjaGVzUGFuZSB8fFxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBPdXRwdXRQYW5lIHx8XG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIEtlcm5lbE1vbml0b3JQYW5lXG4gICAgICAgICkge1xuICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KVxuICApO1xuICBhdXRvcnVuKCgpID0+IHtcbiAgICBlbWl0dGVyLmVtaXQoXCJkaWQtY2hhbmdlLWtlcm5lbFwiLCBzdG9yZS5rZXJuZWwpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XG4gIHN0b3JlLmRpc3Bvc2UoKTtcbn1cblxuLyotLS0tLS0tLS0tLS0tLSBTZXJ2aWNlIFByb3ZpZGVycyAtLS0tLS0tLS0tLS0tLSovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUh5ZHJvZ2VuKCkge1xuICBpZiAoIWh5ZHJvZ2VuUHJvdmlkZXIpIHtcbiAgICBoeWRyb2dlblByb3ZpZGVyID0gbmV3IEh5ZHJvZ2VuUHJvdmlkZXIoZW1pdHRlcik7XG4gIH1cblxuICByZXR1cm4gaHlkcm9nZW5Qcm92aWRlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVBdXRvY29tcGxldGVSZXN1bHRzKCkge1xuICByZXR1cm4gc2VydmljZXMucHJvdmlkZWQuYXV0b2NvbXBsZXRlLnByb3ZpZGVBdXRvY29tcGxldGVSZXN1bHRzKHN0b3JlKTtcbn1cblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbi8qLS0tLS0tLS0tLS0tLS0gU2VydmljZSBDb25zdW1lcnMgLS0tLS0tLS0tLS0tLS0qL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVBdXRvY29tcGxldGVXYXRjaEVkaXRvcihcbiAgd2F0Y2hFZGl0b3I6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnlcbikge1xuICByZXR1cm4gc2VydmljZXMuY29uc3VtZWQuYXV0b2NvbXBsZXRlLmNvbnN1bWUoc3RvcmUsIHdhdGNoRWRpdG9yKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBTdGF0dXNCYXIpIHtcbiAgcmV0dXJuIHNlcnZpY2VzLmNvbnN1bWVkLnN0YXR1c0Jhci5hZGRTdGF0dXNCYXIoXG4gICAgc3RvcmUsXG4gICAgc3RhdHVzQmFyLFxuICAgIGhhbmRsZUtlcm5lbENvbW1hbmRcbiAgKTtcbn1cblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5mdW5jdGlvbiBjb25uZWN0VG9FeGlzdGluZ0tlcm5lbCgpIHtcbiAgaWYgKCFleGlzdGluZ0tlcm5lbFBpY2tlcikge1xuICAgIGV4aXN0aW5nS2VybmVsUGlja2VyID0gbmV3IEV4aXN0aW5nS2VybmVsUGlja2VyKCk7XG4gIH1cblxuICBleGlzdGluZ0tlcm5lbFBpY2tlci50b2dnbGUoKTtcbn1cblxuaW50ZXJmYWNlIEtlcm5lbENvbW1hbmQge1xuICBjb21tYW5kOiBzdHJpbmc7XG4gIHBheWxvYWQ/OiBLZXJuZWxzcGVjTWV0YWRhdGEgfCBudWxsIHwgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVLZXJuZWxDb21tYW5kKFxuICB7IGNvbW1hbmQsIHBheWxvYWQgfTogS2VybmVsQ29tbWFuZCwgLy8gVE9ETyBwYXlsb2FkIGlzIG5vdCB1c2VkIVxuICB7IGtlcm5lbCwgbWFya2VycyB9OiBTdG9yZSB8IFN0b3JlTGlrZVxuKSB7XG4gIGxvZyhcImhhbmRsZUtlcm5lbENvbW1hbmQ6XCIsIFtcbiAgICB7IGNvbW1hbmQsIHBheWxvYWQgfSxcbiAgICB7IGtlcm5lbCwgbWFya2VycyB9LFxuICBdKTtcblxuICBpZiAoIWtlcm5lbCkge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBcIk5vIHJ1bm5pbmcga2VybmVsIGZvciBncmFtbWFyIG9yIGVkaXRvciBmb3VuZFwiO1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoY29tbWFuZCA9PT0gXCJpbnRlcnJ1cHQta2VybmVsXCIpIHtcbiAgICBrZXJuZWwuaW50ZXJydXB0KCk7XG4gIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gXCJyZXN0YXJ0LWtlcm5lbFwiKSB7XG4gICAga2VybmVsLnJlc3RhcnQoKTtcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcInNodXRkb3duLWtlcm5lbFwiKSB7XG4gICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcbiAgICB9XG4gICAgLy8gTm90ZSB0aGF0IGRlc3Ryb3kgYWxvbmUgZG9lcyBub3Qgc2h1dCBkb3duIGEgV1NLZXJuZWxcbiAgICBrZXJuZWwuc2h1dGRvd24oKTtcbiAgICBrZXJuZWwuZGVzdHJveSgpO1xuICB9IGVsc2UgaWYgKFxuICAgIGNvbW1hbmQgPT09IFwicmVuYW1lLWtlcm5lbFwiICYmXG4gICAga2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFdTS2VybmVsXG4gICkge1xuICAgIGtlcm5lbC50cmFuc3BvcnQucHJvbXB0UmVuYW1lKCk7XG4gIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gXCJkaXNjb25uZWN0LWtlcm5lbFwiKSB7XG4gICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcbiAgICB9XG4gICAga2VybmVsLmRlc3Ryb3koKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBydW4obW92ZURvd246IGJvb2xlYW4gPSBmYWxzZSkge1xuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XG4gIGlmICghZWRpdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L2h5ZHJvZ2VuL2lzc3Vlcy8xNDUyXG4gIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWRpdG9yLmVsZW1lbnQsIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y2FuY2VsXCIpO1xuICBjb25zdCBjb2RlQmxvY2sgPSBjb2RlTWFuYWdlci5maW5kQ29kZUJsb2NrKGVkaXRvcik7XG5cbiAgaWYgKCFjb2RlQmxvY2spIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlQmxvY2suY29kZTtcbiAgaWYgKGNvZGVOdWxsYWJsZSA9PT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB7IHJvdyB9ID0gY29kZUJsb2NrO1xuICBjb25zdCBjZWxsVHlwZSA9IGNvZGVNYW5hZ2VyLmdldE1ldGFkYXRhRm9yUm93KGVkaXRvciwgbmV3IFBvaW50KHJvdywgMCkpO1xuICBjb25zdCBjb2RlID1cbiAgICBjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiXG4gICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxuICAgICAgOiBjb2RlTnVsbGFibGU7XG5cbiAgaWYgKG1vdmVEb3duKSB7XG4gICAgY29kZU1hbmFnZXIubW92ZURvd24oZWRpdG9yLCByb3cpO1xuICB9XG5cbiAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcbiAgICByZXN1bHQuY3JlYXRlUmVzdWx0KHN0b3JlLCB7XG4gICAgICBjb2RlLFxuICAgICAgcm93LFxuICAgICAgY2VsbFR5cGUsXG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBydW5BbGwoYnJlYWtwb2ludHM/OiBBcnJheTxQb2ludD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIGNvbnN0IHsgZWRpdG9yLCBrZXJuZWwsIGdyYW1tYXIsIGZpbGVQYXRoIH0gPSBzdG9yZTtcbiAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAnXCJSdW4gQWxsXCIgaXMgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBmaWxlIHR5cGUhJ1xuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGVkaXRvciAmJiBrZXJuZWwpIHtcbiAgICBfcnVuQWxsKGVkaXRvciwga2VybmVsLCBicmVha3BvaW50cyk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBrZXJuZWxNYW5hZ2VyLnN0YXJ0S2VybmVsRm9yKGdyYW1tYXIsIGVkaXRvciwgZmlsZVBhdGgsIChrZXJuZWw6IEtlcm5lbCkgPT4ge1xuICAgIF9ydW5BbGwoZWRpdG9yLCBrZXJuZWwsIGJyZWFrcG9pbnRzKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9ydW5BbGwoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAga2VybmVsOiBLZXJuZWwsXG4gIGJyZWFrcG9pbnRzPzogQXJyYXk8UG9pbnQ+XG4pIHtcbiAgY29uc3QgY2VsbHMgPSBjb2RlTWFuYWdlci5nZXRDZWxscyhlZGl0b3IsIGJyZWFrcG9pbnRzKTtcblxuICBmb3IgKGNvbnN0IGNlbGwgb2YgY2VsbHMpIHtcbiAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNlbGw7XG4gICAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcbiAgICBpZiAoY29kZU51bGxhYmxlID09PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qgcm93ID0gY29kZU1hbmFnZXIuZXNjYXBlQmxhbmtSb3dzKFxuICAgICAgZWRpdG9yLFxuICAgICAgc3RhcnQucm93LFxuICAgICAgY29kZU1hbmFnZXIuZ2V0RXNjYXBlQmxhbmtSb3dzRW5kUm93KGVkaXRvciwgZW5kKVxuICAgICk7XG4gICAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcbiAgICBjb25zdCBjb2RlID1cbiAgICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcbiAgICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcbiAgICAgICAgOiBjb2RlTnVsbGFibGU7XG4gICAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcbiAgICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcbiAgICAgICAgY29kZSxcbiAgICAgICAgcm93LFxuICAgICAgICBjZWxsVHlwZSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJ1bkFsbEFib3ZlKCkge1xuICBjb25zdCB7IGVkaXRvciwga2VybmVsLCBncmFtbWFyLCBmaWxlUGF0aCB9ID0gc3RvcmU7XG4gIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgJ1wiUnVuIEFsbCBBYm92ZVwiIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHRoaXMgZmlsZSB0eXBlISdcbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChlZGl0b3IgJiYga2VybmVsKSB7XG4gICAgX3J1bkFsbEFib3ZlKGVkaXRvciwga2VybmVsKTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKGtlcm5lbDogS2VybmVsKSA9PiB7XG4gICAgX3J1bkFsbEFib3ZlKGVkaXRvciwga2VybmVsKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9ydW5BbGxBYm92ZShlZGl0b3I6IFRleHRFZGl0b3IsIGtlcm5lbDogS2VybmVsKSB7XG4gIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xuICBjdXJzb3IuY29sdW1uID0gZWRpdG9yLmdldEJ1ZmZlcigpLmxpbmVMZW5ndGhGb3JSb3coY3Vyc29yLnJvdyk7XG4gIGNvbnN0IGJyZWFrcG9pbnRzID0gY29kZU1hbmFnZXIuZ2V0QnJlYWtwb2ludHMoZWRpdG9yKTtcbiAgYnJlYWtwb2ludHMucHVzaChjdXJzb3IpO1xuICBjb25zdCBjZWxscyA9IGNvZGVNYW5hZ2VyLmdldENlbGxzKGVkaXRvciwgYnJlYWtwb2ludHMpO1xuXG4gIGZvciAoY29uc3QgY2VsbCBvZiBjZWxscykge1xuICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY2VsbDtcbiAgICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xuICAgIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcbiAgICAgIGVkaXRvcixcbiAgICAgIHN0YXJ0LnJvdyxcbiAgICAgIGNvZGVNYW5hZ2VyLmdldEVzY2FwZUJsYW5rUm93c0VuZFJvdyhlZGl0b3IsIGVuZClcbiAgICApO1xuICAgIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XG5cbiAgICBpZiAoY29kZU51bGxhYmxlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBjb2RlID1cbiAgICAgICAgY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIlxuICAgICAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXG4gICAgICAgICAgOiBjb2RlTnVsbGFibGU7XG4gICAgICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xuICAgICAgICByZXN1bHQuY3JlYXRlUmVzdWx0KHN0b3JlLCB7XG4gICAgICAgICAgY29kZSxcbiAgICAgICAgICByb3csXG4gICAgICAgICAgY2VsbFR5cGUsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNlbGwuY29udGFpbnNQb2ludChjdXJzb3IpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcnVuQ2VsbChtb3ZlRG93bjogYm9vbGVhbiA9IGZhbHNlKSB7XG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcbiAgaWYgKCFlZGl0b3IpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL250ZXJhY3QvaHlkcm9nZW4vaXNzdWVzLzE0NTJcbiAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChlZGl0b3IuZWxlbWVudCwgXCJhdXRvY29tcGxldGUtcGx1czpjYW5jZWxcIik7XG4gIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY29kZU1hbmFnZXIuZ2V0Q3VycmVudENlbGwoZWRpdG9yKTtcbiAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcbiAgaWYgKGNvZGVOdWxsYWJsZSA9PT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByb3cgPSBjb2RlTWFuYWdlci5lc2NhcGVCbGFua1Jvd3MoXG4gICAgZWRpdG9yLFxuICAgIHN0YXJ0LnJvdyxcbiAgICBjb2RlTWFuYWdlci5nZXRFc2NhcGVCbGFua1Jvd3NFbmRSb3coZWRpdG9yLCBlbmQpXG4gICk7XG4gIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XG4gIGNvbnN0IGNvZGUgPVxuICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcbiAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXG4gICAgICA6IGNvZGVOdWxsYWJsZTtcblxuICBpZiAobW92ZURvd24pIHtcbiAgICBjb2RlTWFuYWdlci5tb3ZlRG93bihlZGl0b3IsIHJvdyk7XG4gIH1cblxuICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xuICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcbiAgICAgIGNvZGUsXG4gICAgICByb3csXG4gICAgICBjZWxsVHlwZSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZvbGRDdXJyZW50Q2VsbCgpIHtcbiAgY29uc3QgZWRpdG9yID0gc3RvcmUuZWRpdG9yO1xuICBpZiAoIWVkaXRvcikge1xuICAgIHJldHVybjtcbiAgfVxuICBjb2RlTWFuYWdlci5mb2xkQ3VycmVudENlbGwoZWRpdG9yKTtcbn1cblxuZnVuY3Rpb24gZm9sZEFsbEJ1dEN1cnJlbnRDZWxsKCkge1xuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XG4gIGlmICghZWRpdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvZGVNYW5hZ2VyLmZvbGRBbGxCdXRDdXJyZW50Q2VsbChlZGl0b3IpO1xufVxuXG5mdW5jdGlvbiBzdGFydFpNUUtlcm5lbCgpIHtcbiAga2VybmVsTWFuYWdlclxuICAgIC5nZXRBbGxLZXJuZWxTcGVjc0ZvckdyYW1tYXIoc3RvcmUuZ3JhbW1hcilcbiAgICAudGhlbigoa2VybmVsU3BlY3MpID0+IHtcbiAgICAgIGlmIChrZXJuZWxQaWNrZXIpIHtcbiAgICAgICAga2VybmVsUGlja2VyLmtlcm5lbFNwZWNzID0ga2VybmVsU3BlY3M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXJuZWxQaWNrZXIgPSBuZXcgS2VybmVsUGlja2VyKGtlcm5lbFNwZWNzKTtcblxuICAgICAgICBrZXJuZWxQaWNrZXIub25Db25maXJtZWQgPSAoa2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhKSA9PiB7XG4gICAgICAgICAgY29uc3QgeyBlZGl0b3IsIGdyYW1tYXIsIGZpbGVQYXRoLCBtYXJrZXJzIH0gPSBzdG9yZTtcbiAgICAgICAgICBpZiAoIWVkaXRvciB8fCAhZ3JhbW1hciB8fCAhZmlsZVBhdGggfHwgIW1hcmtlcnMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWFya2Vycy5jbGVhcigpO1xuICAgICAgICAgIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWwoa2VybmVsU3BlYywgZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGtlcm5lbFBpY2tlci50b2dnbGUoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29ubmVjdFRvV1NLZXJuZWwoKSB7XG4gIGlmICghd3NLZXJuZWxQaWNrZXIpIHtcbiAgICB3c0tlcm5lbFBpY2tlciA9IG5ldyBXU0tlcm5lbFBpY2tlcigodHJhbnNwb3J0OiBXU0tlcm5lbCkgPT4ge1xuICAgICAgY29uc3Qga2VybmVsID0gbmV3IEtlcm5lbCh0cmFuc3BvcnQpO1xuICAgICAgY29uc3QgeyBlZGl0b3IsIGdyYW1tYXIsIGZpbGVQYXRoLCBtYXJrZXJzIH0gPSBzdG9yZTtcbiAgICAgIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCB8fCAhbWFya2Vycykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBtYXJrZXJzLmNsZWFyKCk7XG4gICAgICBpZiAoa2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFpNUUtlcm5lbCkge1xuICAgICAgICBrZXJuZWwuZGVzdHJveSgpO1xuICAgICAgfVxuICAgICAgc3RvcmUubmV3S2VybmVsKGtlcm5lbCwgZmlsZVBhdGgsIGVkaXRvciwgZ3JhbW1hcik7XG4gICAgfSk7XG4gIH1cblxuICB3c0tlcm5lbFBpY2tlci50b2dnbGUoKGtlcm5lbFNwZWM6IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT5cbiAgICBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyKGtlcm5lbFNwZWMsIHN0b3JlLmdyYW1tYXIpXG4gICk7XG59XG5cbi8vIEFjY2VwdHMgc3RvcmUgYXMgYW4gYXJnXG5mdW5jdGlvbiBjaGVja0Zvcktlcm5lbChcbiAge1xuICAgIGVkaXRvcixcbiAgICBncmFtbWFyLFxuICAgIGZpbGVQYXRoLFxuICAgIGtlcm5lbCxcbiAgfToge1xuICAgIGVkaXRvcjogVGV4dEVkaXRvcjtcbiAgICBncmFtbWFyOiBHcmFtbWFyO1xuICAgIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAga2VybmVsPzogS2VybmVsO1xuICB9LFxuICBjYWxsYmFjazogKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkXG4pIHtcbiAgaWYgKCFmaWxlUGF0aCB8fCAhZ3JhbW1hcikge1xuICAgIHJldHVybiBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICBcIlRoZSBsYW5ndWFnZSBncmFtbWFyIG11c3QgYmUgc2V0IGluIG9yZGVyIHRvIHN0YXJ0IGEga2VybmVsLiBUaGUgZWFzaWVzdCB3YXkgdG8gZG8gdGhpcyBpcyB0byBzYXZlIHRoZSBmaWxlLlwiXG4gICAgKTtcbiAgfVxuXG4gIGlmIChrZXJuZWwpIHtcbiAgICBjYWxsYmFjayhrZXJuZWwpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKG5ld0tlcm5lbDogS2VybmVsKSA9PlxuICAgIGNhbGxiYWNrKG5ld0tlcm5lbClcbiAgKTtcbn1cbiJdfQ==