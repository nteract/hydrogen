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
            editorSubscriptions.add(editor.onDidChangeCursorPosition(debounce_1.default(() => {
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
    if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
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
    if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
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
    kernelManager.startKernelFor(grammar, editor, filePath, (newKernel) => callback(newKernel));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFPYztBQUVkLCtEQUF1QztBQUN2QywrQkFBK0I7QUFFL0Isa0VBQThDO0FBQzlDLDhEQUEwQztBQUMxQyxzRUFBNkM7QUFDN0MsNEVBQXVEO0FBQ3ZELHNEQUE4QjtBQUM5Qiw4REFBcUM7QUFDckMsNERBQW1DO0FBQ25DLHNEQUE4QjtBQUM5QixvRUFBMkM7QUFDM0MsMEVBQWdEO0FBQ2hELHNGQUE0RDtBQUM1RCx1RkFBOEQ7QUFDOUQsb0RBQWtEO0FBQ2xELHFEQUFpRDtBQUNqRCwwREFBa0M7QUFDbEMscURBQXVDO0FBQ3ZDLDREQUE4QztBQUM5QyxpREFBbUM7QUFDbkMsbUNBVWlCO0FBQ2pCLHVEQUFtRDtBQUNuRCx1REFBZ0U7QUFHbkQsUUFBQSxNQUFNLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLENBQUM7QUFDcEMsSUFBSSxPQUFpRSxDQUFDO0FBQ3RFLElBQUksWUFBc0MsQ0FBQztBQUMzQyxJQUFJLG9CQUFzRCxDQUFDO0FBQzNELElBQUksY0FBMEMsQ0FBQztBQUMvQyxJQUFJLGdCQUE4QyxDQUFDO0FBQ25ELE1BQU0sYUFBYSxHQUFHLElBQUksOEJBQWEsRUFBRSxDQUFDO0FBRTFDLFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxHQUFHLElBQUksY0FBTyxFQUFFLENBQUM7SUFDeEIsSUFBSSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7SUFDdkMsZUFBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUNyQiwyQkFBMkIsRUFDM0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO1FBQ3pCLElBQUksMEJBQTBCLEVBQUU7WUFDOUIsMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLE9BQU87U0FD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QUM7QUFDSixDQUFDO0FBR0QsU0FBUyxjQUFjLENBQ3JCLEVBQ0UsTUFBTSxFQUNOLE9BQU8sRUFDUCxRQUFRLEVBQ1IsTUFBTSxHQU1QLEVBQ0QsUUFBa0M7SUFFbEMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUN6QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUNoQyw4R0FBOEcsQ0FDL0csQ0FBQztLQUNIO0lBRUQsSUFBSSxNQUFNLEVBQUU7UUFDVixRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakIsT0FBTztLQUNSO0lBRUQsYUFBYSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLFNBQWlCLEVBQUUsRUFBRSxDQUM1RSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQ3BCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBFbWl0dGVyLFxyXG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXHJcbiAgRGlzcG9zYWJsZSxcclxuICBQb2ludCxcclxuICBUZXh0RWRpdG9yLFxyXG4gIEdyYW1tYXIsXHJcbn0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHsgU3RhdHVzQmFyIH0gZnJvbSBcImF0b20vc3RhdHVzLWJhclwiO1xyXG5pbXBvcnQgZGVib3VuY2UgZnJvbSBcImxvZGFzaC9kZWJvdW5jZVwiO1xyXG5pbXBvcnQgeyBhdXRvcnVuIH0gZnJvbSBcIm1vYnhcIjtcclxuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xyXG5pbXBvcnQgSW5zcGVjdG9yUGFuZSBmcm9tIFwiLi9wYW5lcy9pbnNwZWN0b3JcIjtcclxuaW1wb3J0IFdhdGNoZXNQYW5lIGZyb20gXCIuL3BhbmVzL3dhdGNoZXNcIjtcclxuaW1wb3J0IE91dHB1dFBhbmUgZnJvbSBcIi4vcGFuZXMvb3V0cHV0LWFyZWFcIjtcclxuaW1wb3J0IEtlcm5lbE1vbml0b3JQYW5lIGZyb20gXCIuL3BhbmVzL2tlcm5lbC1tb25pdG9yXCI7XHJcbmltcG9ydCBDb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCBaTVFLZXJuZWwgZnJvbSBcIi4vem1xLWtlcm5lbFwiO1xyXG5pbXBvcnQgV1NLZXJuZWwgZnJvbSBcIi4vd3Mta2VybmVsXCI7XHJcbmltcG9ydCBLZXJuZWwgZnJvbSBcIi4va2VybmVsXCI7XHJcbmltcG9ydCBLZXJuZWxQaWNrZXIgZnJvbSBcIi4va2VybmVsLXBpY2tlclwiO1xyXG5pbXBvcnQgV1NLZXJuZWxQaWNrZXIgZnJvbSBcIi4vd3Mta2VybmVsLXBpY2tlclwiO1xyXG5pbXBvcnQgRXhpc3RpbmdLZXJuZWxQaWNrZXIgZnJvbSBcIi4vZXhpc3Rpbmcta2VybmVsLXBpY2tlclwiO1xyXG5pbXBvcnQgSHlkcm9nZW5Qcm92aWRlciBmcm9tIFwiLi9wbHVnaW4tYXBpL2h5ZHJvZ2VuLXByb3ZpZGVyXCI7XHJcbmltcG9ydCBzdG9yZSwgeyBTdG9yZSwgU3RvcmVMaWtlIH0gZnJvbSBcIi4vc3RvcmVcIjtcclxuaW1wb3J0IHsgS2VybmVsTWFuYWdlciB9IGZyb20gXCIuL2tlcm5lbC1tYW5hZ2VyXCI7XHJcbmltcG9ydCBzZXJ2aWNlcyBmcm9tIFwiLi9zZXJ2aWNlc1wiO1xyXG5pbXBvcnQgKiBhcyBjb21tYW5kcyBmcm9tIFwiLi9jb21tYW5kc1wiO1xyXG5pbXBvcnQgKiBhcyBjb2RlTWFuYWdlciBmcm9tIFwiLi9jb2RlLW1hbmFnZXJcIjtcclxuaW1wb3J0ICogYXMgcmVzdWx0IGZyb20gXCIuL3Jlc3VsdFwiO1xyXG5pbXBvcnQge1xyXG4gIGxvZyxcclxuICBpc011bHRpbGFuZ3VhZ2VHcmFtbWFyLFxyXG4gIElOU1BFQ1RPUl9VUkksXHJcbiAgV0FUQ0hFU19VUkksXHJcbiAgT1VUUFVUX0FSRUFfVVJJLFxyXG4gIEtFUk5FTF9NT05JVE9SX1VSSSxcclxuICBob3RSZWxvYWRQYWNrYWdlLFxyXG4gIG9wZW5PclNob3dEb2NrLFxyXG4gIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIsXHJcbn0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgZXhwb3J0Tm90ZWJvb2sgfSBmcm9tIFwiLi9leHBvcnQtbm90ZWJvb2tcIjtcclxuaW1wb3J0IHsgaW1wb3J0Tm90ZWJvb2ssIGlweW5iT3BlbmVyIH0gZnJvbSBcIi4vaW1wb3J0LW5vdGVib29rXCI7XHJcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnID0gQ29uZmlnLnNjaGVtYTtcclxubGV0IGVtaXR0ZXI6IEVtaXR0ZXI8e30sIHsgXCJkaWQtY2hhbmdlLWtlcm5lbFwiOiBLZXJuZWwgfT4gfCB1bmRlZmluZWQ7XHJcbmxldCBrZXJuZWxQaWNrZXI6IEtlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcclxubGV0IGV4aXN0aW5nS2VybmVsUGlja2VyOiBFeGlzdGluZ0tlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcclxubGV0IHdzS2VybmVsUGlja2VyOiBXU0tlcm5lbFBpY2tlciB8IHVuZGVmaW5lZDtcclxubGV0IGh5ZHJvZ2VuUHJvdmlkZXI6IEh5ZHJvZ2VuUHJvdmlkZXIgfCB1bmRlZmluZWQ7XHJcbmNvbnN0IGtlcm5lbE1hbmFnZXIgPSBuZXcgS2VybmVsTWFuYWdlcigpO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlKCkge1xyXG4gIGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpO1xyXG4gIGxldCBza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSA9IGZhbHNlO1xyXG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UoXHJcbiAgICAgIFwiSHlkcm9nZW4ubGFuZ3VhZ2VNYXBwaW5nc1wiLFxyXG4gICAgICAoeyBuZXdWYWx1ZSwgb2xkVmFsdWUgfSkgPT4ge1xyXG4gICAgICAgIGlmIChza2lwTGFuZ3VhZ2VNYXBwaW5nc0NoYW5nZSkge1xyXG4gICAgICAgICAgc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UgPSBmYWxzZTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdG9yZS5ydW5uaW5nS2VybmVscy5sZW5ndGggIT0gMCkge1xyXG4gICAgICAgICAgc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UgPSB0cnVlO1xyXG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KFwiSHlkcm9nZW4ubGFuZ3VhZ2VNYXBwaW5nc1wiLCBvbGRWYWx1ZSk7XHJcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJIeWRyb2dlblwiLCB7XHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxyXG4gICAgICAgICAgICAgIFwiYGxhbmd1YWdlTWFwcGluZ3NgIGNhbm5vdCBiZSB1cGRhdGVkIHdoaWxlIGtlcm5lbHMgYXJlIHJ1bm5pbmdcIixcclxuICAgICAgICAgICAgZGlzbWlzc2FibGU6IGZhbHNlLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICApXHJcbiAgKTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJIeWRyb2dlbi5zdGF0dXNCYXJEaXNhYmxlXCIsIChuZXdWYWx1ZSkgPT4ge1xyXG4gICAgICBzdG9yZS5zZXRDb25maWdWYWx1ZShcIkh5ZHJvZ2VuLnN0YXR1c0JhckRpc2FibGVcIiwgQm9vbGVhbihuZXdWYWx1ZSkpO1xyXG4gICAgfSksXHJcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwiSHlkcm9nZW4uc3RhdHVzQmFyS2VybmVsSW5mb1wiLCAobmV3VmFsdWUpID0+IHtcclxuICAgICAgc3RvcmUuc2V0Q29uZmlnVmFsdWUoXCJIeWRyb2dlbi5zdGF0dXNCYXJLZXJuZWxJbmZvXCIsIEJvb2xlYW4obmV3VmFsdWUpKTtcclxuICAgIH0pXHJcbiAgKTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIGF0b20uY29tbWFuZHMuYWRkPFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoW21pbmldKVwiPihcclxuICAgICAgXCJhdG9tLXRleHQtZWRpdG9yOm5vdChbbWluaV0pXCIsXHJcbiAgICAgIHtcclxuICAgICAgICBcImh5ZHJvZ2VuOnJ1blwiOiAoKSA9PiBydW4oKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnJ1bi1hbGxcIjogKCkgPT4gcnVuQWxsKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tYWxsLWFib3ZlXCI6ICgpID0+IHJ1bkFsbEFib3ZlKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tYW5kLW1vdmUtZG93blwiOiAoKSA9PiBydW4odHJ1ZSksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tY2VsbFwiOiAoKSA9PiBydW5DZWxsKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpydW4tY2VsbC1hbmQtbW92ZS1kb3duXCI6ICgpID0+IHJ1bkNlbGwodHJ1ZSksXHJcbiAgICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtd2F0Y2hlc1wiOiAoKSA9PiBhdG9tLndvcmtzcGFjZS50b2dnbGUoV0FUQ0hFU19VUkkpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46dG9nZ2xlLW91dHB1dC1hcmVhXCI6ICgpID0+IGNvbW1hbmRzLnRvZ2dsZU91dHB1dE1vZGUoKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS1rZXJuZWwtbW9uaXRvclwiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBsYXN0SXRlbSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCk7XHJcbiAgICAgICAgICBjb25zdCBsYXN0UGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGxhc3RJdGVtKTtcclxuICAgICAgICAgIGF3YWl0IGF0b20ud29ya3NwYWNlLnRvZ2dsZShLRVJORUxfTU9OSVRPUl9VUkkpO1xyXG4gICAgICAgICAgaWYgKGxhc3RQYW5lKSB7XHJcbiAgICAgICAgICAgIGxhc3RQYW5lLmFjdGl2YXRlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImh5ZHJvZ2VuOnN0YXJ0LWxvY2FsLWtlcm5lbFwiOiAoKSA9PiBzdGFydFpNUUtlcm5lbCgpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46Y29ubmVjdC10by1yZW1vdGUta2VybmVsXCI6ICgpID0+IGNvbm5lY3RUb1dTS2VybmVsKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpjb25uZWN0LXRvLWV4aXN0aW5nLWtlcm5lbFwiOiAoKSA9PiBjb25uZWN0VG9FeGlzdGluZ0tlcm5lbCgpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46YWRkLXdhdGNoXCI6ICgpID0+IHtcclxuICAgICAgICAgIGlmIChzdG9yZS5rZXJuZWwpIHtcclxuICAgICAgICAgICAgc3RvcmUua2VybmVsLndhdGNoZXNTdG9yZS5hZGRXYXRjaEZyb21FZGl0b3Ioc3RvcmUuZWRpdG9yKTtcclxuICAgICAgICAgICAgb3Blbk9yU2hvd0RvY2soV0FUQ0hFU19VUkkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJoeWRyb2dlbjpyZW1vdmUtd2F0Y2hcIjogKCkgPT4ge1xyXG4gICAgICAgICAgaWYgKHN0b3JlLmtlcm5lbCkge1xyXG4gICAgICAgICAgICBzdG9yZS5rZXJuZWwud2F0Y2hlc1N0b3JlLnJlbW92ZVdhdGNoKCk7XHJcbiAgICAgICAgICAgIG9wZW5PclNob3dEb2NrKFdBVENIRVNfVVJJKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiaHlkcm9nZW46dXBkYXRlLWtlcm5lbHNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgYXdhaXQga2VybmVsTWFuYWdlci51cGRhdGVLZXJuZWxTcGVjcygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtaW5zcGVjdG9yXCI6ICgpID0+IGNvbW1hbmRzLnRvZ2dsZUluc3BlY3RvcihzdG9yZSksXHJcbiAgICAgICAgXCJoeWRyb2dlbjppbnRlcnJ1cHQta2VybmVsXCI6ICgpID0+XHJcbiAgICAgICAgICBoYW5kbGVLZXJuZWxDb21tYW5kKFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgY29tbWFuZDogXCJpbnRlcnJ1cHQta2VybmVsXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0b3JlXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgIFwiaHlkcm9nZW46cmVzdGFydC1rZXJuZWxcIjogKCkgPT5cclxuICAgICAgICAgIGhhbmRsZUtlcm5lbENvbW1hbmQoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjb21tYW5kOiBcInJlc3RhcnQta2VybmVsXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0b3JlXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgIFwiaHlkcm9nZW46c2h1dGRvd24ta2VybmVsXCI6ICgpID0+XHJcbiAgICAgICAgICBoYW5kbGVLZXJuZWxDb21tYW5kKFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgY29tbWFuZDogXCJzaHV0ZG93bi1rZXJuZWxcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3RvcmVcclxuICAgICAgICAgICksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpjbGVhci1yZXN1bHRcIjogKCkgPT4gcmVzdWx0LmNsZWFyUmVzdWx0KHN0b3JlKSxcclxuICAgICAgICBcImh5ZHJvZ2VuOmV4cG9ydC1ub3RlYm9va1wiOiAoKSA9PiBleHBvcnROb3RlYm9vaygpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46Zm9sZC1jdXJyZW50LWNlbGxcIjogKCkgPT4gZm9sZEN1cnJlbnRDZWxsKCksXHJcbiAgICAgICAgXCJoeWRyb2dlbjpmb2xkLWFsbC1idXQtY3VycmVudC1jZWxsXCI6ICgpID0+IGZvbGRBbGxCdXRDdXJyZW50Q2VsbCgpLFxyXG4gICAgICAgIFwiaHlkcm9nZW46Y2xlYXItcmVzdWx0c1wiOiAoKSA9PiByZXN1bHQuY2xlYXJSZXN1bHRzKHN0b3JlKSxcclxuICAgICAgfVxyXG4gICAgKVxyXG4gICk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIHtcclxuICAgICAgXCJoeWRyb2dlbjppbXBvcnQtbm90ZWJvb2tcIjogaW1wb3J0Tm90ZWJvb2ssXHJcbiAgICB9KVxyXG4gICk7XHJcblxyXG4gIGlmIChhdG9tLmluRGV2TW9kZSgpKSB7XHJcbiAgICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCB7XHJcbiAgICAgICAgXCJoeWRyb2dlbjpob3QtcmVsb2FkLXBhY2thZ2VcIjogKCkgPT4gaG90UmVsb2FkUGFja2FnZSgpLFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVRleHRFZGl0b3IoKGVkaXRvcikgPT4ge1xyXG4gICAgICBzdG9yZS51cGRhdGVFZGl0b3IoZWRpdG9yKTtcclxuICAgIH0pXHJcbiAgKTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XHJcbiAgICAgIGNvbnN0IGVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcclxuICAgICAgICBlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKCgpID0+IHtcclxuICAgICAgICAgIHN0b3JlLnNldEdyYW1tYXIoZWRpdG9yKTtcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcclxuICAgICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcclxuICAgICAgICAgIGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKFxyXG4gICAgICAgICAgICBkZWJvdW5jZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgc3RvcmUuc2V0R3JhbW1hcihlZGl0b3IpO1xyXG4gICAgICAgICAgICB9LCA3NSlcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcclxuICAgICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgICAgIGVkaXRvci5vbkRpZENoYW5nZVRpdGxlKChuZXdUaXRsZSkgPT4gc3RvcmUuZm9yY2VFZGl0b3JVcGRhdGUoKSlcclxuICAgICAgKTtcclxuICAgICAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoZWRpdG9yU3Vic2NyaXB0aW9ucyk7XHJcbiAgICB9KVxyXG4gICk7XHJcbiAgaHlkcm9nZW5Qcm92aWRlciA9IG51bGw7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaSkgPT4ge1xyXG4gICAgICBzd2l0Y2ggKHVyaSkge1xyXG4gICAgICAgIGNhc2UgSU5TUEVDVE9SX1VSSTpcclxuICAgICAgICAgIHJldHVybiBuZXcgSW5zcGVjdG9yUGFuZShzdG9yZSk7XHJcblxyXG4gICAgICAgIGNhc2UgV0FUQ0hFU19VUkk6XHJcbiAgICAgICAgICByZXR1cm4gbmV3IFdhdGNoZXNQYW5lKHN0b3JlKTtcclxuXHJcbiAgICAgICAgY2FzZSBPVVRQVVRfQVJFQV9VUkk6XHJcbiAgICAgICAgICByZXR1cm4gbmV3IE91dHB1dFBhbmUoc3RvcmUpO1xyXG5cclxuICAgICAgICBjYXNlIEtFUk5FTF9NT05JVE9SX1VSSTpcclxuICAgICAgICAgIHJldHVybiBuZXcgS2VybmVsTW9uaXRvclBhbmUoc3RvcmUpO1xyXG4gICAgICAgIGRlZmF1bHQ6IHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgKTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoaXB5bmJPcGVuZXIpKTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIC8vIERlc3Ryb3kgYW55IFBhbmVzIHdoZW4gdGhlIHBhY2thZ2UgaXMgZGVhY3RpdmF0ZWQuXHJcbiAgICBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XHJcbiAgICAgIGF0b20ud29ya3NwYWNlLmdldFBhbmVJdGVtcygpLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBpdGVtIGluc3RhbmNlb2YgSW5zcGVjdG9yUGFuZSB8fFxyXG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIFdhdGNoZXNQYW5lIHx8XHJcbiAgICAgICAgICBpdGVtIGluc3RhbmNlb2YgT3V0cHV0UGFuZSB8fFxyXG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIEtlcm5lbE1vbml0b3JQYW5lXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICApO1xyXG4gIGF1dG9ydW4oKCkgPT4ge1xyXG4gICAgZW1pdHRlci5lbWl0KFwiZGlkLWNoYW5nZS1rZXJuZWxcIiwgc3RvcmUua2VybmVsKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XHJcbiAgc3RvcmUuZGlzcG9zZSgpO1xyXG59XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tIFNlcnZpY2UgUHJvdmlkZXJzIC0tLS0tLS0tLS0tLS0tKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVIeWRyb2dlbigpIHtcclxuICBpZiAoIWh5ZHJvZ2VuUHJvdmlkZXIpIHtcclxuICAgIGh5ZHJvZ2VuUHJvdmlkZXIgPSBuZXcgSHlkcm9nZW5Qcm92aWRlcihlbWl0dGVyKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBoeWRyb2dlblByb3ZpZGVyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUF1dG9jb21wbGV0ZVJlc3VsdHMoKSB7XHJcbiAgcmV0dXJuIHNlcnZpY2VzLnByb3ZpZGVkLmF1dG9jb21wbGV0ZS5wcm92aWRlQXV0b2NvbXBsZXRlUmVzdWx0cyhzdG9yZSk7XHJcbn1cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuLyotLS0tLS0tLS0tLS0tLSBTZXJ2aWNlIENvbnN1bWVycyAtLS0tLS0tLS0tLS0tLSovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lQXV0b2NvbXBsZXRlV2F0Y2hFZGl0b3IoXHJcbiAgd2F0Y2hFZGl0b3I6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnlcclxuKSB7XHJcbiAgcmV0dXJuIHNlcnZpY2VzLmNvbnN1bWVkLmF1dG9jb21wbGV0ZS5jb25zdW1lKHN0b3JlLCB3YXRjaEVkaXRvcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lU3RhdHVzQmFyKHN0YXR1c0JhcjogU3RhdHVzQmFyKSB7XHJcbiAgcmV0dXJuIHNlcnZpY2VzLmNvbnN1bWVkLnN0YXR1c0Jhci5hZGRTdGF0dXNCYXIoXHJcbiAgICBzdG9yZSxcclxuICAgIHN0YXR1c0JhcixcclxuICAgIGhhbmRsZUtlcm5lbENvbW1hbmRcclxuICApO1xyXG59XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuZnVuY3Rpb24gY29ubmVjdFRvRXhpc3RpbmdLZXJuZWwoKSB7XHJcbiAgaWYgKCFleGlzdGluZ0tlcm5lbFBpY2tlcikge1xyXG4gICAgZXhpc3RpbmdLZXJuZWxQaWNrZXIgPSBuZXcgRXhpc3RpbmdLZXJuZWxQaWNrZXIoKTtcclxuICB9XHJcblxyXG4gIGV4aXN0aW5nS2VybmVsUGlja2VyLnRvZ2dsZSgpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgS2VybmVsQ29tbWFuZCB7XHJcbiAgY29tbWFuZDogc3RyaW5nO1xyXG4gIHBheWxvYWQ/OiBLZXJuZWxzcGVjTWV0YWRhdGEgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVLZXJuZWxDb21tYW5kKFxyXG4gIHsgY29tbWFuZCwgcGF5bG9hZCB9OiBLZXJuZWxDb21tYW5kLCAvLyBUT0RPIHBheWxvYWQgaXMgbm90IHVzZWQhXHJcbiAgeyBrZXJuZWwsIG1hcmtlcnMgfTogU3RvcmUgfCBTdG9yZUxpa2VcclxuKSB7XHJcbiAgbG9nKFwiaGFuZGxlS2VybmVsQ29tbWFuZDpcIiwgW1xyXG4gICAgeyBjb21tYW5kLCBwYXlsb2FkIH0sXHJcbiAgICB7IGtlcm5lbCwgbWFya2VycyB9LFxyXG4gIF0pO1xyXG5cclxuICBpZiAoIWtlcm5lbCkge1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IFwiTm8gcnVubmluZyBrZXJuZWwgZm9yIGdyYW1tYXIgb3IgZWRpdG9yIGZvdW5kXCI7XHJcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoY29tbWFuZCA9PT0gXCJpbnRlcnJ1cHQta2VybmVsXCIpIHtcclxuICAgIGtlcm5lbC5pbnRlcnJ1cHQoKTtcclxuICB9IGVsc2UgaWYgKGNvbW1hbmQgPT09IFwicmVzdGFydC1rZXJuZWxcIikge1xyXG4gICAga2VybmVsLnJlc3RhcnQoKTtcclxuICB9IGVsc2UgaWYgKGNvbW1hbmQgPT09IFwic2h1dGRvd24ta2VybmVsXCIpIHtcclxuICAgIGlmIChtYXJrZXJzKSB7XHJcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgIH1cclxuICAgIC8vIE5vdGUgdGhhdCBkZXN0cm95IGFsb25lIGRvZXMgbm90IHNodXQgZG93biBhIFdTS2VybmVsXHJcbiAgICBrZXJuZWwuc2h1dGRvd24oKTtcclxuICAgIGtlcm5lbC5kZXN0cm95KCk7XHJcbiAgfSBlbHNlIGlmIChcclxuICAgIGNvbW1hbmQgPT09IFwicmVuYW1lLWtlcm5lbFwiICYmXHJcbiAgICBrZXJuZWwudHJhbnNwb3J0IGluc3RhbmNlb2YgV1NLZXJuZWxcclxuICApIHtcclxuICAgIGtlcm5lbC50cmFuc3BvcnQucHJvbXB0UmVuYW1lKCk7XHJcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcImRpc2Nvbm5lY3Qta2VybmVsXCIpIHtcclxuICAgIGlmIChtYXJrZXJzKSB7XHJcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgIH1cclxuICAgIGtlcm5lbC5kZXN0cm95KCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBydW4obW92ZURvd246IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcclxuICBpZiAoIWVkaXRvcikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbnRlcmFjdC9oeWRyb2dlbi9pc3N1ZXMvMTQ1MlxyXG4gIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWRpdG9yLmVsZW1lbnQsIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y2FuY2VsXCIpO1xyXG4gIGNvbnN0IGNvZGVCbG9jayA9IGNvZGVNYW5hZ2VyLmZpbmRDb2RlQmxvY2soZWRpdG9yKTtcclxuXHJcbiAgaWYgKCFjb2RlQmxvY2spIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNvZGVOdWxsYWJsZSA9IGNvZGVCbG9jay5jb2RlO1xyXG4gIGlmIChjb2RlTnVsbGFibGUgPT09IG51bGwpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgeyByb3cgfSA9IGNvZGVCbG9jaztcclxuICBjb25zdCBjZWxsVHlwZSA9IGNvZGVNYW5hZ2VyLmdldE1ldGFkYXRhRm9yUm93KGVkaXRvciwgbmV3IFBvaW50KHJvdywgMCkpO1xyXG4gIGNvbnN0IGNvZGUgPVxyXG4gICAgY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIlxyXG4gICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxyXG4gICAgICA6IGNvZGVOdWxsYWJsZTtcclxuXHJcbiAgaWYgKG1vdmVEb3duKSB7XHJcbiAgICBjb2RlTWFuYWdlci5tb3ZlRG93bihlZGl0b3IsIHJvdyk7XHJcbiAgfVxyXG5cclxuICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xyXG4gICAgcmVzdWx0LmNyZWF0ZVJlc3VsdChzdG9yZSwge1xyXG4gICAgICBjb2RlLFxyXG4gICAgICByb3csXHJcbiAgICAgIGNlbGxUeXBlLFxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1bkFsbChicmVha3BvaW50cz86IEFycmF5PFBvaW50PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICBjb25zdCB7IGVkaXRvciwga2VybmVsLCBncmFtbWFyLCBmaWxlUGF0aCB9ID0gc3RvcmU7XHJcbiAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxyXG4gICAgICAnXCJSdW4gQWxsXCIgaXMgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBmaWxlIHR5cGUhJ1xyXG4gICAgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChlZGl0b3IgJiYga2VybmVsKSB7XHJcbiAgICBfcnVuQWxsKGVkaXRvciwga2VybmVsLCBicmVha3BvaW50cyk7XHJcblxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbEZvcihncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoLCAoa2VybmVsOiBLZXJuZWwpID0+IHtcclxuICAgIF9ydW5BbGwoZWRpdG9yLCBrZXJuZWwsIGJyZWFrcG9pbnRzKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gX3J1bkFsbChcclxuICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAga2VybmVsOiBLZXJuZWwsXHJcbiAgYnJlYWtwb2ludHM/OiBBcnJheTxQb2ludD5cclxuKSB7XHJcbiAgY29uc3QgY2VsbHMgPSBjb2RlTWFuYWdlci5nZXRDZWxscyhlZGl0b3IsIGJyZWFrcG9pbnRzKTtcclxuXHJcbiAgZm9yIChjb25zdCBjZWxsIG9mIGNlbGxzKSB7XHJcbiAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNlbGw7XHJcbiAgICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xyXG4gICAgaWYgKGNvZGVOdWxsYWJsZSA9PT0gbnVsbCkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcclxuICAgICAgZWRpdG9yLFxyXG4gICAgICBzdGFydC5yb3csXHJcbiAgICAgIGNvZGVNYW5hZ2VyLmdldEVzY2FwZUJsYW5rUm93c0VuZFJvdyhlZGl0b3IsIGVuZClcclxuICAgICk7XHJcbiAgICBjb25zdCBjZWxsVHlwZSA9IGNvZGVNYW5hZ2VyLmdldE1ldGFkYXRhRm9yUm93KGVkaXRvciwgc3RhcnQpO1xyXG4gICAgY29uc3QgY29kZSA9XHJcbiAgICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcclxuICAgICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxyXG4gICAgICAgIDogY29kZU51bGxhYmxlO1xyXG4gICAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcclxuICAgICAgcmVzdWx0LmNyZWF0ZVJlc3VsdChzdG9yZSwge1xyXG4gICAgICAgIGNvZGUsXHJcbiAgICAgICAgcm93LFxyXG4gICAgICAgIGNlbGxUeXBlLFxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcnVuQWxsQWJvdmUoKSB7XHJcbiAgY29uc3QgeyBlZGl0b3IsIGtlcm5lbCwgZ3JhbW1hciwgZmlsZVBhdGggfSA9IHN0b3JlO1xyXG4gIGlmICghZWRpdG9yIHx8ICFncmFtbWFyIHx8ICFmaWxlUGF0aCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcclxuICAgICAgJ1wiUnVuIEFsbCBBYm92ZVwiIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHRoaXMgZmlsZSB0eXBlISdcclxuICAgICk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoZWRpdG9yICYmIGtlcm5lbCkge1xyXG4gICAgX3J1bkFsbEFib3ZlKGVkaXRvciwga2VybmVsKTtcclxuXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBrZXJuZWxNYW5hZ2VyLnN0YXJ0S2VybmVsRm9yKGdyYW1tYXIsIGVkaXRvciwgZmlsZVBhdGgsIChrZXJuZWw6IEtlcm5lbCkgPT4ge1xyXG4gICAgX3J1bkFsbEFib3ZlKGVkaXRvciwga2VybmVsKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gX3J1bkFsbEFib3ZlKGVkaXRvcjogVGV4dEVkaXRvciwga2VybmVsOiBLZXJuZWwpIHtcclxuICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcclxuICBjdXJzb3IuY29sdW1uID0gZWRpdG9yLmdldEJ1ZmZlcigpLmxpbmVMZW5ndGhGb3JSb3coY3Vyc29yLnJvdyk7XHJcbiAgY29uc3QgYnJlYWtwb2ludHMgPSBjb2RlTWFuYWdlci5nZXRCcmVha3BvaW50cyhlZGl0b3IpO1xyXG4gIGJyZWFrcG9pbnRzLnB1c2goY3Vyc29yKTtcclxuICBjb25zdCBjZWxscyA9IGNvZGVNYW5hZ2VyLmdldENlbGxzKGVkaXRvciwgYnJlYWtwb2ludHMpO1xyXG5cclxuICBmb3IgKGNvbnN0IGNlbGwgb2YgY2VsbHMpIHtcclxuICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY2VsbDtcclxuICAgIGNvbnN0IGNvZGVOdWxsYWJsZSA9IGNvZGVNYW5hZ2VyLmdldFRleHRJblJhbmdlKGVkaXRvciwgc3RhcnQsIGVuZCk7XHJcbiAgICBjb25zdCByb3cgPSBjb2RlTWFuYWdlci5lc2NhcGVCbGFua1Jvd3MoXHJcbiAgICAgIGVkaXRvcixcclxuICAgICAgc3RhcnQucm93LFxyXG4gICAgICBjb2RlTWFuYWdlci5nZXRFc2NhcGVCbGFua1Jvd3NFbmRSb3coZWRpdG9yLCBlbmQpXHJcbiAgICApO1xyXG4gICAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcclxuXHJcbiAgICBpZiAoY29kZU51bGxhYmxlICE9PSBudWxsKSB7XHJcbiAgICAgIGNvbnN0IGNvZGUgPVxyXG4gICAgICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcclxuICAgICAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXHJcbiAgICAgICAgICA6IGNvZGVOdWxsYWJsZTtcclxuICAgICAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcclxuICAgICAgICByZXN1bHQuY3JlYXRlUmVzdWx0KHN0b3JlLCB7XHJcbiAgICAgICAgICBjb2RlLFxyXG4gICAgICAgICAgcm93LFxyXG4gICAgICAgICAgY2VsbFR5cGUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjZWxsLmNvbnRhaW5zUG9pbnQoY3Vyc29yKSkge1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1bkNlbGwobW92ZURvd246IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcclxuICBpZiAoIWVkaXRvcikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbnRlcmFjdC9oeWRyb2dlbi9pc3N1ZXMvMTQ1MlxyXG4gIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWRpdG9yLmVsZW1lbnQsIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y2FuY2VsXCIpO1xyXG4gIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY29kZU1hbmFnZXIuZ2V0Q3VycmVudENlbGwoZWRpdG9yKTtcclxuICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xyXG4gIGlmIChjb2RlTnVsbGFibGUgPT09IG51bGwpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3Qgcm93ID0gY29kZU1hbmFnZXIuZXNjYXBlQmxhbmtSb3dzKFxyXG4gICAgZWRpdG9yLFxyXG4gICAgc3RhcnQucm93LFxyXG4gICAgY29kZU1hbmFnZXIuZ2V0RXNjYXBlQmxhbmtSb3dzRW5kUm93KGVkaXRvciwgZW5kKVxyXG4gICk7XHJcbiAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcclxuICBjb25zdCBjb2RlID1cclxuICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcclxuICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcclxuICAgICAgOiBjb2RlTnVsbGFibGU7XHJcblxyXG4gIGlmIChtb3ZlRG93bikge1xyXG4gICAgY29kZU1hbmFnZXIubW92ZURvd24oZWRpdG9yLCByb3cpO1xyXG4gIH1cclxuXHJcbiAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcclxuICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcclxuICAgICAgY29kZSxcclxuICAgICAgcm93LFxyXG4gICAgICBjZWxsVHlwZSxcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb2xkQ3VycmVudENlbGwoKSB7XHJcbiAgY29uc3QgZWRpdG9yID0gc3RvcmUuZWRpdG9yO1xyXG4gIGlmICghZWRpdG9yKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvZGVNYW5hZ2VyLmZvbGRDdXJyZW50Q2VsbChlZGl0b3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb2xkQWxsQnV0Q3VycmVudENlbGwoKSB7XHJcbiAgY29uc3QgZWRpdG9yID0gc3RvcmUuZWRpdG9yO1xyXG4gIGlmICghZWRpdG9yKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvZGVNYW5hZ2VyLmZvbGRBbGxCdXRDdXJyZW50Q2VsbChlZGl0b3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdGFydFpNUUtlcm5lbCgpIHtcclxuICBrZXJuZWxNYW5hZ2VyXHJcbiAgICAuZ2V0QWxsS2VybmVsU3BlY3NGb3JHcmFtbWFyKHN0b3JlLmdyYW1tYXIpXHJcbiAgICAudGhlbigoa2VybmVsU3BlY3MpID0+IHtcclxuICAgICAgaWYgKGtlcm5lbFBpY2tlcikge1xyXG4gICAgICAgIGtlcm5lbFBpY2tlci5rZXJuZWxTcGVjcyA9IGtlcm5lbFNwZWNzO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGtlcm5lbFBpY2tlciA9IG5ldyBLZXJuZWxQaWNrZXIoa2VybmVsU3BlY3MpO1xyXG5cclxuICAgICAgICBrZXJuZWxQaWNrZXIub25Db25maXJtZWQgPSAoa2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB7IGVkaXRvciwgZ3JhbW1hciwgZmlsZVBhdGgsIG1hcmtlcnMgfSA9IHN0b3JlO1xyXG4gICAgICAgICAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoIHx8ICFtYXJrZXJzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgICAgICAgIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWwoa2VybmVsU3BlYywgZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAga2VybmVsUGlja2VyLnRvZ2dsZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RUb1dTS2VybmVsKCkge1xyXG4gIGlmICghd3NLZXJuZWxQaWNrZXIpIHtcclxuICAgIHdzS2VybmVsUGlja2VyID0gbmV3IFdTS2VybmVsUGlja2VyKCh0cmFuc3BvcnQ6IFdTS2VybmVsKSA9PiB7XHJcbiAgICAgIGNvbnN0IGtlcm5lbCA9IG5ldyBLZXJuZWwodHJhbnNwb3J0KTtcclxuICAgICAgY29uc3QgeyBlZGl0b3IsIGdyYW1tYXIsIGZpbGVQYXRoLCBtYXJrZXJzIH0gPSBzdG9yZTtcclxuICAgICAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoIHx8ICFtYXJrZXJzKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgICAgaWYgKGtlcm5lbC50cmFuc3BvcnQgaW5zdGFuY2VvZiBaTVFLZXJuZWwpIHtcclxuICAgICAgICBrZXJuZWwuZGVzdHJveSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHN0b3JlLm5ld0tlcm5lbChrZXJuZWwsIGZpbGVQYXRoLCBlZGl0b3IsIGdyYW1tYXIpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB3c0tlcm5lbFBpY2tlci50b2dnbGUoKGtlcm5lbFNwZWM6IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT5cclxuICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoa2VybmVsU3BlYywgc3RvcmUuZ3JhbW1hcilcclxuICApO1xyXG59XHJcblxyXG4vLyBBY2NlcHRzIHN0b3JlIGFzIGFuIGFyZ1xyXG5mdW5jdGlvbiBjaGVja0Zvcktlcm5lbChcclxuICB7XHJcbiAgICBlZGl0b3IsXHJcbiAgICBncmFtbWFyLFxyXG4gICAgZmlsZVBhdGgsXHJcbiAgICBrZXJuZWwsXHJcbiAgfToge1xyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yO1xyXG4gICAgZ3JhbW1hcjogR3JhbW1hcjtcclxuICAgIGZpbGVQYXRoOiBzdHJpbmc7XHJcbiAgICBrZXJuZWw/OiBLZXJuZWw7XHJcbiAgfSxcclxuICBjYWxsYmFjazogKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkXHJcbikge1xyXG4gIGlmICghZmlsZVBhdGggfHwgIWdyYW1tYXIpIHtcclxuICAgIHJldHVybiBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXHJcbiAgICAgIFwiVGhlIGxhbmd1YWdlIGdyYW1tYXIgbXVzdCBiZSBzZXQgaW4gb3JkZXIgdG8gc3RhcnQgYSBrZXJuZWwuIFRoZSBlYXNpZXN0IHdheSB0byBkbyB0aGlzIGlzIHRvIHNhdmUgdGhlIGZpbGUuXCJcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBpZiAoa2VybmVsKSB7XHJcbiAgICBjYWxsYmFjayhrZXJuZWwpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbEZvcihncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoLCAobmV3S2VybmVsOiBLZXJuZWwpID0+XHJcbiAgICBjYWxsYmFjayhuZXdLZXJuZWwpXHJcbiAgKTtcclxufVxyXG4iXX0=