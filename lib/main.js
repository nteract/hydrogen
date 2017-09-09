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

import KernelPicker from "./kernel-picker";
import WSKernelPicker from "./ws-kernel-picker";
import SignalListView from "./signal-list-view";
import * as codeManager from "./code-manager";

import Inspector from "./components/inspector";
import ResultView from "./components/result-view";
import StatusBar from "./components/status-bar";

import InspectorPane from "./panes/inspector";
import WatchesPane from "./panes/watches";
import OutputPane from "./panes/output-area";

import { toggleInspector } from "./commands";

import store from "./store";
import OutputStore from "./store/output";

import Config from "./config";
import kernelManager from "./kernel-manager";
import ZMQKernel from "./zmq-kernel";
import WSKernel from "./ws-kernel";
import AutocompleteProvider from "./autocomplete-provider";
import HydrogenProvider from "./plugin-api/hydrogen-provider";
import {
  log,
  focus,
  reactFactory,
  isMultilanguageGrammar,
  renderDevTools,
  INSPECTOR_URI,
  WATCHES_URI,
  OUTPUT_AREA_URI,
  hotReloadPackage,
  openOrShowDock
} from "./utils";

import type Kernel from "./kernel";

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

          if (store.runningKernels.size != 0) {
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
      atom.commands.add("atom-text-editor:not([mini])", {
        "hydrogen:run": () => this.run(),
        "hydrogen:run-all": () => this.runAll(),
        "hydrogen:run-all-above": () => this.runAllAbove(),
        "hydrogen:run-and-move-down": () => this.run(true),
        "hydrogen:run-cell": () => this.runCell(),
        "hydrogen:run-cell-and-move-down": () => this.runCell(true),
        "hydrogen:toggle-watches": () => atom.workspace.toggle(WATCHES_URI),
        "hydrogen:toggle-output-area": () =>
          atom.workspace.toggle(OUTPUT_AREA_URI),
        "hydrogen:select-kernel": () => this.showKernelPicker(),
        "hydrogen:connect-to-remote-kernel": () => this.showWSKernelPicker(),
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
        "hydrogen:toggle-inspector": () => toggleInspector(store),
        "hydrogen:interrupt-kernel": () =>
          this.handleKernelCommand({ command: "interrupt-kernel" }),
        "hydrogen:restart-kernel": () =>
          this.handleKernelCommand({ command: "restart-kernel" }),
        "hydrogen:restart-kernel-and-re-evaluate-bubbles": () =>
          this.restartKernelAndReEvaluateBubbles(),
        "hydrogen:shutdown-kernel": () =>
          this.handleKernelCommand({ command: "shutdown-kernel" }),
        "hydrogen:toggle-bubble": () => this.toggleBubble()
      })
    );

    store.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "hydrogen:clear-results": () => store.markers.clear()
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
        }
      })
    );

    store.subscriptions.add(
      // Destroy any Panes when the package is deactivated.
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (
            item instanceof InspectorPane ||
            item instanceof WatchesPane ||
            item instanceof OutputPane
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

  provideHydrogen() {
    if (!this.hydrogenProvider) {
      this.hydrogenProvider = new HydrogenProvider(this);
    }

    return this.hydrogenProvider;
  },

  consumeStatusBar(statusBar: atom$StatusBar) {
    const statusBarElement = document.createElement("div");
    statusBarElement.className = "inline-block";

    statusBar.addLeftTile({
      item: statusBarElement,
      priority: 100
    });

    const onClick = this.showKernelCommands.bind(this);

    reactFactory(
      <StatusBar store={store} onClick={onClick} />,
      statusBarElement
    );

    // We should return a disposable here but Atom fails while calling .destroy()
    // return new Disposable(statusBarTile.destroy);
  },

  provide() {
    if (atom.config.get("Hydrogen.autocomplete") === true) {
      return AutocompleteProvider();
    }
    return null;
  },

  showKernelCommands() {
    if (!this.signalListView) {
      this.signalListView = new SignalListView();
      this.signalListView.onConfirmed = (kernelCommand: {
        command: string,
        payload: ?Kernelspec
      }) => this.handleKernelCommand(kernelCommand);
    }
    this.signalListView.toggle();
  },

  handleKernelCommand({
    command,
    payload
  }: {
    command: string,
    payload: ?Kernelspec
  }) {
    log("handleKernelCommand:", arguments);

    const { kernel, grammar } = store;

    if (!grammar) {
      atom.notifications.addError("Undefined grammar");
      return;
    }

    if (command === "switch-kernel") {
      if (!payload) return;
      store.markers.clear();
      if (kernel) kernel.destroy();
      kernelManager.startKernel(payload, grammar);
      return;
    }

    if (!kernel) {
      const message = `No running kernel for grammar \`${grammar.name}\` found`;
      atom.notifications.addError(message);
      return;
    }

    if (command === "interrupt-kernel") {
      kernel.interrupt();
    } else if (command === "restart-kernel") {
      kernel.restart();
    } else if (command === "shutdown-kernel") {
      store.markers.clear();
      // Note that destroy alone does not shut down a WSKernel
      kernel.shutdown();
      kernel.destroy();
    } else if (command === "rename-kernel" && kernel.promptRename) {
      // $FlowFixMe Will only be called if remote kernel
      if (kernel instanceof WSKernel) kernel.promptRename();
    } else if (command === "disconnect-kernel") {
      store.markers.clear();
      kernel.destroy();
    }
  },

  createResultBubble(editor: atom$TextEditor, code: string, row: number) {
    if (!store.grammar) return;

    if (store.kernel) {
      this._createResultBubble(editor, store.kernel, code, row);
      return;
    }

    kernelManager.startKernelFor(store.grammar, editor, (kernel: ZMQKernel) => {
      this._createResultBubble(editor, kernel, code, row);
    });
  },

  _createResultBubble(
    editor: atom$TextEditor,
    kernel: Kernel,
    code: string,
    row: number
  ) {
    if (atom.workspace.getActivePaneItem() instanceof WatchesPane) {
      kernel.watchesStore.run();
      return;
    }
    const globalOutputStore = atom.workspace
      .getPaneItems()
      .find(item => item instanceof OutputPane)
      ? kernel.outputStore
      : null;

    const { outputStore } = new ResultView(
      store.markers,
      kernel,
      editor,
      row,
      !globalOutputStore
    );

    kernel.execute(code, async result => {
      outputStore.appendOutput(result);
      if (globalOutputStore) {
        globalOutputStore.appendOutput(result);

        if (store.kernel !== kernel) return;

        const container = atom.workspace.paneContainerForURI(OUTPUT_AREA_URI);
        const pane = atom.workspace.paneForURI(OUTPUT_AREA_URI);
        if (
          (container && container.isVisible && !container.isVisible()) ||
          (pane && pane.itemForURI(OUTPUT_AREA_URI) !== pane.getActiveItem())
        ) {
          await atom.workspace.open(OUTPUT_AREA_URI, { searchAllPanes: true });
          focus(store.editor);
        }
      }
    });
  },

  restartKernelAndReEvaluateBubbles() {
    const { editor, kernel, markers } = store;

    let breakpoints = [];
    markers.markers.forEach((bubble: ResultView) => {
      breakpoints.push(bubble.marker.getBufferRange().start);
    });
    store.markers.clear();

    if (!editor || !kernel) {
      this.runAll(breakpoints);
    } else {
      kernel.restart(() => this.runAll(breakpoints));
    }
  },

  toggleBubble() {
    const { editor, kernel, markers } = store;
    if (!editor) return;
    const [startRow, endRow] = editor.getLastSelection().getBufferRowRange();

    for (let row = startRow; row <= endRow; row++) {
      const destroyed = markers.clearOnRow(row);

      if (!destroyed) {
        const { outputStore } = new ResultView(
          markers,
          kernel,
          editor,
          row,
          true
        );
        outputStore.status = "empty";
      }
    }
  },

  run(moveDown: boolean = false) {
    const editor = store.editor;
    if (!editor) return;
    const codeBlock = codeManager.findCodeBlock(editor);
    if (!codeBlock) {
      return;
    }

    const [code, row] = codeBlock;
    if (code) {
      if (moveDown === true) {
        codeManager.moveDown(editor, row);
      }
      this.createResultBubble(editor, code, row);
    }
  },

  runAll(breakpoints: ?Array<atom$Point>) {
    const { editor, kernel, grammar } = store;
    if (!editor || !grammar) return;
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

    kernelManager.startKernelFor(grammar, editor, (kernel: ZMQKernel) => {
      this._runAll(editor, kernel, breakpoints);
    });
  },

  _runAll(
    editor: atom$TextEditor,
    kernel: Kernel,
    breakpoints?: Array<atom$Point>
  ) {
    let cells = codeManager.getCells(editor, breakpoints);
    _.forEach(
      cells,
      ({ start, end }: { start: atom$Point, end: atom$Point }) => {
        const code = codeManager.getTextInRange(editor, start, end);
        const endRow = codeManager.escapeBlankRows(editor, start.row, end.row);
        this._createResultBubble(editor, kernel, code, endRow);
      }
    );
  },

  runAllAbove() {
    const editor = store.editor; // to make flow happy
    if (!editor) return;
    if (isMultilanguageGrammar(editor.getGrammar())) {
      atom.notifications.addError(
        '"Run All Above" is not supported for this file type!'
      );
      return;
    }

    const cursor = editor.getLastCursor();
    const row = codeManager.escapeBlankRows(editor, 0, cursor.getBufferRow());
    const code = codeManager.getRows(editor, 0, row);

    if (code) {
      this.createResultBubble(editor, code, row);
    }
  },

  runCell(moveDown: boolean = false) {
    const editor = store.editor;
    if (!editor) return;
    const { start, end } = codeManager.getCurrentCell(editor);
    const code = codeManager.getTextInRange(editor, start, end);
    const endRow = codeManager.escapeBlankRows(editor, start.row, end.row);

    if (code) {
      if (moveDown === true) {
        codeManager.moveDown(editor, endRow);
      }
      this.createResultBubble(editor, code, endRow);
    }
  },

  showKernelPicker() {
    kernelManager.getAllKernelSpecsForGrammar(store.grammar, kernelSpecs => {
      if (this.kernelPicker) {
        this.kernelPicker.kernelSpecs = kernelSpecs;
      } else {
        this.kernelPicker = new KernelPicker(kernelSpecs);

        this.kernelPicker.onConfirmed = (kernelSpec: Kernelspec) =>
          this.handleKernelCommand({
            command: "switch-kernel",
            payload: kernelSpec
          });
      }

      this.kernelPicker.toggle();
    });
  },

  showWSKernelPicker() {
    if (!this.wsKernelPicker) {
      this.wsKernelPicker = new WSKernelPicker((kernel: Kernel) => {
        store.markers.clear();

        if (kernel instanceof ZMQKernel) kernel.destroy();

        store.newKernel(kernel);
      });
    }

    this.wsKernelPicker.toggle((kernelSpec: Kernelspec) =>
      kernelManager.kernelSpecProvidesGrammar(kernelSpec, store.grammar)
    );
  }
};

export default Hydrogen;
