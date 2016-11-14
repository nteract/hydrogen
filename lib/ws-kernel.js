import child_process from 'child_process';
import path from 'path';

import _ from 'lodash';
import uuid from 'uuid';
import services from './jupyter-js-services-shim';

import Kernel from './kernel';
import InputView from './input-view';
import RenameView from './rename-view';

export default class WSKernel extends Kernel {
    constructor(kernelSpec, grammar, session) {
        this.session = session;
        super(kernelSpec, grammar);

        this.session.statusChanged.connect(() => this._onStatusChange());
        this._onStatusChange(); // Set initial status correctly
    }

    interrupt() {
        return this.session.kernel.interrupt();
    }

    shutdown() {
        return this.session.kernel.shutdown();
    }

    restart() {
        return this.session.kernel.restart();
    }

    _onStatusChange() {
        return this.statusView.setStatus(this.session.status);
    }

    _execute(code, onResults, callWatches) {
        let future = this.session.kernel.execute({
            code
        });

        future.onIOPub = message => {
            if (callWatches &&
            message.header.msg_type === 'status' &&
            message.content.execution_state === 'idle') {
                this._callWatchCallbacks();
            }

            if (onResults != null) {
                console.log('WSKernel: _execute:', message);
                let result = this._parseIOMessage(message);
                if (result != null) {
                    return onResults(result);
                }
            }
        };

        future.onReply = function(message) {
            if (message.content.status === 'error') {
                return;
            }
            let result = {
                data: 'ok',
                type: 'text',
                stream: 'status'
            };
            return __guardFunc__(onResults, f => f(result));
        };

        return future.onStdin = message => {
            if (message.header.msg_type !== 'input_request') {
                return;
            }

            let { prompt } = message.content;

            let inputView = new InputView(prompt, input => {
                return this.session.kernel.sendInputReply({
                    value: input
                });
            }
            );

            return inputView.attach();
        };
    }


    execute(code, onResults) {
        return this._execute(code, onResults, true);
    }

    executeWatch(code, onResults) {
        return this._execute(code, onResults, false);
    }

    complete(code, onResults) {
        return this.session.kernel.complete({
            code,
            cursor_pos: code.length
        })
        .then(message => __guardFunc__(onResults, f => f(message.content)));
    }

    inspect(code, cursor_pos, onResults) {
        return this.session.kernel.inspect({
            code,
            cursor_pos,
            detail_level: 0
        })
        .then(message =>
            __guardFunc__(onResults, f => f({
                data: message.content.data,
                found: message.content.found
            }))
        );
    }

    promptRename() {
        let view = new RenameView('Name your current session', this.session.path, input => {
            return this.session.rename(input);
        }
        );

        return view.attach();
    }

    destroy() {
        console.log('WSKernel: destroying jupyter-js-services Session');
        this.session.dispose();
        return super.destroy(...arguments);
    }
};

function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}