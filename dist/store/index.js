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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RvcmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUFzRTtBQUN0RSwrQkFBMEQ7QUFDMUQsb0NBSWtCO0FBQ2xCLDZEQUErQztBQUMvQyx3REFBb0M7QUFDcEMsdURBQStCO0FBQy9CLGdFQUFrRDtBQUtsRCxNQUFhLEtBQUs7SUFBbEI7UUFDRSxrQkFBYSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQUUxQyxtQkFBYyxHQUE2QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXJELG1CQUFjLEdBQWtCLEVBQUUsQ0FBQztRQUVuQyxrQkFBYSxHQUFrQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXpDLG9CQUFlLEdBQXlCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFbEQsV0FBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUk5QyxrQkFBYSxHQUE0QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ25FLGVBQVUsR0FBWSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0lBK1J4RSxDQUFDO0lBNVJDLElBQUksTUFBTTtRQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNqQyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25CLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDaEQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FDN0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLGdC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QUM4QjtBQUV6QztJQURDLGlCQUFVOzhCQUNNLEdBQUc7OENBQThCO0FBRWxEO0lBREMsaUJBQVU7O3FDQUNtQztBQUU5QztJQURDLGlCQUFVOztzQ0FDeUI7QUFFcEM7SUFEQyxpQkFBVTs4QkFDSSxHQUFHOzRDQUFpRDtBQUluRTtJQURDLGVBQVE7OEJBQ0ssZ0JBQU07O21DQTBCbkI7QUFHRDtJQURDLGVBQVE7OztxQ0FRUjtBQUlEO0lBREMsZUFBUTs4QkFDUSxLQUFLOztzQ0FFckI7QUFHRDtJQURDLGVBQVE7OztxQ0F5Q1I7QUFHRDtJQURDLGVBQVE7OEJBQ00saUJBQVc7O29DQU96QjtBQUdEO0lBREMsYUFBTTs7OzsyQ0FLTjtBQUdEO0lBREMsYUFBTTs7Ozt3Q0FHTjtBQWdDRDtJQURDLGFBQU07O3FDQUVHLGdCQUFNLFVBRU4saUJBQVU7O3NDQXlCbkI7QUFHRDtJQURDLGFBQU07O3FDQUNjLGdCQUFNOzt5Q0FnQjFCO0FBZ0JEO0lBREMsYUFBTTs7OztvQ0FRTjtBQUdEO0lBREMsYUFBTTs7cUNBQ2MsaUJBQVU7O3lDQVc5QjtBQXNCRDtJQURDLGFBQU07O3FDQUNZLGlCQUFVOzt1Q0FPNUI7QUFHRDtJQURDLGFBQU07Ozs7MkNBT047QUF4Ukgsc0JBK1NDO0FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUMxQixrQkFBZSxLQUFLLENBQUM7QUFFckIsTUFBTSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RWRpdG9yLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBGaWxlLCBHcmFtbWFyIH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHsgb2JzZXJ2YWJsZSwgY29tcHV0ZWQsIGFjdGlvbiwga2V5cyB9IGZyb20gXCJtb2J4XCI7XHJcbmltcG9ydCB7XHJcbiAgaXNNdWx0aWxhbmd1YWdlR3JhbW1hcixcclxuICBnZXRFbWJlZGRlZFNjb3BlLFxyXG4gIGlzVW5zYXZlZEZpbGVQYXRoLFxyXG59IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgKiBhcyBjb2RlTWFuYWdlciBmcm9tIFwiLi4vY29kZS1tYW5hZ2VyXCI7XHJcbmltcG9ydCBNYXJrZXJTdG9yZSBmcm9tIFwiLi9tYXJrZXJzXCI7XHJcbmltcG9ydCBLZXJuZWwgZnJvbSBcIi4uL2tlcm5lbFwiO1xyXG5pbXBvcnQgKiBhcyBjb21tdXRhYmxlIGZyb20gXCJAbnRlcmFjdC9jb21tdXRhYmxlXCI7XHJcblxyXG5leHBvcnQgdHlwZSBLZXJuZWxNYXAgPSBNYXA8c3RyaW5nLCBLZXJuZWw+O1xyXG5leHBvcnQgdHlwZSBLZXJuZWxNYXBwaW5nID0gTWFwPHN0cmluZywgS2VybmVsIHwgS2VybmVsTWFwPjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTdG9yZSB7XHJcbiAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgQG9ic2VydmFibGVcclxuICBtYXJrZXJzTWFwcGluZzogTWFwPG51bWJlciwgTWFya2VyU3RvcmU+ID0gbmV3IE1hcCgpO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgcnVubmluZ0tlcm5lbHM6IEFycmF5PEtlcm5lbD4gPSBbXTtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIGtlcm5lbE1hcHBpbmc6IEtlcm5lbE1hcHBpbmcgPSBuZXcgTWFwKCk7XHJcbiAgQG9ic2VydmFibGVcclxuICBzdGFydGluZ0tlcm5lbHM6IE1hcDxzdHJpbmcsIGJvb2xlYW4+ID0gbmV3IE1hcCgpO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgZ3JhbW1hcjogR3JhbW1hciB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgQG9ic2VydmFibGVcclxuICBjb25maWdNYXBwaW5nOiBNYXA8c3RyaW5nLCB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZD4gPSBuZXcgTWFwKCk7XHJcbiAgZ2xvYmFsTW9kZTogYm9vbGVhbiA9IEJvb2xlYW4oYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4uZ2xvYmFsTW9kZVwiKSk7XHJcblxyXG4gIEBjb21wdXRlZFxyXG4gIGdldCBrZXJuZWwoKTogS2VybmVsIHwgbnVsbCB8IHVuZGVmaW5lZCB7XHJcbiAgICBpZiAoIXRoaXMuZ3JhbW1hciB8fCAhdGhpcy5lZGl0b3IpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZ2xvYmFsTW9kZSkge1xyXG4gICAgICBjb25zdCBjdXJyZW50U2NvcGVOYW1lID0gdGhpcy5ncmFtbWFyLnNjb3BlTmFtZTtcclxuICAgICAgcmV0dXJuIHRoaXMucnVubmluZ0tlcm5lbHMuZmluZChcclxuICAgICAgICAoaykgPT4gay5ncmFtbWFyLnNjb3BlTmFtZSA9PT0gY3VycmVudFNjb3BlTmFtZVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVQYXRoO1xyXG4gICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgY29uc3Qga2VybmVsT3JNYXAgPSB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KGZpbGUpO1xyXG4gICAgaWYgKCFrZXJuZWxPck1hcCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGlmIChrZXJuZWxPck1hcCBpbnN0YW5jZW9mIEtlcm5lbCkge1xyXG4gICAgICByZXR1cm4ga2VybmVsT3JNYXA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5ncmFtbWFyICYmIHRoaXMuZ3JhbW1hci5uYW1lXHJcbiAgICAgID8ga2VybmVsT3JNYXAuZ2V0KHRoaXMuZ3JhbW1hci5uYW1lKVxyXG4gICAgICA6IG51bGw7XHJcbiAgfVxyXG5cclxuICBAY29tcHV0ZWRcclxuICBnZXQgZmlsZVBhdGgoKTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB7XHJcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcclxuICAgIGlmICghZWRpdG9yKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc2F2ZWRGaWxlUGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XHJcbiAgICByZXR1cm4gc2F2ZWRGaWxlUGF0aCA/IHNhdmVkRmlsZVBhdGggOiBgVW5zYXZlZCBFZGl0b3IgJHtlZGl0b3IuaWR9YDtcclxuICB9XHJcblxyXG4gIC8vIFRPRE8gZml4IHRoZSB0eXBlcyB1c2luZyBtb2J4IHR5cGVzXHJcbiAgQGNvbXB1dGVkXHJcbiAgZ2V0IGZpbGVQYXRocygpOiBBcnJheTxzdHJpbmc+IHtcclxuICAgIHJldHVybiBrZXlzKHRoaXMua2VybmVsTWFwcGluZyk7XHJcbiAgfVxyXG5cclxuICBAY29tcHV0ZWRcclxuICBnZXQgbm90ZWJvb2soKSB7XHJcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcclxuICAgIGlmICghZWRpdG9yKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgbGV0IG5vdGVib29rID0gY29tbXV0YWJsZS5lbXB0eU5vdGVib29rO1xyXG5cclxuICAgIGlmICh0aGlzLmtlcm5lbCkge1xyXG4gICAgICBub3RlYm9vayA9IG5vdGVib29rLnNldEluKFxyXG4gICAgICAgIFtcIm1ldGFkYXRhXCIsIFwia2VybmVsc3BlY1wiXSxcclxuICAgICAgICB0aGlzLmtlcm5lbC50cmFuc3BvcnQua2VybmVsU3BlY1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNlbGxSYW5nZXMgPSBjb2RlTWFuYWdlci5nZXRDZWxscyhlZGl0b3IpO1xyXG5cclxuICAgIGNlbGxSYW5nZXMuZm9yRWFjaCgoY2VsbCkgPT4ge1xyXG4gICAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGNlbGw7XHJcbiAgICAgIGxldCBzb3VyY2UgPSBjb2RlTWFuYWdlci5nZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0LCBlbmQpO1xyXG4gICAgICBzb3VyY2UgPSBzb3VyY2UgPyBzb3VyY2UgOiBcIlwiO1xyXG4gICAgICAvLyBXaGVuIHRoZSBjZWxsIG1hcmtlciBmb2xsb3dpbmcgYSBnaXZlbiBjZWxsIHJhbmdlIGlzIG9uIGl0cyBvd24gbGluZSxcclxuICAgICAgLy8gdGhlIG5ld2xpbmUgaW1tZWRpYXRlbHkgcHJlY2VkaW5nIHRoYXQgY2VsbCBtYXJrZXIgaXMgaW5jbHVkZWQgaW5cclxuICAgICAgLy8gYHNvdXJjZWAuIFdlIHJlbW92ZSB0aGF0IGhlcmUuIFNlZSAjMTUxMiBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gICAgICBpZiAoc291cmNlLnNsaWNlKC0xKSA9PT0gXCJcXG5cIikge1xyXG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zbGljZSgwLCAtMSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY2VsbFR5cGUgPSBjb2RlTWFuYWdlci5nZXRNZXRhZGF0YUZvclJvdyhlZGl0b3IsIHN0YXJ0KTtcclxuICAgICAgbGV0IG5ld0NlbGw7XHJcblxyXG4gICAgICBpZiAoY2VsbFR5cGUgPT09IFwiY29kZWNlbGxcIikge1xyXG4gICAgICAgIG5ld0NlbGwgPSBjb21tdXRhYmxlLmVtcHR5Q29kZUNlbGwuc2V0KFwic291cmNlXCIsIHNvdXJjZSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoY2VsbFR5cGUgPT09IFwibWFya2Rvd25cIikge1xyXG4gICAgICAgIHNvdXJjZSA9IGNvZGVNYW5hZ2VyLnJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKGVkaXRvciwgc291cmNlKTtcclxuICAgICAgICBuZXdDZWxsID0gY29tbXV0YWJsZS5lbXB0eU1hcmtkb3duQ2VsbC5zZXQoXCJzb3VyY2VcIiwgc291cmNlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbm90ZWJvb2sgPSBjb21tdXRhYmxlLmFwcGVuZENlbGxUb05vdGVib29rKG5vdGVib29rLCBuZXdDZWxsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBjb21tdXRhYmxlLnRvSlMobm90ZWJvb2spO1xyXG4gIH1cclxuXHJcbiAgQGNvbXB1dGVkXHJcbiAgZ2V0IG1hcmtlcnMoKTogTWFya2VyU3RvcmUgfCBudWxsIHwgdW5kZWZpbmVkIHtcclxuICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZWRpdG9yO1xyXG4gICAgaWYgKCFlZGl0b3IpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtYXJrZXJTdG9yZSA9IHRoaXMubWFya2Vyc01hcHBpbmcuZ2V0KGVkaXRvci5pZCk7XHJcbiAgICByZXR1cm4gbWFya2VyU3RvcmUgPyBtYXJrZXJTdG9yZSA6IHRoaXMubmV3TWFya2VyU3RvcmUoZWRpdG9yLmlkKTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBuZXdNYXJrZXJTdG9yZShlZGl0b3JJZDogbnVtYmVyKSB7XHJcbiAgICBjb25zdCBtYXJrZXJTdG9yZSA9IG5ldyBNYXJrZXJTdG9yZSgpO1xyXG4gICAgdGhpcy5tYXJrZXJzTWFwcGluZy5zZXQoZWRpdG9ySWQsIG1hcmtlclN0b3JlKTtcclxuICAgIHJldHVybiBtYXJrZXJTdG9yZTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBzdGFydEtlcm5lbChrZXJuZWxEaXNwbGF5TmFtZTogc3RyaW5nKSB7XHJcbiAgICB0aGlzLnN0YXJ0aW5nS2VybmVscy5zZXQoa2VybmVsRGlzcGxheU5hbWUsIHRydWUpO1xyXG4gIH1cclxuXHJcbiAgYWRkRmlsZURpc3Bvc2VyKGVkaXRvcjogVGV4dEVkaXRvciwgZmlsZVBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgZmlsZURpc3Bvc2VyID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICBpZiAoaXNVbnNhdmVkRmlsZVBhdGgoZmlsZVBhdGgpKSB7XHJcbiAgICAgIGZpbGVEaXNwb3Nlci5hZGQoXHJcbiAgICAgICAgZWRpdG9yLm9uRGlkU2F2ZSgoZXZlbnQpID0+IHtcclxuICAgICAgICAgIGZpbGVEaXNwb3Nlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICB0aGlzLmFkZEZpbGVEaXNwb3NlcihlZGl0b3IsIGV2ZW50LnBhdGgpOyAvLyBBZGQgYW5vdGhlciBgZmlsZURpc3Bvc2VyYCBvbmNlIGl0J3Mgc2F2ZWRcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgICBmaWxlRGlzcG9zZXIuYWRkKFxyXG4gICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShmaWxlUGF0aCk7XHJcbiAgICAgICAgICBmaWxlRGlzcG9zZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBmaWxlOiBGaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpO1xyXG4gICAgICBmaWxlRGlzcG9zZXIuYWRkKFxyXG4gICAgICAgIGZpbGUub25EaWREZWxldGUoKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShmaWxlUGF0aCk7XHJcbiAgICAgICAgICBmaWxlRGlzcG9zZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChmaWxlRGlzcG9zZXIpO1xyXG4gIH1cclxuXHJcbiAgQGFjdGlvblxyXG4gIG5ld0tlcm5lbChcclxuICAgIGtlcm5lbDogS2VybmVsLFxyXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICAgIGdyYW1tYXI6IEdyYW1tYXJcclxuICApIHtcclxuICAgIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XHJcbiAgICAgIGlmICghdGhpcy5rZXJuZWxNYXBwaW5nLmhhcyhmaWxlUGF0aCkpIHtcclxuICAgICAgICB0aGlzLmtlcm5lbE1hcHBpbmcuc2V0KGZpbGVQYXRoLCBuZXcgTWFwKCkpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIFRPRE8gd2hlbiB3aWxsIHRoaXMgYmUgYSBLZXJuZWw/XHJcbiAgICAgIGNvbnN0IG11bHRpTGFuZ3VhZ2VNYXAgPSB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KGZpbGVQYXRoKTtcclxuICAgICAgaWYgKG11bHRpTGFuZ3VhZ2VNYXAgJiYgdHlwZW9mIG11bHRpTGFuZ3VhZ2VNYXAuc2V0ID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAobXVsdGlMYW5ndWFnZU1hcCBhcyBLZXJuZWxNYXApLnNldChncmFtbWFyLm5hbWUsIGtlcm5lbCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMua2VybmVsTWFwcGluZy5zZXQoZmlsZVBhdGgsIGtlcm5lbCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hZGRGaWxlRGlzcG9zZXIoZWRpdG9yLCBmaWxlUGF0aCk7XHJcbiAgICBjb25zdCBpbmRleCA9IHRoaXMucnVubmluZ0tlcm5lbHMuZmluZEluZGV4KChrKSA9PiBrID09PSBrZXJuZWwpO1xyXG5cclxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcclxuICAgICAgdGhpcy5ydW5uaW5nS2VybmVscy5wdXNoKGtlcm5lbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGVsZXRlIHN0YXJ0aW5nS2VybmVsIHNpbmNlIHN0b3JlLmtlcm5lbCBub3cgaW4gcGxhY2UgdG8gcHJldmVudCBkdXBsaWNhdGUga2VybmVsXHJcbiAgICB0aGlzLnN0YXJ0aW5nS2VybmVscy5kZWxldGUoa2VybmVsLmtlcm5lbFNwZWMuZGlzcGxheV9uYW1lKTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBkZWxldGVLZXJuZWwoa2VybmVsOiBLZXJuZWwpIHtcclxuICAgIGNvbnN0IGdyYW1tYXIgPSBrZXJuZWwuZ3JhbW1hci5uYW1lO1xyXG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmdldEZpbGVzRm9yS2VybmVsKGtlcm5lbCk7XHJcbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XHJcbiAgICAgIGNvbnN0IGtlcm5lbE9yTWFwID0gdGhpcy5rZXJuZWxNYXBwaW5nLmdldChmaWxlKTtcclxuICAgICAgaWYgKCFrZXJuZWxPck1hcCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGtlcm5lbE9yTWFwIGluc3RhbmNlb2YgS2VybmVsKSB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShmaWxlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBrZXJuZWxPck1hcC5kZWxldGUoZ3JhbW1hcik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgdGhpcy5ydW5uaW5nS2VybmVscyA9IHRoaXMucnVubmluZ0tlcm5lbHMuZmlsdGVyKChrKSA9PiBrICE9PSBrZXJuZWwpO1xyXG4gIH1cclxuXHJcbiAgZ2V0RmlsZXNGb3JLZXJuZWwoa2VybmVsOiBLZXJuZWwpOiBBcnJheTxzdHJpbmc+IHtcclxuICAgIGNvbnN0IGdyYW1tYXIgPSBrZXJuZWwuZ3JhbW1hci5uYW1lO1xyXG4gICAgcmV0dXJuIHRoaXMuZmlsZVBhdGhzLmZpbHRlcigoZmlsZSkgPT4ge1xyXG4gICAgICBjb25zdCBrZXJuZWxPck1hcCA9IHRoaXMua2VybmVsTWFwcGluZy5nZXQoZmlsZSk7XHJcbiAgICAgIGlmICgha2VybmVsT3JNYXApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGtlcm5lbE9yTWFwIGluc3RhbmNlb2YgS2VybmVsXHJcbiAgICAgICAgPyBrZXJuZWxPck1hcCA9PT0ga2VybmVsXHJcbiAgICAgICAgOiBrZXJuZWxPck1hcC5nZXQoZ3JhbW1hcikgPT09IGtlcm5lbDtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgQGFjdGlvblxyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5tYXJrZXJzTWFwcGluZy5mb3JFYWNoKChtYXJrZXJTdG9yZSkgPT4gbWFya2VyU3RvcmUuY2xlYXIoKSk7XHJcbiAgICB0aGlzLm1hcmtlcnNNYXBwaW5nLmNsZWFyKCk7XHJcbiAgICB0aGlzLnJ1bm5pbmdLZXJuZWxzLmZvckVhY2goKGtlcm5lbCkgPT4ga2VybmVsLmRlc3Ryb3koKSk7XHJcbiAgICB0aGlzLnJ1bm5pbmdLZXJuZWxzID0gW107XHJcbiAgICB0aGlzLmtlcm5lbE1hcHBpbmcuY2xlYXIoKTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICB1cGRhdGVFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XHJcbiAgICB0aGlzLnNldEdyYW1tYXIoZWRpdG9yKTtcclxuXHJcbiAgICBpZiAodGhpcy5nbG9iYWxNb2RlICYmIHRoaXMua2VybmVsICYmIGVkaXRvcikge1xyXG4gICAgICBjb25zdCBmaWxlTmFtZSA9IGVkaXRvci5nZXRQYXRoKCk7XHJcbiAgICAgIGlmICghZmlsZU5hbWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5rZXJuZWxNYXBwaW5nLnNldChmaWxlTmFtZSwgdGhpcy5rZXJuZWwpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJucyB0aGUgZW1iZWRkZWQgZ3JhbW1hciBmb3IgbXVsdGlsYW5ndWFnZSwgbm9ybWFsIGdyYW1tYXIgb3RoZXJ3aXNlXHJcbiAgZ2V0RW1iZWRkZWRHcmFtbWFyKGVkaXRvcjogVGV4dEVkaXRvcik6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkIHtcclxuICAgIGNvbnN0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG5cclxuICAgIGlmICghaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICByZXR1cm4gZ3JhbW1hcjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBlbWJlZGRlZFNjb3BlID0gZ2V0RW1iZWRkZWRTY29wZShcclxuICAgICAgZWRpdG9yLFxyXG4gICAgICBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxyXG4gICAgKTtcclxuICAgIGlmICghZW1iZWRkZWRTY29wZSkge1xyXG4gICAgICByZXR1cm4gZ3JhbW1hcjtcclxuICAgIH1cclxuICAgIGNvbnN0IHNjb3BlID0gZW1iZWRkZWRTY29wZS5yZXBsYWNlKFwiLmVtYmVkZGVkXCIsIFwiXCIpO1xyXG4gICAgcmV0dXJuIGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShzY29wZSk7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgc2V0R3JhbW1hcihlZGl0b3I6IFRleHRFZGl0b3IgfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICB0aGlzLmdyYW1tYXIgPSBudWxsO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5ncmFtbWFyID0gdGhpcy5nZXRFbWJlZGRlZEdyYW1tYXIoZWRpdG9yKTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBzZXRDb25maWdWYWx1ZShrZXlQYXRoOiBzdHJpbmcsIG5ld1ZhbHVlOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKCFuZXdWYWx1ZSkge1xyXG4gICAgICBuZXdWYWx1ZSA9IGF0b20uY29uZmlnLmdldChrZXlQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNvbmZpZ01hcHBpbmcuc2V0KGtleVBhdGgsIG5ld1ZhbHVlKTtcclxuICB9XHJcblxyXG4gIC8qKiBGb3JjZSBtb2J4IHRvIHJlY2FsY3VsYXRlIGZpbGVQYXRoICh3aGljaCBkZXBlbmRzIG9uIGVkaXRvciBvYnNlcnZhYmxlKSAqL1xyXG4gIGZvcmNlRWRpdG9yVXBkYXRlKCkge1xyXG4gICAgY29uc3QgY3VycmVudEVkaXRvciA9IHRoaXMuZWRpdG9yO1xyXG4gICAgaWYgKCFjdXJyZW50RWRpdG9yKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IG9sZEtleSA9IHRoaXMuZmlsZVBhdGg7XHJcbiAgICAvLyBSZXR1cm4gYmFjayBpZiB0aGUga2VybmVsIGZvciB0aGlzIGVkaXRvciBpcyBhbHJlYWR5IGRpc3Bvc2VkLlxyXG4gICAgaWYgKCFvbGRLZXkgfHwgIXRoaXMua2VybmVsTWFwcGluZy5oYXMob2xkS2V5KSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLnVwZGF0ZUVkaXRvcihudWxsKTtcclxuICAgIHRoaXMudXBkYXRlRWRpdG9yKGN1cnJlbnRFZGl0b3IpO1xyXG4gICAgY29uc3QgbmV3S2V5ID0gdGhpcy5maWxlUGF0aDtcclxuICAgIGlmICghbmV3S2V5KSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIENoYW5nZSBrZXkgb2Yga2VybmVsTWFwcGluZyBmcm9tIGVkaXRvciBJRCB0byBmaWxlIHBhdGhcclxuICAgIHRoaXMua2VybmVsTWFwcGluZy5zZXQobmV3S2V5LCB0aGlzLmtlcm5lbE1hcHBpbmcuZ2V0KG9sZEtleSkpO1xyXG4gICAgdGhpcy5rZXJuZWxNYXBwaW5nLmRlbGV0ZShvbGRLZXkpO1xyXG4gIH1cclxufVxyXG5jb25zdCBzdG9yZSA9IG5ldyBTdG9yZSgpO1xyXG5leHBvcnQgZGVmYXVsdCBzdG9yZTsgLy8gRm9yIGRlYnVnZ2luZ1xyXG5cclxud2luZG93Lmh5ZHJvZ2VuX3N0b3JlID0gc3RvcmU7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JlTGlrZSB7XHJcbiAga2VybmVsPzogS2VybmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBtYXJrZXJzPzogTWFya2VyU3RvcmUgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG59XHJcbiJdfQ==