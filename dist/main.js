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
        "hydrogen:update-kernels": () => kernel_manager_1.default.updateKernelSpecs(),
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
function handleKernelCommand({ command, payload, }, { kernel, markers, }) {
    utils_1.log("handleKernelCommand:", arguments);
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
        const row = codeManager.escapeBlankRows(editor, start.row, end.row == editor.getLastBufferRow() ? end.row : end.row - 1);
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
        const row = codeManager.escapeBlankRows(editor, start.row, end.row == editor.getLastBufferRow() ? end.row : end.row - 1);
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
    const row = codeManager.escapeBlankRows(editor, start.row, end.row == editor.getLastBufferRow() ? end.row : end.row - 1);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFPYztBQUVkLG9EQUF1QjtBQUN2QiwrQkFBK0I7QUFFL0Isa0VBQThDO0FBQzlDLDhEQUEwQztBQUMxQyxzRUFBNkM7QUFDN0MsNEVBQXVEO0FBQ3ZELHNEQUE4QjtBQUM5Qiw4REFBcUM7QUFDckMsNERBQW1DO0FBQ25DLHNEQUE4QjtBQUM5QixvRUFBMkM7QUFDM0MsMEVBQWdEO0FBQ2hELHNGQUE0RDtBQUM1RCx1RkFBOEQ7QUFDOUQsb0RBQTRCO0FBQzVCLHNFQUE2QztBQUM3QywwREFBa0M7QUFDbEMscURBQXVDO0FBQ3ZDLDREQUE4QztBQUM5QyxpREFBbUM7QUFFbkMsbUNBV2lCO0FBQ2pCLHdFQUErQztBQUMvQyx1REFBZ0U7QUFHbkQsUUFBQSxNQUFNLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLENBQUM7QUFDcEMsSUFBSSxPQUFpRSxDQUFDO0FBQ3RFLElBQUksWUFBc0MsQ0FBQztBQUMzQyxJQUFJLG9CQUFzRCxDQUFDO0FBQzNELElBQUksY0FBMEMsQ0FBQztBQUMvQyxJQUFJLGdCQUE4QyxDQUFDO0FBRW5ELFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxHQUFHLElBQUksY0FBTyxFQUFFLENBQUM7SUFDeEIsSUFBSSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7SUFDdkMsZUFBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUNyQiwyQkFBMkIsRUFDM0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO1FBQ3pCLElBQUksMEJBQTBCLEVBQUU7WUFDOUIsMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLE9BQU87U0FDUjtRQUVELElBQUksZUFBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLElBQUks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Q0FBQyxVQUE4QixFQUFFLEVBQUUsQ0FDdkQsaUNBQXlCLENBQUMsVUFBVSxFQUFFLGVBQUssQ0FBQyxPQUFPLENBQUMsQ0FDckQsQ0FBQztBQUNKLENBQUM7QUFHRCxTQUFTLGNBQWMsQ0FDckIsRUFDRSxNQUFNLEVBQ04sT0FBTyxFQUNQLFFBQVEsRUFDUixNQUFNLEdBTVAsRUFDRCxRQUFrQztJQUVsQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQ2hDLDhHQUE4RyxDQUMvRyxDQUFDO0tBQ0g7SUFFRCxJQUFJLE1BQU0sRUFBRTtRQUNWLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQixPQUFPO0tBQ1I7SUFFRCx3QkFBYSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLFNBQWlCLEVBQUUsRUFBRSxDQUM1RSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQ3BCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBFbWl0dGVyLFxyXG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXHJcbiAgRGlzcG9zYWJsZSxcclxuICBQb2ludCxcclxuICBUZXh0RWRpdG9yLFxyXG4gIEdyYW1tYXIsXHJcbn0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHsgU3RhdHVzQmFyIH0gZnJvbSBcImF0b20vc3RhdHVzLWJhclwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7IGF1dG9ydW4gfSBmcm9tIFwibW9ieFwiO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XHJcbmltcG9ydCBJbnNwZWN0b3JQYW5lIGZyb20gXCIuL3BhbmVzL2luc3BlY3RvclwiO1xyXG5pbXBvcnQgV2F0Y2hlc1BhbmUgZnJvbSBcIi4vcGFuZXMvd2F0Y2hlc1wiO1xyXG5pbXBvcnQgT3V0cHV0UGFuZSBmcm9tIFwiLi9wYW5lcy9vdXRwdXQtYXJlYVwiO1xyXG5pbXBvcnQgS2VybmVsTW9uaXRvclBhbmUgZnJvbSBcIi4vcGFuZXMva2VybmVsLW1vbml0b3JcIjtcclxuaW1wb3J0IENvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IFpNUUtlcm5lbCBmcm9tIFwiLi96bXEta2VybmVsXCI7XHJcbmltcG9ydCBXU0tlcm5lbCBmcm9tIFwiLi93cy1rZXJuZWxcIjtcclxuaW1wb3J0IEtlcm5lbCBmcm9tIFwiLi9rZXJuZWxcIjtcclxuaW1wb3J0IEtlcm5lbFBpY2tlciBmcm9tIFwiLi9rZXJuZWwtcGlja2VyXCI7XHJcbmltcG9ydCBXU0tlcm5lbFBpY2tlciBmcm9tIFwiLi93cy1rZXJuZWwtcGlja2VyXCI7XHJcbmltcG9ydCBFeGlzdGluZ0tlcm5lbFBpY2tlciBmcm9tIFwiLi9leGlzdGluZy1rZXJuZWwtcGlja2VyXCI7XHJcbmltcG9ydCBIeWRyb2dlblByb3ZpZGVyIGZyb20gXCIuL3BsdWdpbi1hcGkvaHlkcm9nZW4tcHJvdmlkZXJcIjtcclxuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XHJcbmltcG9ydCBrZXJuZWxNYW5hZ2VyIGZyb20gXCIuL2tlcm5lbC1tYW5hZ2VyXCI7XHJcbmltcG9ydCBzZXJ2aWNlcyBmcm9tIFwiLi9zZXJ2aWNlc1wiO1xyXG5pbXBvcnQgKiBhcyBjb21tYW5kcyBmcm9tIFwiLi9jb21tYW5kc1wiO1xyXG5pbXBvcnQgKiBhcyBjb2RlTWFuYWdlciBmcm9tIFwiLi9jb2RlLW1hbmFnZXJcIjtcclxuaW1wb3J0ICogYXMgcmVzdWx0IGZyb20gXCIuL3Jlc3VsdFwiO1xyXG5pbXBvcnQgdHlwZSBNYXJrZXJTdG9yZSBmcm9tIFwiLi9zdG9yZS9tYXJrZXJzXCI7XHJcbmltcG9ydCB7XHJcbiAgbG9nLFxyXG4gIHJlYWN0RmFjdG9yeSxcclxuICBpc011bHRpbGFuZ3VhZ2VHcmFtbWFyLFxyXG4gIElOU1BFQ1RPUl9VUkksXHJcbiAgV0FUQ0hFU19VUkksXHJcbiAgT1VUUFVUX0FSRUFfVVJJLFxyXG4gIEtFUk5FTF9NT05JVE9SX1VSSSxcclxuICBob3RSZWxvYWRQYWNrYWdlLFxyXG4gIG9wZW5PclNob3dEb2NrLFxyXG4gIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIsXHJcbn0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IGV4cG9ydE5vdGVib29rIGZyb20gXCIuL2V4cG9ydC1ub3RlYm9va1wiO1xyXG5pbXBvcnQgeyBpbXBvcnROb3RlYm9vaywgaXB5bmJPcGVuZXIgfSBmcm9tIFwiLi9pbXBvcnQtbm90ZWJvb2tcIjtcclxuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBjb25maWcgPSBDb25maWcuc2NoZW1hO1xyXG5sZXQgZW1pdHRlcjogRW1pdHRlcjx7fSwgeyBcImRpZC1jaGFuZ2Uta2VybmVsXCI6IEtlcm5lbCB9PiB8IHVuZGVmaW5lZDtcclxubGV0IGtlcm5lbFBpY2tlcjogS2VybmVsUGlja2VyIHwgdW5kZWZpbmVkO1xyXG5sZXQgZXhpc3RpbmdLZXJuZWxQaWNrZXI6IEV4aXN0aW5nS2VybmVsUGlja2VyIHwgdW5kZWZpbmVkO1xyXG5sZXQgd3NLZXJuZWxQaWNrZXI6IFdTS2VybmVsUGlja2VyIHwgdW5kZWZpbmVkO1xyXG5sZXQgaHlkcm9nZW5Qcm92aWRlcjogSHlkcm9nZW5Qcm92aWRlciB8IHVuZGVmaW5lZDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcclxuICBlbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcclxuICBsZXQgc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UgPSBmYWxzZTtcclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlKFxyXG4gICAgICBcIkh5ZHJvZ2VuLmxhbmd1YWdlTWFwcGluZ3NcIixcclxuICAgICAgKHsgbmV3VmFsdWUsIG9sZFZhbHVlIH0pID0+IHtcclxuICAgICAgICBpZiAoc2tpcExhbmd1YWdlTWFwcGluZ3NDaGFuZ2UpIHtcclxuICAgICAgICAgIHNraXBMYW5ndWFnZU1hcHBpbmdzQ2hhbmdlID0gZmFsc2U7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RvcmUucnVubmluZ0tlcm5lbHMubGVuZ3RoICE9IDApIHtcclxuICAgICAgICAgIHNraXBMYW5ndWFnZU1hcHBpbmdzQ2hhbmdlID0gdHJ1ZTtcclxuICAgICAgICAgIGF0b20uY29uZmlnLnNldChcIkh5ZHJvZ2VuLmxhbmd1YWdlTWFwcGluZ3NcIiwgb2xkVmFsdWUpO1xyXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiSHlkcm9nZW5cIiwge1xyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgICAgICBcImBsYW5ndWFnZU1hcHBpbmdzYCBjYW5ub3QgYmUgdXBkYXRlZCB3aGlsZSBrZXJuZWxzIGFyZSBydW5uaW5nXCIsXHJcbiAgICAgICAgICAgIGRpc21pc3NhYmxlOiBmYWxzZSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgKVxyXG4gICk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwiSHlkcm9nZW4uc3RhdHVzQmFyRGlzYWJsZVwiLCAobmV3VmFsdWUpID0+IHtcclxuICAgICAgc3RvcmUuc2V0Q29uZmlnVmFsdWUoXCJIeWRyb2dlbi5zdGF0dXNCYXJEaXNhYmxlXCIsIEJvb2xlYW4obmV3VmFsdWUpKTtcclxuICAgIH0pLFxyXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIkh5ZHJvZ2VuLnN0YXR1c0Jhcktlcm5lbEluZm9cIiwgKG5ld1ZhbHVlKSA9PiB7XHJcbiAgICAgIHN0b3JlLnNldENvbmZpZ1ZhbHVlKFwiSHlkcm9nZW4uc3RhdHVzQmFyS2VybmVsSW5mb1wiLCBCb29sZWFuKG5ld1ZhbHVlKSk7XHJcbiAgICB9KVxyXG4gICk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSlcIiwge1xyXG4gICAgICBcImh5ZHJvZ2VuOnJ1blwiOiAoKSA9PiBydW4oKSxcclxuICAgICAgXCJoeWRyb2dlbjpydW4tYWxsXCI6ICgpID0+IHJ1bkFsbCgpLFxyXG4gICAgICBcImh5ZHJvZ2VuOnJ1bi1hbGwtYWJvdmVcIjogKCkgPT4gcnVuQWxsQWJvdmUoKSxcclxuICAgICAgXCJoeWRyb2dlbjpydW4tYW5kLW1vdmUtZG93blwiOiAoKSA9PiBydW4odHJ1ZSksXHJcbiAgICAgIFwiaHlkcm9nZW46cnVuLWNlbGxcIjogKCkgPT4gcnVuQ2VsbCgpLFxyXG4gICAgICBcImh5ZHJvZ2VuOnJ1bi1jZWxsLWFuZC1tb3ZlLWRvd25cIjogKCkgPT4gcnVuQ2VsbCh0cnVlKSxcclxuICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtd2F0Y2hlc1wiOiAoKSA9PiBhdG9tLndvcmtzcGFjZS50b2dnbGUoV0FUQ0hFU19VUkkpLFxyXG4gICAgICBcImh5ZHJvZ2VuOnRvZ2dsZS1vdXRwdXQtYXJlYVwiOiAoKSA9PiBjb21tYW5kcy50b2dnbGVPdXRwdXRNb2RlKCksXHJcbiAgICAgIFwiaHlkcm9nZW46dG9nZ2xlLWtlcm5lbC1tb25pdG9yXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICBjb25zdCBsYXN0SXRlbSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCk7XHJcbiAgICAgICAgY29uc3QgbGFzdFBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9ySXRlbShsYXN0SXRlbSk7XHJcbiAgICAgICAgYXdhaXQgYXRvbS53b3Jrc3BhY2UudG9nZ2xlKEtFUk5FTF9NT05JVE9SX1VSSSk7XHJcbiAgICAgICAgaWYgKGxhc3RQYW5lKSB7XHJcbiAgICAgICAgICBsYXN0UGFuZS5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgXCJoeWRyb2dlbjpzdGFydC1sb2NhbC1rZXJuZWxcIjogKCkgPT4gc3RhcnRaTVFLZXJuZWwoKSxcclxuICAgICAgXCJoeWRyb2dlbjpjb25uZWN0LXRvLXJlbW90ZS1rZXJuZWxcIjogKCkgPT4gY29ubmVjdFRvV1NLZXJuZWwoKSxcclxuICAgICAgXCJoeWRyb2dlbjpjb25uZWN0LXRvLWV4aXN0aW5nLWtlcm5lbFwiOiAoKSA9PiBjb25uZWN0VG9FeGlzdGluZ0tlcm5lbCgpLFxyXG4gICAgICBcImh5ZHJvZ2VuOmFkZC13YXRjaFwiOiAoKSA9PiB7XHJcbiAgICAgICAgaWYgKHN0b3JlLmtlcm5lbCkge1xyXG4gICAgICAgICAgc3RvcmUua2VybmVsLndhdGNoZXNTdG9yZS5hZGRXYXRjaEZyb21FZGl0b3Ioc3RvcmUuZWRpdG9yKTtcclxuICAgICAgICAgIG9wZW5PclNob3dEb2NrKFdBVENIRVNfVVJJKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFwiaHlkcm9nZW46cmVtb3ZlLXdhdGNoXCI6ICgpID0+IHtcclxuICAgICAgICBpZiAoc3RvcmUua2VybmVsKSB7XHJcbiAgICAgICAgICBzdG9yZS5rZXJuZWwud2F0Y2hlc1N0b3JlLnJlbW92ZVdhdGNoKCk7XHJcbiAgICAgICAgICBvcGVuT3JTaG93RG9jayhXQVRDSEVTX1VSSSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBcImh5ZHJvZ2VuOnVwZGF0ZS1rZXJuZWxzXCI6ICgpID0+IGtlcm5lbE1hbmFnZXIudXBkYXRlS2VybmVsU3BlY3MoKSxcclxuICAgICAgXCJoeWRyb2dlbjp0b2dnbGUtaW5zcGVjdG9yXCI6ICgpID0+IGNvbW1hbmRzLnRvZ2dsZUluc3BlY3RvcihzdG9yZSksXHJcbiAgICAgIFwiaHlkcm9nZW46aW50ZXJydXB0LWtlcm5lbFwiOiAoKSA9PlxyXG4gICAgICAgIGhhbmRsZUtlcm5lbENvbW1hbmQoXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbW1hbmQ6IFwiaW50ZXJydXB0LWtlcm5lbFwiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHN0b3JlXHJcbiAgICAgICAgKSxcclxuICAgICAgXCJoeWRyb2dlbjpyZXN0YXJ0LWtlcm5lbFwiOiAoKSA9PlxyXG4gICAgICAgIGhhbmRsZUtlcm5lbENvbW1hbmQoXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbW1hbmQ6IFwicmVzdGFydC1rZXJuZWxcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzdG9yZVxyXG4gICAgICAgICksXHJcbiAgICAgIFwiaHlkcm9nZW46c2h1dGRvd24ta2VybmVsXCI6ICgpID0+XHJcbiAgICAgICAgaGFuZGxlS2VybmVsQ29tbWFuZChcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgY29tbWFuZDogXCJzaHV0ZG93bi1rZXJuZWxcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzdG9yZVxyXG4gICAgICAgICksXHJcbiAgICAgIFwiaHlkcm9nZW46Y2xlYXItcmVzdWx0XCI6ICgpID0+IHJlc3VsdC5jbGVhclJlc3VsdChzdG9yZSksXHJcbiAgICAgIFwiaHlkcm9nZW46ZXhwb3J0LW5vdGVib29rXCI6ICgpID0+IGV4cG9ydE5vdGVib29rKCksXHJcbiAgICAgIFwiaHlkcm9nZW46Zm9sZC1jdXJyZW50LWNlbGxcIjogKCkgPT4gZm9sZEN1cnJlbnRDZWxsKCksXHJcbiAgICAgIFwiaHlkcm9nZW46Zm9sZC1hbGwtYnV0LWN1cnJlbnQtY2VsbFwiOiAoKSA9PiBmb2xkQWxsQnV0Q3VycmVudENlbGwoKSxcclxuICAgICAgXCJoeWRyb2dlbjpjbGVhci1yZXN1bHRzXCI6ICgpID0+IHJlc3VsdC5jbGVhclJlc3VsdHMoc3RvcmUpLFxyXG4gICAgfSlcclxuICApO1xyXG4gIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCB7XHJcbiAgICAgIFwiaHlkcm9nZW46aW1wb3J0LW5vdGVib29rXCI6IGltcG9ydE5vdGVib29rLFxyXG4gICAgfSlcclxuICApO1xyXG5cclxuICBpZiAoYXRvbS5pbkRldk1vZGUoKSkge1xyXG4gICAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwge1xyXG4gICAgICAgIFwiaHlkcm9nZW46aG90LXJlbG9hZC1wYWNrYWdlXCI6ICgpID0+IGhvdFJlbG9hZFBhY2thZ2UoKSxcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChcclxuICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVUZXh0RWRpdG9yKChlZGl0b3IpID0+IHtcclxuICAgICAgc3RvcmUudXBkYXRlRWRpdG9yKGVkaXRvcik7XHJcbiAgICB9KVxyXG4gICk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcikgPT4ge1xyXG4gICAgICBjb25zdCBlZGl0b3JTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICAgICAgZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoKSA9PiB7XHJcbiAgICAgICAgICBzdG9yZS5zZXRHcmFtbWFyKGVkaXRvcik7XHJcbiAgICAgICAgfSlcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XHJcbiAgICAgICAgZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICAgICAgICBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihcclxuICAgICAgICAgICAgXy5kZWJvdW5jZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgc3RvcmUuc2V0R3JhbW1hcihlZGl0b3IpO1xyXG4gICAgICAgICAgICB9LCA3NSlcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChcclxuICAgICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKFxyXG4gICAgICAgIGVkaXRvci5vbkRpZENoYW5nZVRpdGxlKChuZXdUaXRsZSkgPT4gc3RvcmUuZm9yY2VFZGl0b3JVcGRhdGUoKSlcclxuICAgICAgKTtcclxuICAgICAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoZWRpdG9yU3Vic2NyaXB0aW9ucyk7XHJcbiAgICB9KVxyXG4gICk7XHJcbiAgaHlkcm9nZW5Qcm92aWRlciA9IG51bGw7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaSkgPT4ge1xyXG4gICAgICBzd2l0Y2ggKHVyaSkge1xyXG4gICAgICAgIGNhc2UgSU5TUEVDVE9SX1VSSTpcclxuICAgICAgICAgIHJldHVybiBuZXcgSW5zcGVjdG9yUGFuZShzdG9yZSk7XHJcblxyXG4gICAgICAgIGNhc2UgV0FUQ0hFU19VUkk6XHJcbiAgICAgICAgICByZXR1cm4gbmV3IFdhdGNoZXNQYW5lKHN0b3JlKTtcclxuXHJcbiAgICAgICAgY2FzZSBPVVRQVVRfQVJFQV9VUkk6XHJcbiAgICAgICAgICByZXR1cm4gbmV3IE91dHB1dFBhbmUoc3RvcmUpO1xyXG5cclxuICAgICAgICBjYXNlIEtFUk5FTF9NT05JVE9SX1VSSTpcclxuICAgICAgICAgIHJldHVybiBuZXcgS2VybmVsTW9uaXRvclBhbmUoc3RvcmUpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKGlweW5iT3BlbmVyKSk7XHJcbiAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoXHJcbiAgICAvLyBEZXN0cm95IGFueSBQYW5lcyB3aGVuIHRoZSBwYWNrYWdlIGlzIGRlYWN0aXZhdGVkLlxyXG4gICAgbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xyXG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRQYW5lSXRlbXMoKS5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIEluc3BlY3RvclBhbmUgfHxcclxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBXYXRjaGVzUGFuZSB8fFxyXG4gICAgICAgICAgaXRlbSBpbnN0YW5jZW9mIE91dHB1dFBhbmUgfHxcclxuICAgICAgICAgIGl0ZW0gaW5zdGFuY2VvZiBLZXJuZWxNb25pdG9yUGFuZVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgaXRlbS5kZXN0cm95KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgKTtcclxuICBhdXRvcnVuKCgpID0+IHtcclxuICAgIGVtaXR0ZXIuZW1pdChcImRpZC1jaGFuZ2Uta2VybmVsXCIsIHN0b3JlLmtlcm5lbCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xyXG4gIHN0b3JlLmRpc3Bvc2UoKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLSBTZXJ2aWNlIFByb3ZpZGVycyAtLS0tLS0tLS0tLS0tLSovXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlSHlkcm9nZW4oKSB7XHJcbiAgaWYgKCFoeWRyb2dlblByb3ZpZGVyKSB7XHJcbiAgICBoeWRyb2dlblByb3ZpZGVyID0gbmV3IEh5ZHJvZ2VuUHJvdmlkZXIoZW1pdHRlcik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaHlkcm9nZW5Qcm92aWRlcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVBdXRvY29tcGxldGVSZXN1bHRzKCkge1xyXG4gIHJldHVybiBzZXJ2aWNlcy5wcm92aWRlZC5hdXRvY29tcGxldGUucHJvdmlkZUF1dG9jb21wbGV0ZVJlc3VsdHMoc3RvcmUpO1xyXG59XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0gU2VydmljZSBDb25zdW1lcnMgLS0tLS0tLS0tLS0tLS0qL1xyXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUF1dG9jb21wbGV0ZVdhdGNoRWRpdG9yKFxyXG4gIHdhdGNoRWRpdG9yOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55XHJcbikge1xyXG4gIHJldHVybiBzZXJ2aWNlcy5jb25zdW1lZC5hdXRvY29tcGxldGUuY29uc3VtZShzdG9yZSwgd2F0Y2hFZGl0b3IpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IFN0YXR1c0Jhcikge1xyXG4gIHJldHVybiBzZXJ2aWNlcy5jb25zdW1lZC5zdGF0dXNCYXIuYWRkU3RhdHVzQmFyKFxyXG4gICAgc3RvcmUsXHJcbiAgICBzdGF0dXNCYXIsXHJcbiAgICBoYW5kbGVLZXJuZWxDb21tYW5kXHJcbiAgKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbmZ1bmN0aW9uIGNvbm5lY3RUb0V4aXN0aW5nS2VybmVsKCkge1xyXG4gIGlmICghZXhpc3RpbmdLZXJuZWxQaWNrZXIpIHtcclxuICAgIGV4aXN0aW5nS2VybmVsUGlja2VyID0gbmV3IEV4aXN0aW5nS2VybmVsUGlja2VyKCk7XHJcbiAgfVxyXG5cclxuICBleGlzdGluZ0tlcm5lbFBpY2tlci50b2dnbGUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlS2VybmVsQ29tbWFuZChcclxuICB7XHJcbiAgICBjb21tYW5kLFxyXG4gICAgcGF5bG9hZCxcclxuICB9OiB7XHJcbiAgICBjb21tYW5kOiBzdHJpbmc7XHJcbiAgICBwYXlsb2FkOiBLZXJuZWxzcGVjTWV0YWRhdGEgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIH0sXHJcbiAge1xyXG4gICAga2VybmVsLFxyXG4gICAgbWFya2VycyxcclxuICB9OiB7XHJcbiAgICBrZXJuZWw6IEtlcm5lbCB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgICBtYXJrZXJzOiBNYXJrZXJTdG9yZSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgfVxyXG4pIHtcclxuICBsb2coXCJoYW5kbGVLZXJuZWxDb21tYW5kOlwiLCBhcmd1bWVudHMpO1xyXG5cclxuICBpZiAoIWtlcm5lbCkge1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IFwiTm8gcnVubmluZyBrZXJuZWwgZm9yIGdyYW1tYXIgb3IgZWRpdG9yIGZvdW5kXCI7XHJcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoY29tbWFuZCA9PT0gXCJpbnRlcnJ1cHQta2VybmVsXCIpIHtcclxuICAgIGtlcm5lbC5pbnRlcnJ1cHQoKTtcclxuICB9IGVsc2UgaWYgKGNvbW1hbmQgPT09IFwicmVzdGFydC1rZXJuZWxcIikge1xyXG4gICAga2VybmVsLnJlc3RhcnQoKTtcclxuICB9IGVsc2UgaWYgKGNvbW1hbmQgPT09IFwic2h1dGRvd24ta2VybmVsXCIpIHtcclxuICAgIGlmIChtYXJrZXJzKSB7XHJcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgIH1cclxuICAgIC8vIE5vdGUgdGhhdCBkZXN0cm95IGFsb25lIGRvZXMgbm90IHNodXQgZG93biBhIFdTS2VybmVsXHJcbiAgICBrZXJuZWwuc2h1dGRvd24oKTtcclxuICAgIGtlcm5lbC5kZXN0cm95KCk7XHJcbiAgfSBlbHNlIGlmIChcclxuICAgIGNvbW1hbmQgPT09IFwicmVuYW1lLWtlcm5lbFwiICYmXHJcbiAgICBrZXJuZWwudHJhbnNwb3J0IGluc3RhbmNlb2YgV1NLZXJuZWxcclxuICApIHtcclxuICAgIGtlcm5lbC50cmFuc3BvcnQucHJvbXB0UmVuYW1lKCk7XHJcbiAgfSBlbHNlIGlmIChjb21tYW5kID09PSBcImRpc2Nvbm5lY3Qta2VybmVsXCIpIHtcclxuICAgIGlmIChtYXJrZXJzKSB7XHJcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgIH1cclxuICAgIGtlcm5lbC5kZXN0cm95KCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBydW4obW92ZURvd246IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gIGNvbnN0IGVkaXRvciA9IHN0b3JlLmVkaXRvcjtcclxuICBpZiAoIWVkaXRvcikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbnRlcmFjdC9oeWRyb2dlbi9pc3N1ZXMvMTQ1MlxyXG4gIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWRpdG9yLmVsZW1lbnQsIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y2FuY2VsXCIpO1xyXG4gIGNvbnN0IGNvZGVCbG9jayA9IGNvZGVNYW5hZ2VyLmZpbmRDb2RlQmxvY2soZWRpdG9yKTtcclxuXHJcbiAgaWYgKCFjb2RlQmxvY2spIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNvZGVOdWxsYWJsZSA9IGNvZGVCbG9jay5jb2RlO1xyXG4gIGlmIChjb2RlTnVsbGFibGUgPT09IG51bGwpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgeyByb3cgfSA9IGNvZGVCbG9jaztcclxuICBjb25zdCBjZWxsVHlwZSA9IGNvZGVNYW5hZ2VyLmdldE1ldGFkYXRhRm9yUm93KGVkaXRvciwgbmV3IFBvaW50KHJvdywgMCkpO1xyXG4gIGNvbnN0IGNvZGUgPVxyXG4gICAgY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIlxyXG4gICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxyXG4gICAgICA6IGNvZGVOdWxsYWJsZTtcclxuXHJcbiAgaWYgKG1vdmVEb3duID09PSB0cnVlKSB7XHJcbiAgICBjb2RlTWFuYWdlci5tb3ZlRG93bihlZGl0b3IsIHJvdyk7XHJcbiAgfVxyXG5cclxuICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xyXG4gICAgcmVzdWx0LmNyZWF0ZVJlc3VsdChzdG9yZSwge1xyXG4gICAgICBjb2RlLFxyXG4gICAgICByb3csXHJcbiAgICAgIGNlbGxUeXBlLFxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1bkFsbChicmVha3BvaW50cz86IEFycmF5PFBvaW50PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICBjb25zdCB7IGVkaXRvciwga2VybmVsLCBncmFtbWFyLCBmaWxlUGF0aCB9ID0gc3RvcmU7XHJcbiAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxyXG4gICAgICAnXCJSdW4gQWxsXCIgaXMgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBmaWxlIHR5cGUhJ1xyXG4gICAgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChlZGl0b3IgJiYga2VybmVsKSB7XHJcbiAgICBfcnVuQWxsKGVkaXRvciwga2VybmVsLCBicmVha3BvaW50cyk7XHJcblxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbEZvcihncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoLCAoa2VybmVsOiBLZXJuZWwpID0+IHtcclxuICAgIF9ydW5BbGwoZWRpdG9yLCBrZXJuZWwsIGJyZWFrcG9pbnRzKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gX3J1bkFsbChcclxuICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAga2VybmVsOiBLZXJuZWwsXHJcbiAgYnJlYWtwb2ludHM/OiBBcnJheTxQb2ludD5cclxuKSB7XHJcbiAgY29uc3QgY2VsbHMgPSBjb2RlTWFuYWdlci5nZXRDZWxscyhlZGl0b3IsIGJyZWFrcG9pbnRzKTtcclxuXHJcbiAgZm9yIChjb25zdCBjZWxsIG9mIGNlbGxzKSB7XHJcbiAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNlbGw7XHJcbiAgICBjb25zdCBjb2RlTnVsbGFibGUgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xyXG4gICAgaWYgKGNvZGVOdWxsYWJsZSA9PT0gbnVsbCkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcclxuICAgICAgZWRpdG9yLFxyXG4gICAgICBzdGFydC5yb3csXHJcbiAgICAgIGVuZC5yb3cgPT0gZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKSA/IGVuZC5yb3cgOiBlbmQucm93IC0gMVxyXG4gICAgKTtcclxuICAgIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XHJcbiAgICBjb25zdCBjb2RlID1cclxuICAgICAgY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIlxyXG4gICAgICAgID8gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBjb2RlTnVsbGFibGUpXHJcbiAgICAgICAgOiBjb2RlTnVsbGFibGU7XHJcbiAgICBjaGVja0Zvcktlcm5lbChzdG9yZSwgKGtlcm5lbCkgPT4ge1xyXG4gICAgICByZXN1bHQuY3JlYXRlUmVzdWx0KHN0b3JlLCB7XHJcbiAgICAgICAgY29kZSxcclxuICAgICAgICByb3csXHJcbiAgICAgICAgY2VsbFR5cGUsXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBydW5BbGxBYm92ZSgpIHtcclxuICBjb25zdCB7IGVkaXRvciwga2VybmVsLCBncmFtbWFyLCBmaWxlUGF0aCB9ID0gc3RvcmU7XHJcbiAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxyXG4gICAgICAnXCJSdW4gQWxsIEFib3ZlXCIgaXMgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBmaWxlIHR5cGUhJ1xyXG4gICAgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChlZGl0b3IgJiYga2VybmVsKSB7XHJcbiAgICBfcnVuQWxsQWJvdmUoZWRpdG9yLCBrZXJuZWwpO1xyXG5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWxGb3IoZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgKGtlcm5lbDogS2VybmVsKSA9PiB7XHJcbiAgICBfcnVuQWxsQWJvdmUoZWRpdG9yLCBrZXJuZWwpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfcnVuQWxsQWJvdmUoZWRpdG9yOiBUZXh0RWRpdG9yLCBrZXJuZWw6IEtlcm5lbCkge1xyXG4gIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xyXG4gIGN1cnNvci5jb2x1bW4gPSBlZGl0b3IuZ2V0QnVmZmVyKCkubGluZUxlbmd0aEZvclJvdyhjdXJzb3Iucm93KTtcclxuICBjb25zdCBicmVha3BvaW50cyA9IGNvZGVNYW5hZ2VyLmdldEJyZWFrcG9pbnRzKGVkaXRvcik7XHJcbiAgYnJlYWtwb2ludHMucHVzaChjdXJzb3IpO1xyXG4gIGNvbnN0IGNlbGxzID0gY29kZU1hbmFnZXIuZ2V0Q2VsbHMoZWRpdG9yLCBicmVha3BvaW50cyk7XHJcblxyXG4gIGZvciAoY29uc3QgY2VsbCBvZiBjZWxscykge1xyXG4gICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBjZWxsO1xyXG4gICAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcclxuICAgIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcclxuICAgICAgZWRpdG9yLFxyXG4gICAgICBzdGFydC5yb3csXHJcbiAgICAgIGVuZC5yb3cgPT0gZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKSA/IGVuZC5yb3cgOiBlbmQucm93IC0gMVxyXG4gICAgKTtcclxuICAgIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XHJcblxyXG4gICAgaWYgKGNvZGVOdWxsYWJsZSAhPT0gbnVsbCkge1xyXG4gICAgICBjb25zdCBjb2RlID1cclxuICAgICAgICBjZWxsVHlwZSA9PT0gXCJtYXJrZG93blwiXHJcbiAgICAgICAgICA/IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgY29kZU51bGxhYmxlKVxyXG4gICAgICAgICAgOiBjb2RlTnVsbGFibGU7XHJcbiAgICAgIGNoZWNrRm9yS2VybmVsKHN0b3JlLCAoa2VybmVsKSA9PiB7XHJcbiAgICAgICAgcmVzdWx0LmNyZWF0ZVJlc3VsdChzdG9yZSwge1xyXG4gICAgICAgICAgY29kZSxcclxuICAgICAgICAgIHJvdyxcclxuICAgICAgICAgIGNlbGxUeXBlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2VsbC5jb250YWluc1BvaW50KGN1cnNvcikpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBydW5DZWxsKG1vdmVEb3duOiBib29sZWFuID0gZmFsc2UpIHtcclxuICBjb25zdCBlZGl0b3IgPSBzdG9yZS5lZGl0b3I7XHJcbiAgaWYgKCFlZGl0b3IpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL250ZXJhY3QvaHlkcm9nZW4vaXNzdWVzLzE0NTJcclxuICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvci5lbGVtZW50LCBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKTtcclxuICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNvZGVNYW5hZ2VyLmdldEN1cnJlbnRDZWxsKGVkaXRvcik7XHJcbiAgY29uc3QgY29kZU51bGxhYmxlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcclxuICBpZiAoY29kZU51bGxhYmxlID09PSBudWxsKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHJvdyA9IGNvZGVNYW5hZ2VyLmVzY2FwZUJsYW5rUm93cyhcclxuICAgIGVkaXRvcixcclxuICAgIHN0YXJ0LnJvdyxcclxuICAgIGVuZC5yb3cgPT0gZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKSA/IGVuZC5yb3cgOiBlbmQucm93IC0gMVxyXG4gICk7XHJcbiAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcclxuICBjb25zdCBjb2RlID1cclxuICAgIGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCJcclxuICAgICAgPyBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIGNvZGVOdWxsYWJsZSlcclxuICAgICAgOiBjb2RlTnVsbGFibGU7XHJcblxyXG4gIGlmIChtb3ZlRG93biA9PT0gdHJ1ZSkge1xyXG4gICAgY29kZU1hbmFnZXIubW92ZURvd24oZWRpdG9yLCByb3cpO1xyXG4gIH1cclxuXHJcbiAgY2hlY2tGb3JLZXJuZWwoc3RvcmUsIChrZXJuZWwpID0+IHtcclxuICAgIHJlc3VsdC5jcmVhdGVSZXN1bHQoc3RvcmUsIHtcclxuICAgICAgY29kZSxcclxuICAgICAgcm93LFxyXG4gICAgICBjZWxsVHlwZSxcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb2xkQ3VycmVudENlbGwoKSB7XHJcbiAgY29uc3QgZWRpdG9yID0gc3RvcmUuZWRpdG9yO1xyXG4gIGlmICghZWRpdG9yKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvZGVNYW5hZ2VyLmZvbGRDdXJyZW50Q2VsbChlZGl0b3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb2xkQWxsQnV0Q3VycmVudENlbGwoKSB7XHJcbiAgY29uc3QgZWRpdG9yID0gc3RvcmUuZWRpdG9yO1xyXG4gIGlmICghZWRpdG9yKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvZGVNYW5hZ2VyLmZvbGRBbGxCdXRDdXJyZW50Q2VsbChlZGl0b3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdGFydFpNUUtlcm5lbCgpIHtcclxuICBrZXJuZWxNYW5hZ2VyXHJcbiAgICAuZ2V0QWxsS2VybmVsU3BlY3NGb3JHcmFtbWFyKHN0b3JlLmdyYW1tYXIpXHJcbiAgICAudGhlbigoa2VybmVsU3BlY3MpID0+IHtcclxuICAgICAgaWYgKGtlcm5lbFBpY2tlcikge1xyXG4gICAgICAgIGtlcm5lbFBpY2tlci5rZXJuZWxTcGVjcyA9IGtlcm5lbFNwZWNzO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGtlcm5lbFBpY2tlciA9IG5ldyBLZXJuZWxQaWNrZXIoa2VybmVsU3BlY3MpO1xyXG5cclxuICAgICAgICBrZXJuZWxQaWNrZXIub25Db25maXJtZWQgPSAoa2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB7IGVkaXRvciwgZ3JhbW1hciwgZmlsZVBhdGgsIG1hcmtlcnMgfSA9IHN0b3JlO1xyXG4gICAgICAgICAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoIHx8ICFtYXJrZXJzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgICAgICAgIGtlcm5lbE1hbmFnZXIuc3RhcnRLZXJuZWwoa2VybmVsU3BlYywgZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAga2VybmVsUGlja2VyLnRvZ2dsZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RUb1dTS2VybmVsKCkge1xyXG4gIGlmICghd3NLZXJuZWxQaWNrZXIpIHtcclxuICAgIHdzS2VybmVsUGlja2VyID0gbmV3IFdTS2VybmVsUGlja2VyKCh0cmFuc3BvcnQ6IFdTS2VybmVsKSA9PiB7XHJcbiAgICAgIGNvbnN0IGtlcm5lbCA9IG5ldyBLZXJuZWwodHJhbnNwb3J0KTtcclxuICAgICAgY29uc3QgeyBlZGl0b3IsIGdyYW1tYXIsIGZpbGVQYXRoLCBtYXJrZXJzIH0gPSBzdG9yZTtcclxuICAgICAgaWYgKCFlZGl0b3IgfHwgIWdyYW1tYXIgfHwgIWZpbGVQYXRoIHx8ICFtYXJrZXJzKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIG1hcmtlcnMuY2xlYXIoKTtcclxuICAgICAgaWYgKGtlcm5lbC50cmFuc3BvcnQgaW5zdGFuY2VvZiBaTVFLZXJuZWwpIHtcclxuICAgICAgICBrZXJuZWwuZGVzdHJveSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHN0b3JlLm5ld0tlcm5lbChrZXJuZWwsIGZpbGVQYXRoLCBlZGl0b3IsIGdyYW1tYXIpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB3c0tlcm5lbFBpY2tlci50b2dnbGUoKGtlcm5lbFNwZWM6IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT5cclxuICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoa2VybmVsU3BlYywgc3RvcmUuZ3JhbW1hcilcclxuICApO1xyXG59XHJcblxyXG4vLyBBY2NlcHRzIHN0b3JlIGFzIGFuIGFyZ1xyXG5mdW5jdGlvbiBjaGVja0Zvcktlcm5lbChcclxuICB7XHJcbiAgICBlZGl0b3IsXHJcbiAgICBncmFtbWFyLFxyXG4gICAgZmlsZVBhdGgsXHJcbiAgICBrZXJuZWwsXHJcbiAgfToge1xyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yO1xyXG4gICAgZ3JhbW1hcjogR3JhbW1hcjtcclxuICAgIGZpbGVQYXRoOiBzdHJpbmc7XHJcbiAgICBrZXJuZWw/OiBLZXJuZWw7XHJcbiAgfSxcclxuICBjYWxsYmFjazogKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkXHJcbikge1xyXG4gIGlmICghZmlsZVBhdGggfHwgIWdyYW1tYXIpIHtcclxuICAgIHJldHVybiBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXHJcbiAgICAgIFwiVGhlIGxhbmd1YWdlIGdyYW1tYXIgbXVzdCBiZSBzZXQgaW4gb3JkZXIgdG8gc3RhcnQgYSBrZXJuZWwuIFRoZSBlYXNpZXN0IHdheSB0byBkbyB0aGlzIGlzIHRvIHNhdmUgdGhlIGZpbGUuXCJcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBpZiAoa2VybmVsKSB7XHJcbiAgICBjYWxsYmFjayhrZXJuZWwpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAga2VybmVsTWFuYWdlci5zdGFydEtlcm5lbEZvcihncmFtbWFyLCBlZGl0b3IsIGZpbGVQYXRoLCAobmV3S2VybmVsOiBLZXJuZWwpID0+XHJcbiAgICBjYWxsYmFjayhuZXdLZXJuZWwpXHJcbiAgKTtcclxufVxyXG4iXX0=