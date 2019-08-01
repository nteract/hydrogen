/* @flow */

import {
  Emitter,
  CompositeDisposable,
  Disposable,
  Point,
  TextEditor
} from "atom";

import _ from "lodash";
import { autorun } from "mobx";
import React from "react";

import InspectorPane from "./panes/inspector";
import WatchesPane from "./panes/watches";
import OutputPane from "./panes/output-area";
import KernelMonitorPane from "./panes/kernel-monitor";
import Config from "./config";
import ZMQKernel from "./zmq-kernel";
import WSKernel from "./ws-kernel";
import Kernel from "./kernel";
import KernelPicker from "./kernel-picker";
import WSKernelPicker from "./ws-kernel-picker";
import ExistingKernelPicker from "./existing-kernel-picker";
import HydrogenProvider from "./plugin-api/hydrogen-provider";

import store from "./store";
import kernelManager from "./kernel-manager";
import services from "./services";
import * as commands from "./commands";
import * as codeManager from "./code-manager";
import * as result from "./result";

import type MarkerStore from "./store/markers";

import {
  log,
  reactFactory,
  isMultilanguageGrammar,
  renderDevTools,
  INSPECTOR_URI,
  WATCHES_URI,
  OUTPUT_AREA_URI,
  KERNEL_MONITOR_URI,
  hotReloadPackage,
  openOrShowDock,
  kernelSpecProvidesGrammar
} from "./utils";

import exportNotebook from "./export-notebook";
import { importNotebook, ipynbOpener } from "./import-notebook";

