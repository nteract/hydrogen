'use babel';

import { SelectListView } from 'atom-space-pen-views';
import _ from 'lodash';

import WSKernel from './ws-kernel';
import kernelManager from './kernel-manager';
import log from './utils/log';
import store from './store';

// View to display a list of grammars to apply to the current editor.
export default class SignalListView extends SelectListView {
  initialize() {
    super.initialize(...arguments);

    this.basicCommands = [{
      name: 'Interrupt',
      value: 'interrupt-kernel',
    }, {
      name: 'Restart',
      value: 'restart-kernel',
    }, {
      name: 'Shut Down',
      value: 'shutdown-kernel',
    }];

    this.wsKernelCommands = [{
      name: 'Rename session for',
      value: 'rename-kernel',
    }, {
      name: 'Disconnect from',
      value: 'disconnect-kernel',
    }];

    this.onConfirmed = null;
    this.list.addClass('mark-active');
    this.setItems([]);
  }


  toggle() {
    if (this.panel) {
      this.cancel();
    } else if (atom.workspace.getActiveTextEditor()) {
      this.editor = atom.workspace.getActiveTextEditor();
      this.attach();
    }
  }


  attach() {
    // get language from editor
    this.storeFocusedElement();
    if (!this.panel) { this.panel = atom.workspace.addModalPanel({ item: this }); }
    this.focusFilterEditor();
    const language = store.language;

    // disable all commands if no kernel is running
    const kernel = store.kernel;
    if (!kernel) {
      this.setItems([]);
    }

    // add basic commands for the current grammar language
    const basicCommands = this.basicCommands.map(command => ({
      name: this._getCommandName(command.name, kernel.kernelSpec),
      command: command.value,
    }));

    if (kernel instanceof WSKernel) {
      const wsKernelCommands = this.wsKernelCommands.map(command => ({
        name: this._getCommandName(command.name, kernel.kernelSpec),
        command: command.value,
      }));
      this.setItems(_.union(basicCommands, wsKernelCommands));
    } else {
      // add commands to switch to other kernels
      kernelManager.getAllKernelSpecsFor(language, (kernelSpecs) => {
        _.pull(kernelSpecs, kernel.kernelSpec);

        const switchCommands = kernelSpecs.map(kernelSpec => ({
          name: this._getCommandName('Switch to', kernelSpec),
          command: 'switch-kernel',
          payload: kernelSpec,
        }));

        this.setItems(_.union(basicCommands, switchCommands));
      });
    }
  }


  _getCommandName(name, kernelSpec) {
    return `${name} ${kernelSpec.display_name} kernel`;
  }


  confirmed(item) {
    log('Selected command:', item);
    if (this.onConfirmed) this.onConfirmed(item);
    this.cancel();
  }


  getEmptyMessage() {
    return 'No running kernels for this file type.';
  }


  getFilterKey() {
    return 'name';
  }


  destroy() {
    this.cancel();
  }


  viewForItem(item) {
    const element = document.createElement('li');
    element.textContent = item.name;
    return element;
  }


  cancelled() {
    if (this.panel) this.panel.destroy();
    this.panel = null;
    this.editor = null;
  }
}
