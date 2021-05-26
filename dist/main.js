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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFPYztBQUVkLG9EQUF1QjtBQUN2QiwrQkFBK0I7QUFFL0Isa0VBQThDO0FBQzlDLDhEQUEwQztBQUMxQyxzRUFBNkM7QUFDN0MsNEVBQXVEO0FBQ3ZELHNEQUE4QjtBQUM5Qiw4REFBcUM7QUFDckMsNERBQW1DO0FBQ25DLHNEQUE4QjtBQUM5QixvRUFBMkM7QUFDM0MsMEVBQWdEO0FBQ2hELHNGQUE0RDtBQUM1RCx1RkFBOEQ7QUFDOUQsb0RBQWtEO0FBQ2xELHNFQUE2QztBQUM3QywwREFBa0M7QUFDbEMscURBQXVDO0FBQ3ZDLDREQUE4QztBQUM5QyxpREFBbUM7QUFFbkMsbUNBV2lCO0FBQ2pCLHVEQUFtRDtBQUNuRCx1REFBZ0U7QUFHbkQsUUFBQSxNQUFNLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLENBQUM7QUFDcEMsSUFBSSxPQUFpRSxDQUFDO0FBQ3RFLElBQUksWUFBc0MsQ0FBQztBQUMzQyxJQUFJLG9CQUFzRCxDQUFDO0FBQzNELElBQUksY0FBMEMsQ0FBQztBQUMvQyxJQUFJLGdCQUE4QyxDQUFDO0FBRW5ELFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxHQUFHLElBQUksY0FBTyxFQUFFLENBQUM7SUFDeEIsSUFBSSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7SUFDdkMsZUFBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUNyQiwyQkFBMkIsRUFDM0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO1FBQ3pCLElBQUksMEJBQTBCLEVBQUU7WUFDOUIsMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLE9BQU87U0FDUjtRQUVELElBQUksZUFBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ3BDLDBCQUEwQixHQUFHLElBQUksQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RDLFdBQVcsRUFDVCxnRUFBZ0U7Z0JBQ2xFLFdBQVcsRUFBRSxLQUFLO2FBQ25CLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQyxDQUNGLENBQ0YsQ0FBQztJQUNGLGVBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFO1FBQzVELGVBQUssQ0FBQyxjQUFjLENBQUMsMkJBQTJCLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQyxDQUFDLEVBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRTtRQUMvRCxlQUFLLENBQUMsY0FBYyxDQUFDLDhCQUE4QixFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDRixlQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDckIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ2YsOEJBQThCLEVBQzlCO1FBQ0UsY0FBYyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRTtRQUMzQixrQkFBa0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUU7UUFDbEMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFO1FBQzdDLDRCQUE0QixFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDN0MsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFO1FBQ3BDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDdEQseUJBQXlCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsbUJBQVcsQ0FBQztRQUNuRSw2QkFBNkIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUU7UUFDaEUsZ0NBQWdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsMEJBQWtCLENBQUMsQ0FBQztZQUNoRCxJQUFJLFFBQVEsRUFBRTtnQkFDWixRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDckI7UUFDSCxDQUFDO1FBQ0QsNkJBQTZCLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYyxFQUFFO1FBQ3JELG1DQUFtQyxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixFQUFFO1FBQzlELHFDQUFxQyxFQUFFLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixFQUFFO1FBQ3RFLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUN6QixJQUFJLGVBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLGVBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLGVBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0Qsc0JBQWMsQ0FBQyxtQkFBVyxDQUFDLENBQUM7YUFDN0I7UUFDSCxDQUFDO1FBQ0QsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1lBQzVCLElBQUksZUFBSyxDQUFDLE1BQU0sRUFBRTtnQkFDaEIsZUFBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLHNCQUFjLENBQUMsbUJBQVcsQ0FBQyxDQUFDO2FBQzdCO1FBQ0gsQ0FBQztRQUNELHlCQUF5QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BDLE1BQU0sd0JBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFDRCwyQkFBMkIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQUssQ0FBQztRQUNsRSwyQkFBMkIsRUFBRSxHQUFHLEVBQUUsQ0FDaEMsbUJBQW1CLENBQ2pCO1lBQ0UsT0FBTyxFQUFFLGtCQUFrQjtTQUM1QixFQUNELGVBQUssQ0FDTjtRQUNILHlCQUF5QixFQUFFLEdBQUcsRUFBRSxDQUM5QixtQkFBbUIsQ0FDakI7WUFDRSxPQUFPLEVBQUUsZ0JBQWdCO1NBQzFCLEVBQ0QsZUFBSyxDQUNOO1FBQ0gsMEJBQTBCLEVBQUUsR0FBRyxFQUFFLENBQy9CLG1CQUFtQixDQUNqQjtZQUNFLE9BQU8sRUFBRSxpQkFBaUI7U0FDM0IsRUFDRCxlQUFLLENBQ047UUFDSCx1QkFBdUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGVBQUssQ0FBQztRQUN4RCwwQkFBMEIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQ0FBYyxFQUFFO1FBQ2xELDRCQUE0QixFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWUsRUFBRTtRQUNyRCxvQ0FBb0MsRUFBRSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRTtRQUNuRSx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLGVBQUssQ0FBQztLQUMzRCxDQUNGLENBQ0YsQ0FBQztJQUNGLGVBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRTtRQUNsQywwQkFBMEIsRUFBRSxnQ0FBYztLQUMzQyxDQUFDLENBQ0gsQ0FBQztJQUVGLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFO1FBQ3BCLGVBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRTtZQUNsQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUUsQ0FBQyx3QkFBZ0IsRUFBRTtTQUN4RCxDQUFDLENBQ0gsQ0FBQztLQUNIO0lBRUQsZUFBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUNoRCxlQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDRixlQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQzNDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQ3RELG1CQUFtQixDQUFDLEdBQUcsQ0FDckIsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRTtZQUM3QixlQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUNILENBQUM7UUFFRixJQUFJLDhCQUFzQixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFO1lBQy9DLG1CQUFtQixDQUFDLEdBQUcsQ0FDckIsTUFBTSxDQUFDLHlCQUF5QixDQUM5QixnQkFBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2QsZUFBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQ1AsQ0FDRixDQUFDO1NBQ0g7UUFFRCxtQkFBbUIsQ0FBQyxHQUFHLENBQ3JCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFO1lBQ3ZCLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUNILENBQUM7UUFDRixtQkFBbUIsQ0FBQyxHQUFHLENBQ3JCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsZUFBSyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FDakUsQ0FBQztRQUNGLGVBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDL0MsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNGLGdCQUFnQixHQUFHLElBQUksQ0FBQztJQUN4QixlQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUMvQixRQUFRLEdBQUcsRUFBRTtZQUNYLEtBQUsscUJBQWE7Z0JBQ2hCLE9BQU8sSUFBSSxtQkFBYSxDQUFDLGVBQUssQ0FBQyxDQUFDO1lBRWxDLEtBQUssbUJBQVc7Z0JBQ2QsT0FBTyxJQUFJLGlCQUFXLENBQUMsZUFBSyxDQUFDLENBQUM7WUFFaEMsS0FBSyx1QkFBZTtnQkFDbEIsT0FBTyxJQUFJLHFCQUFVLENBQUMsZUFBSyxDQUFDLENBQUM7WUFFL0IsS0FBSywwQkFBa0I7Z0JBQ3JCLE9BQU8sSUFBSSx3QkFBaUIsQ0FBQyxlQUFLLENBQUMsQ0FBQztZQUN0QyxPQUFPLENBQUMsQ0FBQztnQkFDUCxPQUFPO2FBQ1I7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUNILENBQUM7SUFDRixlQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyw2QkFBVyxDQUFDLENBQUMsQ0FBQztJQUMvRCxlQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FFckIsSUFBSSxpQkFBVSxDQUFDLEdBQUcsRUFBRTtRQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzdDLElBQ0UsSUFBSSxZQUFZLG1CQUFhO2dCQUM3QixJQUFJLFlBQVksaUJBQVc7Z0JBQzNCLElBQUksWUFBWSxxQkFBVTtnQkFDMUIsSUFBSSxZQUFZLHdCQUFpQixFQUNqQztnQkFDQSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDaEI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDRixjQUFPLENBQUMsR0FBRyxFQUFFO1FBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxlQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBN0xELDRCQTZMQztBQUVELFNBQWdCLFVBQVU7SUFDeEIsZUFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2xCLENBQUM7QUFGRCxnQ0FFQztBQUdELFNBQWdCLGVBQWU7SUFDN0IsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1FBQ3JCLGdCQUFnQixHQUFHLElBQUksMkJBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEQ7SUFFRCxPQUFPLGdCQUFnQixDQUFDO0FBQzFCLENBQUM7QUFORCwwQ0FNQztBQUVELFNBQWdCLDBCQUEwQjtJQUN4QyxPQUFPLGtCQUFRLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsQ0FBQyxlQUFLLENBQUMsQ0FBQztBQUMxRSxDQUFDO0FBRkQsZ0VBRUM7QUFLRCxTQUFnQiw4QkFBOEIsQ0FDNUMsV0FBeUM7SUFFekMsT0FBTyxrQkFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLGVBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNwRSxDQUFDO0FBSkQsd0VBSUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxTQUFvQjtJQUNuRCxPQUFPLGtCQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQzdDLGVBQUssRUFDTCxTQUFTLEVBQ1QsbUJBQW1CLENBQ3BCLENBQUM7QUFDSixDQUFDO0FBTkQsNENBTUM7QUFHRCxTQUFTLHVCQUF1QjtJQUM5QixJQUFJLENBQUMsb0JBQW9CLEVBQUU7UUFDekIsb0JBQW9CLEdBQUcsSUFBSSxnQ0FBb0IsRUFBRSxDQUFDO0tBQ25EO0lBRUQsb0JBQW9CLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDaEMsQ0FBQztBQU9ELFNBQVMsbUJBQW1CLENBQzFCLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBaUIsRUFDbkMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFxQjtJQUV0QyxXQUFHLENBQUMsc0JBQXNCLEVBQUU7UUFDMUIsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO1FBQ3BCLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRTtLQUNwQixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1gsTUFBTSxPQUFPLEdBQUcsK0NBQStDLENBQUM7UUFDaEUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsT0FBTztLQUNSO0lBRUQsSUFBSSxPQUFPLEtBQUssa0JBQWtCLEVBQUU7UUFDbEMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO0tBQ3BCO1NBQU0sSUFBSSxPQUFPLEtBQUssZ0JBQWdCLEVBQUU7UUFDdkMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQ2xCO1NBQU0sSUFBSSxPQUFPLEtBQUssaUJBQWlCLEVBQUU7UUFDeEMsSUFBSSxPQUFPLEVBQUU7WUFDWCxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDakI7UUFFRCxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbEIsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQ2xCO1NBQU0sSUFDTCxPQUFPLEtBQUssZUFBZTtRQUMzQixNQUFNLENBQUMsU0FBUyxZQUFZLG1CQUFRLEVBQ3BDO1FBQ0EsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztLQUNqQztTQUFNLElBQUksT0FBTyxLQUFLLG1CQUFtQixFQUFFO1FBQzFDLElBQUksT0FBTyxFQUFFO1lBQ1gsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2pCO1FBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQUVELFNBQVMsR0FBRyxDQUFDLFdBQW9CLEtBQUs7SUFDcEMsTUFBTSxNQUFNLEdBQUcsZUFBSyxDQUFDLE1BQU0sQ0FBQztJQUM1QixJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1gsT0FBTztLQUNSO0lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQ25FLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFcEQsSUFBSSxDQUFDLFNBQVMsRUFBRTtRQUNkLE9BQU87S0FDUjtJQUVELE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7SUFDcEMsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO1FBQ3pCLE9BQU87S0FDUjtJQUNELE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7SUFDMUIsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFJLFlBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRSxNQUFNLElBQUksR0FDUixRQUFRLEtBQUssVUFBVTtRQUNyQixDQUFDLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUM7UUFDOUQsQ0FBQyxDQUFDLFlBQVksQ0FBQztJQUVuQixJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7UUFDckIsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDbkM7SUFFRCxjQUFjLENBQUMsZUFBSyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDL0IsTUFBTSxDQUFDLFlBQVksQ0FBQyxlQUFLLEVBQUU7WUFDekIsSUFBSTtZQUNKLEdBQUc7WUFDSCxRQUFRO1NBQ1QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxNQUFNLENBQUMsV0FBNkM7SUFDM0QsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLGVBQUssQ0FBQztJQUNwRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ3BDLE9BQU87S0FDUjtJQUVELElBQUksOEJBQXNCLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUU7UUFDL0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQ3pCLGdEQUFnRCxDQUNqRCxDQUFDO1FBQ0YsT0FBTztLQUNSO0lBRUQsSUFBSSxNQUFNLElBQUksTUFBTSxFQUFFO1FBQ3BCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXJDLE9BQU87S0FDUjtJQUVELHdCQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUU7UUFDekUsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQ2QsTUFBa0IsRUFDbEIsTUFBYyxFQUNkLFdBQTBCO0lBRTFCLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRXhELEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1FBQ3hCLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQzVCLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNwRSxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7WUFDekIsU0FBUztTQUNWO1FBQ0QsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FDckMsTUFBTSxFQUNOLEtBQUssQ0FBQyxHQUFHLEVBQ1QsV0FBVyxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FDbEQsQ0FBQztRQUNGLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFJLEdBQ1IsUUFBUSxLQUFLLFVBQVU7WUFDckIsQ0FBQyxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDO1lBQzlELENBQUMsQ0FBQyxZQUFZLENBQUM7UUFDbkIsY0FBYyxDQUFDLGVBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQy9CLE1BQU0sQ0FBQyxZQUFZLENBQUMsZUFBSyxFQUFFO2dCQUN6QixJQUFJO2dCQUNKLEdBQUc7Z0JBQ0gsUUFBUTthQUNULENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0tBQ0o7QUFDSCxDQUFDO0FBRUQsU0FBUyxXQUFXO0lBQ2xCLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxlQUFLLENBQUM7SUFDcEQsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNwQyxPQUFPO0tBQ1I7SUFFRCxJQUFJLDhCQUFzQixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFO1FBQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUN6QixzREFBc0QsQ0FDdkQsQ0FBQztRQUNGLE9BQU87S0FDUjtJQUVELElBQUksTUFBTSxJQUFJLE1BQU0sRUFBRTtRQUNwQixZQUFZLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTdCLE9BQU87S0FDUjtJQUVELHdCQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUU7UUFDekUsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxNQUFrQixFQUFFLE1BQWM7SUFDdEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDaEQsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hFLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkQsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztJQUV4RCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtRQUN4QixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztRQUM1QixNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDcEUsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FDckMsTUFBTSxFQUNOLEtBQUssQ0FBQyxHQUFHLEVBQ1QsV0FBVyxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FDbEQsQ0FBQztRQUNGLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFOUQsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO1lBQ3pCLE1BQU0sSUFBSSxHQUNSLFFBQVEsS0FBSyxVQUFVO2dCQUNyQixDQUFDLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUM7Z0JBQzlELENBQUMsQ0FBQyxZQUFZLENBQUM7WUFDbkIsY0FBYyxDQUFDLGVBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsWUFBWSxDQUFDLGVBQUssRUFBRTtvQkFDekIsSUFBSTtvQkFDSixHQUFHO29CQUNILFFBQVE7aUJBQ1QsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM5QixNQUFNO1NBQ1A7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxXQUFvQixLQUFLO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUIsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNYLE9BQU87S0FDUjtJQUVELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztJQUNuRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLFdBQVcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUQsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3BFLElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtRQUN6QixPQUFPO0tBQ1I7SUFDRCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsZUFBZSxDQUNyQyxNQUFNLEVBQ04sS0FBSyxDQUFDLEdBQUcsRUFDVCxXQUFXLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUNsRCxDQUFDO0lBQ0YsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5RCxNQUFNLElBQUksR0FDUixRQUFRLEtBQUssVUFBVTtRQUNyQixDQUFDLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUM7UUFDOUQsQ0FBQyxDQUFDLFlBQVksQ0FBQztJQUVuQixJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7UUFDckIsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDbkM7SUFFRCxjQUFjLENBQUMsZUFBSyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDL0IsTUFBTSxDQUFDLFlBQVksQ0FBQyxlQUFLLEVBQUU7WUFDekIsSUFBSTtZQUNKLEdBQUc7WUFDSCxRQUFRO1NBQ1QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxlQUFlO0lBQ3RCLE1BQU0sTUFBTSxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUIsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNYLE9BQU87S0FDUjtJQUNELFdBQVcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUVELFNBQVMscUJBQXFCO0lBQzVCLE1BQU0sTUFBTSxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUIsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNYLE9BQU87S0FDUjtJQUNELFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxjQUFjO0lBQ3JCLHdCQUFhO1NBQ1YsMkJBQTJCLENBQUMsZUFBSyxDQUFDLE9BQU8sQ0FBQztTQUMxQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUNwQixJQUFJLFlBQVksRUFBRTtZQUNoQixZQUFZLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztTQUN4QzthQUFNO1lBQ0wsWUFBWSxHQUFHLElBQUksdUJBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU3QyxZQUFZLENBQUMsV0FBVyxHQUFHLENBQUMsVUFBOEIsRUFBRSxFQUFFO2dCQUM1RCxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsZUFBSyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoRCxPQUFPO2lCQUNSO2dCQUNELE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsd0JBQWEsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDbkUsQ0FBQyxDQUFDO1NBQ0g7UUFFRCxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBUyxpQkFBaUI7SUFDeEIsSUFBSSxDQUFDLGNBQWMsRUFBRTtRQUNuQixjQUFjLEdBQUcsSUFBSSwwQkFBYyxDQUFDLENBQUMsU0FBbUIsRUFBRSxFQUFFO1lBQzFELE1BQU0sTUFBTSxHQUFHLElBQUksZ0JBQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsZUFBSyxDQUFDO1lBQ3JELElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hELE9BQU87YUFDUjtZQUNELE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQixJQUFJLE1BQU0sQ0FBQyxTQUFTLFlBQVksb0JBQVMsRUFBRTtnQkFDekMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2xCO1lBQ0QsZUFBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztLQUNKO0lBRUQsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFVBQThCLEVBQUUsRUFBRSxDQUN2RCxpQ0FBeUIsQ0FBQyxVQUFVLEVBQUUsZUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUNyRCxDQUFDO0FBQ0osQ0FBQztBQUdELFNBQVMsY0FBYyxDQUNyQixFQUNFLE1BQU0sRUFDTixPQUFPLEVBQ1AsUUFBUSxFQUNSLE1BQU0sR0FNUCxFQUNELFFBQWtDO0lBRWxDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDekIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FDaEMsOEdBQThHLENBQy9HLENBQUM7S0FDSDtJQUVELElBQUksTUFBTSxFQUFFO1FBQ1YsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pCLE9BQU87S0FDUjtJQUVELHdCQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsU0FBaUIsRUFBRSxFQUFFLENBQzVFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FDcEIsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIEVtaXR0ZXIsXHJcbiAgQ29tcG9zaXRlRGlzcG9zYWJsZSxcclxuICBEaXNwb3NhYmxlLFxyXG4gIFBvaW50LFxyXG4gIFRleHRFZGl0b3IsXHJcbiAgR3JhbW1hcixcclxufSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgeyBTdGF0dXNCYXIgfSBmcm9tIFwiYXRvbS9zdGF0dXMtYmFyXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHsgYXV0b3J1biB9IGZyb20gXCJtb2J4XCI7XHJcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcclxuaW1wb3J0IEluc3BlY3RvclBhbmUgZnJvbSBcIi4vcGFuZXMvaW5zcGVjdG9yXCI7XHJcbmltcG9ydCBXYXRjaGVzUGFuZSBmcm9tIFwiLi9wYW5lcy93YXRjaGVzXCI7XHJcbmltcG9ydCBPdXRwdXRQYW5lIGZyb20gXCIuL3BhbmVzL291dHB1dC1hcmVhXCI7XHJcbmltcG9ydCBLZXJuZWxNb25pdG9yUGFuZSBmcm9tIFwiLi9wYW5lcy9rZXJuZWwtbW9uaXRvclwiO1xyXG5pbXBvcnQgQ29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQgWk1RS2VybmVsIGZyb20gXCIuL3ptcS1rZXJuZWxcIjtcclxuaW1wb3J0IFdTS2VybmVsIGZyb20gXCIuL3dzLWtlcm5lbFwiO1xyXG5pbXBvcnQgS2VybmVsIGZyb20gXCIuL2tlcm5lbFwiO1xyXG5pbXBvcnQgS2VybmVsUGlja2VyIGZyb20gXCIuL2tlcm5lbC1waWNrZXJcIjtcclxuaW1wb3J0IFdTS2VybmVsUGlja2VyIGZyb20gXCIuL3dzLWtlcm5lbC1waWNrZXJcIjtcclxuaW1wb3J0IEV4aXN0aW5nS2VybmVsUGlja2VyIGZyb20gXCIuL2V4aXN0aW5nLWtlcm5lbC1waWNrZXJcIjtcclxuaW1wb3J0IEh5ZHJvZ2VuUHJvdmlkZXIgZnJvbSBcIi4vcGx1Z2luLWFwaS9oeWRyb2dlbi1wcm92aWRlclwiO1xyXG5pbXBvcnQgc3RvcmUsIHsgU3RvcmUsIFN0b3JlTGlrZSB9IGZyb20gXCIuL3N0b3JlXCI7XHJcbmltcG9ydCBrZXJuZWxNYW5hZ2VyIGZyb20gXCIuL2tlcm5lbC1tYW5hZ2VyXCI7XHJcbmltcG9ydCBzZXJ2aWNlcyBmcm9tIFwiLi9zZXJ2aWNlc1wiO1xyXG5pbXBvcnQgKiBhcyBjb21tYW5kcyBmcm9tIFwiLi9jb21tYW5kc1wiO1xyXG5pbXBvcnQgKiBhcyBjb2RlTWFuYWdlciBmcm9tIFwiLi9jb2RlLW1hbmFnZXJcIjtcclxuaW1wb3J0ICogYXMgcmVzdWx0IGZyb20gXCIuL3Jlc3VsdFwiO1xyXG5pbXBvcnQgdHlwZSBNYXJrZXJTdG9yZSBmcm9tIFwiLi9zdG9yZS9tYXJrZXJzXCI7XHJcbmltcG9ydCB7XHJcbiAgbG9nLFxyXG4gIHJlYWN0RmFjdG9yeSxcclxuICBpc011bHRpbGFuZ3VhZ2VHcmFtbWFyLFxyXG4gIElOU1BFQ1RPUl9VUkksXHJcbiAgV0FUQ0hFU19VUkksXHJcbiAgT1VUUFVUX0FSRUFfVVJJLFxyXG4gIEtFUk5FTF9NT05JVE9SX1VSSSxcclxuICBob3RSZWxvYWRQYWNrYWdlLFxyXG4gIG9wZW5PclNob3dEb2NrLFxyXG4gIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIsXHJcbn0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgZXhwb3J0Tm90ZWJvb2sgfSBmcm9tIFwiLi9leHBvcnQtbm90ZWJvb2tcIjtcclxuaW1wb3J0IHsgaW1wb3J0Tm90ZWJvb2ssIGlweW5iT3BlbmVyIH0gZnJvbSBcIi4vaW1wb3J0LW5vdGVib29rXCI7XHJcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnID0gQ29uZmlnLnNjaGVtYTtcclxubGV0IGVtaXR0ZXI6IEVtaXR0ZXI8e30sIHsgXCJkaWQtY2hhbmdlLWtlcm5lbFwiOiBLZXJuZWwgfT4gfCB1bmRlZmluZWQ7XHJcbmxldCBrZXJuZWxQaWNrZXI6IEtlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcclxubGV0IGV4aXN0aW5nS2VybmVsUGlja2VyOiBFeGlzdGluZ0tlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcclxubGV0IHdzS2VybmVsUGlja2VyOiBXU0tlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcclxubGV0IGh5ZHJvZ2VuUHJvdmlkZXI6IEh5ZHJvZ2VuUHJvdmlkZXIgfCB1bmRlZmluZWQ7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoKSB7XHJcbiAgZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XHJcbiAgbGV0IHNraXBMYW5ndWFnZU1hcHBpbmdzQ2hhbmdlID0gZmFsc2U7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZShcclxuICAgICAgXCJIeWRyb2dlbi5sYW5ndWFnZU1hcHBpbmdzXCIsXHJcbiAgICAgICh7IG5ld1ZhbHVlLCBvbGRWYWx1ZSB9KSA9PiB7XHJcbiAgICAgICAgaWYgKHNraXBMYW5ndWFnZU1hcHBpbmdzQ2hhbmdlKSB7XHJcbiAgICAgICAgICBza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSA9IGZhbHNlO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN0b3JlLnJ1bm5pbmdLZXJuZWxzLmxlbmd0aCAhPSAwKSB7XHJcbiAgICAgICAgICBza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSA9IHRydWU7XHJcbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoXCJIeWRyb2dlbi5sYW5ndWFnZU1hcHBpbmdzXCIsIG9sZFZhbHVlKTtcclxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkh5ZHJvZ2VuXCIsIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246XHJcbiAgICAgICAgICAgICAgXCJgbGFuZ3VhZ2VNYXBwaW5nc2AgY2Fubm90IGJlIHVwZGF0ZWQgd2hpbGUga2VybmVscyBhcmUgcnVubmluZ1wiLFxyXG4gICAgICAgICAgICBkaXNtaXNzYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIClcclxuICApO1xyXG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIkh5ZHJvZ2VuLnN0YXR1c0JhckRpc2FibGVcIiwgKG5ld1ZhbHVlKSA9PiB7XHJcbiAgICAgIHN0b3JlLnNldENvbmZpZ1ZhbHVlKFwiSHlkcm9nZW4uc3RhdHVzQmFyRGlzYWJsZVwiLCBCb29sZWFuKG5ld1ZhbHVlKSk7XHJcbiAgICB9KSxcclxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5zdGF0dXNCYXJLZXJuZWxJbmZvXCIsIChuZXdWYWx1ZSkgPT4ge1xyXG4gICAgICBzdG9yZS5zZXRDb25maWdWYWx1ZShcIkh5ZHJvZ2VuLnN0YXR1c0Jhcktlcm5lbEluZm9cIiwgQm9vbGVhbihuZXdWYWx1ZSkpO1xyXG4gICAgfSlcclxuICApO1xyXG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgYXRvbS5jb21tYW5kcy5hZGQ8XCJhdG9tLXRleHQtZWRpdG9yOm5vdChbbWluaV0pXCI+KFxyXG4gICAgICBcImF0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSlcIixcclxuICAgICAge1xyXG4gICAgICAgIFwiaHlkcm9nZW46cnVuXCI6ICgpID0+IHJ1bigpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46cnVuLWFsbFwiOiAoKSA9PiBydW5BbGwoKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1hbGwtYWJvdmVcIjogKCkgPT4gcnVuQWxsQWJvdmUoKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1hbmQtbW92ZS1kb3duXCI6ICgpID0+IHJ1bih0cnVlKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1jZWxsXCI6ICgpID0+IHJ1bkNlbGwoKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1jZWxsLWFuZC1tb3ZlLWRvd25cIjogKCkgPT4gcnVuQ2VsbCh0cnVlKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS13YXRjaGVzXCI6ICgpID0+IGF0b20ud29ya3NwYWNlLnRvZ2dsZShXQVRDSEVTX1VSSSksXHJcbiAgICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtb3V0cHV0LWFyZWFcIjogKCkgPT4gY29tbWFuZHMudG9nZ2xlT3V0cHV0TW9kZSgpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46dG9nZ2xlLWtlcm5lbC1tb25pdG9yXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IGxhc3RJdGVtID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKTtcclxuICAgICAgICAgIGNvbnN0IGxhc3RQYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0obGFzdEl0ZW0pO1xyXG4gICAgICAgICAgYXdhaXQgYXRvbS53b3Jrc3BhY2UudG9nZ2xlKEtFUk5FTF9NT05JVE9SX1VSSSk7XHJcbiAgICAgICAgICBpZiAobGFzdFBhbmUpIHtcclxuICAgICAgICAgICAgbGFzdFBhbmUuYWN0aXZhdGUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiaHlkcm9nZW46c3RhcnQtbG9jYWwta2VybmVsXCI6ICgpID0+IHN0YXJ0Wk1RS2VybmVsKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpjb25uZWN0LXRvLXJlbW90ZS1rZXJuZWxcIjogKCkgPT4gY29ubmVjdFRvV1NLZXJuZWwoKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOmNvbm5lY3QtdG8tZXhpc3Rpbmcta2VybmVsXCI6ICgpID0+IGNvbm5lY3RUb0V4aXN0aW5nS2VybmVsKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjphZGQtd2F0Y2hcIjogKCkgPT4ge1xyXG4gICAgICAgICAgaWYgKHN0b3JlLmtlcm5lbCkge1xyXG4gICAgICAgICAgICBzdG9yZS5rZXJuZWwud2F0Y2hlc1N0b3JlLmFkZFdhdGNoRnJvbUVkaXRvcihzdG9yZS5lZGl0b3IpO1xyXG4gICAgICAgICAgICBvcGVuT3JTaG93RG9jayhXQVRDSEVTX1VSSSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnJlbW92ZS13YXRjaFwiOiAoKSA9PiB7XHJcbiAgICAgICAgICBpZiAoc3RvcmUua2VybmVsKSB7XHJcbiAgICAgICAgICAgIHN0b3JlLmtlcm5lbC53YXRjaGVzU3RvcmUucmVtb3ZlV2F0Y2goKTtcclxuICAgICAgICAgICAgb3Blbk9yU2hvd0RvY2soV0FUQ0hFU19VUkkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJoeWRyb2dlbjp1cGRhdGUta2VybmVsc1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICBhd2FpdCBrZXJuZWxNYW5hZ2VyLnVwZGF0ZUtlcm5lbFNwZWNzKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS1pbnNwZWN0b3JcIjogKCkgPT4gY29tbWFuZHMudG9nZ2xlSW5zcGVjdG9yKHN0b3JlKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOmludGVycnVwdC1rZXJuZWxcIjogKCkgPT5cclxuICAgICAgICAgIGhhbmRsZUtlcm5lbENvbW1hbmQoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjb21tYW5kOiBcImludGVycnVwdC1rZXJuZWxcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3RvcmVcclxuICAgICAgICAgICksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpyZXN0YXJ0LWtlcm5lbFwiOiAoKSA9PlxyXG4gICAgICAgICAgaGFuZGxlS2VybmVsQ29tbWFuZChcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGNvbW1hbmQ6IFwicmVzdGFydC1rZXJuZWxcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3RvcmVcclxuICAgICAgICAgICksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpzaHV0ZG93bi1rZXJuZWxcIjogKCkgPT5cclxuICAgICAgICAgIGhhbmRsZUtlcm5lbENvbW1hbmQoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjb21tYW5kOiBcInNodXRkb3duLWtlcm5lbFwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdG9yZVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOmNsZWFyLXJlc3VsdFwiOiAoKSA9PiByZXN1bHQuY2xlYXJSZXN1bHQoc3RvcmUpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46ZXhwb3J0LW5vdGVib29rXCI6ICgpID0+IGV4cG9ydE5vdGVib29rKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpmb2xkLWN1cnJlbnQtY2VsbFwiOiAoKSA9PiBmb2xkQ3VycmVudENlbGwoKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOmZvbGQtYWxsLWJ1dC1jdXJyZW50LWNlbGxcIjogKCkgPT4gZm9sZEFsbEJ1dEN1cnJlbnRDZWxsKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpjbGVhci1yZXN1bHRzXCI6ICgpID0+IHJlc3VsdC5jbGVhclJlc3VsdHMoc3RvcmUpLFxyXG4gICAgICB9XHJcbiAgICApXHJcbiAgKTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwge1xyXG4gICAgICBcImh5ZHJvZ2VuOmltcG9ydC1ub3RlYm9va1wiOiBpbXBvcnROb3RlYm9vayxcclxuICAgIH0pXHJcbiAgKTtcclxuXHJcbiAgaWYgKGF0b20uaW5EZXZNb2RlKCkpIHtcclxuICAgIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIHtcclxuICAgICAgICBcImh5ZHJvZ2VuOmhvdC1yZWxvYWQtcGFja2FnZVwiOiAoKSA9PiBob3RSZWxvYWRQYWNrYWdlKCksXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlVGV4dEVkaXRvcigoZWRpdG9yKSA9PiB7XHJcbiAgICAgIHN0b3JlLnVwZGF0ZUVkaXRvcihlZGl0b3IpO1xyXG4gICAgfSlcclxuICApO1xyXG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcclxuICAgICAgY29uc3QgZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgICAgIGVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKCkgPT4ge1xyXG4gICAgICAgICAgc3RvcmUuc2V0R3JhbW1hcihlZGl0b3IpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgICAgICAgZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXHJcbiAgICAgICAgICAgIF8uZGVib3VuY2UoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHN0b3JlLnNldEdyYW1tYXIoZWRpdG9yKTtcclxuICAgICAgICAgICAgfSwgNzUpXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XHJcbiAgICAgICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcclxuICAgICAgICBlZGl0b3Iub25EaWRDaGFuZ2VUaXRsZSgobmV3VGl0bGUpID0+IHN0b3JlLmZvcmNlRWRpdG9yVXBkYXRlKCkpXHJcbiAgICAgICk7XHJcbiAgICAgIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKGVkaXRvclN1YnNjcmlwdGlvbnMpO1xyXG4gICAgfSlcclxuICApO1xyXG4gIGh5ZHJvZ2VuUHJvdmlkZXIgPSBudWxsO1xyXG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKCh1cmkpID0+IHtcclxuICAgICAgc3dpdGNoICh1cmkpIHtcclxuICAgICAgICBjYXNlIElOU1BFQ1RPUl9VUkk6XHJcbiAgICAgICAgICByZXR1cm4gbmV3IEluc3BlY3RvclBhbmUoc3RvcmUpO1xyXG5cclxuICAgICAgICBjYXNlIFdBVENIRVNfVVJJOlxyXG4gICAgICAgICAgcmV0dXJuIG5ldyBXYXRjaGVzUGFuZShzdG9yZSk7XHJcblxyXG4gICAgICAgIGNhc2UgT1VUUFVUX0FSRUFfVVJJOlxyXG4gICAgICAgICAgcmV0dXJuIG5ldyBPdXRwdXRQYW5lKHN0b3JlKTtcclxuXHJcbiAgICAgICAgY2FzZSBLRVJORUxfTU9OSVRPUl9VUkk6XHJcbiAgICAgICAgICByZXR1cm4gbmV3IEtlcm5lbE1vbml0b3JQYW5lKHN0b3JlKTtcclxuICAgICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKGlweW5iT3BlbmVyKSk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICAvLyBEZXN0cm95IGFueSBQYW5lcyB3aGVuIHRoZSBwYWNrYWdlIGlzIGRlYWN0aXZhdGVkLlxyXG4gICAgbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xyXG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRQYW5lSXRlbXMoKS5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIEluc3BlY3RvclBhbmUgfHxcclxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBXYXRjaGVzUGFuZSB8fFxyXG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIE91dHB1dFBhbmUgfHxcclxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBLZXJuZWxNb25pdG9yUGFuZVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgaXRlbS5kZXN0cm95KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgKTtcclxuICBhdXRvcnVuKCgpID0+IHtcclxuICAgIGVtaXR0ZXIuZW1pdChcImRpZC1jaGFuZ2Uta2VybmVsXCIsIHN0b3JlLmtlcm5lbCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xyXG4gIHN0b3JlLmRpc3Bvc2UoKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLSBTZXJ2aWNlIFByb3ZpZGVycyAtLS0tLS0tLS0tLS0tLSovXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlSHlkcm9nZW4oKSB7XHJcbiAgaWYgKCFoeWRyb2dlblByb3ZpZGVyKSB7XHJcbiAgICBoeWRyb2dlblByb3ZpZGVyID0gbmV3IEh5ZHJvZ2VuUHJvdmlkZXIoZW1pdHRlcik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaHlkcm9nZW5Qcm92aWRlcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVBdXRvY29tcGxldGVSZXN1bHRzKCkge1xyXG4gIHJldHVybiBzZXJ2aWNlcy5wcm92aWRlZC5hdXRvY29tcGxldGUucHJvdmlkZUF1dG9jb21wbGV0ZVJlc3VsdHMoc3RvcmUpO1xyXG59XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0gU2VydmljZSBDb25zdW1lcnMgLS0tLS0tLS0tLS0tLS0qL1xyXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUF1dG9jb21wbGV0ZVdhdGNoRWRpdG9yKFxyXG4gIHdhdGNoRWRpdG9yOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55XHJcbikge1xyXG4gIHJldHVybiBzZXJ2aWNlcy5jb25zdW1lZC5hdXRvY29tcGxldGUuY29uc3VtZShzdG9yZSwgd2F0Y2hFZGl0b3IpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IFN0YXR1c0Jhcikge1xyXG4gIHJldHVybiBzZXJ2aWNlcy5jb25zdW1lZC5zdGF0dXNCYXIuYWRkU3RhdHVzQmFyKFxyXG4gICAgc3RvcmUsXHJcbiAgICBzdGF0dXNCYXIsXHJcbiAgICBoYW5kbGVLZXJuZWxDb21tYW5kXHJcbiAgKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbmZ1bmN0aW9uIGNvbm5lY3RUb0V4aXN0aW5nS2VybmVsKCkge1xyXG4gIGlmICghZXhpc3RpbmdLZXJuZWxQaWNrZXIpIHtcclxuICAgIGV4aXN0aW5nS2VybmVsUGlja2VyID0gbmV3IEV4aXN0aW5nS2VybmVsUGlja2VyKCk7XHJcbiAgfVxyXG5cclxuICBleGlzdGluZ0tlcm5lbFBpY2tlci50b2dnbGUoKTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEtlcm5lbENvbW1hbmQge1xyXG4gIGNvbW1hbmQ6IHN0cmluZztcclxuICBwYXlsb2FkPzogS2VybmVsc3BlY01ldGFkYXRhIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlS2VybmVsQ29tbWFuZChcclxuICB7IGNvbW1hbmQsIHBheWxvYWQgfTogS2VybmVsQ29tbWFuZCwgLy8gVE9ETyBwYXlsb2FkIGlzIG5vdCB1c2VkIVxyXG4gIHsga2VybmVsLCBtYXJrZXJzIH06IFN0b3JlIHwgU3RvcmVMaWtlXHJcbikge1xyXG4gIGxvZyhcImhhbmRsZUtlcm5lbENvbW1hbmQ6XCIsIFtcclxuICAgIHsgY29tbWFuZCwgcGF5bG9hZCB9LFxyXG4gICAgeyBrZXJuZWwsIG1hcmtlcnMgfSxcclxuICBdKTtcclxuXHJcbiAgaWYgKCFrZXJuZWwpIHtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSBcIk5vIHJ1bm5pbmcga2VybmVsIGZvciBncmFtbWFyIG9yIGVkaXRvciBmb3VuZFwiO1xyXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKGNvbW1hbmQgPT09IFwiaW50ZXJydXB0LWtlcm5lbFwiKSB7XHJcbiAgICBrZXJuZWwuaW50ZXJydXB0KCk7XHJcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcInJlc3RhcnQta2VybmVsXCIpIHtcclxuICAgIGtlcm5lbC5yZXN0YXJ0KCk7XHJcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcInNodXRkb3duLWtlcm5lbFwiKSB7XHJcbiAgICBpZiAobWFya2Vycykge1xyXG4gICAgICBtYXJrZXJzLmNsZWFyKCk7XHJcbiAgICB9XHJcbiAgICAvLyBOb3RlIHRoYXQgZGVzdHJveSBhbG9uZSBkb2VzIG5vdCBzaHV0IGRvd24gYSBXU0tlcm5lbFxyXG4gICAga2VybmVsLnNodXRkb3duKCk7XHJcbiAgICBrZXJuZWwuZGVzdHJveSgpO1xyXG4gIH0gZWxzZSBpZiAoXHJcbiAgICBjb21tYW5kID09PSBcInJlbmFtZS1rZXJuZWxcIiAmJlxyXG4gICAga2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFdTS2VybmVsXHJcbiAgKSB7XHJcbiAgICBrZXJuZWwudHJhbnNwb3J0LnByb21wdFJlbmFtZSgpO1xyXG4gIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gXCJkaXNjb25uZWN0LWtlcm5lbFwiKSB7XHJcbiAgICBpZiAobWFya2Vycykge1xyXG4gICAgICBtYXJrZXJzLmNsZWFyKCk7XHJcbiAgICB9XHJcbiAgICBrZXJuZWwuZGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcnVuKG1vdmVEb3duOiBib29sZWFuID0gZmFsc2UpIHtcclxuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XHJcbiAgaWYgKCFlZGl0b3IpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL250ZXJhY3QvaHlkcm9nZW4vaXNzdWVzLzE0NTJcclxuICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvci5lbGVtZW50LCBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKTtcclxuICBjb25zdCBjb2RlQmxvY2sgPSBjb2RlTWFuYWdlci5maW5kQ29kZUJsb2NrKGVkaXRvcik7XHJcblxyXG4gIGlmICghY29kZUJsb2NrKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlQmxvY2suY29kZTtcclxuICBpZiAoY29kZU51bGxhYmxlID09PSBudWxsKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHsgcm93IH0gPSBjb2RlQmxvY2s7XHJcbiAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIG5ldyBQb2ludChyb3csIDApKTtcclxuICBjb25zdCBjb2RlID1cclxuICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcclxuICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcclxuICAgICAgOiBjb2RlTnVsbGFibGU7XHJcblxyXG4gIGlmIChtb3ZlRG93biA9PT0gdHJ1ZSkge1xyXG4gICAgY29kZU1hbmFnZXIubW92ZURvd24oZWRpdG9yLCByb3cpO1xyXG4gIH1cclxuXHJcbiAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcclxuICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcclxuICAgICAgY29kZSxcclxuICAgICAgcm93LFxyXG4gICAgICBjZWxsVHlwZSxcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5BbGwoYnJlYWtwb2ludHM/OiBBcnJheTxQb2ludD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcbiAgY29uc3QgeyBlZGl0b3IsIGtlcm5lbCwgZ3JhbW1hciwgZmlsZVBhdGggfSA9IHN0b3JlO1xyXG4gIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcclxuICAgICAgJ1wiUnVuIEFsbFwiIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHRoaXMgZmlsZSB0eXBlISdcclxuICAgICk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoZWRpdG9yICYmIGtlcm5lbCkge1xyXG4gICAgX3J1bkFsbChlZGl0b3IsIGtlcm5lbCwgYnJlYWtwb2ludHMpO1xyXG5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKGtlcm5lbDogS2VybmVsKSA9PiB7XHJcbiAgICBfcnVuQWxsKGVkaXRvciwga2VybmVsLCBicmVha3BvaW50cyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9ydW5BbGwoXHJcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gIGtlcm5lbDogS2VybmVsLFxyXG4gIGJyZWFrcG9pbnRzPzogQXJyYXk8UG9pbnQ+XHJcbikge1xyXG4gIGNvbnN0IGNlbGxzID0gY29kZU1hbmFnZXIuZ2V0Q2VsbHMoZWRpdG9yLCBicmVha3BvaW50cyk7XHJcblxyXG4gIGZvciAoY29uc3QgY2VsbCBvZiBjZWxscykge1xyXG4gICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBjZWxsO1xyXG4gICAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcclxuICAgIGlmIChjb2RlTnVsbGFibGUgPT09IG51bGwpIHtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCByb3cgPSBjb2RlTWFuYWdlci5lc2NhcGVCbGFua1Jvd3MoXHJcbiAgICAgIGVkaXRvcixcclxuICAgICAgc3RhcnQucm93LFxyXG4gICAgICBjb2RlTWFuYWdlci5nZXRFc2NhcGVCbGFua1Jvd3NFbmRSb3coZWRpdG9yLCBlbmQpXHJcbiAgICApO1xyXG4gICAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcclxuICAgIGNvbnN0IGNvZGUgPVxyXG4gICAgICBjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiXHJcbiAgICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcclxuICAgICAgICA6IGNvZGVOdWxsYWJsZTtcclxuICAgIGNoZWNrRm9yS2VybmVsKHN0b3JlLCAoa2VybmVsKSA9PiB7XHJcbiAgICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcclxuICAgICAgICBjb2RlLFxyXG4gICAgICAgIHJvdyxcclxuICAgICAgICBjZWxsVHlwZSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1bkFsbEFib3ZlKCkge1xyXG4gIGNvbnN0IHsgZWRpdG9yLCBrZXJuZWwsIGdyYW1tYXIsIGZpbGVQYXRoIH0gPSBzdG9yZTtcclxuICBpZiAoIWVkaXRvciB8fCAhZ3JhbW1hciB8fCAhZmlsZVBhdGgpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XHJcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXHJcbiAgICAgICdcIlJ1biBBbGwgQWJvdmVcIiBpcyBub3Qgc3VwcG9ydGVkIGZvciB0aGlzIGZpbGUgdHlwZSEnXHJcbiAgICApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKGVkaXRvciAmJiBrZXJuZWwpIHtcclxuICAgIF9ydW5BbGxBYm92ZShlZGl0b3IsIGtlcm5lbCk7XHJcblxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbEZvcihncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoLCAoa2VybmVsOiBLZXJuZWwpID0+IHtcclxuICAgIF9ydW5BbGxBYm92ZShlZGl0b3IsIGtlcm5lbCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9ydW5BbGxBYm92ZShlZGl0b3I6IFRleHRFZGl0b3IsIGtlcm5lbDogS2VybmVsKSB7XHJcbiAgY29uc3QgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgY3Vyc29yLmNvbHVtbiA9IGVkaXRvci5nZXRCdWZmZXIoKS5saW5lTGVuZ3RoRm9yUm93KGN1cnNvci5yb3cpO1xyXG4gIGNvbnN0IGJyZWFrcG9pbnRzID0gY29kZU1hbmFnZXIuZ2V0QnJlYWtwb2ludHMoZWRpdG9yKTtcclxuICBicmVha3BvaW50cy5wdXNoKGN1cnNvcik7XHJcbiAgY29uc3QgY2VsbHMgPSBjb2RlTWFuYWdlci5nZXRDZWxscyhlZGl0b3IsIGJyZWFrcG9pbnRzKTtcclxuXHJcbiAgZm9yIChjb25zdCBjZWxsIG9mIGNlbGxzKSB7XHJcbiAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNlbGw7XHJcbiAgICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xyXG4gICAgY29uc3Qgcm93ID0gY29kZU1hbmFnZXIuZXNjYXBlQmxhbmtSb3dzKFxyXG4gICAgICBlZGl0b3IsXHJcbiAgICAgIHN0YXJ0LnJvdyxcclxuICAgICAgY29kZU1hbmFnZXIuZ2V0RXNjYXBlQmxhbmtSb3dzRW5kUm93KGVkaXRvciwgZW5kKVxyXG4gICAgKTtcclxuICAgIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XHJcblxyXG4gICAgaWYgKGNvZGVOdWxsYWJsZSAhPT0gbnVsbCkge1xyXG4gICAgICBjb25zdCBjb2RlID1cclxuICAgICAgICBjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiXHJcbiAgICAgICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxyXG4gICAgICAgICAgOiBjb2RlTnVsbGFibGU7XHJcbiAgICAgIGNoZWNrRm9yS2VybmVsKHN0b3JlLCAoa2VybmVsKSA9PiB7XHJcbiAgICAgICAgcmVzdWx0LmNyZWF0ZVJlc3VsdChzdG9yZSwge1xyXG4gICAgICAgICAgY29kZSxcclxuICAgICAgICAgIHJvdyxcclxuICAgICAgICAgIGNlbGxUeXBlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2VsbC5jb250YWluc1BvaW50KGN1cnNvcikpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBydW5DZWxsKG1vdmVEb3duOiBib29sZWFuID0gZmFsc2UpIHtcclxuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XHJcbiAgaWYgKCFlZGl0b3IpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL250ZXJhY3QvaHlkcm9nZW4vaXNzdWVzLzE0NTJcclxuICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvci5lbGVtZW50LCBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKTtcclxuICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNvZGVNYW5hZ2VyLmdldEN1cnJlbnRDZWxsKGVkaXRvcik7XHJcbiAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcclxuICBpZiAoY29kZU51bGxhYmxlID09PSBudWxsKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcclxuICAgIGVkaXRvcixcclxuICAgIHN0YXJ0LnJvdyxcclxuICAgIGNvZGVNYW5hZ2VyLmdldEVzY2FwZUJsYW5rUm93c0VuZFJvdyhlZGl0b3IsIGVuZClcclxuICApO1xyXG4gIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XHJcbiAgY29uc3QgY29kZSA9XHJcbiAgICBjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiXHJcbiAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXHJcbiAgICAgIDogY29kZU51bGxhYmxlO1xyXG5cclxuICBpZiAobW92ZURvd24gPT09IHRydWUpIHtcclxuICAgIGNvZGVNYW5hZ2VyLm1vdmVEb3duKGVkaXRvciwgcm93KTtcclxuICB9XHJcblxyXG4gIGNoZWNrRm9yS2VybmVsKHN0b3JlLCAoa2VybmVsKSA9PiB7XHJcbiAgICByZXN1bHQuY3JlYXRlUmVzdWx0KHN0b3JlLCB7XHJcbiAgICAgIGNvZGUsXHJcbiAgICAgIHJvdyxcclxuICAgICAgY2VsbFR5cGUsXHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9sZEN1cnJlbnRDZWxsKCkge1xyXG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcclxuICBpZiAoIWVkaXRvcikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb2RlTWFuYWdlci5mb2xkQ3VycmVudENlbGwoZWRpdG9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9sZEFsbEJ1dEN1cnJlbnRDZWxsKCkge1xyXG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcclxuICBpZiAoIWVkaXRvcikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb2RlTWFuYWdlci5mb2xkQWxsQnV0Q3VycmVudENlbGwoZWRpdG9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RhcnRaTVFLZXJuZWwoKSB7XHJcbiAga2VybmVsTWFuYWdlclxyXG4gICAgLmdldEFsbEtlcm5lbFNwZWNzRm9yR3JhbW1hcihzdG9yZS5ncmFtbWFyKVxyXG4gICAgLnRoZW4oKGtlcm5lbFNwZWNzKSA9PiB7XHJcbiAgICAgIGlmIChrZXJuZWxQaWNrZXIpIHtcclxuICAgICAgICBrZXJuZWxQaWNrZXIua2VybmVsU3BlY3MgPSBrZXJuZWxTcGVjcztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBrZXJuZWxQaWNrZXIgPSBuZXcgS2VybmVsUGlja2VyKGtlcm5lbFNwZWNzKTtcclxuXHJcbiAgICAgICAga2VybmVsUGlja2VyLm9uQ29uZmlybWVkID0gKGtlcm5lbFNwZWM6IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgeyBlZGl0b3IsIGdyYW1tYXIsIGZpbGVQYXRoLCBtYXJrZXJzIH0gPSBzdG9yZTtcclxuICAgICAgICAgIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCB8fCAhbWFya2Vycykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBtYXJrZXJzLmNsZWFyKCk7XHJcbiAgICAgICAgICBrZXJuZWxNYW5hZ2VyLnN0YXJ0S2VybmVsKGtlcm5lbFNwZWMsIGdyYW1tYXIsIGVkaXRvciwgZmlsZVBhdGgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGtlcm5lbFBpY2tlci50b2dnbGUoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25uZWN0VG9XU0tlcm5lbCgpIHtcclxuICBpZiAoIXdzS2VybmVsUGlja2VyKSB7XHJcbiAgICB3c0tlcm5lbFBpY2tlciA9IG5ldyBXU0tlcm5lbFBpY2tlcigodHJhbnNwb3J0OiBXU0tlcm5lbCkgPT4ge1xyXG4gICAgICBjb25zdCBrZXJuZWwgPSBuZXcgS2VybmVsKHRyYW5zcG9ydCk7XHJcbiAgICAgIGNvbnN0IHsgZWRpdG9yLCBncmFtbWFyLCBmaWxlUGF0aCwgbWFya2VycyB9ID0gc3RvcmU7XHJcbiAgICAgIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCB8fCAhbWFya2Vycykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBtYXJrZXJzLmNsZWFyKCk7XHJcbiAgICAgIGlmIChrZXJuZWwudHJhbnNwb3J0IGluc3RhbmNlb2YgWk1RS2VybmVsKSB7XHJcbiAgICAgICAga2VybmVsLmRlc3Ryb3koKTtcclxuICAgICAgfVxyXG4gICAgICBzdG9yZS5uZXdLZXJuZWwoa2VybmVsLCBmaWxlUGF0aCwgZWRpdG9yLCBncmFtbWFyKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgd3NLZXJuZWxQaWNrZXIudG9nZ2xlKChrZXJuZWxTcGVjOiBLZXJuZWxzcGVjTWV0YWRhdGEpID0+XHJcbiAgICBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyKGtlcm5lbFNwZWMsIHN0b3JlLmdyYW1tYXIpXHJcbiAgKTtcclxufVxyXG5cclxuLy8gQWNjZXB0cyBzdG9yZSBhcyBhbiBhcmdcclxuZnVuY3Rpb24gY2hlY2tGb3JLZXJuZWwoXHJcbiAge1xyXG4gICAgZWRpdG9yLFxyXG4gICAgZ3JhbW1hcixcclxuICAgIGZpbGVQYXRoLFxyXG4gICAga2VybmVsLFxyXG4gIH06IHtcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcjtcclxuICAgIGdyYW1tYXI6IEdyYW1tYXI7XHJcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xyXG4gICAga2VybmVsPzogS2VybmVsO1xyXG4gIH0sXHJcbiAgY2FsbGJhY2s6IChrZXJuZWw6IEtlcm5lbCkgPT4gdm9pZFxyXG4pIHtcclxuICBpZiAoIWZpbGVQYXRoIHx8ICFncmFtbWFyKSB7XHJcbiAgICByZXR1cm4gYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxyXG4gICAgICBcIlRoZSBsYW5ndWFnZSBncmFtbWFyIG11c3QgYmUgc2V0IGluIG9yZGVyIHRvIHN0YXJ0IGEga2VybmVsLiBUaGUgZWFzaWVzdCB3YXkgdG8gZG8gdGhpcyBpcyB0byBzYXZlIHRoZSBmaWxlLlwiXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgaWYgKGtlcm5lbCkge1xyXG4gICAgY2FsbGJhY2soa2VybmVsKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKG5ld0tlcm5lbDogS2VybmVsKSA9PlxyXG4gICAgY2FsbGJhY2sobmV3S2VybmVsKVxyXG4gICk7XHJcbn1cclxuIl19