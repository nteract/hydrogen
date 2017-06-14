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
  OUTPUT_AREA_URI
} from "./utils";

import type Kernel from "./kernel";

const Hydrogen = {
  config: Config.schema,

  markerBubbleMap: null,

  activate() {
    this.emitter = new Emitter();

    this.markerBubbleMap = {};

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
            atom.workspace.open(WATCHES_URI, { searchAllPanes: true });
          }
        },
        "hydrogen:remove-watch": () => {
          if (store.kernel) {
            store.kernel.watchesStore.removeWatch();
            atom.workspace.open(WATCHES_URI, { searchAllPanes: true });
          }
        },
        "hydrogen:update-kernels": () => kernelManager.updateKernelSpecs(),
        "hydrogen:toggle-inspector": () => toggleInspector(store),
        "hydrogen:interrupt-kernel": () =>
          this.handleKernelCommand({ command: "interrupt-kernel" }),
        "hydrogen:restart-kernel": () =>
          this.handleKernelCommand({ command: "restart-kernel" }),
        "hydrogen:refresh-all-result-bubbles": () =>
          this.refreshAllResultBubbles(),
        "hydrogen:shutdown-kernel": () =>
          this.handleKernelCommand({ command: "shutdown-kernel" })
      })
    );

    store.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "hydrogen:clear-results": () => this.clearResultBubbles()
      })
    );

    store.subscriptions.add(
      atom.workspace.getCenter().observeActivePaneItem(item => {
        store.updateEditor(item instanceof TextEditor ? item : null);
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

    renderDevTools();

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
      this.clearResultBubbles();
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
      this.clearResultBubbles();
      // Note that destroy alone does not shut down a WSKernel
      kernel.shutdown();
      kernel.destroy();
    } else if (command === "rename-kernel" && kernel.promptRename) {
      // $FlowFixMe Will only be called if remote kernel
      if (kernel instanceof WSKernel) kernel.promptRename();
    } else if (command === "disconnect-kernel") {
      this.clearResultBubbles();
      kernel.destroy();
    }
  },

  createResultBubble(code: string, row: number, editor: atom$TextEditor) {
    if (!store.grammar) return;

    if (store.kernel) {
      this._createResultBubble(store.kernel, code, row);
      return;
    }

    kernelManager.startKernelFor(store.grammar, editor, (kernel: ZMQKernel) => {
      this._createResultBubble(kernel, code, row);
    });
  },

  _createResultBubble(kernel: Kernel, code: string, row: number) {
    if (atom.workspace.getActivePaneItem() instanceof WatchesPane) {
      kernel.watchesStore.run();
      return;
    }
    const globalOutputStore = atom.workspace
      .getPaneItems()
      .find(item => item instanceof OutputPane)
      ? kernel.outputStore
      : null;

    const outputStore = this.insertResultBubble(
      store.editor,
      row,
      !globalOutputStore
    );

    kernel.execute(code, async result => {
      outputStore.appendOutput(result);
      if (globalOutputStore) {
        globalOutputStore.appendOutput(result);

        await atom.workspace.open(OUTPUT_AREA_URI, { searchAllPanes: true });
        focus(store.editor);
      }
    });
  },

  insertResultBubble(
    editor: atom$TextEditor,
    row: number,
    showResult: boolean
  ) {
    this.clearBubblesOnRow(row);

    const buffer = editor.getBuffer();
    const lineLength = buffer.lineLengthForRow(row);

    const point = new Point(row, lineLength);
    const marker = editor.markBufferPosition(point, { invalidate: "touch" });
    const lineHeight = editor.getLineHeightInPixels();

    const outputStore = new OutputStore();
    outputStore.updatePosition({
      lineLength: lineLength,
      lineHeight: editor.getLineHeightInPixels(),
      // $FlowFixMe: Missing flow type
      editorWidth: editor.getEditorWidthInChars()
    });

    const view = new ResultView(outputStore, marker, showResult);
    const { element } = view;

    editor.decorateMarker(marker, {
      type: "block",
      item: element,
      position: "after"
    });

    this.markerBubbleMap[marker.id] = view;
    marker.onDidChange(event => {
      log("marker.onDidChange:", marker);
      if (!event.isValid) {
        view.destroy();
        delete this.markerBubbleMap[marker.id];
      } else {
        outputStore.updatePosition({
          lineLength: marker.getStartBufferPosition().column
        });
      }
    });
    return outputStore;
  },

  clearResultBubbles() {
    _.forEach(this.markerBubbleMap, (bubble: ResultView) => bubble.destroy());
    this.markerBubbleMap = {};
  },

  refreshAllResultBubbles() {
    const { editor, kernel } = store;
    if (!editor || !kernel) {
      this.runAll();
      return;
    }

    let breakpoints = [];
    _.forEach(this.markerBubbleMap, (bubble: ResultView) => {
      breakpoints.push(bubble.marker.getBufferRange().start);
    });
    this.clearResultBubbles();

    const runAll = () => this.runAll(breakpoints);

    // FIXME: temporal workaround until hydrogen#863 fixed.
    kernel.restart(() => setTimeout(runAll, 500));
  },

  clearBubblesOnRow(row: number) {
    log("clearBubblesOnRow:", row);
    _.forEach(this.markerBubbleMap, (bubble: ResultView) => {
      const { marker } = bubble;
      if (!marker) return;
      const range = marker.getBufferRange();
      if (range.start.row <= row && row <= range.end.row) {
        log("clearBubblesOnRow:", row, bubble);
        bubble.destroy();
        delete this.markerBubbleMap[marker.id];
      }
    });
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
      this.createResultBubble(code, row, editor);
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
        this._createResultBubble(kernel, code, endRow);
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
      this.createResultBubble(code, row);
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
      this.createResultBubble(code, endRow);
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
        this.clearResultBubbles();

        if (kernel instanceof ZMQKernel) kernel.destroy();

        store.newKernel(kernel);
      });
    }

    this.wsKernelPicker.toggle(store.grammar, (kernelSpec: Kernelspec) =>
      kernelManager.kernelSpecProvidesGrammar(kernelSpec, store.grammar)
    );
  }
};

export default Hydrogen;
