// coffeelint: disable = missing_fat_arrows
let Hydrogen;
import { CompositeDisposable, Emitter } from 'atom';

import _ from 'lodash';

import ResultView from './result-view';
import SignalListView from './signal-list-view';
import KernelPicker from './kernel-picker';
import WSKernelPicker from './ws-kernel-picker';
import CodeManager from './code-manager';

import Config from './config';
import KernelManager from './kernel-manager';
import Inspector from './inspector';
import AutocompleteProvider from './autocomplete-provider';

import HydrogenProvider from './plugin-api/hydrogen-provider';

export default Hydrogen = {
  config: Config.schema,
  subscriptions: null,

  kernelManager: null,
  inspector: null,

  editor: null,
  kernel: null,
  markerBubbleMap: null,

  statusBarElement: null,
  statusBarTile: null,

  watchSidebar: null,
  watchSidebarIsVisible: false,

  activate(state) {
    this.emitter = new Emitter();
    this.kernelManager = new KernelManager();
    this.codeManager = new CodeManager();
    this.inspector = new Inspector(this.kernelManager, this.codeManager);

    this.markerBubbleMap = {};

    this.statusBarElement = document.createElement('div');
    this.statusBarElement.classList.add('hydrogen');
    this.statusBarElement.classList.add('status-container');
    this.statusBarElement.onclick = this.showKernelCommands.bind(this);

    this.onEditorChanged(atom.workspace.getActiveTextEditor());

    this.subscriptions = new CompositeDisposable;

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      ['hydrogen:run']: () => this.run(),
      ['hydrogen:run-all']: () => this.runAll(),
      ['hydrogen:run-all-above']: () => this.runAllAbove(),
      ['hydrogen:run-and-move-down']: () => this.run(true),
      ['hydrogen:run-cell']: () => this.runCell(),
      ['hydrogen:run-cell-and-move-down']: () => this.runCell(true),
      ['hydrogen:toggle-watches']: () => this.toggleWatchSidebar(),
      ['hydrogen:select-kernel']: () => this.showKernelPicker(),
      ['hydrogen:connect-to-remote-kernel']: () => this.showWSKernelPicker(),
      ['hydrogen:add-watch']: () => {
        if (!this.watchSidebarIsVisible) {
          this.toggleWatchSidebar();
        }
        return __guard__(this.watchSidebar, x => x.addWatchFromEditor());
      },
      ['hydrogen:remove-watch']: () => {
        if (!this.watchSidebarIsVisible) {
          this.toggleWatchSidebar();
        }
        return __guard__(this.watchSidebar, x => x.removeWatch());
      },
      ['hydrogen:update-kernels']: () => this.kernelManager.updateKernelSpecs(),
      ['hydrogen:toggle-inspector']: () => this.inspector.toggle(),
      ['hydrogen:interrupt-kernel']: () => {
        return this.handleKernelCommand({ command: 'interrupt-kernel' });
      },
      ['hydrogen:restart-kernel']: () => {
        return this.handleKernelCommand({ command: 'restart-kernel' });
      },
      ['hydrogen:shutdown-kernel']: () => {
        return this.handleKernelCommand({ command: 'shutdown-kernel' });
      }
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      ['hydrogen:clear-results']: () => this.clearResultBubbles() }));

    this.subscriptions.add(atom.workspace.observeActivePaneItem(item => {
      if (item && item === atom.workspace.getActiveTextEditor()) {
        return this.onEditorChanged(item);
      }
    }));

    return this.hydrogenProvider = null;
  },


  deactivate() {
    this.subscriptions.dispose();
    this.kernelManager.destroy();
    return this.statusBarTile.destroy();
  },

  provideHydrogen() {
    if (this.hydrogenProvider == null) {
      this.hydrogenProvider = new HydrogenProvider(this);
    }

    return this.hydrogenProvider;
  },


  consumeStatusBar(statusBar) {
    return this.statusBarTile = statusBar.addLeftTile({
      item: this.statusBarElement,
      priority: 100
    });
  },


  provide() {
    if (atom.config.get('Hydrogen.autocomplete') === true) {
      return AutocompleteProvider(this.kernelManager);
    }
  },


  onEditorChanged(editor) {
    this.editor = editor;
    if (this.editor) {
      let grammar = this.editor.getGrammar();
      let language = this.kernelManager.getLanguageFor(grammar);
      var kernel = this.kernelManager.getRunningKernelFor(language);
      this.codeManager.editor = this.editor;
    }

    if (this.kernel !== kernel) {
      return this.onKernelChanged(kernel);
    }
  },


  onKernelChanged(kernel) {
    this.kernel = kernel;
    this.setStatusBar();
    this.setWatchSidebar(this.kernel);
    return this.emitter.emit('did-change-kernel', this.kernel);
  },


  setStatusBar() {
    if (this.statusBarElement == null) {
      console.error('setStatusBar: there is no status bar');
      return;
    }

    this.clearStatusBar();

    if (this.kernel != null) {
      return this.statusBarElement.appendChild(this.kernel.statusView.element);
    }
  },


  clearStatusBar() {
    if (this.statusBarElement == null) {
      console.error('clearStatusBar: there is no status bar');
      return;
    }

    return (() => {
      let result = [];
      while (this.statusBarElement.hasChildNodes()) {
        result.push(this.statusBarElement.removeChild(this.statusBarElement.lastChild));
      }
      return result;
    })();
  },


  setWatchSidebar(kernel) {
    console.log('setWatchSidebar:', kernel);

    let sidebar = __guard__(kernel, x => x.watchSidebar);
    if (this.watchSidebar === sidebar) {
      return;
    }

    if (__guard__(this.watchSidebar, x1 => x1.visible)) {
      this.watchSidebar.hide();
    }

    this.watchSidebar = sidebar;

    if (this.watchSidebarIsVisible) {
      return __guard__(this.watchSidebar, x2 => x2.show());
    }
  },


  toggleWatchSidebar() {
    if (this.watchSidebarIsVisible) {
      console.log('toggleWatchSidebar: hiding sidebar');
      this.watchSidebarIsVisible = false;
      return __guard__(this.watchSidebar, x => x.hide());
    } else {
      console.log('toggleWatchSidebar: showing sidebar');
      this.watchSidebarIsVisible = true;
      return __guard__(this.watchSidebar, x1 => x1.show());
    }
  },


  showKernelCommands() {
    if (this.signalListView == null) {
      this.signalListView = new SignalListView(this.kernelManager);
      this.signalListView.onConfirmed = kernelCommand => {
        return this.handleKernelCommand(kernelCommand);
      };
    }
    return this.signalListView.toggle();
  },


  handleKernelCommand({ kernel, command, grammar, language, kernelSpec }) {
    console.log('handleKernelCommand:', arguments);

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
      let message = `No running kernel for language \`${language}\` found`;
      atom.notifications.addError(message);
      return;
    }

    if (command === 'interrupt-kernel') {
      return kernel.interrupt();

    } else if (command === 'restart-kernel') {
      this.clearResultBubbles();
      return this.kernelManager.restartRunningKernelFor(grammar, kernel => {
        return this.onKernelChanged(kernel);
      });

    } else if (command === 'shutdown-kernel') {
      this.clearResultBubbles();
      // Note that destroy alone does not shut down a WSKernel
      kernel.shutdown();
      this.kernelManager.destroyRunningKernelFor(grammar);
      return this.onKernelChanged();

    } else if (command === 'switch-kernel') {
      this.clearResultBubbles();
      this.kernelManager.destroyRunningKernelFor(grammar);
      return this.kernelManager.startKernel(kernelSpec, grammar, kernel => {
        return this.onKernelChanged(kernel);
      });

    } else if (command === 'rename-kernel') {
      return __guardMethod__(kernel, 'promptRename', o => o.promptRename());

    } else if (command === 'disconnect-kernel') {
      this.clearResultBubbles();
      this.kernelManager.destroyRunningKernelFor(grammar);
      return this.onKernelChanged();
    }
  },


  createResultBubble(code, row) {
    if (this.kernel) {
      this._createResultBubble(this.kernel, code, row);
      return;
    }

    return this.kernelManager.startKernelFor(this.editor.getGrammar(), kernel => {
      this.onKernelChanged(kernel);
      return this._createResultBubble(kernel, code, row);
    });
  },


  _createResultBubble(kernel, code, row) {
    if (this.watchSidebar.element.contains(document.activeElement)) {
      this.watchSidebar.run();
      return;
    }

    this.clearBubblesOnRow(row);
    let view = this.insertResultBubble(row);
    return kernel.execute(code, function(result) {
      view.spin(false);
      return view.addResult(result);
    });
  },


  insertResultBubble(row) {
    let buffer = this.editor.getBuffer();
    let lineLength = buffer.lineLengthForRow(row);

    let marker = this.editor.markBufferPosition({
      row,
      column: lineLength
    }, { invalidate: 'touch' });

    let view = new ResultView(marker);
    view.spin(true);
    let { element } = view;

    let lineHeight = this.editor.getLineHeightInPixels();
    view.spinner.setAttribute('style',
      `width: ${lineHeight + 2}px; height: ${lineHeight - 4}px;`);
    view.statusContainer.setAttribute('style', `height: ${lineHeight}px`);
    element.setAttribute('style',
      `margin-left: ${lineLength + 1}ch;
                margin-top: -${lineHeight}px`);

    this.editor.decorateMarker(marker, {
      type: 'block',
      item: element,
      position: 'after'
    });

    this.markerBubbleMap[marker.id] = view;
    marker.onDidChange(event => {
      console.log('marker.onDidChange:', marker);
      if (!event.isValid) {
        view.destroy();
        marker.destroy();
        return delete this.markerBubbleMap[marker.id];
      } else {
        if (!element.classList.contains('multiline')) {
          lineLength = marker.getStartBufferPosition()['column'];
          return element.setAttribute('style',
            `margin-left: ${lineLength + 1}ch;
                            margin-top: -${lineHeight}px`);
        }
      }
    });

    return view;
  },


  clearResultBubbles() {
    _.forEach(this.markerBubbleMap, bubble => bubble.destroy());
    return this.markerBubbleMap = {};
  },


  clearBubblesOnRow(row) {
    console.log('clearBubblesOnRow:', row);
    return _.forEach(this.markerBubbleMap, bubble => {
      let { marker } = bubble;
      let range = marker.getBufferRange();
      if (range.start.row <= row && row <= range.end.row) {
        console.log('clearBubblesOnRow:', row, bubble);
        bubble.destroy();
        return delete this.markerBubbleMap[marker.id];
      }
    });
  },


  run(moveDown = false) {
    let codeBlock = this.codeManager.findCodeBlock();
    if (codeBlock == null) {
      return;
    }

    let [code, row] = codeBlock;
    if ((code != null) && (row != null)) {
      if (moveDown === true) {
        this.codeManager.moveDown(row);
      }
      return this.createResultBubble(code, row);
    }
  },


  runAll() {
    if (this.kernel) {
      this._runAll(this.kernel);
      return;
    }

    return this.kernelManager.startKernelFor(this.editor.getGrammar(), kernel => {
      this.onKernelChanged(kernel);
      return this._runAll(kernel);
    });
  },


  _runAll(kernel) {
    let start;
    let end;
    let code;
    let endRow;
    let breakpoints = this.codeManager.getBreakpoints();
    return __range__(1, breakpoints.length, false).map((i) =>
      (start = breakpoints[i - 1],
        end = breakpoints[i],
        code = this.codeManager.getTextInRange(start, end),
        endRow = this.codeManager.escapeBlankRows(start.row, end.row),
        this._createResultBubble(kernel, code, endRow)));
  },


  runAllAbove() {
    let cursor = this.editor.getLastCursor();
    let row = this.codeManager.escapeBlankRows(0, cursor.getBufferRow());
    let code = this.codeManager.getRows(0, row);

    if ((code != null) && (row != null)) {
      return this.createResultBubble(code, row);
    }
  },


  runCell(moveDown = false) {
    let [start, end] = this.codeManager.getCurrentCell();
    let code = this.codeManager.getTextInRange(start, end);
    let endRow = this.codeManager.escapeBlankRows(start.row, end.row);

    if (code != null) {
      if (moveDown === true) {
        this.codeManager.moveDown(endRow);
      }
      return this.createResultBubble(code, endRow);
    }
  },


  showKernelPicker() {
    if (this.kernelPicker == null) {
      this.kernelPicker = new KernelPicker(callback => {
        let grammar = this.editor.getGrammar();
        let language = this.kernelManager.getLanguageFor(grammar);
        return this.kernelManager.getAllKernelSpecsFor(language, kernelSpecs => callback(kernelSpecs));
      });
      this.kernelPicker.onConfirmed = ({ kernelSpec }) => {
        return this.handleKernelCommand({
          command: 'switch-kernel',
          kernelSpec
        });
      };
    }
    return this.kernelPicker.toggle();
  },


  showWSKernelPicker() {
    if (this.wsKernelPicker == null) {
      this.wsKernelPicker = new WSKernelPicker(kernel => {
        this.clearResultBubbles();

        let { grammar } = kernel;
        this.kernelManager.destroyRunningKernelFor(grammar);

        this.kernelManager.setRunningKernelFor(grammar, kernel);
        return this.onKernelChanged(kernel);
      });
    }

    let grammar = this.editor.getGrammar();
    let language = this.kernelManager.getLanguageFor(grammar);

    return this.wsKernelPicker.toggle(grammar, kernelSpec => {
      return this.kernelManager.kernelSpecProvidesLanguage(kernelSpec, language);
    });
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
