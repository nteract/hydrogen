'use babel';

import { CompositeDisposable, Disposable, Emitter } from 'atom';

import _ from 'lodash';
import ReactDOM from 'react-dom';
import React from 'react';


import ResultView from './result-view';
import SignalListView from './signal-list-view';
import KernelPicker from './kernel-picker';
import WSKernelPicker from './ws-kernel-picker';
import CodeManager from './code-manager';

import StatusBar from './components/status-bar';
import store from './store';

import Config from './config';
import KernelManager from './kernel-manager';
import Inspector from './inspector';
import AutocompleteProvider from './autocomplete-provider';
import HydrogenProvider from './plugin-api/hydrogen-provider';
import log from './log';

const Hydrogen = {
  config: Config.schema,
  subscriptions: null,

  kernelManager: null,
  inspector: null,

  editor: null,
  kernel: null,
  markerBubbleMap: null,

  watchSidebar: null,
  watchSidebarIsVisible: false,

  activate() {
    this.emitter = new Emitter();
    this.kernelManager = new KernelManager();
    this.codeManager = new CodeManager();
    this.inspector = new Inspector(this.kernelManager, this.codeManager);

    this.markerBubbleMap = {};

    this.onEditorChanged(atom.workspace.getActiveTextEditor());

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
      'hydrogen:update-kernels': () => this.kernelManager.updateKernelSpecs(),
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
        this.onEditorChanged(item);
      }
    }));

    this.hydrogenProvider = null;
  },


  deactivate() {
    this.subscriptions.dispose();
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

    const statusBarTile = statusBar.addLeftTile({
      item: statusBarElement,
      priority: 100,
    });

    const onClick = this.showKernelCommands.bind(this);

    ReactDOM.render(
      <StatusBar
        store={store}
        onClick={onClick}
      />,
      statusBarElement,
    );

    const disposable = new Disposable(() => {
      ReactDOM.unmountComponentAtNode(statusBarElement);
      statusBarTile.destroy();
    });
    this.subscriptions.add(disposable);
    return disposable;
  },


  provide() {
    if (atom.config.get('Hydrogen.autocomplete') === true) {
      return AutocompleteProvider(this.kernelManager);
    }
    return null;
  },


  onEditorChanged(editor) {
    store.editor = editor;
    this.editor = editor;
    let kernel;
    if (this.editor) {
      const grammar = this.editor.getGrammar();
      const language = this.kernelManager.getLanguageFor(grammar);
      kernel = this.kernelManager.getRunningKernelFor(language);
      this.codeManager.editor = this.editor;
    }

    if (this.kernel !== kernel) {
      this.onKernelChanged(kernel);
    }
  },


  onKernelChanged(kernel) {
    this.kernel = kernel;
    this.setWatchSidebar(this.kernel);
    this.emitter.emit('did-change-kernel', this.kernel);
  },

  setWatchSidebar(kernel) {
    log('setWatchSidebar:', kernel);

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
      this.signalListView = new SignalListView(this.kernelManager);
      this.signalListView.onConfirmed = kernelCommand =>
        this.handleKernelCommand(kernelCommand);
    }
    this.signalListView.toggle();
  },


  handleKernelCommand({ kernel, command, grammar, language, kernelSpec }) {
    log('handleKernelCommand:', arguments);

    if (!grammar) {
      grammar = this.editor.getGrammar();
    }
    if (!language) {
      language = this.kernelManager.getLanguageFor(grammar);
    }
    if (!kernel) {
      kernel = this.kernelManager.getRunningKernelFor(language);
    }

    if (!kernel) {
      const message = `No running kernel for language \`${language}\` found`;
      atom.notifications.addError(message);
      return;
    }

    if (command === 'interrupt-kernel') {
      kernel.interrupt();
    } else if (command === 'restart-kernel') {
      this.clearResultBubbles();
      this.kernelManager.restartRunningKernelFor(grammar, this.onKernelChanged.bind(this));
    } else if (command === 'shutdown-kernel') {
      this.clearResultBubbles();
      // Note that destroy alone does not shut down a WSKernel
      kernel.shutdown();
      this.kernelManager.destroyRunningKernelFor(grammar);
      this.onKernelChanged();
    } else if (command === 'switch-kernel') {
      this.clearResultBubbles();
      this.kernelManager.destroyRunningKernelFor(grammar);
      this.kernelManager.startKernel(kernelSpec, grammar, this.onKernelChanged.bind(this));
    } else if (command === 'rename-kernel' && kernel.promptRename) {
      kernel.promptRename();
    } else if (command === 'disconnect-kernel') {
      this.clearResultBubbles();
      this.kernelManager.destroyRunningKernelFor(grammar);
      this.onKernelChanged();
    }
  },


  createResultBubble(code, row) {
    if (this.kernel) {
      this._createResultBubble(this.kernel, code, row);
      return;
    }

    this.kernelManager.startKernelFor(this.editor.getGrammar(), (kernel) => {
      this.onKernelChanged(kernel);
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
    const buffer = this.editor.getBuffer();
    let lineLength = buffer.lineLengthForRow(row);

    const marker = this.editor.markBufferPosition({
      row,
      column: lineLength,
    }, { invalidate: 'touch' });

    const view = new ResultView(marker);
    view.spin();
    const { element } = view;

    const lineHeight = this.editor.getLineHeightInPixels();
    view.spinner.setAttribute('style', `
      width: ${lineHeight + 2}px;
      height: ${lineHeight - 4}px;`);
    view.statusContainer.setAttribute('style', `height: ${lineHeight}px`);
    element.setAttribute('style', `
      margin-left: ${lineLength + 1}ch;
      margin-top: -${lineHeight}px;
      max-width: ${this.editor.width}px`);

    this.editor.decorateMarker(marker, {
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
    const codeBlock = this.codeManager.findCodeBlock();
    if (!codeBlock) {
      return;
    }

    const [code, row] = codeBlock;
    if (code) {
      if (moveDown === true) {
        this.codeManager.moveDown(row);
      }
      this.createResultBubble(code, row);
    }
  },


  runAll() {
    if (this.kernel) {
      this._runAll(this.kernel);
      return;
    }

    this.kernelManager.startKernelFor(this.editor.getGrammar(), (kernel) => {
      this.onKernelChanged(kernel);
      this._runAll(kernel);
    });
  },


  _runAll(kernel) {
    const cells = this.codeManager.getCells();
    _.forEach(cells, ({ start, end }) => {
      const code = this.codeManager.getTextInRange(start, end);
      const endRow = this.codeManager.escapeBlankRows(start.row, end.row);
      this._createResultBubble(kernel, code, endRow);
    });
  },


  runAllAbove() {
    const cursor = this.editor.getLastCursor();
    const row = this.codeManager.escapeBlankRows(0, cursor.getBufferRow());
    const code = this.codeManager.getRows(0, row);

    if (code) {
      this.createResultBubble(code, row);
    }
  },


  runCell(moveDown = false) {
    const { start, end } = this.codeManager.getCurrentCell();
    const code = this.codeManager.getTextInRange(start, end);
    const endRow = this.codeManager.escapeBlankRows(start.row, end.row);

    if (code) {
      if (moveDown === true) {
        this.codeManager.moveDown(endRow);
      }
      this.createResultBubble(code, endRow);
    }
  },


  showKernelPicker() {
    if (!this.kernelPicker) {
      this.kernelPicker = new KernelPicker((callback) => {
        const grammar = this.editor.getGrammar();
        const language = this.kernelManager.getLanguageFor(grammar);
        this.kernelManager.getAllKernelSpecsFor(language, kernelSpecs =>
          callback(kernelSpecs));
      });
      this.kernelPicker.onConfirmed = ({ kernelSpec }) =>
        this.handleKernelCommand({
          command: 'switch-kernel',
          kernelSpec,
        });
    }
    this.kernelPicker.toggle();
  },


  showWSKernelPicker() {
    if (!this.wsKernelPicker) {
      this.wsKernelPicker = new WSKernelPicker((kernel) => {
        this.clearResultBubbles();

        const { grammar } = kernel;
        this.kernelManager.destroyRunningKernelFor(grammar);

        store.newKernel(kernel);
        this.onKernelChanged(kernel);
      });
    }

    const grammar = this.editor.getGrammar();
    const language = this.kernelManager.getLanguageFor(grammar);

    this.wsKernelPicker.toggle(grammar, kernelSpec =>
      this.kernelManager.kernelSpecProvidesLanguage(kernelSpec, language),
    );
  },
};

export default Hydrogen;
