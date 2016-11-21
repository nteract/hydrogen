'use babel';

import Kernel from './kernel';
import InputView from './input-view';

export default class WSKernel extends Kernel {
  constructor(kernelSpec, grammar, session) {
    super(kernelSpec, grammar);
    this.session = session;

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
    this.statusView.setStatus(this.session.status);
  }

  _execute(code, callWatches, onResults) {
    const future = this.session.kernel.execute({ code });

    future.onIOPub = (message) => {
      if (callWatches &&
        message.header.msg_type === 'status' &&
        message.content.execution_state === 'idle') {
        this._callWatchCallbacks();
      }

      if (onResults) {
        console.log('WSKernel: _execute:', message);
        const result = this._parseIOMessage(message);
        if (result) onResults(result);
      }
    };

    future.onReply = (message) => {
      if (message.content.status === 'error') {
        return;
      }
      const result = {
        data: 'ok',
        type: 'text',
        stream: 'status',
      };
      if (onResults) onResults(result);
    };

    future.onStdin = (message) => {
      if (message.header.msg_type !== 'input_request') {
        return;
      }

      const { prompt } = message.content;

      const inputView = new InputView({ prompt }, input =>
        this.session.kernel.sendInputReply({ value: input }));

      inputView.attach();
    };
  }


  execute(code, onResults) {
    this._execute(code, true, onResults);
  }

  executeWatch(code, onResults) {
    this._execute(code, false, onResults);
  }

  complete(code, onResults) {
    this.session.kernel.complete({
      code,
      cursor_pos: code.length,
    })
      .then(message => onResults(message.content));
  }

  inspect(code, cursorPos, onResults) {
    this.session.kernel.inspect({
      code,
      cursor_pos: cursorPos,
      detail_level: 0,
    })
      .then(message =>
        onResults({
          data: message.content.data,
          found: message.content.found,
        }),
      );
  }

  promptRename() {
    const view = new InputView(
      {
        prompt: 'Name your current session',
        defaultText: this.session.path,
        allowCancel: true,
      },
      input => this.session.rename(input));

    view.attach();
  }

  destroy() {
    console.log('WSKernel: destroying jupyter-js-services Session');
    this.session.dispose();
    super.destroy(...arguments);
  }
}
