import { SelectListView } from 'atom-space-pen-views';
import _ from 'lodash';

import WSKernel from './ws-kernel';

// View to display a list of grammars to apply to the current editor.
export default class SignalListView extends SelectListView {
    initialize(kernelManager) {
        this.kernelManager = kernelManager;
        super.initialize(...arguments);

        this.basicCommands = [{
            name: 'Interrupt',
            value: 'interrupt-kernel'
        }
        , {
            name: 'Restart',
            value: 'restart-kernel'
        }
        , {
            name: 'Shut Down',
            value: 'shutdown-kernel'
        }
        ];

        this.wsKernelCommands = [{
            name: 'Rename session for',
            value: 'rename-kernel'
        }
        , {
            name: 'Disconnect from',
            value: 'disconnect-kernel'
        }
        ];

        this.onConfirmed = null;
        this.list.addClass('mark-active');
        return this.setItems([]);
    }


    toggle() {
        if (this.panel != null) {
            return this.cancel();
        } else if (this.editor = atom.workspace.getActiveTextEditor()) {
            return this.attach();
        }
    }


    attach() {
        // get language from editor
        this.storeFocusedElement();
        if (this.panel == null) { this.panel = atom.workspace.addModalPanel({item: this}); }
        this.focusFilterEditor();
        let grammar = this.editor.getGrammar();
        let language = this.kernelManager.getLanguageFor(grammar);

        // disable all commands if no kernel is running
        let kernel = this.kernelManager.getRunningKernelFor(language);
        if (kernel == null) {
            return this.setItems([]);
        }

        // add basic commands for the current grammar language
        let basicCommands = this.basicCommands.map(command => {
            return {
                name: this._getCommandName(command.name, kernel.kernelSpec),
                command: command.value,
                grammar,
                language,
                kernel
            };
        });

        if (kernel instanceof WSKernel) {
            let wsKernelCommands = this.wsKernelCommands.map(command => {
                return {
                    name: this._getCommandName(command.name, kernel.kernelSpec),
                    command: command.value,
                    grammar,
                    language,
                    kernel
                };
            });
            return this.setItems(_.union(basicCommands, wsKernelCommands));
        } else {
            // add commands to switch to other kernels
            return this.kernelManager.getAllKernelSpecsFor(language, kernelSpecs => {
                _.pull(kernelSpecs, kernel.kernelSpec);

                let switchCommands = kernelSpecs.map(kernelSpec => {
                    return {
                        name: this._getCommandName('Switch to', kernelSpec),
                        command: 'switch-kernel',
                        grammar,
                        language,
                        kernelSpec
                    };
                });

                return this.setItems(_.union(basicCommands, switchCommands));
            }
            );
        }
    }


    _getCommandName(name, kernelSpec) {
        return name + ' ' + kernelSpec.display_name + ' kernel';
    }


    confirmed(item) {
        console.log('Selected command:', item);
        __guardMethod__(this, 'onConfirmed', o => o.onConfirmed(item));
        return this.cancel();
    }


    getEmptyMessage() {
        return 'No running kernels for this file type.';
    }


    getFilterKey() {
        return 'name';
    }


    destroy() {
        return this.cancel();
    }


    viewForItem(item) {
        let element = document.createElement('li');
        element.textContent = item.name;
        return element;
    }


    cancelled() {
        __guard__(this.panel, x => x.destroy());
        this.panel = null;
        return this.editor = null;
    }
};

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}