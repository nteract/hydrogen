/* @flow */

import { Emitter, CompositeDisposable } from "atom";

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

import store from "./store";

import Config from "./config";
import kernelManager from "./kernel-manager";
import ZMQKernel from "./zmq-kernel";
import WSKernel from "./ws-kernel";
import AutocompleteProvider from "./autocomplete-provider";
import HydrogenProvider from "./plugin-api/hydrogen-provider";
import {
  log,
  reactFactory,
  isMultilanguageGrammar,
  renderDevTools
} from "./utils";

import type Kernel from "./kernel";

const Hydrogen = {
  config: Config.schema,

  inspector: null,

  markerBubbleMap: null,

  watchSidebar: null,
  watchSidebarIsVisible: false,

  activate() {
    this.emitter = new Emitter();
    this.inspector = new Inspector();

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
              description: "`languageMappings` cannot be updated while kernels are running",
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
        "hydrogen:toggle-watches": () => this.toggleWatchSidebar(),
        "hydrogen:select-kernel": () => this.showKernelPicker(),
        "hydrogen:connect-to-remote-kernel": () => this.showWSKernelPicker(),
        "hydrogen:add-watch": () => {
          if (!this.watchSidebarIsVisible) this.toggleWatchSidebar();
          if (this.watchSidebar) this.watchSidebar.addWatchFromEditor();
        },
        "hydrogen:remove-watch": () => {
          if (!this.watchSidebarIsVisible) this.toggleWatchSidebar();
          if (this.watchSidebar) this.watchSidebar.removeWatch();
        },
        "hydrogen:update-kernels": () => kernelManager.updateKernelSpecs(),
        "hydrogen:toggle-inspector": () => this.inspector.toggle(),
        "hydrogen:interrupt-kernel": () =>
          this.handleKernelCommand({ command: "interrupt-kernel" }),
        "hydrogen:restart-kernel": () =>
          this.handleKernelCommand({ command: "restart-kernel" }),
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
      atom.workspace.observeActivePaneItem(item => {
        const currentEditor = atom.workspace.getActiveTextEditor();
        store.updateEditor(item === currentEditor ? currentEditor : null);
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

    renderDevTools();

    autorun(() => {
      this.setWatchSidebar(store.kernel);
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

  setWatchSidebar(kernel: Kernel) {
    const sidebar = kernel ? kernel.watchSidebar : null;
    if (this.watchSidebar === sidebar) {
      return;
    }

    if (this.watchSidebar && this.watchSidebar.visible) {
      this.watchSidebar.hide();
    }

    this.watchSidebar = sidebar;

    if (this.watchSidebar && this.watchSidebarIsVisible) {
      this.watchSidebar.show();
    }
  },

  toggleWatchSidebar() {
    if (this.watchSidebarIsVisible) {
      log("toggleWatchSidebar: hiding sidebar");
      this.watchSidebarIsVisible = false;
      if (this.watchSidebar) this.watchSidebar.hide();
    } else {
      log("toggleWatchSidebar: showing sidebar");
      this.watchSidebarIsVisible = true;
      if (this.watchSidebar) this.watchSidebar.show();
    }
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
      this.clearResultBubbles();
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

  createResultBubble(code: string, row: number) {
    if (store.kernel) {
      this._createResultBubble(store.kernel, code, row);
      return;
    }

    kernelManager.startKernelFor(store.grammar, (kernel: Kernel) => {
      this._createResultBubble(kernel, code, row);
    });
  },

  _createResultBubble(kernel: Kernel, code: string, row: number) {
    if (
      this.watchSidebar &&
      this.watchSidebar.element.contains(document.activeElement)
    ) {
      this.watchSidebar.run();
      return;
    }

    this.clearBubblesOnRow(row);
    // $FlowFixMe
    const view = new ResultView(store.editor, row);
    kernel.execute(code, result => {
      view.appendOutput(result);
    });
  },

  // insertResultBubble(editor: atom$TextEditor, row: number) {
  //   const buffer = editor.getBuffer();
  //   let lineLength = buffer.lineLengthForRow(row);
  //
  //   const marker = editor.markBufferPosition(
  //     {
  //       row,
  //       column: lineLength
  //     },
  //     { invalidate: "touch" }
  //   );
  //
  //   const view = new ResultView(marker);
  //   view.spin();
  //   const { element } = view;
  //
  //   const lineHeight = editor.getLineHeightInPixels();
  //   view.spinner.setAttribute(
  //     "style",
  //     `
  //     width: ${lineHeight + 2}px;
  //     height: ${lineHeight - 4}px;`
  //   );
  //   view.statusContainer.setAttribute("style", `height: ${lineHeight}px`);
  //   element.setAttribute(
  //     "style",
  //     `
  //     margin-left: ${lineLength + 1}ch;
  //     margin-top: -${lineHeight}px;
  //     max-width: ${editor.width}px`
  //   );
  //
  //   editor.decorateMarker(marker, {
  //     type: "block",
  //     item: element,
  //     position: "after"
  //   });
  //
  //   this.markerBubbleMap[marker.id] = view;
  //   marker.onDidChange(event => {
  //     log("marker.onDidChange:", marker);
  //     if (!event.isValid) {
  //       view.destroy();
  //       marker.destroy();
  //       delete this.markerBubbleMap[marker.id];
  //     } else if (!element.classList.contains("multiline")) {
  //       lineLength = marker.getStartBufferPosition().column;
  //       element.setAttribute(
  //         "style",
  //         `
  //         margin-left: ${lineLength + 1}ch;
  //         margin-top: -${lineHeight}px`
  //       );
  //     }
  //   });
  //   return view;
  // },

  clearResultBubbles() {
    _.forEach(this.markerBubbleMap, (bubble: ResultView) => bubble.destroy());
    this.markerBubbleMap = {};
  },

  clearBubblesOnRow(row: number) {
    log("clearBubblesOnRow:", row);
    _.forEach(this.markerBubbleMap, (bubble: ResultView) => {
      const { marker } = bubble;
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
      this.createResultBubble(code, row);
    }
  },

  runAll() {
    const { editor, kernel } = store;
    if (!editor) return;
    if (isMultilanguageGrammar(editor.getGrammar())) {
      atom.notifications.addError(
        '"Run All" is not supported for this file type!'
      );
      return;
    }

    if (editor && kernel) {
      this._runAll(editor, kernel);
      return;
    }

    kernelManager.startKernelFor(store.grammar, (kernel: Kernel) => {
      this._runAll(editor, kernel);
    });
  },

  _runAll(editor: atom$TextEditor, kernel: Kernel) {
    const cells = codeManager.getCells(editor);
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
