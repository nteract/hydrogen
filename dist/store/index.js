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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RvcmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUFzRTtBQUN0RSwrQkFPYztBQUNkLG9DQUlrQjtBQUNsQixvREFBdUI7QUFFdkIsNkRBQStDO0FBQy9DLHdEQUFvQztBQUVwQyx1REFBK0I7QUFDL0IsZ0VBQWtEO0FBS2xELE1BQWEsS0FBSztJQUFsQjtRQUNFLGtCQUFhLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBRTFDLG1CQUFjLEdBQTZCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFckQsbUJBQWMsR0FBa0IsRUFBRSxDQUFDO1FBRW5DLGtCQUFhLEdBQWtCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFekMsb0JBQWUsR0FBeUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVsRCxXQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBSTlDLGtCQUFhLEdBQTRDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkUsZUFBVSxHQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUErUnhFLENBQUM7SUE1UkMsSUFBSSxNQUFNO1FBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUNoRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUM3QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxT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YztBQUVuQztJQURDLGlCQUFVOzs0Q0FDOEI7QUFFekM7SUFEQyxpQkFBVTs4QkFDTSxHQUFHOzhDQUE4QjtBQUVsRDtJQURDLGlCQUFVOztxQ0FDbUM7QUFFOUM7SUFEQyxpQkFBVTs7c0NBQ3lCO0FBRXBDO0lBREMsaUJBQVU7OEJBQ0ksR0FBRzs0Q0FBaUQ7QUFJbkU7SUFEQyxlQUFROzhCQUNLLGdCQUFNOzttQ0EwQm5CO0FBR0Q7SUFEQyxlQUFROzs7cUNBUVI7QUFJRDtJQURDLGVBQVE7OEJBQ1EsS0FBSzs7c0NBRXJCO0FBR0Q7SUFEQyxlQUFROzs7cUNBeUNSO0FBR0Q7SUFEQyxlQUFROzhCQUNNLGlCQUFXOztvQ0FPekI7QUFHRDtJQURDLGFBQU07Ozs7MkNBS047QUFHRDtJQURDLGFBQU07Ozs7d0NBR047QUFnQ0Q7SUFEQyxhQUFNOztxQ0FFRyxnQkFBTSxVQUVOLGlCQUFVOztzQ0F5Qm5CO0FBR0Q7SUFEQyxhQUFNOztxQ0FDYyxnQkFBTTs7eUNBZ0IxQjtBQWdCRDtJQURDLGFBQU07Ozs7b0NBUU47QUFHRDtJQURDLGFBQU07O3FDQUNjLGlCQUFVOzt5Q0FXOUI7QUFzQkQ7SUFEQyxhQUFNOztxQ0FDWSxpQkFBVTs7dUNBTzVCO0FBR0Q7SUFEQyxhQUFNOzs7OzJDQU9OO0FBeFJILHNCQStTQztBQUNELE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDMUIsa0JBQWUsS0FBSyxDQUFDO0FBRXJCLE1BQU0sQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGV4dEVkaXRvciwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRmlsZSwgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQge1xuICBvYnNlcnZhYmxlLFxuICBjb21wdXRlZCxcbiAgYWN0aW9uLFxuICBpc09ic2VydmFibGVNYXAsXG4gIGtleXMsXG4gIHZhbHVlcyxcbn0gZnJvbSBcIm1vYnhcIjtcbmltcG9ydCB7XG4gIGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIsXG4gIGdldEVtYmVkZGVkU2NvcGUsXG4gIGlzVW5zYXZlZEZpbGVQYXRoLFxufSBmcm9tIFwiLi4vdXRpbHNcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCBDb25maWcgZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0ICogYXMgY29kZU1hbmFnZXIgZnJvbSBcIi4uL2NvZGUtbWFuYWdlclwiO1xuaW1wb3J0IE1hcmtlclN0b3JlIGZyb20gXCIuL21hcmtlcnNcIjtcbmltcG9ydCBrZXJuZWxNYW5hZ2VyIGZyb20gXCIuLi9rZXJuZWwtbWFuYWdlclwiO1xuaW1wb3J0IEtlcm5lbCBmcm9tIFwiLi4va2VybmVsXCI7XG5pbXBvcnQgKiBhcyBjb21tdXRhYmxlIGZyb20gXCJAbnRlcmFjdC9jb21tdXRhYmxlXCI7XG5cbmV4cG9ydCB0eXBlIEtlcm5lbE1hcCA9IE1hcDxzdHJpbmcsIEtlcm5lbD47XG5leHBvcnQgdHlwZSBLZXJuZWxNYXBwaW5nID0gTWFwPHN0cmluZywgS2VybmVsIHwgS2VybmVsTWFwPjtcblxuZXhwb3J0IGNsYXNzIFN0b3JlIHtcbiAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIEBvYnNlcnZhYmxlXG4gIG1hcmtlcnNNYXBwaW5nOiBNYXA8bnVtYmVyLCBNYXJrZXJTdG9yZT4gPSBuZXcgTWFwKCk7XG4gIEBvYnNlcnZhYmxlXG4gIHJ1bm5pbmdLZXJuZWxzOiBBcnJheTxLZXJuZWw+ID0gW107XG4gIEBvYnNlcnZhYmxlXG4gIGtlcm5lbE1hcHBpbmc6IEtlcm5lbE1hcHBpbmcgPSBuZXcgTWFwKCk7XG4gIEBvYnNlcnZhYmxlXG4gIHN0YXJ0aW5nS2VybmVsczogTWFwPHN0cmluZywgYm9vbGVhbj4gPSBuZXcgTWFwKCk7XG4gIEBvYnNlcnZhYmxlXG4gIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgQG9ic2VydmFibGVcbiAgZ3JhbW1hcjogR3JhbW1hciB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIEBvYnNlcnZhYmxlXG4gIGNvbmZpZ01hcHBpbmc6IE1hcDxzdHJpbmcsIHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkPiA9IG5ldyBNYXAoKTtcbiAgZ2xvYmFsTW9kZTogYm9vbGVhbiA9IEJvb2xlYW4oYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4uZ2xvYmFsTW9kZVwiKSk7XG5cbiAgQGNvbXB1dGVkXG4gIGdldCBrZXJuZWwoKTogS2VybmVsIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLmdyYW1tYXIgfHwgIXRoaXMuZWRpdG9yKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5nbG9iYWxNb2RlKSB7XG4gICAgICBjb25zdCBjdXJyZW50U2NvcGVOYW1lID0gdGhpcy5ncmFtbWFyLnNjb3BlTmFtZTtcbiAgICAgIHJldHVybiB0aGlzLnJ1bm5pbmdLZXJuZWxzLmZpbmQoXG4gICAgICAgIChrKSA9PiBrLmdyYW1tYXIuc2NvcGVOYW1lID09PSBjdXJyZW50U2NvcGVOYW1lXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVQYXRoO1xuICAgIGlmICghZmlsZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGtlcm5lbE9yTWFwID0gdGhpcy5rZXJuZWxNYXBwaW5nLmdldChmaWxlKTtcbiAgICBpZiAoIWtlcm5lbE9yTWFwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKGtlcm5lbE9yTWFwIGluc3RhbmNlb2YgS2VybmVsKSB7XG4gICAgICByZXR1cm4ga2VybmVsT3JNYXA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmdyYW1tYXIgJiYgdGhpcy5ncmFtbWFyLm5hbWVcbiAgICAgID8ga2VybmVsT3JNYXAuZ2V0KHRoaXMuZ3JhbW1hci5uYW1lKVxuICAgICAgOiBudWxsO1xuICB9XG5cbiAgQGNvbXB1dGVkXG4gIGdldCBmaWxlUGF0aCgpOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHNhdmVkRmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xuICAgIHJldHVybiBzYXZlZEZpbGVQYXRoID8gc2F2ZWRGaWxlUGF0aCA6IGBVbnNhdmVkIEVkaXRvciAke2VkaXRvci5pZH1gO1xuICB9XG5cbiAgLy8gVE9ETyBmaXggdGhlIHR5cGVzIHVzaW5nIG1vYnggdHlwZXNcbiAgQGNvbXB1dGVkXG4gIGdldCBmaWxlUGF0aHMoKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGtleXModGhpcy5rZXJuZWxNYXBwaW5nKTtcbiAgfVxuXG4gIEBjb21wdXRlZFxuICBnZXQgbm90ZWJvb2soKSB7XG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBsZXQgbm90ZWJvb2sgPSBjb21tdXRhYmxlLmVtcHR5Tm90ZWJvb2s7XG5cbiAgICBpZiAodGhpcy5rZXJuZWwpIHtcbiAgICAgIG5vdGVib29rID0gbm90ZWJvb2suc2V0SW4oXG4gICAgICAgIFtcIm1ldGFkYXRhXCIsIFwia2VybmVsc3BlY1wiXSxcbiAgICAgICAgdGhpcy5rZXJuZWwudHJhbnNwb3J0Lmtlcm5lbFNwZWNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgY2VsbFJhbmdlcyA9IGNvZGVNYW5hZ2VyLmdldENlbGxzKGVkaXRvcik7XG5cbiAgICBfLmZvckVhY2goY2VsbFJhbmdlcywgKGNlbGwpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gY2VsbDtcbiAgICAgIGxldCBzb3VyY2UgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xuICAgICAgc291cmNlID0gc291cmNlID8gc291cmNlIDogXCJcIjtcbiAgICAgIC8vIFdoZW4gdGhlIGNlbGwgbWFya2VyIGZvbGxvd2luZyBhIGdpdmVuIGNlbGwgcmFuZ2UgaXMgb24gaXRzIG93biBsaW5lLFxuICAgICAgLy8gdGhlIG5ld2xpbmUgaW1tZWRpYXRlbHkgcHJlY2VkaW5nIHRoYXQgY2VsbCBtYXJrZXIgaXMgaW5jbHVkZWQgaW5cbiAgICAgIC8vIGBzb3VyY2VgLiBXZSByZW1vdmUgdGhhdCBoZXJlLiBTZWUgIzE1MTIgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgIGlmIChzb3VyY2Uuc2xpY2UoLTEpID09PSBcIlxcblwiKSB7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zbGljZSgwLCAtMSk7XG4gICAgICB9XG4gICAgICBjb25zdCBjZWxsVHlwZSA9IGNvZGVNYW5hZ2VyLmdldE1ldGFkYXRhRm9yUm93KGVkaXRvciwgc3RhcnQpO1xuICAgICAgbGV0IG5ld0NlbGw7XG5cbiAgICAgIGlmIChjZWxsVHlwZSA9PT0gXCJjb2RlY2VsbFwiKSB7XG4gICAgICAgIG5ld0NlbGwgPSBjb21tdXRhYmxlLmVtcHR5Q29kZUNlbGwuc2V0KFwic291cmNlXCIsIHNvdXJjZSk7XG4gICAgICB9IGVsc2UgaWYgKGNlbGxUeXBlID09PSBcIm1hcmtkb3duXCIpIHtcbiAgICAgICAgc291cmNlID0gY29kZU1hbmFnZXIucmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoZWRpdG9yLCBzb3VyY2UpO1xuICAgICAgICBuZXdDZWxsID0gY29tbXV0YWJsZS5lbXB0eU1hcmtkb3duQ2VsbC5zZXQoXCJzb3VyY2VcIiwgc291cmNlKTtcbiAgICAgIH1cblxuICAgICAgbm90ZWJvb2sgPSBjb21tdXRhYmxlLmFwcGVuZENlbGxUb05vdGVib29rKG5vdGVib29rLCBuZXdDZWxsKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjb21tdXRhYmxlLnRvSlMobm90ZWJvb2spO1xuICB9XG5cbiAgQGNvbXB1dGVkXG4gIGdldCBtYXJrZXJzKCk6IE1hcmtlclN0b3JlIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBtYXJrZXJTdG9yZSA9IHRoaXMubWFya2Vyc01hcHBpbmcuZ2V0KGVkaXRvci5pZCk7XG4gICAgcmV0dXJuIG1hcmtlclN0b3JlID8gbWFya2VyU3RvcmUgOiB0aGlzLm5ld01hcmtlclN0b3JlKGVkaXRvci5pZCk7XG4gIH1cblxuICBAYWN0aW9uXG4gIG5ld01hcmtlclN0b3JlKGVkaXRvcklkOiBudW1iZXIpIHtcbiAgICBjb25zdCBtYXJrZXJTdG9yZSA9IG5ldyBNYXJrZXJTdG9yZSgpO1xuICAgIHRoaXMubWFya2Vyc01hcHBpbmcuc2V0KGVkaXRvcklkLCBtYXJrZXJTdG9yZSk7XG4gICAgcmV0dXJuIG1hcmtlclN0b3JlO1xuICB9XG5cbiAgQGFjdGlvblxuICBzdGFydEtlcm5lbChrZXJuZWxEaXNwbGF5TmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5zdGFydGluZ0tlcm5lbHMuc2V0KGtlcm5lbERpc3BsYXlOYW1lLCB0cnVlKTtcbiAgfVxuXG4gIGFkZEZpbGVEaXNwb3NlcihlZGl0b3I6IFRleHRFZGl0b3IsIGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaWxlRGlzcG9zZXIgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgaWYgKGlzVW5zYXZlZEZpbGVQYXRoKGZpbGVQYXRoKSkge1xuICAgICAgZmlsZURpc3Bvc2VyLmFkZChcbiAgICAgICAgZWRpdG9yLm9uRGlkU2F2ZSgoZXZlbnQpID0+IHtcbiAgICAgICAgICBmaWxlRGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgICAgICAgIHRoaXMuYWRkRmlsZURpc3Bvc2VyKGVkaXRvciwgZXZlbnQucGF0aCk7IC8vIEFkZCBhbm90aGVyIGBmaWxlRGlzcG9zZXJgIG9uY2UgaXQncyBzYXZlZFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIGZpbGVEaXNwb3Nlci5hZGQoXG4gICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgIHRoaXMua2VybmVsTWFwcGluZy5kZWxldGUoZmlsZVBhdGgpO1xuICAgICAgICAgIGZpbGVEaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBmaWxlOiBGaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpO1xuICAgICAgZmlsZURpc3Bvc2VyLmFkZChcbiAgICAgICAgZmlsZS5vbkRpZERlbGV0ZSgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShmaWxlUGF0aCk7XG4gICAgICAgICAgZmlsZURpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChmaWxlRGlzcG9zZXIpO1xuICB9XG5cbiAgQGFjdGlvblxuICBuZXdLZXJuZWwoXG4gICAga2VybmVsOiBLZXJuZWwsXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgZ3JhbW1hcjogR3JhbW1hclxuICApIHtcbiAgICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xuICAgICAgaWYgKCF0aGlzLmtlcm5lbE1hcHBpbmcuaGFzKGZpbGVQYXRoKSkge1xuICAgICAgICB0aGlzLmtlcm5lbE1hcHBpbmcuc2V0KGZpbGVQYXRoLCBuZXcgTWFwKCkpO1xuICAgICAgfVxuICAgICAgLy8gVE9ETyB3aGVuIHdpbGwgdGhpcyBiZSBhIEtlcm5lbD9cbiAgICAgIGNvbnN0IG11bHRpTGFuZ3VhZ2VNYXAgPSB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KGZpbGVQYXRoKTtcbiAgICAgIGlmIChtdWx0aUxhbmd1YWdlTWFwICYmIHR5cGVvZiBtdWx0aUxhbmd1YWdlTWFwLnNldCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIChtdWx0aUxhbmd1YWdlTWFwIGFzIEtlcm5lbE1hcCkuc2V0KGdyYW1tYXIubmFtZSwga2VybmVsKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLnNldChmaWxlUGF0aCwga2VybmVsKTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZEZpbGVEaXNwb3NlcihlZGl0b3IsIGZpbGVQYXRoKTtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMucnVubmluZ0tlcm5lbHMuZmluZEluZGV4KChrKSA9PiBrID09PSBrZXJuZWwpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5ydW5uaW5nS2VybmVscy5wdXNoKGtlcm5lbCk7XG4gICAgfVxuXG4gICAgLy8gZGVsZXRlIHN0YXJ0aW5nS2VybmVsIHNpbmNlIHN0b3JlLmtlcm5lbCBub3cgaW4gcGxhY2UgdG8gcHJldmVudCBkdXBsaWNhdGUga2VybmVsXG4gICAgdGhpcy5zdGFydGluZ0tlcm5lbHMuZGVsZXRlKGtlcm5lbC5rZXJuZWxTcGVjLmRpc3BsYXlfbmFtZSk7XG4gIH1cblxuICBAYWN0aW9uXG4gIGRlbGV0ZUtlcm5lbChrZXJuZWw6IEtlcm5lbCkge1xuICAgIGNvbnN0IGdyYW1tYXIgPSBrZXJuZWwuZ3JhbW1hci5uYW1lO1xuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5nZXRGaWxlc0Zvcktlcm5lbChrZXJuZWwpO1xuICAgIGZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGtlcm5lbE9yTWFwID0gdGhpcy5rZXJuZWxNYXBwaW5nLmdldChmaWxlKTtcbiAgICAgIGlmICgha2VybmVsT3JNYXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoa2VybmVsT3JNYXAgaW5zdGFuY2VvZiBLZXJuZWwpIHtcbiAgICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShmaWxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtlcm5lbE9yTWFwLmRlbGV0ZShncmFtbWFyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLnJ1bm5pbmdLZXJuZWxzID0gdGhpcy5ydW5uaW5nS2VybmVscy5maWx0ZXIoKGspID0+IGsgIT09IGtlcm5lbCk7XG4gIH1cblxuICBnZXRGaWxlc0Zvcktlcm5lbChrZXJuZWw6IEtlcm5lbCk6IEFycmF5PHN0cmluZz4ge1xuICAgIGNvbnN0IGdyYW1tYXIgPSBrZXJuZWwuZ3JhbW1hci5uYW1lO1xuICAgIHJldHVybiB0aGlzLmZpbGVQYXRocy5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGtlcm5lbE9yTWFwID0gdGhpcy5rZXJuZWxNYXBwaW5nLmdldChmaWxlKTtcbiAgICAgIGlmICgha2VybmVsT3JNYXApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGtlcm5lbE9yTWFwIGluc3RhbmNlb2YgS2VybmVsXG4gICAgICAgID8ga2VybmVsT3JNYXAgPT09IGtlcm5lbFxuICAgICAgICA6IGtlcm5lbE9yTWFwLmdldChncmFtbWFyKSA9PT0ga2VybmVsO1xuICAgIH0pO1xuICB9XG5cbiAgQGFjdGlvblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgdGhpcy5tYXJrZXJzTWFwcGluZy5mb3JFYWNoKChtYXJrZXJTdG9yZSkgPT4gbWFya2VyU3RvcmUuY2xlYXIoKSk7XG4gICAgdGhpcy5tYXJrZXJzTWFwcGluZy5jbGVhcigpO1xuICAgIHRoaXMucnVubmluZ0tlcm5lbHMuZm9yRWFjaCgoa2VybmVsKSA9PiBrZXJuZWwuZGVzdHJveSgpKTtcbiAgICB0aGlzLnJ1bm5pbmdLZXJuZWxzID0gW107XG4gICAgdGhpcy5rZXJuZWxNYXBwaW5nLmNsZWFyKCk7XG4gIH1cblxuICBAYWN0aW9uXG4gIHVwZGF0ZUVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgdGhpcy5zZXRHcmFtbWFyKGVkaXRvcik7XG5cbiAgICBpZiAodGhpcy5nbG9iYWxNb2RlICYmIHRoaXMua2VybmVsICYmIGVkaXRvcikge1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBlZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgaWYgKCFmaWxlTmFtZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmtlcm5lbE1hcHBpbmcuc2V0KGZpbGVOYW1lLCB0aGlzLmtlcm5lbCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgZW1iZWRkZWQgZ3JhbW1hciBmb3IgbXVsdGlsYW5ndWFnZSwgbm9ybWFsIGdyYW1tYXIgb3RoZXJ3aXNlXG4gIGdldEVtYmVkZGVkR3JhbW1hcihlZGl0b3I6IFRleHRFZGl0b3IpOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG5cbiAgICBpZiAoIWlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgIHJldHVybiBncmFtbWFyO1xuICAgIH1cblxuICAgIGNvbnN0IGVtYmVkZGVkU2NvcGUgPSBnZXRFbWJlZGRlZFNjb3BlKFxuICAgICAgZWRpdG9yLFxuICAgICAgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICApO1xuICAgIGlmICghZW1iZWRkZWRTY29wZSkge1xuICAgICAgcmV0dXJuIGdyYW1tYXI7XG4gICAgfVxuICAgIGNvbnN0IHNjb3BlID0gZW1iZWRkZWRTY29wZS5yZXBsYWNlKFwiLmVtYmVkZGVkXCIsIFwiXCIpO1xuICAgIHJldHVybiBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoc2NvcGUpO1xuICB9XG5cbiAgQGFjdGlvblxuICBzZXRHcmFtbWFyKGVkaXRvcjogVGV4dEVkaXRvciB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgdGhpcy5ncmFtbWFyID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmdyYW1tYXIgPSB0aGlzLmdldEVtYmVkZGVkR3JhbW1hcihlZGl0b3IpO1xuICB9XG5cbiAgQGFjdGlvblxuICBzZXRDb25maWdWYWx1ZShrZXlQYXRoOiBzdHJpbmcsIG5ld1ZhbHVlOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghbmV3VmFsdWUpIHtcbiAgICAgIG5ld1ZhbHVlID0gYXRvbS5jb25maWcuZ2V0KGtleVBhdGgpO1xuICAgIH1cblxuICAgIHRoaXMuY29uZmlnTWFwcGluZy5zZXQoa2V5UGF0aCwgbmV3VmFsdWUpO1xuICB9XG5cbiAgLyoqIEZvcmNlIG1vYnggdG8gcmVjYWxjdWxhdGUgZmlsZVBhdGggKHdoaWNoIGRlcGVuZHMgb24gZWRpdG9yIG9ic2VydmFibGUpICovXG4gIGZvcmNlRWRpdG9yVXBkYXRlKCkge1xuICAgIGNvbnN0IGN1cnJlbnRFZGl0b3IgPSB0aGlzLmVkaXRvcjtcbiAgICBpZiAoIWN1cnJlbnRFZGl0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb2xkS2V5ID0gdGhpcy5maWxlUGF0aDtcbiAgICAvLyBSZXR1cm4gYmFjayBpZiB0aGUga2VybmVsIGZvciB0aGlzIGVkaXRvciBpcyBhbHJlYWR5IGRpc3Bvc2VkLlxuICAgIGlmICghb2xkS2V5IHx8ICF0aGlzLmtlcm5lbE1hcHBpbmcuaGFzKG9sZEtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVFZGl0b3IobnVsbCk7XG4gICAgdGhpcy51cGRhdGVFZGl0b3IoY3VycmVudEVkaXRvcik7XG4gICAgY29uc3QgbmV3S2V5ID0gdGhpcy5maWxlUGF0aDtcbiAgICBpZiAoIW5ld0tleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBDaGFuZ2Uga2V5IG9mIGtlcm5lbE1hcHBpbmcgZnJvbSBlZGl0b3IgSUQgdG8gZmlsZSBwYXRoXG4gICAgdGhpcy5rZXJuZWxNYXBwaW5nLnNldChuZXdLZXksIHRoaXMua2VybmVsTWFwcGluZy5nZXQob2xkS2V5KSk7XG4gICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShvbGRLZXkpO1xuICB9XG59XG5jb25zdCBzdG9yZSA9IG5ldyBTdG9yZSgpO1xuZXhwb3J0IGRlZmF1bHQgc3RvcmU7IC8vIEZvciBkZWJ1Z2dpbmdcblxud2luZG93Lmh5ZHJvZ2VuX3N0b3JlID0gc3RvcmU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmVMaWtlIHtcbiAga2VybmVsPzogS2VybmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgbWFya2Vycz86IE1hcmtlclN0b3JlIHwgbnVsbCB8IHVuZGVmaW5lZDtcbn1cbiJdfQ==