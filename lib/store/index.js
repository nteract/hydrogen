/* @flow */

import { CompositeDisposable } from "atom";
import { observable, computed, action } from "mobx";
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
    const kernel = this.kernelMapping.get(this.filePath);
    if (!kernel || kernel instanceof Kernel) return kernel;
    if (this.grammar) return kernel[this.grammar.name];
  }

  @computed
  get filePath(): ?string {
    return this.editor ? this.editor.getPath() : null;
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
      const old = this.kernelMapping.get(filePath);
      const newMap = old && old instanceof Kernel === false ? old : {};
      newMap[grammar.name] = kernel;
      this.kernelMapping.set(filePath, newMap);
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
    this._iterateOverKernels(
      kernel,
      (_, file) => {
        this.kernelMapping.delete(file);
      },
      (map, _, grammar) => {
        map[grammar] = null;
        delete map[grammar];
      }
    );

    this.runningKernels.remove(kernel);
  }

  _iterateOverKernels(
    kernel: Kernel,
    func: (kernel: Kernel | KernelObj, file: string) => mixed,
    func2: (obj: KernelObj, file: string, grammar: string) => mixed = func
  ) {
    this.kernelMapping.forEach((kernelOrObj, file) => {
      if (kernelOrObj === kernel) {
        func(kernel, file);
      }

      if (kernelOrObj instanceof Kernel === false) {
        _.forEach(kernelOrObj, (k, grammar) => {
          if (k === kernel) {
            func2(kernelOrObj, file, grammar);
          }
        });
      }
    });
  }

  getFilesForKernel(kernel: Kernel) {
    const files = [];
    this._iterateOverKernels(kernel, (_, file) => files.push(file));
    return files;
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
}

const store = new Store();
export default store;

// For debugging
window.hydrogen_store = store;
