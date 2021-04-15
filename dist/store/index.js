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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const atom_1 = require("atom");
const mobx_1 = require("mobx");
const utils_1 = require("../utils");
const lodash_1 = __importDefault(require("lodash"));
const codeManager = __importStar(require("../code-manager"));
const markers_1 = __importDefault(require("./markers"));
const kernel_1 = __importDefault(require("../kernel"));
const commutable = __importStar(require("@nteract/commutable"));
class Store {
    constructor() {
        this.subscriptions = new atom_1.CompositeDisposable();
        this.markersMapping = new Map();
        this.runningKernels = [];
        this.kernelMapping = new Map();
        this.startingKernels = new Map();
        this.editor = atom.workspace.getActiveTextEditor();
        this.configMapping = new Map();
        this.globalMode = Boolean(atom.config.get("Hydrogen.globalMode"));
    }
    get kernel() {
        if (!this.grammar || !this.editor) {
            return null;
        }
        if (this.globalMode) {
            const currentScopeName = this.grammar.scopeName;
            return this.runningKernels.find((k) => k.grammar.scopeName === currentScopeName);
        }
        const file = this.filePath;
        if (!file) {
            return null;
        }
        const kernelOrMap = this.kernelMapping.get(file);
        if (!kernelOrMap) {
            return null;
        }
        if (kernelOrMap instanceof kernel_1.default) {
            return kernelOrMap;
        }
        return this.grammar && this.grammar.name
            ? kernelOrMap.get(this.grammar.name)
            : null;
    }
    get filePath() {
        const editor = this.editor;
        if (!editor) {
            return null;
        }
        const savedFilePath = editor.getPath();
        return savedFilePath ? savedFilePath : `Unsaved Editor ${editor.id}`;
    }
    get filePaths() {
        return mobx_1.keys(this.kernelMapping);
    }
    get notebook() {
        const editor = this.editor;
        if (!editor) {
            return null;
        }
        let notebook = commutable.emptyNotebook;
        if (this.kernel) {
            notebook = notebook.setIn(["metadata", "kernelspec"], this.kernel.transport.kernelSpec);
        }
        const cellRanges = codeManager.getCells(editor);
        lodash_1.default.forEach(cellRanges, (cell) => {
            const { start, end } = cell;
            let source = codeManager.getTextInRange(editor, start, end);
            source = source ? source : "";
            if (source.slice(-1) === "\n") {
                source = source.slice(0, -1);
            }
            const cellType = codeManager.getMetadataForRow(editor, start);
            let newCell;
            if (cellType === "codecell") {
                newCell = commutable.emptyCodeCell.set("source", source);
            }
            else if (cellType === "markdown") {
                source = codeManager.removeCommentsMarkdownCell(editor, source);
                newCell = commutable.emptyMarkdownCell.set("source", source);
            }
            notebook = commutable.appendCellToNotebook(notebook, newCell);
        });
        return commutable.toJS(notebook);
    }
    get markers() {
        const editor = this.editor;
        if (!editor) {
            return null;
        }
        const markerStore = this.markersMapping.get(editor.id);
        return markerStore ? markerStore : this.newMarkerStore(editor.id);
    }
    newMarkerStore(editorId) {
        const markerStore = new markers_1.default();
        this.markersMapping.set(editorId, markerStore);
        return markerStore;
    }
    startKernel(kernelDisplayName) {
        this.startingKernels.set(kernelDisplayName, true);
    }
    addFileDisposer(editor, filePath) {
        const fileDisposer = new atom_1.CompositeDisposable();
        if (utils_1.isUnsavedFilePath(filePath)) {
            fileDisposer.add(editor.onDidSave((event) => {
                fileDisposer.dispose();
                this.addFileDisposer(editor, event.path);
            }));
            fileDisposer.add(editor.onDidDestroy(() => {
                this.kernelMapping.delete(filePath);
                fileDisposer.dispose();
            }));
        }
        else {
            const file = new atom_1.File(filePath);
            fileDisposer.add(file.onDidDelete(() => {
                this.kernelMapping.delete(filePath);
                fileDisposer.dispose();
            }));
        }
        this.subscriptions.add(fileDisposer);
    }
    newKernel(kernel, filePath, editor, grammar) {
        if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
            if (!this.kernelMapping.has(filePath)) {
                this.kernelMapping.set(filePath, new Map());
            }
            const multiLanguageMap = this.kernelMapping.get(filePath);
            if (multiLanguageMap && typeof multiLanguageMap.set === "function") {
                multiLanguageMap.set(grammar.name, kernel);
            }
        }
        else {
            this.kernelMapping.set(filePath, kernel);
        }
        this.addFileDisposer(editor, filePath);
        const index = this.runningKernels.findIndex((k) => k === kernel);
        if (index === -1) {
            this.runningKernels.push(kernel);
        }
        this.startingKernels.delete(kernel.kernelSpec.display_name);
    }
    deleteKernel(kernel) {
        const grammar = kernel.grammar.name;
        const files = this.getFilesForKernel(kernel);
        files.forEach((file) => {
            const kernelOrMap = this.kernelMapping.get(file);
            if (!kernelOrMap) {
                return;
            }
            if (kernelOrMap instanceof kernel_1.default) {
                this.kernelMapping.delete(file);
            }
            else {
                kernelOrMap.delete(grammar);
            }
        });
        this.runningKernels = this.runningKernels.filter((k) => k !== kernel);
    }
    getFilesForKernel(kernel) {
        const grammar = kernel.grammar.name;
        return this.filePaths.filter((file) => {
            const kernelOrMap = this.kernelMapping.get(file);
            if (!kernelOrMap) {
                return false;
            }
            return kernelOrMap instanceof kernel_1.default
                ? kernelOrMap === kernel
                : kernelOrMap.get(grammar) === kernel;
        });
    }
    dispose() {
        this.subscriptions.dispose();
        this.markersMapping.forEach((markerStore) => markerStore.clear());
        this.markersMapping.clear();
        this.runningKernels.forEach((kernel) => kernel.destroy());
        this.runningKernels = [];
        this.kernelMapping.clear();
    }
    updateEditor(editor) {
        this.editor = editor;
        this.setGrammar(editor);
        if (this.globalMode && this.kernel && editor) {
            const fileName = editor.getPath();
            if (!fileName) {
                return;
            }
            this.kernelMapping.set(fileName, this.kernel);
        }
    }
    getEmbeddedGrammar(editor) {
        const grammar = editor.getGrammar();
        if (!utils_1.isMultilanguageGrammar(grammar)) {
            return grammar;
        }
        const embeddedScope = utils_1.getEmbeddedScope(editor, editor.getCursorBufferPosition());
        if (!embeddedScope) {
            return grammar;
        }
        const scope = embeddedScope.replace(".embedded", "");
        return atom.grammars.grammarForScopeName(scope);
    }
    setGrammar(editor) {
        if (!editor) {
            this.grammar = null;
            return;
        }
        this.grammar = this.getEmbeddedGrammar(editor);
    }
    setConfigValue(keyPath, newValue) {
        if (!newValue) {
            newValue = atom.config.get(keyPath);
        }
        this.configMapping.set(keyPath, newValue);
    }
    forceEditorUpdate() {
        const currentEditor = this.editor;
        if (!currentEditor) {
            return;
        }
        const oldKey = this.filePath;
        if (!oldKey || !this.kernelMapping.has(oldKey)) {
            return;
        }
        this.updateEditor(null);
        this.updateEditor(currentEditor);
        const newKey = this.filePath;
        if (!newKey) {
            return;
        }
        this.kernelMapping.set(newKey, this.kernelMapping.get(oldKey));
        this.kernelMapping.delete(oldKey);
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", Map)
], Store.prototype, "markersMapping", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Array)
], Store.prototype, "runningKernels", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], Store.prototype, "kernelMapping", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Map)
], Store.prototype, "startingKernels", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], Store.prototype, "editor", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], Store.prototype, "grammar", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Map)
], Store.prototype, "configMapping", void 0);
__decorate([
    mobx_1.computed,
    __metadata("design:type", kernel_1.default),
    __metadata("design:paramtypes", [])
], Store.prototype, "kernel", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Store.prototype, "filePath", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", Array),
    __metadata("design:paramtypes", [])
], Store.prototype, "filePaths", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], Store.prototype, "notebook", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", markers_1.default),
    __metadata("design:paramtypes", [])
], Store.prototype, "markers", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Store.prototype, "newMarkerStore", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], Store.prototype, "startKernel", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kernel_1.default, String, atom_1.TextEditor, Object]),
    __metadata("design:returntype", void 0)
], Store.prototype, "newKernel", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kernel_1.default]),
    __metadata("design:returntype", void 0)
], Store.prototype, "deleteKernel", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Store.prototype, "dispose", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [atom_1.TextEditor]),
    __metadata("design:returntype", void 0)
], Store.prototype, "updateEditor", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [atom_1.TextEditor]),
    __metadata("design:returntype", void 0)
], Store.prototype, "setGrammar", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], Store.prototype, "setConfigValue", null);
exports.Store = Store;
const store = new Store();
exports.default = store;
window.hydrogen_store = store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RvcmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUFzRTtBQUN0RSwrQkFPYztBQUNkLG9DQUlrQjtBQUNsQixvREFBdUI7QUFFdkIsNkRBQStDO0FBQy9DLHdEQUFvQztBQUVwQyx1REFBK0I7QUFDL0IsZ0VBQWtEO0FBS2xELE1BQWEsS0FBSztJQUFsQjtRQUNFLGtCQUFhLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBRTFDLG1CQUFjLEdBQTZCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFckQsbUJBQWMsR0FBa0IsRUFBRSxDQUFDO1FBRW5DLGtCQUFhLEdBQWtCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFekMsb0JBQWUsR0FBeUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVsRCxXQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBSTlDLGtCQUFhLEdBQTRDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkUsZUFBVSxHQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUErUnhFLENBQUM7SUE1UkMsSUFBSSxNQUFNO1FBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUNoRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUM3QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxT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YztBQUVuQztJQURDLGlCQUFVOzs0Q0FDOEI7QUFFekM7SUFEQyxpQkFBVTs4QkFDTSxHQUFHOzhDQUE4QjtBQUVsRDtJQURDLGlCQUFVOztxQ0FDbUM7QUFFOUM7SUFEQyxpQkFBVTs7c0NBQ3lCO0FBRXBDO0lBREMsaUJBQVU7OEJBQ0ksR0FBRzs0Q0FBaUQ7QUFJbkU7SUFEQyxlQUFROzhCQUNLLGdCQUFNOzttQ0EwQm5CO0FBR0Q7SUFEQyxlQUFROzs7cUNBUVI7QUFJRDtJQURDLGVBQVE7OEJBQ1EsS0FBSzs7c0NBRXJCO0FBR0Q7SUFEQyxlQUFROzs7cUNBeUNSO0FBR0Q7SUFEQyxlQUFROzhCQUNNLGlCQUFXOztvQ0FPekI7QUFHRDtJQURDLGFBQU07Ozs7MkNBS047QUFHRDtJQURDLGFBQU07Ozs7d0NBR047QUFnQ0Q7SUFEQyxhQUFNOztxQ0FFRyxnQkFBTSxVQUVOLGlCQUFVOztzQ0F5Qm5CO0FBR0Q7SUFEQyxhQUFNOztxQ0FDYyxnQkFBTTs7eUNBZ0IxQjtBQWdCRDtJQURDLGFBQU07Ozs7b0NBUU47QUFHRDtJQURDLGFBQU07O3FDQUNjLGlCQUFVOzt5Q0FXOUI7QUFzQkQ7SUFEQyxhQUFNOztxQ0FDWSxpQkFBVTs7dUNBTzVCO0FBR0Q7SUFEQyxhQUFNOzs7OzJDQU9OO0FBeFJILHNCQStTQztBQUNELE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDMUIsa0JBQWUsS0FBSyxDQUFDO0FBRXJCLE1BQU0sQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGV4dEVkaXRvciwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRmlsZSwgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XHJcbmltcG9ydCB7XHJcbiAgb2JzZXJ2YWJsZSxcclxuICBjb21wdXRlZCxcclxuICBhY3Rpb24sXHJcbiAgaXNPYnNlcnZhYmxlTWFwLFxyXG4gIGtleXMsXHJcbiAgdmFsdWVzLFxyXG59IGZyb20gXCJtb2J4XCI7XHJcbmltcG9ydCB7XHJcbiAgaXNNdWx0aWxhbmd1YWdlR3JhbW1hcixcclxuICBnZXRFbWJlZGRlZFNjb3BlLFxyXG4gIGlzVW5zYXZlZEZpbGVQYXRoLFxyXG59IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCBDb25maWcgZnJvbSBcIi4uL2NvbmZpZ1wiO1xyXG5pbXBvcnQgKiBhcyBjb2RlTWFuYWdlciBmcm9tIFwiLi4vY29kZS1tYW5hZ2VyXCI7XHJcbmltcG9ydCBNYXJrZXJTdG9yZSBmcm9tIFwiLi9tYXJrZXJzXCI7XHJcbmltcG9ydCBrZXJuZWxNYW5hZ2VyIGZyb20gXCIuLi9rZXJuZWwtbWFuYWdlclwiO1xyXG5pbXBvcnQgS2VybmVsIGZyb20gXCIuLi9rZXJuZWxcIjtcclxuaW1wb3J0ICogYXMgY29tbXV0YWJsZSBmcm9tIFwiQG50ZXJhY3QvY29tbXV0YWJsZVwiO1xyXG5cclxuZXhwb3J0IHR5cGUgS2VybmVsTWFwID0gTWFwPHN0cmluZywgS2VybmVsPjtcclxuZXhwb3J0IHR5cGUgS2VybmVsTWFwcGluZyA9IE1hcDxzdHJpbmcsIEtlcm5lbCB8IEtlcm5lbE1hcD47XHJcblxyXG5leHBvcnQgY2xhc3MgU3RvcmUge1xyXG4gIHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgbWFya2Vyc01hcHBpbmc6IE1hcDxudW1iZXIsIE1hcmtlclN0b3JlPiA9IG5ldyBNYXAoKTtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIHJ1bm5pbmdLZXJuZWxzOiBBcnJheTxLZXJuZWw+ID0gW107XHJcbiAgQG9ic2VydmFibGVcclxuICBrZXJuZWxNYXBwaW5nOiBLZXJuZWxNYXBwaW5nID0gbmV3IE1hcCgpO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgc3RhcnRpbmdLZXJuZWxzOiBNYXA8c3RyaW5nLCBib29sZWFuPiA9IG5ldyBNYXAoKTtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIGdyYW1tYXI6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgY29uZmlnTWFwcGluZzogTWFwPHN0cmluZywgdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQ+ID0gbmV3IE1hcCgpO1xyXG4gIGdsb2JhbE1vZGU6IGJvb2xlYW4gPSBCb29sZWFuKGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmdsb2JhbE1vZGVcIikpO1xyXG5cclxuICBAY29tcHV0ZWRcclxuICBnZXQga2VybmVsKCk6IEtlcm5lbCB8IG51bGwgfCB1bmRlZmluZWQge1xyXG4gICAgaWYgKCF0aGlzLmdyYW1tYXIgfHwgIXRoaXMuZWRpdG9yKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmdsb2JhbE1vZGUpIHtcclxuICAgICAgY29uc3QgY3VycmVudFNjb3BlTmFtZSA9IHRoaXMuZ3JhbW1hci5zY29wZU5hbWU7XHJcbiAgICAgIHJldHVybiB0aGlzLnJ1bm5pbmdLZXJuZWxzLmZpbmQoXHJcbiAgICAgICAgKGspID0+IGsuZ3JhbW1hci5zY29wZU5hbWUgPT09IGN1cnJlbnRTY29wZU5hbWVcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maWxlUGF0aDtcclxuICAgIGlmICghZmlsZSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGNvbnN0IGtlcm5lbE9yTWFwID0gdGhpcy5rZXJuZWxNYXBwaW5nLmdldChmaWxlKTtcclxuICAgIGlmICgha2VybmVsT3JNYXApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAoa2VybmVsT3JNYXAgaW5zdGFuY2VvZiBLZXJuZWwpIHtcclxuICAgICAgcmV0dXJuIGtlcm5lbE9yTWFwO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuZ3JhbW1hciAmJiB0aGlzLmdyYW1tYXIubmFtZVxyXG4gICAgICA/IGtlcm5lbE9yTWFwLmdldCh0aGlzLmdyYW1tYXIubmFtZSlcclxuICAgICAgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgQGNvbXB1dGVkXHJcbiAgZ2V0IGZpbGVQYXRoKCk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQge1xyXG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3I7XHJcbiAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGNvbnN0IHNhdmVkRmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xyXG4gICAgcmV0dXJuIHNhdmVkRmlsZVBhdGggPyBzYXZlZEZpbGVQYXRoIDogYFVuc2F2ZWQgRWRpdG9yICR7ZWRpdG9yLmlkfWA7XHJcbiAgfVxyXG5cclxuICAvLyBUT0RPIGZpeCB0aGUgdHlwZXMgdXNpbmcgbW9ieCB0eXBlc1xyXG4gIEBjb21wdXRlZFxyXG4gIGdldCBmaWxlUGF0aHMoKTogQXJyYXk8c3RyaW5nPiB7XHJcbiAgICByZXR1cm4ga2V5cyh0aGlzLmtlcm5lbE1hcHBpbmcpO1xyXG4gIH1cclxuXHJcbiAgQGNvbXB1dGVkXHJcbiAgZ2V0IG5vdGVib29rKCkge1xyXG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3I7XHJcbiAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGxldCBub3RlYm9vayA9IGNvbW11dGFibGUuZW1wdHlOb3RlYm9vaztcclxuXHJcbiAgICBpZiAodGhpcy5rZXJuZWwpIHtcclxuICAgICAgbm90ZWJvb2sgPSBub3RlYm9vay5zZXRJbihcclxuICAgICAgICBbXCJtZXRhZGF0YVwiLCBcImtlcm5lbHNwZWNcIl0sXHJcbiAgICAgICAgdGhpcy5rZXJuZWwudHJhbnNwb3J0Lmtlcm5lbFNwZWNcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjZWxsUmFuZ2VzID0gY29kZU1hbmFnZXIuZ2V0Q2VsbHMoZWRpdG9yKTtcclxuXHJcbiAgICBfLmZvckVhY2goY2VsbFJhbmdlcywgKGNlbGwpID0+IHtcclxuICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBjZWxsO1xyXG4gICAgICBsZXQgc291cmNlID0gY29kZU1hbmFnZXIuZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydCwgZW5kKTtcclxuICAgICAgc291cmNlID0gc291cmNlID8gc291cmNlIDogXCJcIjtcclxuICAgICAgLy8gV2hlbiB0aGUgY2VsbCBtYXJrZXIgZm9sbG93aW5nIGEgZ2l2ZW4gY2VsbCByYW5nZSBpcyBvbiBpdHMgb3duIGxpbmUsXHJcbiAgICAgIC8vIHRoZSBuZXdsaW5lIGltbWVkaWF0ZWx5IHByZWNlZGluZyB0aGF0IGNlbGwgbWFya2VyIGlzIGluY2x1ZGVkIGluXHJcbiAgICAgIC8vIGBzb3VyY2VgLiBXZSByZW1vdmUgdGhhdCBoZXJlLiBTZWUgIzE1MTIgZm9yIG1vcmUgZGV0YWlscy5cclxuICAgICAgaWYgKHNvdXJjZS5zbGljZSgtMSkgPT09IFwiXFxuXCIpIHtcclxuICAgICAgICBzb3VyY2UgPSBzb3VyY2Uuc2xpY2UoMCwgLTEpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XHJcbiAgICAgIGxldCBuZXdDZWxsO1xyXG5cclxuICAgICAgaWYgKGNlbGxUeXBlID09PSBcImNvZGVjZWxsXCIpIHtcclxuICAgICAgICBuZXdDZWxsID0gY29tbXV0YWJsZS5lbXB0eUNvZGVDZWxsLnNldChcInNvdXJjZVwiLCBzb3VyY2UpO1xyXG4gICAgICB9IGVsc2UgaWYgKGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCIpIHtcclxuICAgICAgICBzb3VyY2UgPSBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIHNvdXJjZSk7XHJcbiAgICAgICAgbmV3Q2VsbCA9IGNvbW11dGFibGUuZW1wdHlNYXJrZG93bkNlbGwuc2V0KFwic291cmNlXCIsIHNvdXJjZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG5vdGVib29rID0gY29tbXV0YWJsZS5hcHBlbmRDZWxsVG9Ob3RlYm9vayhub3RlYm9vaywgbmV3Q2VsbCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gY29tbXV0YWJsZS50b0pTKG5vdGVib29rKTtcclxuICB9XHJcblxyXG4gIEBjb21wdXRlZFxyXG4gIGdldCBtYXJrZXJzKCk6IE1hcmtlclN0b3JlIHwgbnVsbCB8IHVuZGVmaW5lZCB7XHJcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcclxuICAgIGlmICghZWRpdG9yKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbWFya2VyU3RvcmUgPSB0aGlzLm1hcmtlcnNNYXBwaW5nLmdldChlZGl0b3IuaWQpO1xyXG4gICAgcmV0dXJuIG1hcmtlclN0b3JlID8gbWFya2VyU3RvcmUgOiB0aGlzLm5ld01hcmtlclN0b3JlKGVkaXRvci5pZCk7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgbmV3TWFya2VyU3RvcmUoZWRpdG9ySWQ6IG51bWJlcikge1xyXG4gICAgY29uc3QgbWFya2VyU3RvcmUgPSBuZXcgTWFya2VyU3RvcmUoKTtcclxuICAgIHRoaXMubWFya2Vyc01hcHBpbmcuc2V0KGVkaXRvcklkLCBtYXJrZXJTdG9yZSk7XHJcbiAgICByZXR1cm4gbWFya2VyU3RvcmU7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgc3RhcnRLZXJuZWwoa2VybmVsRGlzcGxheU5hbWU6IHN0cmluZykge1xyXG4gICAgdGhpcy5zdGFydGluZ0tlcm5lbHMuc2V0KGtlcm5lbERpc3BsYXlOYW1lLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIGFkZEZpbGVEaXNwb3NlcihlZGl0b3I6IFRleHRFZGl0b3IsIGZpbGVQYXRoOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGZpbGVEaXNwb3NlciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgaWYgKGlzVW5zYXZlZEZpbGVQYXRoKGZpbGVQYXRoKSkge1xyXG4gICAgICBmaWxlRGlzcG9zZXIuYWRkKFxyXG4gICAgICAgIGVkaXRvci5vbkRpZFNhdmUoKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICBmaWxlRGlzcG9zZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgdGhpcy5hZGRGaWxlRGlzcG9zZXIoZWRpdG9yLCBldmVudC5wYXRoKTsgLy8gQWRkIGFub3RoZXIgYGZpbGVEaXNwb3NlcmAgb25jZSBpdCdzIHNhdmVkXHJcbiAgICAgICAgfSlcclxuICAgICAgKTtcclxuICAgICAgZmlsZURpc3Bvc2VyLmFkZChcclxuICAgICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgIHRoaXMua2VybmVsTWFwcGluZy5kZWxldGUoZmlsZVBhdGgpO1xyXG4gICAgICAgICAgZmlsZURpc3Bvc2VyLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgZmlsZTogRmlsZSA9IG5ldyBGaWxlKGZpbGVQYXRoKTtcclxuICAgICAgZmlsZURpc3Bvc2VyLmFkZChcclxuICAgICAgICBmaWxlLm9uRGlkRGVsZXRlKCgpID0+IHtcclxuICAgICAgICAgIHRoaXMua2VybmVsTWFwcGluZy5kZWxldGUoZmlsZVBhdGgpO1xyXG4gICAgICAgICAgZmlsZURpc3Bvc2VyLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoZmlsZURpc3Bvc2VyKTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBuZXdLZXJuZWwoXHJcbiAgICBrZXJuZWw6IEtlcm5lbCxcclxuICAgIGZpbGVQYXRoOiBzdHJpbmcsXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgICBncmFtbWFyOiBHcmFtbWFyXHJcbiAgKSB7XHJcbiAgICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgICBpZiAoIXRoaXMua2VybmVsTWFwcGluZy5oYXMoZmlsZVBhdGgpKSB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLnNldChmaWxlUGF0aCwgbmV3IE1hcCgpKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBUT0RPIHdoZW4gd2lsbCB0aGlzIGJlIGEgS2VybmVsP1xyXG4gICAgICBjb25zdCBtdWx0aUxhbmd1YWdlTWFwID0gdGhpcy5rZXJuZWxNYXBwaW5nLmdldChmaWxlUGF0aCk7XHJcbiAgICAgIGlmIChtdWx0aUxhbmd1YWdlTWFwICYmIHR5cGVvZiBtdWx0aUxhbmd1YWdlTWFwLnNldCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgKG11bHRpTGFuZ3VhZ2VNYXAgYXMgS2VybmVsTWFwKS5zZXQoZ3JhbW1hci5uYW1lLCBrZXJuZWwpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmtlcm5lbE1hcHBpbmcuc2V0KGZpbGVQYXRoLCBrZXJuZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYWRkRmlsZURpc3Bvc2VyKGVkaXRvciwgZmlsZVBhdGgpO1xyXG4gICAgY29uc3QgaW5kZXggPSB0aGlzLnJ1bm5pbmdLZXJuZWxzLmZpbmRJbmRleCgoaykgPT4gayA9PT0ga2VybmVsKTtcclxuXHJcbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XHJcbiAgICAgIHRoaXMucnVubmluZ0tlcm5lbHMucHVzaChrZXJuZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRlbGV0ZSBzdGFydGluZ0tlcm5lbCBzaW5jZSBzdG9yZS5rZXJuZWwgbm93IGluIHBsYWNlIHRvIHByZXZlbnQgZHVwbGljYXRlIGtlcm5lbFxyXG4gICAgdGhpcy5zdGFydGluZ0tlcm5lbHMuZGVsZXRlKGtlcm5lbC5rZXJuZWxTcGVjLmRpc3BsYXlfbmFtZSk7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgZGVsZXRlS2VybmVsKGtlcm5lbDogS2VybmVsKSB7XHJcbiAgICBjb25zdCBncmFtbWFyID0ga2VybmVsLmdyYW1tYXIubmFtZTtcclxuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5nZXRGaWxlc0Zvcktlcm5lbChrZXJuZWwpO1xyXG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xyXG4gICAgICBjb25zdCBrZXJuZWxPck1hcCA9IHRoaXMua2VybmVsTWFwcGluZy5nZXQoZmlsZSk7XHJcbiAgICAgIGlmICgha2VybmVsT3JNYXApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChrZXJuZWxPck1hcCBpbnN0YW5jZW9mIEtlcm5lbCkge1xyXG4gICAgICAgIHRoaXMua2VybmVsTWFwcGluZy5kZWxldGUoZmlsZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAga2VybmVsT3JNYXAuZGVsZXRlKGdyYW1tYXIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHRoaXMucnVubmluZ0tlcm5lbHMgPSB0aGlzLnJ1bm5pbmdLZXJuZWxzLmZpbHRlcigoaykgPT4gayAhPT0ga2VybmVsKTtcclxuICB9XHJcblxyXG4gIGdldEZpbGVzRm9yS2VybmVsKGtlcm5lbDogS2VybmVsKTogQXJyYXk8c3RyaW5nPiB7XHJcbiAgICBjb25zdCBncmFtbWFyID0ga2VybmVsLmdyYW1tYXIubmFtZTtcclxuICAgIHJldHVybiB0aGlzLmZpbGVQYXRocy5maWx0ZXIoKGZpbGUpID0+IHtcclxuICAgICAgY29uc3Qga2VybmVsT3JNYXAgPSB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KGZpbGUpO1xyXG4gICAgICBpZiAoIWtlcm5lbE9yTWFwKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBrZXJuZWxPck1hcCBpbnN0YW5jZW9mIEtlcm5lbFxyXG4gICAgICAgID8ga2VybmVsT3JNYXAgPT09IGtlcm5lbFxyXG4gICAgICAgIDoga2VybmVsT3JNYXAuZ2V0KGdyYW1tYXIpID09PSBrZXJuZWw7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBkaXNwb3NlKCkge1xyXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcclxuICAgIHRoaXMubWFya2Vyc01hcHBpbmcuZm9yRWFjaCgobWFya2VyU3RvcmUpID0+IG1hcmtlclN0b3JlLmNsZWFyKCkpO1xyXG4gICAgdGhpcy5tYXJrZXJzTWFwcGluZy5jbGVhcigpO1xyXG4gICAgdGhpcy5ydW5uaW5nS2VybmVscy5mb3JFYWNoKChrZXJuZWwpID0+IGtlcm5lbC5kZXN0cm95KCkpO1xyXG4gICAgdGhpcy5ydW5uaW5nS2VybmVscyA9IFtdO1xyXG4gICAgdGhpcy5rZXJuZWxNYXBwaW5nLmNsZWFyKCk7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgdXBkYXRlRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvciB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xyXG4gICAgdGhpcy5zZXRHcmFtbWFyKGVkaXRvcik7XHJcblxyXG4gICAgaWYgKHRoaXMuZ2xvYmFsTW9kZSAmJiB0aGlzLmtlcm5lbCAmJiBlZGl0b3IpIHtcclxuICAgICAgY29uc3QgZmlsZU5hbWUgPSBlZGl0b3IuZ2V0UGF0aCgpO1xyXG4gICAgICBpZiAoIWZpbGVOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMua2VybmVsTWFwcGluZy5zZXQoZmlsZU5hbWUsIHRoaXMua2VybmVsKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFJldHVybnMgdGhlIGVtYmVkZGVkIGdyYW1tYXIgZm9yIG11bHRpbGFuZ3VhZ2UsIG5vcm1hbCBncmFtbWFyIG90aGVyd2lzZVxyXG4gIGdldEVtYmVkZGVkR3JhbW1hcihlZGl0b3I6IFRleHRFZGl0b3IpOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCB7XHJcbiAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuXHJcbiAgICBpZiAoIWlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZ3JhbW1hcikpIHtcclxuICAgICAgcmV0dXJuIGdyYW1tYXI7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZW1iZWRkZWRTY29wZSA9IGdldEVtYmVkZGVkU2NvcGUoXHJcbiAgICAgIGVkaXRvcixcclxuICAgICAgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcclxuICAgICk7XHJcbiAgICBpZiAoIWVtYmVkZGVkU2NvcGUpIHtcclxuICAgICAgcmV0dXJuIGdyYW1tYXI7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzY29wZSA9IGVtYmVkZGVkU2NvcGUucmVwbGFjZShcIi5lbWJlZGRlZFwiLCBcIlwiKTtcclxuICAgIHJldHVybiBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoc2NvcGUpO1xyXG4gIH1cclxuXHJcbiAgQGFjdGlvblxyXG4gIHNldEdyYW1tYXIoZWRpdG9yOiBUZXh0RWRpdG9yIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKCFlZGl0b3IpIHtcclxuICAgICAgdGhpcy5ncmFtbWFyID0gbnVsbDtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZ3JhbW1hciA9IHRoaXMuZ2V0RW1iZWRkZWRHcmFtbWFyKGVkaXRvcik7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgc2V0Q29uZmlnVmFsdWUoa2V5UGF0aDogc3RyaW5nLCBuZXdWYWx1ZTogdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICAgIGlmICghbmV3VmFsdWUpIHtcclxuICAgICAgbmV3VmFsdWUgPSBhdG9tLmNvbmZpZy5nZXQoa2V5UGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb25maWdNYXBwaW5nLnNldChrZXlQYXRoLCBuZXdWYWx1ZSk7XHJcbiAgfVxyXG5cclxuICAvKiogRm9yY2UgbW9ieCB0byByZWNhbGN1bGF0ZSBmaWxlUGF0aCAod2hpY2ggZGVwZW5kcyBvbiBlZGl0b3Igb2JzZXJ2YWJsZSkgKi9cclxuICBmb3JjZUVkaXRvclVwZGF0ZSgpIHtcclxuICAgIGNvbnN0IGN1cnJlbnRFZGl0b3IgPSB0aGlzLmVkaXRvcjtcclxuICAgIGlmICghY3VycmVudEVkaXRvcikge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBvbGRLZXkgPSB0aGlzLmZpbGVQYXRoO1xyXG4gICAgLy8gUmV0dXJuIGJhY2sgaWYgdGhlIGtlcm5lbCBmb3IgdGhpcyBlZGl0b3IgaXMgYWxyZWFkeSBkaXNwb3NlZC5cclxuICAgIGlmICghb2xkS2V5IHx8ICF0aGlzLmtlcm5lbE1hcHBpbmcuaGFzKG9sZEtleSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy51cGRhdGVFZGl0b3IobnVsbCk7XHJcbiAgICB0aGlzLnVwZGF0ZUVkaXRvcihjdXJyZW50RWRpdG9yKTtcclxuICAgIGNvbnN0IG5ld0tleSA9IHRoaXMuZmlsZVBhdGg7XHJcbiAgICBpZiAoIW5ld0tleSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvLyBDaGFuZ2Uga2V5IG9mIGtlcm5lbE1hcHBpbmcgZnJvbSBlZGl0b3IgSUQgdG8gZmlsZSBwYXRoXHJcbiAgICB0aGlzLmtlcm5lbE1hcHBpbmcuc2V0KG5ld0tleSwgdGhpcy5rZXJuZWxNYXBwaW5nLmdldChvbGRLZXkpKTtcclxuICAgIHRoaXMua2VybmVsTWFwcGluZy5kZWxldGUob2xkS2V5KTtcclxuICB9XHJcbn1cclxuY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoKTtcclxuZXhwb3J0IGRlZmF1bHQgc3RvcmU7IC8vIEZvciBkZWJ1Z2dpbmdcclxuXHJcbndpbmRvdy5oeWRyb2dlbl9zdG9yZSA9IHN0b3JlO1xyXG4iXX0=