const Hydrogen = {
  config: Config.schema,

  activate() {
    this.emitter = new Emitter();

    let skipLanguageMappingsChange = false;
    store.subscriptions.add(
      atom.config.onDidChange(
        "Hydrogen.languageMappings",
        ({ newValue, oldValue }) => {
          if (skipLanguageMappingsChange) {
            skipLanguageMappingsChange = false;
            return;
          }

          if (store.runningKernels.length != 0) {
            skipLanguageMappingsChange = true;

            atom.config.set("Hydrogen.languageMappings", oldValue);

            atom.notifications.addError("Hydrogen", {
              description:
                "`languageMappings` cannot be updated while kernels are running",
              dismissable: false
            });
          }
        }
      )
    );

    store.subscriptions.add(
      // enable/disable mobx-react-devtools logging
      atom.config.onDidChange("Hydrogen.debug", ({ newValue }) =>
        renderDevTools(newValue)
      )
    );

    store.subscriptions.add(
      atom.config.observe("Hydrogen.statusBarDisable", newValue => {
        store.setConfigValue("Hydrogen.statusBarDisable", Boolean(newValue));
      })
    );

    store.subscriptions.add(
      atom.commands.add("atom-text-editor:not([mini])", {
        "hydrogen:run": () => this.run(),
        "hydrogen:run-all": () => this.runAll(),
        "hydrogen:run-all-above": () => this.runAllAbove(),
        "hydrogen:run-and-move-down": () => this.run(true),
        "hydrogen:run-cell": () => this.runCell(),
        "hydrogen:run-cell-and-move-down": () => this.runCell(true),
        "hydrogen:toggle-watches": () => atom.workspace.toggle(WATCHES_URI),
        "hydrogen:toggle-output-area": () => commands.toggleOutputMode(),
        "hydrogen:toggle-kernel-monitor": async () => {
          const lastItem = atom.workspace.getActivePaneItem();
          const lastPane = atom.workspace.paneForItem(lastItem);
          await atom.workspace.toggle(KERNEL_MONITOR_URI);
          if (lastPane) lastPane.activate();
        },
        "hydrogen:start-local-kernel": () => this.startZMQKernel(),
        "hydrogen:connect-to-remote-kernel": () => this.connectToWSKernel(),
        "hydrogen:connect-to-existing-kernel": () =>
          this.connectToExistingKernel(),
        "hydrogen:add-watch": () => {
          if (store.kernel) {
            store.kernel.watchesStore.addWatchFromEditor(store.editor);
            openOrShowDock(WATCHES_URI);
          }
        },
        "hydrogen:remove-watch": () => {
          if (store.kernel) {
            store.kernel.watchesStore.removeWatch();
            openOrShowDock(WATCHES_URI);
          }
        },
        "hydrogen:update-kernels": () => kernelManager.updateKernelSpecs(),
        "hydrogen:toggle-inspector": () => commands.toggleInspector(store),
        "hydrogen:interrupt-kernel": () =>
          this.handleKernelCommand({ command: "interrupt-kernel" }, store),
        "hydrogen:restart-kernel": () =>
          this.handleKernelCommand({ command: "restart-kernel" }, store),
        "hydrogen:shutdown-kernel": () =>
          this.handleKernelCommand({ command: "shutdown-kernel" }, store),
        "hydrogen:clear-result": () => result.clearResult(store),
        "hydrogen:export-notebook": () => exportNotebook(),
        "hydrogen:fold-current-cell": () => this.foldCurrentCell(),
        "hydrogen:fold-all-but-current-cell": () =>
          this.foldAllButCurrentCell(),
        "hydrogen:clear-results": () => result.clearResults(store)
      })
    );

    store.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "hydrogen:import-notebook": importNotebook
      })
    );

    if (atom.inDevMode()) {
      store.subscriptions.add(
        atom.commands.add("atom-workspace", {
          "hydrogen:hot-reload-package": () => hotReloadPackage()
        })
      );
    }

    store.subscriptions.add(
      atom.workspace.observeActiveTextEditor(editor => {
        store.updateEditor(editor);
      })
    );

    store.subscriptions.add(
      atom.workspace.observeTextEditors(editor => {
        const editorSubscriptions = new CompositeDisposable();
        editorSubscriptions.add(
          editor.onDidChangeGrammar(() => {
            store.setGrammar(editor);
          })
        );

        if (isMultilanguageGrammar(editor.getGrammar())) {
          editorSubscriptions.add(
            editor.onDidChangeCursorPosition(
              _.debounce(() => {
                store.setGrammar(editor);
              }, 75)
            )
          );
        }

        editorSubscriptions.add(
          editor.onDidDestroy(() => {
            editorSubscriptions.dispose();
          })
        );

        editorSubscriptions.add(
          editor.onDidChangeTitle(newTitle => store.forceEditorUpdate())
        );

        store.subscriptions.add(editorSubscriptions);
      })
    );

    this.hydrogenProvider = null;

    store.subscriptions.add(
      atom.workspace.addOpener(uri => {
        switch (uri) {
          case INSPECTOR_URI:
            return new InspectorPane(store);
          case WATCHES_URI:
            return new WatchesPane(store);
          case OUTPUT_AREA_URI:
            return new OutputPane(store);
          case KERNEL_MONITOR_URI:
            return new KernelMonitorPane(store);
        }
      })
    );
    store.subscriptions.add(atom.workspace.addOpener(ipynbOpener));

    store.subscriptions.add(
      // Destroy any Panes when the package is deactivated.
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (
            item instanceof InspectorPane ||
            item instanceof WatchesPane ||
            item instanceof OutputPane ||
            item instanceof KernelMonitorPane
          ) {
            item.destroy();
          }
        });
      })
    );

    renderDevTools(atom.config.get("Hydrogen.debug") === true);

    autorun(() => {
      this.emitter.emit("did-change-kernel", store.kernel);
    });
  },

  deactivate() {
    store.dispose();
  },

  /*-------------- Service Providers --------------*/
  provideHydrogen() {
    if (!this.hydrogenProvider) {
      this.hydrogenProvider = new HydrogenProvider(this);
    }

    return this.hydrogenProvider;
  },

  provideAutocompleteResults() {
    return services.provided.autocomplete.provideAutocompleteResults(store);
  },
  /*-----------------------------------------------*/

  /*-------------- Service Consumers --------------*/
  consumeAutocompleteWatchEditor(watchEditor: Function) {
    return services.consumed.autocomplete.consume(store, watchEditor);
  },

  consumeStatusBar(statusBar: atom$StatusBar) {
    return services.consumed.statusBar.addStatusBar(
      store,
      statusBar,
      this.handleKernelCommand.bind(this)
    );
  },
  /*-----------------------------------------------*/

  connectToExistingKernel() {
    if (!this.existingKernelPicker) {
      this.existingKernelPicker = new ExistingKernelPicker();
    }
    this.existingKernelPicker.toggle();
  },

  handleKernelCommand(
    { command, payload }: { command: string, payload: ?Kernelspec },
    { kernel, markers }: { kernel: ?Kernel, markers: ?MarkerStore }
  ) {
    log("handleKernelCommand:", arguments);

    if (!kernel) {
      const message = "No running kernel for grammar or editor found";
      atom.notifications.addError(message);
      return;
    }

    if (command === "interrupt-kernel") {
      kernel.interrupt();
    } else if (command === "restart-kernel") {
      kernel.restart();
    } else if (command === "shutdown-kernel") {
      if (markers) markers.clear();
      // Note that destroy alone does not shut down a WSKernel
      kernel.shutdown();
      kernel.destroy();
    } else if (
      command === "rename-kernel" &&
      kernel.transport instanceof WSKernel
    ) {
      kernel.transport.promptRename();
    } else if (command === "disconnect-kernel") {
      if (markers) markers.clear();
      kernel.destroy();
    }
  },

  run(moveDown: boolean = false) {
    const editor = store.editor;
    if (!editor) return;
    // https://github.com/nteract/hydrogen/issues/1452
    atom.commands.dispatch(editor.element, "autocomplete-plus:cancel");
    const codeBlock = codeManager.findCodeBlock(editor);
    if (!codeBlock) {
      return;
    }

    const codeNullable = codeBlock.code;
    if (codeNullable === null) return;

    const { row } = codeBlock;
    const cellType = codeManager.getMetadataForRow(editor, new Point(row, 0));

    const code =
      cellType === "markdown"
        ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
        : codeNullable;

    if (moveDown === true) {
      codeManager.moveDown(editor, row);
    }

    this.checkForKernel(store, kernel => {
      result.createResult(store, { code, row, cellType });
    });
  },

  runAll(breakpoints: ?Array<atom$Point>) {
    const { editor, kernel, grammar, filePath } = store;
    if (!editor || !grammar || !filePath) return;
    if (isMultilanguageGrammar(editor.getGrammar())) {
      atom.notifications.addError(
        '"Run All" is not supported for this file type!'
      );
      return;
    }

    if (editor && kernel) {
      this._runAll(editor, kernel, breakpoints);
      return;
    }

    kernelManager.startKernelFor(
      grammar,
      editor,
      filePath,
      (kernel: Kernel) => {
        this._runAll(editor, kernel, breakpoints);
      }
    );
  },

  _runAll(
    editor: atom$TextEditor,
    kernel: Kernel,
    breakpoints?: Array<atom$Point>
  ) {
    let cells = codeManager.getCells(editor, breakpoints);
    for (const cell of cells) {
      const { start, end } = cell;
      const codeNullable = codeManager.getTextInRange(editor, start, end);
      if (codeNullable === null) continue;

      const row = codeManager.escapeBlankRows(
        editor,
        start.row,
        end.row == editor.getLastBufferRow() ? end.row : end.row - 1
      );
      const cellType = codeManager.getMetadataForRow(editor, start);

      const code =
        cellType === "markdown"
          ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
          : codeNullable;

      this.checkForKernel(store, kernel => {
        result.createResult(store, { code, row, cellType });
      });
    }
  },

  runAllAbove() {
    const { editor, kernel, grammar, filePath } = store;
    if (!editor || !grammar || !filePath) return;
    if (isMultilanguageGrammar(editor.getGrammar())) {
      atom.notifications.addError(
        '"Run All Above" is not supported for this file type!'
      );
      return;
    }

    if (editor && kernel) {
      this._runAllAbove(editor, kernel);
      return;
    }

    kernelManager.startKernelFor(
      grammar,
      editor,
      filePath,
      (kernel: Kernel) => {
        this._runAllAbove(editor, kernel);
      }
    );
  },

  _runAllAbove(editor: atom$TextEditor, kernel: Kernel) {
    const cursor = editor.getCursorBufferPosition();
    cursor.column = editor.getBuffer().lineLengthForRow(cursor.row);
    const breakpoints = codeManager.getBreakpoints(editor);
    breakpoints.push(cursor);
    const cells = codeManager.getCells(editor, breakpoints);
    for (const cell of cells) {
      const { start, end } = cell;
      const codeNullable = codeManager.getTextInRange(editor, start, end);

      const row = codeManager.escapeBlankRows(
        editor,
        start.row,
        end.row == editor.getLastBufferRow() ? end.row : end.row - 1
      );
      const cellType = codeManager.getMetadataForRow(editor, start);

      if (codeNullable !== null) {
        const code =
          cellType === "markdown"
            ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
            : codeNullable;

        this.checkForKernel(store, kernel => {
          result.createResult(store, { code, row, cellType });
        });
      }

      if (cell.containsPoint(cursor)) {
        break;
      }
    }
  },

  runCell(moveDown: boolean = false) {
    const editor = store.editor;
    if (!editor) return;
    // https://github.com/nteract/hydrogen/issues/1452
    atom.commands.dispatch(editor.element, "autocomplete-plus:cancel");

    const { start, end } = codeManager.getCurrentCell(editor);
    const codeNullable = codeManager.getTextInRange(editor, start, end);
    if (codeNullable === null) return;

    const row = codeManager.escapeBlankRows(
      editor,
      start.row,
      end.row == editor.getLastBufferRow() ? end.row : end.row - 1
    );
    const cellType = codeManager.getMetadataForRow(editor, start);

    const code =
      cellType === "markdown"
        ? codeManager.removeCommentsMarkdownCell(editor, codeNullable)
        : codeNullable;

    if (moveDown === true) {
      codeManager.moveDown(editor, row);
    }

    this.checkForKernel(store, kernel => {
      result.createResult(store, { code, row, cellType });
    });
  },

  foldCurrentCell() {
    const editor = store.editor;
    if (!editor) return;
    codeManager.foldCurrentCell(editor);
  },

  foldAllButCurrentCell() {
    const editor = store.editor;
    if (!editor) return;
    codeManager.foldAllButCurrentCell(editor);
  },

  startZMQKernel() {
    kernelManager
      .getAllKernelSpecsForGrammar(store.grammar)
      .then(kernelSpecs => {
        if (this.kernelPicker) {
          this.kernelPicker.kernelSpecs = kernelSpecs;
        } else {
          this.kernelPicker = new KernelPicker(kernelSpecs);

          this.kernelPicker.onConfirmed = (kernelSpec: Kernelspec) => {
            const { editor, grammar, filePath, markers } = store;
            if (!editor || !grammar || !filePath || !markers) return;
            markers.clear();

            kernelManager.startKernel(kernelSpec, grammar, editor, filePath);
          };
        }

        this.kernelPicker.toggle();
      });
  },

  connectToWSKernel() {
    if (!this.wsKernelPicker) {
      this.wsKernelPicker = new WSKernelPicker((transport: WSKernel) => {
        const kernel = new Kernel(transport);
        const { editor, grammar, filePath, markers } = store;
        if (!editor || !grammar || !filePath || !markers) return;
        markers.clear();

        if (kernel.transport instanceof ZMQKernel) kernel.destroy();

        store.newKernel(kernel, filePath, editor, grammar);
      });
    }

    this.wsKernelPicker.toggle((kernelSpec: Kernelspec) =>
      kernelSpecProvidesGrammar(kernelSpec, store.grammar)
    );
  },

  // Accepts store as an arg
  checkForKernel(
    {
      editor,
      grammar,
      filePath,
      kernel
    }: {
      editor: atom$TextEditor,
      grammar: atom$Grammar,
      filePath: string,
      kernel?: Kernel
    },
    callback: (kernel: Kernel) => void
  ) {
    if (!filePath || !grammar) {
      return atom.notifications.addError(
        "The language grammar must be set in order to start a kernel. The easiest way to do this is to save the file."
      );
    }

    if (kernel) {
      callback(kernel);
      return;
    }

    kernelManager.startKernelFor(
      grammar,
      editor,
      filePath,
      (newKernel: Kernel) => callback(newKernel)
    );
  }
};

export default Hydrogen;
