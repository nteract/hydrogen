'use babel';

import { CompositeDisposable, Emitter } from 'atom';

import _ from 'lodash';
import { autorun } from 'mobx';
import React from 'react';

import ResultView from './result-view';
import SignalListView from './signal-list-view';
import KernelPicker from './kernel-picker';
import WSKernelPicker from './ws-kernel-picker';
import * as codeManager from './code-manager';

import StatusBar from './components/status-bar';
import store from './store';
import disposer from './store/disposer';

import Config from './config';
import kernelManager from './kernel-manager';
import ZMQKernel from './zmq-kernel';
import Inspector from './inspector';
import AutocompleteProvider from './autocomplete-provider';
import HydrogenProvider from './plugin-api/hydrogen-provider';
import reactFactory from './utils/react';
import log from './utils/log';

const Hydrogen = {
  config: Config.schema,
  subscriptions: null,

  inspector: null,

  markerBubbleMap: null,

  watchSidebar: null,
  watchSidebarIsVisible: false,

  activate() {
    this.emitter = new Emitter();
    this.inspector = new Inspector();

    this.markerBubbleMap = {};

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'hydrogen:run': () => this.run(),
      'hydrogen:run-all': () => this.runAll(),
      'hydrogen:run-all-above': () => this.runAllAbove(),
      'hydrogen:run-and-move-down': () => this.run(true),
      'hydrogen:run-cell': () => this.runCell(),
      'hydrogen:run-cell-and-move-down': () => this.runCell(true),
      'hydrogen:toggle-watches': () => this.toggleWatchSidebar(),
      'hydrogen:select-kernel': () => this.showKernelPicker(),
      'hydrogen:connect-to-remote-kernel': () => this.showWSKernelPicker(),
      'hydrogen:add-watch': () => {
        if (!this.watchSidebarIsVisible) this.toggleWatchSidebar();
        if (this.watchSidebar) this.watchSidebar.addWatchFromEditor();
      },
      'hydrogen:remove-watch': () => {
        if (!this.watchSidebarIsVisible) this.toggleWatchSidebar();
        if (this.watchSidebar) this.watchSidebar.removeWatch();
      },
      'hydrogen:update-kernels': () => kernelManager.updateKernelSpecs(),
      'hydrogen:toggle-inspector': () => this.inspector.toggle(),
      'hydrogen:interrupt-kernel': () =>
        this.handleKernelCommand({ command: 'interrupt-kernel' }),
      'hydrogen:restart-kernel': () =>
        this.handleKernelCommand({ command: 'restart-kernel' }),
      'hydrogen:shutdown-kernel': () =>
        this.handleKernelCommand({ command: 'shutdown-kernel' }),
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'hydrogen:clear-results': () => this.clearResultBubbles() }));

    this.subscriptions.add(atom.workspace.observeActivePaneItem((item) => {
      if (item && item === atom.workspace.getActiveTextEditor()) {
        store.updateEditor(item);
      }
    }));

    this.hydrogenProvider = null;

    autorun(() => {
      this.setWatchSidebar(store.kernel);
      this.emitter.emit('did-change-kernel', store.kernel);
    });
  },


  deactivate() {
    this.subscriptions.dispose();
    disposer.dispose();
    store.dispose();
  },

  provideHydrogen() {
    if (!this.hydrogenProvider) {
      this.hydrogenProvider = new HydrogenProvider(this);
    }

    return this.hydrogenProvider;
  },


  consumeStatusBar(statusBar) {
    const statusBarElement = document.createElement('div');
    statusBarElement.className = 'inline-block';

    statusBar.addLeftTile({
      item: statusBarElement,
      priority: 100,
    });

    const onClick = this.showKernelCommands.bind(this);

    reactFactory(
      <StatusBar
        store={store}
        onClick={onClick}
      />,
      statusBarElement,
    );

    // We should return a disposable here but Atom fails while calling .destroy()
    // return new Disposable(statusBarTile.destroy);
  },


  provide() {
    if (atom.config.get('Hydrogen.autocomplete') === true) {
      return AutocompleteProvider();
    }
    return null;
  },


  setWatchSidebar(kernel) {
    const sidebar = (kernel) ? kernel.watchSidebar : null;
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
      log('toggleWatchSidebar: hiding sidebar');
      this.watchSidebarIsVisible = false;
      if (this.watchSidebar) this.watchSidebar.hide();
    } else {
      log('toggleWatchSidebar: showing sidebar');
      this.watchSidebarIsVisible = true;
      if (this.watchSidebar) this.watchSidebar.show();
    }
  },


  showKernelCommands() {
    if (!this.signalListView) {
      this.signalListView = new SignalListView();
      this.signalListView.onConfirmed = kernelCommand =>
        this.handleKernelCommand(kernelCommand);
    }
    this.signalListView.toggle();
  },


  handleKernelCommand({ command, payload }) {
    log('handleKernelCommand:', arguments);

    const kernel = store.kernel;
    const grammar = store.editor.getGrammar();

    if (!kernel && command !== 'switch-kernel') {
      const message = `No running kernel for language \`${store.language}\` found`;
      atom.notifications.addError(message);
      return;
    }

    if (command === 'interrupt-kernel') {
      kernel.interrupt();
    } else if (command === 'restart-kernel') {
      this.clearResultBubbles();
      kernel.restart();
    } else if (command === 'shutdown-kernel') {
      this.clearResultBubbles();
      // Note that destroy alone does not shut down a WSKernel
      kernel.shutdown();
      kernel.destroy();
    } else if (command === 'switch-kernel') {
      this.clearResultBubbles();
      if (kernel) kernel.destroy();
      kernelManager.startKernel(payload, grammar);
    } else if (command === 'rename-kernel' && kernel.promptRename) {
      kernel.promptRename();
    } else if (command === 'disconnect-kernel') {
      this.clearResultBubbles();
      kernel.destroy();
    }
  },


  createResultBubble(code, row) {
    if (store.kernel) {
      this._createResultBubble(store.kernel, code, row);
      return;
    }

    kernelManager.startKernelFor(store.editor.getGrammar(), (kernel) => {
      this._createResultBubble(kernel, code, row);
    });
  },


  _createResultBubble(kernel, code, row) {
    if (this.watchSidebar.element.contains(document.activeElement)) {
      this.watchSidebar.run();
      return;
    }

    this.clearBubblesOnRow(row);
    const view = this.insertResultBubble(row);
    kernel.execute(code, (result) => {
      view.addResult(result);
    });
  },


  insertResultBubble(row) {
    const buffer = store.editor.getBuffer();
    let lineLength = buffer.lineLengthForRow(row);

    const marker = store.editor.markBufferPosition({
      row,
      column: lineLength,
    }, { invalidate: 'touch' });

    const view = new ResultView(marker);
    view.spin();
    const { element } = view;

    const lineHeight = store.editor.getLineHeightInPixels();
    view.spinner.setAttribute('style', `
      width: ${lineHeight + 2}px;
      height: ${lineHeight - 4}px;`);
    view.statusContainer.setAttribute('style', `height: ${lineHeight}px`);
    element.setAttribute('style', `
      margin-left: ${lineLength + 1}ch;
      margin-top: -${lineHeight}px;
      max-width: ${store.editor.width}px`);

    store.editor.decorateMarker(marker, {
      type: 'block',
      item: element,
      position: 'after',
    });

    this.markerBubbleMap[marker.id] = view;
    marker.onDidChange((event) => {
      log('marker.onDidChange:', marker);
      if (!event.isValid) {
        view.destroy();
        marker.destroy();
        delete this.markerBubbleMap[marker.id];
      } else if (!element.classList.contains('multiline')) {
        lineLength = marker.getStartBufferPosition().column;
        element.setAttribute('style', `
          margin-left: ${lineLength + 1}ch;
          margin-top: -${lineHeight}px`);
      }
    });
    return view;
  },


  clearResultBubbles() {
    _.forEach(this.markerBubbleMap, bubble => bubble.destroy());
    this.markerBubbleMap = {};
  },


  clearBubblesOnRow(row) {
    log('clearBubblesOnRow:', row);
    _.forEach(this.markerBubbleMap, (bubble) => {
      const { marker } = bubble;
      const range = marker.getBufferRange();
      if (range.start.row <= row && row <= range.end.row) {
        log('clearBubblesOnRow:', row, bubble);
        bubble.destroy();
        delete this.markerBubbleMap[marker.id];
      }
    });
  },


  run(moveDown = false) {
    const codeBlock = codeManager.findCodeBlock();
    if (!codeBlock) {
      return;
    }

    const [code, row] = codeBlock;
    if (code) {
      if (moveDown === true) {
        codeManager.moveDown(row);
      }
      this.createResultBubble(code, row);
    }
  },


  runAll() {
    if (store.kernel) {
      this._runAll(store.kernel);
      return;
    }

    kernelManager.startKernelFor(store.editor.getGrammar(), (kernel) => {
      this._runAll(kernel);
    });
  },


  _runAll(kernel) {
    const cells = codeManager.getCells();
    _.forEach(cells, ({ start, end }) => {
      const code = codeManager.getTextInRange(start, end);
      const endRow = codeManager.escapeBlankRows(start.row, end.row);
      this._createResultBubble(kernel, code, endRow);
    });
  },


  runAllAbove() {
    const cursor = store.editor.getLastCursor();
    const row = codeManager.escapeBlankRows(0, cursor.getBufferRow());
    const code = codeManager.getRows(0, row);

    if (code) {
      this.createResultBubble(code, row);
    }
  },


  runCell(moveDown = false) {
    const { start, end } = codeManager.getCurrentCell();
    const code = codeManager.getTextInRange(start, end);
    const endRow = codeManager.escapeBlankRows(start.row, end.row);

    if (code) {
      if (moveDown === true) {
        codeManager.moveDown(endRow);
      }
      this.createResultBubble(code, endRow);
    }
  },


  showKernelPicker() {
    if (!this.kernelPicker) {
      this.kernelPicker = new KernelPicker((callback) => {
        kernelManager.getAllKernelSpecsFor(store.language, kernelSpecs =>
          callback(kernelSpecs));
      });
      this.kernelPicker.onConfirmed = ({ kernelSpec }) =>
        this.handleKernelCommand({
          command: 'switch-kernel',
          payload: kernelSpec,
        });
    }
    this.kernelPicker.toggle();
  },


  showWSKernelPicker() {
    if (!this.wsKernelPicker) {
      this.wsKernelPicker = new WSKernelPicker((kernel) => {
        this.clearResultBubbles();

        if (kernel instanceof ZMQKernel) kernel.destroy();

        store.newKernel(kernel);
      });
    }

    this.wsKernelPicker.toggle(store.grammar, kernelSpec =>
      kernelManager.kernelSpecProvidesLanguage(kernelSpec, store.language),
    );
  },
};

export default Hydrogen;
