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
        return (0, mobx_1.keys)(this.kernelMapping);
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
        cellRanges.forEach((cell) => {
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
        if ((0, utils_1.isUnsavedFilePath)(filePath)) {
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
        if ((0, utils_1.isMultilanguageGrammar)(editor.getGrammar())) {
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
        if (!(0, utils_1.isMultilanguageGrammar)(grammar)) {
            return grammar;
        }
        const embeddedScope = (0, utils_1.getEmbeddedScope)(editor, editor.getCursorBufferPosition());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RvcmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBc0U7QUFDdEUsK0JBQTBEO0FBQzFELG9DQUlrQjtBQUNsQiw2REFBK0M7QUFDL0Msd0RBQW9DO0FBQ3BDLHVEQUErQjtBQUMvQixnRUFBa0Q7QUFLbEQsTUFBYSxLQUFLO0lBQWxCO1FBQ0Usa0JBQWEsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUM7UUFFMUMsbUJBQWMsR0FBNkIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVyRCxtQkFBYyxHQUFrQixFQUFFLENBQUM7UUFFbkMsa0JBQWEsR0FBa0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV6QyxvQkFBZSxHQUF5QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRWxELFdBQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFJOUMsa0JBQWEsR0FBNEMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNuRSxlQUFVLEdBQVksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztJQStSeEUsQ0FBQztJQTdSQyxJQUNJLE1BQU07UUFDUixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDakMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1lBQ2hELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQzdCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FB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QUs7NkNBQWM7QUFDbkM7SUFBQyxpQkFBVTs7NENBQzhCO0FBQ3pDO0lBQUMsaUJBQVU7OEJBQ00sR0FBRzs4Q0FBOEI7QUFDbEQ7SUFBQyxpQkFBVTs7cUNBQ21DO0FBQzlDO0lBQUMsaUJBQVU7O3NDQUN5QjtBQUNwQztJQUFDLGlCQUFVOzhCQUNJLEdBQUc7NENBQWlEO0FBR25FO0lBQUMsZUFBUTs4QkFDSyxnQkFBTTs7bUNBMEJuQjtBQUVEO0lBQUMsZUFBUTs7O3FDQVFSO0FBR0Q7SUFBQyxlQUFROzhCQUNRLEtBQUs7O3NDQUVyQjtBQUVEO0lBQUMsZUFBUTs7O3FDQXlDUjtBQUVEO0lBQUMsZUFBUTs4QkFDTSxpQkFBVzs7b0NBT3pCO0FBRUQ7SUFBQyxhQUFNOzs7OzJDQUtOO0FBRUQ7SUFBQyxhQUFNOzs7O3dDQUdOO0FBK0JEO0lBQUMsYUFBTTs7cUNBRUcsZ0JBQU0sVUFFTixpQkFBVTs7c0NBeUJuQjtBQUVEO0lBQUMsYUFBTTs7cUNBQ2MsZ0JBQU07O3lDQWdCMUI7QUFlRDtJQUFDLGFBQU07Ozs7b0NBUU47QUFFRDtJQUFDLGFBQU07O3FDQUNjLGlCQUFVOzt5Q0FXOUI7QUFxQkQ7SUFBQyxhQUFNOztxQ0FDWSxpQkFBVTs7dUNBTzVCO0FBRUQ7SUFBQyxhQUFNOzs7OzJDQU9OO0FBeFJILHNCQStTQztBQUNELE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDMUIsa0JBQWUsS0FBSyxDQUFDO0FBRXJCLE1BQU0sQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGV4dEVkaXRvciwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRmlsZSwgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgeyBvYnNlcnZhYmxlLCBjb21wdXRlZCwgYWN0aW9uLCBrZXlzIH0gZnJvbSBcIm1vYnhcIjtcbmltcG9ydCB7XG4gIGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIsXG4gIGdldEVtYmVkZGVkU2NvcGUsXG4gIGlzVW5zYXZlZEZpbGVQYXRoLFxufSBmcm9tIFwiLi4vdXRpbHNcIjtcbmltcG9ydCAqIGFzIGNvZGVNYW5hZ2VyIGZyb20gXCIuLi9jb2RlLW1hbmFnZXJcIjtcbmltcG9ydCBNYXJrZXJTdG9yZSBmcm9tIFwiLi9tYXJrZXJzXCI7XG5pbXBvcnQgS2VybmVsIGZyb20gXCIuLi9rZXJuZWxcIjtcbmltcG9ydCAqIGFzIGNvbW11dGFibGUgZnJvbSBcIkBudGVyYWN0L2NvbW11dGFibGVcIjtcblxuZXhwb3J0IHR5cGUgS2VybmVsTWFwID0gTWFwPHN0cmluZywgS2VybmVsPjtcbmV4cG9ydCB0eXBlIEtlcm5lbE1hcHBpbmcgPSBNYXA8c3RyaW5nLCBLZXJuZWwgfCBLZXJuZWxNYXA+O1xuXG5leHBvcnQgY2xhc3MgU3RvcmUge1xuICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgQG9ic2VydmFibGVcbiAgbWFya2Vyc01hcHBpbmc6IE1hcDxudW1iZXIsIE1hcmtlclN0b3JlPiA9IG5ldyBNYXAoKTtcbiAgQG9ic2VydmFibGVcbiAgcnVubmluZ0tlcm5lbHM6IEFycmF5PEtlcm5lbD4gPSBbXTtcbiAgQG9ic2VydmFibGVcbiAga2VybmVsTWFwcGluZzogS2VybmVsTWFwcGluZyA9IG5ldyBNYXAoKTtcbiAgQG9ic2VydmFibGVcbiAgc3RhcnRpbmdLZXJuZWxzOiBNYXA8c3RyaW5nLCBib29sZWFuPiA9IG5ldyBNYXAoKTtcbiAgQG9ic2VydmFibGVcbiAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICBAb2JzZXJ2YWJsZVxuICBncmFtbWFyOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgQG9ic2VydmFibGVcbiAgY29uZmlnTWFwcGluZzogTWFwPHN0cmluZywgdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQ+ID0gbmV3IE1hcCgpO1xuICBnbG9iYWxNb2RlOiBib29sZWFuID0gQm9vbGVhbihhdG9tLmNvbmZpZy5nZXQoXCJIeWRyb2dlbi5nbG9iYWxNb2RlXCIpKTtcblxuICBAY29tcHV0ZWRcbiAgZ2V0IGtlcm5lbCgpOiBLZXJuZWwgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuZ3JhbW1hciB8fCAhdGhpcy5lZGl0b3IpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmdsb2JhbE1vZGUpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTY29wZU5hbWUgPSB0aGlzLmdyYW1tYXIuc2NvcGVOYW1lO1xuICAgICAgcmV0dXJuIHRoaXMucnVubmluZ0tlcm5lbHMuZmluZChcbiAgICAgICAgKGspID0+IGsuZ3JhbW1hci5zY29wZU5hbWUgPT09IGN1cnJlbnRTY29wZU5hbWVcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmlsZVBhdGg7XG4gICAgaWYgKCFmaWxlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3Qga2VybmVsT3JNYXAgPSB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KGZpbGUpO1xuICAgIGlmICgha2VybmVsT3JNYXApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoa2VybmVsT3JNYXAgaW5zdGFuY2VvZiBLZXJuZWwpIHtcbiAgICAgIHJldHVybiBrZXJuZWxPck1hcDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ3JhbW1hciAmJiB0aGlzLmdyYW1tYXIubmFtZVxuICAgICAgPyBrZXJuZWxPck1hcC5nZXQodGhpcy5ncmFtbWFyLm5hbWUpXG4gICAgICA6IG51bGw7XG4gIH1cblxuICBAY29tcHV0ZWRcbiAgZ2V0IGZpbGVQYXRoKCk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZWRpdG9yO1xuICAgIGlmICghZWRpdG9yKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3Qgc2F2ZWRGaWxlUGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHNhdmVkRmlsZVBhdGggPyBzYXZlZEZpbGVQYXRoIDogYFVuc2F2ZWQgRWRpdG9yICR7ZWRpdG9yLmlkfWA7XG4gIH1cblxuICAvLyBUT0RPIGZpeCB0aGUgdHlwZXMgdXNpbmcgbW9ieCB0eXBlc1xuICBAY29tcHV0ZWRcbiAgZ2V0IGZpbGVQYXRocygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4ga2V5cyh0aGlzLmtlcm5lbE1hcHBpbmcpO1xuICB9XG5cbiAgQGNvbXB1dGVkXG4gIGdldCBub3RlYm9vaygpIHtcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGxldCBub3RlYm9vayA9IGNvbW11dGFibGUuZW1wdHlOb3RlYm9vaztcblxuICAgIGlmICh0aGlzLmtlcm5lbCkge1xuICAgICAgbm90ZWJvb2sgPSBub3RlYm9vay5zZXRJbihcbiAgICAgICAgW1wibWV0YWRhdGFcIiwgXCJrZXJuZWxzcGVjXCJdLFxuICAgICAgICB0aGlzLmtlcm5lbC50cmFuc3BvcnQua2VybmVsU3BlY1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBjZWxsUmFuZ2VzID0gY29kZU1hbmFnZXIuZ2V0Q2VsbHMoZWRpdG9yKTtcblxuICAgIGNlbGxSYW5nZXMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBjZWxsO1xuICAgICAgbGV0IHNvdXJjZSA9IGNvZGVNYW5hZ2VyLmdldFRleHRJblJhbmdlKGVkaXRvciwgc3RhcnQsIGVuZCk7XG4gICAgICBzb3VyY2UgPSBzb3VyY2UgPyBzb3VyY2UgOiBcIlwiO1xuICAgICAgLy8gV2hlbiB0aGUgY2VsbCBtYXJrZXIgZm9sbG93aW5nIGEgZ2l2ZW4gY2VsbCByYW5nZSBpcyBvbiBpdHMgb3duIGxpbmUsXG4gICAgICAvLyB0aGUgbmV3bGluZSBpbW1lZGlhdGVseSBwcmVjZWRpbmcgdGhhdCBjZWxsIG1hcmtlciBpcyBpbmNsdWRlZCBpblxuICAgICAgLy8gYHNvdXJjZWAuIFdlIHJlbW92ZSB0aGF0IGhlcmUuIFNlZSAjMTUxMiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgaWYgKHNvdXJjZS5zbGljZSgtMSkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgc291cmNlID0gc291cmNlLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNlbGxUeXBlID0gY29kZU1hbmFnZXIuZ2V0TWV0YWRhdGFGb3JSb3coZWRpdG9yLCBzdGFydCk7XG4gICAgICBsZXQgbmV3Q2VsbDtcblxuICAgICAgaWYgKGNlbGxUeXBlID09PSBcImNvZGVjZWxsXCIpIHtcbiAgICAgICAgbmV3Q2VsbCA9IGNvbW11dGFibGUuZW1wdHlDb2RlQ2VsbC5zZXQoXCJzb3VyY2VcIiwgc291cmNlKTtcbiAgICAgIH0gZWxzZSBpZiAoY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIikge1xuICAgICAgICBzb3VyY2UgPSBjb2RlTWFuYWdlci5yZW1vdmVDb21tZW50c01hcmtkb3duQ2VsbChlZGl0b3IsIHNvdXJjZSk7XG4gICAgICAgIG5ld0NlbGwgPSBjb21tdXRhYmxlLmVtcHR5TWFya2Rvd25DZWxsLnNldChcInNvdXJjZVwiLCBzb3VyY2UpO1xuICAgICAgfVxuXG4gICAgICBub3RlYm9vayA9IGNvbW11dGFibGUuYXBwZW5kQ2VsbFRvTm90ZWJvb2sobm90ZWJvb2ssIG5ld0NlbGwpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbW11dGFibGUudG9KUyhub3RlYm9vayk7XG4gIH1cblxuICBAY29tcHV0ZWRcbiAgZ2V0IG1hcmtlcnMoKTogTWFya2VyU3RvcmUgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IG1hcmtlclN0b3JlID0gdGhpcy5tYXJrZXJzTWFwcGluZy5nZXQoZWRpdG9yLmlkKTtcbiAgICByZXR1cm4gbWFya2VyU3RvcmUgPyBtYXJrZXJTdG9yZSA6IHRoaXMubmV3TWFya2VyU3RvcmUoZWRpdG9yLmlkKTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgbmV3TWFya2VyU3RvcmUoZWRpdG9ySWQ6IG51bWJlcikge1xuICAgIGNvbnN0IG1hcmtlclN0b3JlID0gbmV3IE1hcmtlclN0b3JlKCk7XG4gICAgdGhpcy5tYXJrZXJzTWFwcGluZy5zZXQoZWRpdG9ySWQsIG1hcmtlclN0b3JlKTtcbiAgICByZXR1cm4gbWFya2VyU3RvcmU7XG4gIH1cblxuICBAYWN0aW9uXG4gIHN0YXJ0S2VybmVsKGtlcm5lbERpc3BsYXlOYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLnN0YXJ0aW5nS2VybmVscy5zZXQoa2VybmVsRGlzcGxheU5hbWUsIHRydWUpO1xuICB9XG5cbiAgYWRkRmlsZURpc3Bvc2VyKGVkaXRvcjogVGV4dEVkaXRvciwgZmlsZVBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IGZpbGVEaXNwb3NlciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICBpZiAoaXNVbnNhdmVkRmlsZVBhdGgoZmlsZVBhdGgpKSB7XG4gICAgICBmaWxlRGlzcG9zZXIuYWRkKFxuICAgICAgICBlZGl0b3Iub25EaWRTYXZlKChldmVudCkgPT4ge1xuICAgICAgICAgIGZpbGVEaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgICAgICAgdGhpcy5hZGRGaWxlRGlzcG9zZXIoZWRpdG9yLCBldmVudC5wYXRoKTsgLy8gQWRkIGFub3RoZXIgYGZpbGVEaXNwb3NlcmAgb25jZSBpdCdzIHNhdmVkXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgZmlsZURpc3Bvc2VyLmFkZChcbiAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShmaWxlUGF0aCk7XG4gICAgICAgICAgZmlsZURpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGZpbGU6IEZpbGUgPSBuZXcgRmlsZShmaWxlUGF0aCk7XG4gICAgICBmaWxlRGlzcG9zZXIuYWRkKFxuICAgICAgICBmaWxlLm9uRGlkRGVsZXRlKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmtlcm5lbE1hcHBpbmcuZGVsZXRlKGZpbGVQYXRoKTtcbiAgICAgICAgICBmaWxlRGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGZpbGVEaXNwb3Nlcik7XG4gIH1cblxuICBAYWN0aW9uXG4gIG5ld0tlcm5lbChcbiAgICBrZXJuZWw6IEtlcm5lbCxcbiAgICBmaWxlUGF0aDogc3RyaW5nLFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICBncmFtbWFyOiBHcmFtbWFyXG4gICkge1xuICAgIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XG4gICAgICBpZiAoIXRoaXMua2VybmVsTWFwcGluZy5oYXMoZmlsZVBhdGgpKSB7XG4gICAgICAgIHRoaXMua2VybmVsTWFwcGluZy5zZXQoZmlsZVBhdGgsIG5ldyBNYXAoKSk7XG4gICAgICB9XG4gICAgICAvLyBUT0RPIHdoZW4gd2lsbCB0aGlzIGJlIGEgS2VybmVsP1xuICAgICAgY29uc3QgbXVsdGlMYW5ndWFnZU1hcCA9IHRoaXMua2VybmVsTWFwcGluZy5nZXQoZmlsZVBhdGgpO1xuICAgICAgaWYgKG11bHRpTGFuZ3VhZ2VNYXAgJiYgdHlwZW9mIG11bHRpTGFuZ3VhZ2VNYXAuc2V0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgKG11bHRpTGFuZ3VhZ2VNYXAgYXMgS2VybmVsTWFwKS5zZXQoZ3JhbW1hci5uYW1lLCBrZXJuZWwpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtlcm5lbE1hcHBpbmcuc2V0KGZpbGVQYXRoLCBrZXJuZWwpO1xuICAgIH1cblxuICAgIHRoaXMuYWRkRmlsZURpc3Bvc2VyKGVkaXRvciwgZmlsZVBhdGgpO1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ydW5uaW5nS2VybmVscy5maW5kSW5kZXgoKGspID0+IGsgPT09IGtlcm5lbCk7XG5cbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLnJ1bm5pbmdLZXJuZWxzLnB1c2goa2VybmVsKTtcbiAgICB9XG5cbiAgICAvLyBkZWxldGUgc3RhcnRpbmdLZXJuZWwgc2luY2Ugc3RvcmUua2VybmVsIG5vdyBpbiBwbGFjZSB0byBwcmV2ZW50IGR1cGxpY2F0ZSBrZXJuZWxcbiAgICB0aGlzLnN0YXJ0aW5nS2VybmVscy5kZWxldGUoa2VybmVsLmtlcm5lbFNwZWMuZGlzcGxheV9uYW1lKTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgZGVsZXRlS2VybmVsKGtlcm5lbDogS2VybmVsKSB7XG4gICAgY29uc3QgZ3JhbW1hciA9IGtlcm5lbC5ncmFtbWFyLm5hbWU7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmdldEZpbGVzRm9yS2VybmVsKGtlcm5lbCk7XG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgY29uc3Qga2VybmVsT3JNYXAgPSB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KGZpbGUpO1xuICAgICAgaWYgKCFrZXJuZWxPck1hcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXJuZWxPck1hcCBpbnN0YW5jZW9mIEtlcm5lbCkge1xuICAgICAgICB0aGlzLmtlcm5lbE1hcHBpbmcuZGVsZXRlKGZpbGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2VybmVsT3JNYXAuZGVsZXRlKGdyYW1tYXIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMucnVubmluZ0tlcm5lbHMgPSB0aGlzLnJ1bm5pbmdLZXJuZWxzLmZpbHRlcigoaykgPT4gayAhPT0ga2VybmVsKTtcbiAgfVxuXG4gIGdldEZpbGVzRm9yS2VybmVsKGtlcm5lbDogS2VybmVsKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgY29uc3QgZ3JhbW1hciA9IGtlcm5lbC5ncmFtbWFyLm5hbWU7XG4gICAgcmV0dXJuIHRoaXMuZmlsZVBhdGhzLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgY29uc3Qga2VybmVsT3JNYXAgPSB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KGZpbGUpO1xuICAgICAgaWYgKCFrZXJuZWxPck1hcCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4ga2VybmVsT3JNYXAgaW5zdGFuY2VvZiBLZXJuZWxcbiAgICAgICAgPyBrZXJuZWxPck1hcCA9PT0ga2VybmVsXG4gICAgICAgIDoga2VybmVsT3JNYXAuZ2V0KGdyYW1tYXIpID09PSBrZXJuZWw7XG4gICAgfSk7XG4gIH1cblxuICBAYWN0aW9uXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICB0aGlzLm1hcmtlcnNNYXBwaW5nLmZvckVhY2goKG1hcmtlclN0b3JlKSA9PiBtYXJrZXJTdG9yZS5jbGVhcigpKTtcbiAgICB0aGlzLm1hcmtlcnNNYXBwaW5nLmNsZWFyKCk7XG4gICAgdGhpcy5ydW5uaW5nS2VybmVscy5mb3JFYWNoKChrZXJuZWwpID0+IGtlcm5lbC5kZXN0cm95KCkpO1xuICAgIHRoaXMucnVubmluZ0tlcm5lbHMgPSBbXTtcbiAgICB0aGlzLmtlcm5lbE1hcHBpbmcuY2xlYXIoKTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgdXBkYXRlRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvciB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICB0aGlzLnNldEdyYW1tYXIoZWRpdG9yKTtcblxuICAgIGlmICh0aGlzLmdsb2JhbE1vZGUgJiYgdGhpcy5rZXJuZWwgJiYgZWRpdG9yKSB7XG4gICAgICBjb25zdCBmaWxlTmFtZSA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgICBpZiAoIWZpbGVOYW1lKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMua2VybmVsTWFwcGluZy5zZXQoZmlsZU5hbWUsIHRoaXMua2VybmVsKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBlbWJlZGRlZCBncmFtbWFyIGZvciBtdWx0aWxhbmd1YWdlLCBub3JtYWwgZ3JhbW1hciBvdGhlcndpc2VcbiAgZ2V0RW1iZWRkZWRHcmFtbWFyKGVkaXRvcjogVGV4dEVkaXRvcik6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcblxuICAgIGlmICghaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihncmFtbWFyKSkge1xuICAgICAgcmV0dXJuIGdyYW1tYXI7XG4gICAgfVxuXG4gICAgY29uc3QgZW1iZWRkZWRTY29wZSA9IGdldEVtYmVkZGVkU2NvcGUoXG4gICAgICBlZGl0b3IsXG4gICAgICBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgICk7XG4gICAgaWYgKCFlbWJlZGRlZFNjb3BlKSB7XG4gICAgICByZXR1cm4gZ3JhbW1hcjtcbiAgICB9XG4gICAgY29uc3Qgc2NvcGUgPSBlbWJlZGRlZFNjb3BlLnJlcGxhY2UoXCIuZW1iZWRkZWRcIiwgXCJcIik7XG4gICAgcmV0dXJuIGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShzY29wZSk7XG4gIH1cblxuICBAYWN0aW9uXG4gIHNldEdyYW1tYXIoZWRpdG9yOiBUZXh0RWRpdG9yIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghZWRpdG9yKSB7XG4gICAgICB0aGlzLmdyYW1tYXIgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZ3JhbW1hciA9IHRoaXMuZ2V0RW1iZWRkZWRHcmFtbWFyKGVkaXRvcik7XG4gIH1cblxuICBAYWN0aW9uXG4gIHNldENvbmZpZ1ZhbHVlKGtleVBhdGg6IHN0cmluZywgbmV3VmFsdWU6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFuZXdWYWx1ZSkge1xuICAgICAgbmV3VmFsdWUgPSBhdG9tLmNvbmZpZy5nZXQoa2V5UGF0aCk7XG4gICAgfVxuXG4gICAgdGhpcy5jb25maWdNYXBwaW5nLnNldChrZXlQYXRoLCBuZXdWYWx1ZSk7XG4gIH1cblxuICAvKiogRm9yY2UgbW9ieCB0byByZWNhbGN1bGF0ZSBmaWxlUGF0aCAod2hpY2ggZGVwZW5kcyBvbiBlZGl0b3Igb2JzZXJ2YWJsZSkgKi9cbiAgZm9yY2VFZGl0b3JVcGRhdGUoKSB7XG4gICAgY29uc3QgY3VycmVudEVkaXRvciA9IHRoaXMuZWRpdG9yO1xuICAgIGlmICghY3VycmVudEVkaXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvbGRLZXkgPSB0aGlzLmZpbGVQYXRoO1xuICAgIC8vIFJldHVybiBiYWNrIGlmIHRoZSBrZXJuZWwgZm9yIHRoaXMgZWRpdG9yIGlzIGFscmVhZHkgZGlzcG9zZWQuXG4gICAgaWYgKCFvbGRLZXkgfHwgIXRoaXMua2VybmVsTWFwcGluZy5oYXMob2xkS2V5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUVkaXRvcihudWxsKTtcbiAgICB0aGlzLnVwZGF0ZUVkaXRvcihjdXJyZW50RWRpdG9yKTtcbiAgICBjb25zdCBuZXdLZXkgPSB0aGlzLmZpbGVQYXRoO1xuICAgIGlmICghbmV3S2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIENoYW5nZSBrZXkgb2Yga2VybmVsTWFwcGluZyBmcm9tIGVkaXRvciBJRCB0byBmaWxlIHBhdGhcbiAgICB0aGlzLmtlcm5lbE1hcHBpbmcuc2V0KG5ld0tleSwgdGhpcy5rZXJuZWxNYXBwaW5nLmdldChvbGRLZXkpKTtcbiAgICB0aGlzLmtlcm5lbE1hcHBpbmcuZGVsZXRlKG9sZEtleSk7XG4gIH1cbn1cbmNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG5leHBvcnQgZGVmYXVsdCBzdG9yZTsgLy8gRm9yIGRlYnVnZ2luZ1xuXG53aW5kb3cuaHlkcm9nZW5fc3RvcmUgPSBzdG9yZTtcblxuZXhwb3J0IGludGVyZmFjZSBTdG9yZUxpa2Uge1xuICBrZXJuZWw/OiBLZXJuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBtYXJrZXJzPzogTWFya2VyU3RvcmUgfCBudWxsIHwgdW5kZWZpbmVkO1xufVxuIl19