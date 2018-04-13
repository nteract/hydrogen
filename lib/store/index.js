/* @flow */

import { CompositeDisposable } from "atom";
import {
  observable,
  computed,
  action,
  isObservableMap,
  keys,
  values
} from "mobx";
import { isMultilanguageGrammar, getEmbeddedScope } from "./../utils";
import _ from "lodash";

import Config from "./../config";
import * as codeManager from "./../code-manager";
import MarkerStore from "./markers";
import kernelManager from "./../kernel-manager";
import Kernel from "./../kernel";

import type { IObservableArray } from "mobx";

const commutable = require("@nteract/commutable");

export class Store {
  subscriptions = new CompositeDisposable();
  markers = new MarkerStore();
  runningKernels: IObservableArray<Kernel> = observable([]);
  @observable kernelMapping: KernelMapping = new Map();
  @observable startingKernels: Map<string, boolean> = new Map();
  @observable editor = atom.workspace.getActiveTextEditor();
  @observable grammar: ?atom$Grammar;
  @observable configMapping: Map<string, ?mixed> = new Map();

  @computed
  get kernel(): ?Kernel {
    if (!this.filePath) return null;
    const kernelOrMap = this.kernelMapping.get(this.filePath);
    if (!kernelOrMap || kernelOrMap instanceof Kernel) return kernelOrMap;
    if (this.grammar) return kernelOrMap.get(this.grammar.name);
  }

  @computed
  get filePath(): ?string {
    return this.editor ? this.editor.getPath() : null;
  }

  @computed
  get filePaths(): Array<?string> {
    return keys(this.kernelMapping);
  }

  @computed
  get notebook() {
    const editor = this.editor;
    if (!editor) {
      return null;
    }
    // Should we consider starting off with a monocellNotebook ?
    let notebook = commutable.emptyNotebook;
    const cellRanges = codeManager.getCells(editor);
    _.forEach(cellRanges, cell => {
      const { start, end } = cell;
      let source = codeManager.getTextInRange(editor, start, end);
      source = source ? source : "";
      const newCell = commutable.emptyCodeCell.set("source", source);
      notebook = commutable.appendCellToNotebook(notebook, newCell);
    });
    return commutable.toJS(notebook);
  }

  @action
  startKernel(kernelDisplayName: string) {
    this.startingKernels.set(kernelDisplayName, true);
  }

  @action
  newKernel(
    kernel: Kernel,
    filePath: string,
    editor: atom$TextEditor,
    grammar: atom$Grammar
  ) {
    if (isMultilanguageGrammar(editor.getGrammar())) {
      if (!this.kernelMapping.has(filePath)) {
        this.kernelMapping.set(filePath, new Map());
      }
      const multiLanguageMap = this.kernelMapping.get(filePath);
      multiLanguageMap.set(grammar.name, kernel);
    } else {
      this.kernelMapping.set(filePath, kernel);
    }
    const index = this.runningKernels.findIndex(k => k === kernel);
    if (index === -1) {
      this.runningKernels.push(kernel);
    }
    // delete startingKernel since store.kernel now in place to prevent duplicate kernel
    this.startingKernels.delete(kernel.kernelSpec.display_name);
  }

  @action
  deleteKernel(kernel: Kernel) {
    const grammar = kernel.grammar.name;
    const files = this.getFilesForKernel(kernel);

    files.forEach(file => {
      const kernelOrMap = this.kernelMapping.get(file);
      if (!kernelOrMap) return;
      if (kernelOrMap instanceof Kernel) {
        this.kernelMapping.delete(file);
      } else {
        kernelOrMap.delete(grammar);
      }
    });

    this.runningKernels.remove(kernel);
  }

  getFilesForKernel(kernel: Kernel) {
    const grammar = kernel.grammar.name;
    return this.filePaths.filter(file => {
      const kernelOrMap = this.kernelMapping.get(file);
      return kernelOrMap instanceof Kernel
        ? kernelOrMap === kernel
        : kernelOrMap.get(grammar) === kernel;
    });
  }

  @action
  dispose() {
    this.subscriptions.dispose();
    this.markers.clear();
    this.runningKernels.forEach(kernel => kernel.destroy());
    this.runningKernels.clear();
    this.kernelMapping.clear();
  }

  @action
  updateEditor(editor: ?atom$TextEditor) {
    this.editor = editor;
    this.setGrammar(editor);
  }

  @action
  setGrammar(editor: ?atom$TextEditor) {
    if (!editor) {
      this.grammar = null;
      return;
    }

    let grammar = editor.getGrammar();

    if (isMultilanguageGrammar(grammar)) {
      const embeddedScope = getEmbeddedScope(
        editor,
        editor.getCursorBufferPosition()
      );

      if (embeddedScope) {
        const scope = embeddedScope.replace(".embedded", "");
        grammar = atom.grammars.grammarForScopeName(scope);
      }
    }

    this.grammar = grammar;
  }

  @action
  setConfigValue(keyPath: string, newValue: ?mixed) {
    if (!newValue) {
      newValue = atom.config.get(keyPath);
    }
    this.configMapping.set(keyPath, newValue);
  }

  forceEditorUpdate() {
    // Force mobx to recalculate filePath (which depends on editor observable)

    const currentEditor = this.editor;
    this.updateEditor(null);
    this.updateEditor(currentEditor);
  }
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
