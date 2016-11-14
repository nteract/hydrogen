'use babel';

import fs from 'fs';
import jmp from 'jmp';
import uuid from 'uuid';

import { __guard__ } from './guards';
import Kernel from './kernel';
import InputView from './input-view';

export default class ZMQKernel extends Kernel {
  constructor(kernelSpec, grammar, connection, connectionFile, kernelProcess) {
    super(kernelSpec, grammar);
    this.connection = connection;
    this.connectionFile = connectionFile;
    this.kernelProcess = kernelProcess;

    this.executionCallbacks = {};

    this._connect();

    if (this.kernelProcess != null) {
      console.log('ZMQKernel: @kernelProcess:', this.kernelProcess);

      const getKernelNotificationsRegExp = () => {
        try {
          const pattern = atom.config.get('Hydrogen.kernelNotifications');
          const flags = 'im';
          return new RegExp(pattern, flags);
        } catch (err) {
          return null;
        }
      };

      this.kernelProcess.stdout.on('data', (data) => {
        data = data.toString();

        console.log('ZMQKernel: stdout:', data);

        const regexp = getKernelNotificationsRegExp();
        if (__guard__(regexp, x => x.test(data))) {
          atom.notifications.addInfo(this.kernelSpec.display_name,
            { description: data, dismissable: true });
        }
      });

      this.kernelProcess.stderr.on('data', (data) => {
        data = data.toString();

        console.log('ZMQKernel: stderr:', data);

        const regexp = getKernelNotificationsRegExp();
        if (__guard__(regexp, x => x.test(data))) {
          atom.notifications.addError(this.kernelSpec.display_name,
            { description: data, dismissable: true });
        }
      });
    } else {
      console.log('ZMQKernel: connectionFile:', this.connectionFile);
      atom.notifications.addInfo('Using an existing kernel connection');
    }
  }


  _connect() {
    const scheme = this.connection.signature_scheme.slice('hmac-'.length);
    const { key } = this.connection;

    this.shellSocket = new jmp.Socket('dealer', scheme, key);
    this.controlSocket = new jmp.Socket('dealer', scheme, key);
    this.stdinSocket = new jmp.Socket('dealer', scheme, key);
    this.ioSocket = new jmp.Socket('sub', scheme, key);

    const id = uuid.v4();
    this.shellSocket.identity = `dealer${id}`;
    this.controlSocket.identity = `control${id}`;
    this.stdinSocket.identity = `dealer${id}`;
    this.ioSocket.identity = `sub${id}`;

    const address = `${this.connection.transport}://${this.connection.ip}:`;
    this.shellSocket.connect(address + this.connection.shell_port);
    this.controlSocket.connect(address + this.connection.control_port);
    this.ioSocket.connect(address + this.connection.iopub_port);
    this.ioSocket.subscribe('');
    this.stdinSocket.connect(address + this.connection.stdin_port);

    this.shellSocket.on('message', this.onShellMessage.bind(this));
    this.ioSocket.on('message', this.onIOMessage.bind(this));
    this.stdinSocket.on('message', this.onStdinMessage.bind(this));

    this.shellSocket.on('connect', () => console.log('shellSocket connected'));
    this.controlSocket.on('connect', () => console.log('controlSocket connected'));
    this.ioSocket.on('connect', () => console.log('ioSocket connected'));
    this.stdinSocket.on('connect', () => console.log('stdinSocket connected'));

    try {
      this.shellSocket.monitor();
      this.controlSocket.monitor();
      this.ioSocket.monitor();
      this.stdinSocket.monitor();
    } catch (err) {
      console.error('Kernel:', err);
    }
  }


  interrupt() {
    if (this.kernelProcess != null) {
      console.log('ZMQKernel: sending SIGINT');
      this.kernelProcess.kill('SIGINT');
    } else {
      console.log('ZMQKernel: cannot interrupt an existing kernel');
      atom.notifications.addWarning('Cannot interrupt this kernel');
    }
  }


  _kill() {
    if (this.kernelProcess != null) {
      console.log('ZMQKernel: sending SIGKILL');
      this.kernelProcess.kill('SIGKILL');
    } else {
      console.log('ZMQKernel: cannot kill an existing kernel');
      atom.notifications.addWarning('Cannot kill this kernel');
    }
  }


  shutdown(restart = false) {
    const requestId = `shutdown_${uuid.v4()}`;
    const message = this._createMessage('shutdown_request', requestId);

    message.content = { restart };

    this.shellSocket.send(new jmp.Message(message));
  }


  // onResults is a callback that may be called multiple times
  // as results come in from the kernel
  _execute(code, requestId, onResults) {
    const message = this._createMessage('execute_request', requestId);

    message.content = {
      code,
      silent: false,
      store_history: true,
      user_expressions: {},
      allow_stdin: true,
    };

    this.executionCallbacks[requestId] = onResults;

    this.shellSocket.send(new jmp.Message(message));
  }


  execute(code, onResults) {
    console.log('Kernel.execute:', code);

    const requestId = `execute_${uuid.v4()}`;
    this._execute(code, requestId, onResults);
  }


  executeWatch(code, onResults) {
    console.log('Kernel.executeWatch:', code);

    const requestId = `watch_${uuid.v4()}`;
    this._execute(code, requestId, onResults);
  }


  complete(code, onResults) {
    console.log('Kernel.complete:', code);

    const requestId = `complete_${uuid.v4()}`;

    const message = this._createMessage('complete_request', requestId);

    message.content = {
      code,
      text: code,
      line: code,
      cursor_pos: code.length,
    };

    this.executionCallbacks[requestId] = onResults;

    this.shellSocket.send(new jmp.Message(message));
  }


  inspect(code, cursorPos, onResults) {
    console.log('Kernel.inspect:', code, cursorPos);

    const requestId = `inspect_${uuid.v4()}`;

    const message = this._createMessage('inspect_request', requestId);

    message.content = {
      code,
      cursor_pos: cursorPos,
      detail_level: 0,
    };

    this.executionCallbacks[requestId] = onResults;

    this.shellSocket.send(new jmp.Message(message));
  }

  inputReply(input) {
    const requestId = `input_reply_${uuid.v4()}`;

    const message = this._createMessage('input_reply', requestId);

    message.content = { value: input };

    this.stdinSocket.send(new jmp.Message(message));
  }

  /* eslint-disable camelcase*/
  onShellMessage(message) {
    console.log('shell message:', message);

    if (!this._isValidMessage(message)) {
      return;
    }

    const { msg_id } = message.parent_header;
    let callback;
    if (msg_id != null) {
      callback = this.executionCallbacks[msg_id];
    }

    if (callback == null) {
      return;
    }

    const { status } = message.content;
    if (status === 'error') {
      // Drop 'status: error' shell messages, wait for IO messages instead
      return;
    }

    if (status === 'ok') {
      const { msg_type } = message.header;

      if (msg_type === 'execution_reply') {
        callback({
          data: 'ok',
          type: 'text',
          stream: 'status',
        });
      } else if (msg_type === 'complete_reply') {
        callback(message.content);
      } else if (msg_type === 'inspect_reply') {
        callback({
          data: message.content.data,
          found: message.content.found,
        });
      } else {
        callback({
          data: 'ok',
          type: 'text',
          stream: 'status',
        });
      }
    }
  }


  onStdinMessage(message) {
    console.log('stdin message:', message);

    if (!this._isValidMessage(message)) {
      return;
    }

    const { msg_type } = message.header;

    if (msg_type === 'input_request') {
      const { prompt } = message.content;

      const inputView = new InputView(prompt, input => this.inputReply(input));

      inputView.attach();
    }
  }


  onIOMessage(message) {
    console.log('IO message:', message);

    if (!this._isValidMessage(message)) {
      return;
    }

    const { msg_type } = message.header;

    if (msg_type === 'status') {
      const status = message.content.execution_state;
      this.statusView.setStatus(status);

      const msg_id = __guard__(message.parent_header, x => x.msg_id);
      if (status === 'idle' && __guard__(msg_id, x1 => x1.startsWith('execute'))) {
        this._callWatchCallbacks();
      }
    }

    const { msg_id } = message.parent_header;
    let callback;
    if (msg_id != null) {
      callback = this.executionCallbacks[msg_id];
    }

    if (callback == null) {
      return;
    }

    const result = this._parseIOMessage(message);

    if (result != null) {
      callback(result);
    }
  }
  /* eslint-enable camelcase*/


  _isValidMessage(message) {
    if (message == null) {
      console.log('Invalid message: null');
      return false;
    }

    if (message.content == null) {
      console.log('Invalid message: Missing content');
      return false;
    }

    if (message.content.execution_state === 'starting') {
      // Kernels send a starting status message with an empty parent_header
      console.log('Dropped starting status IO message');
      return false;
    }

    if (message.parent_header == null) {
      console.log('Invalid message: Missing parent_header');
      return false;
    }

    if (message.parent_header.msg_id == null) {
      console.log('Invalid message: Missing parent_header.msg_id');
      return false;
    }

    if (message.parent_header.msg_type == null) {
      console.log('Invalid message: Missing parent_header.msg_type');
      return false;
    }

    if (message.header == null) {
      console.log('Invalid message: Missing header');
      return false;
    }

    if (message.header.msg_id == null) {
      console.log('Invalid message: Missing header.msg_id');
      return false;
    }

    if (message.header.msg_type == null) {
      console.log('Invalid message: Missing header.msg_type');
      return false;
    }

    return true;
  }


  destroy() {
    console.log('ZMQKernel: destroy:', this);

    this.shutdown();

    if (this.kernelProcess != null) {
      this._kill();
      fs.unlink(this.connectionFile);
    }

    this.shellSocket.close();
    this.controlSocket.close();
    this.ioSocket.close();
    this.stdinSocket.close();

    super.destroy(...arguments);
  }


  _getUsername() {
    return process.env.LOGNAME ||
      process.env.USER ||
      process.env.LNAME ||
      process.env.USERNAME;
  }

  _createMessage(msgType, msgId = uuid.v4()) {
    const message = {
      header: {
        username: this._getUsername(),
        session: '00000000-0000-0000-0000-000000000000',
        msg_type: msgType,
        msg_id: msgId,
        date: new Date(),
        version: '5.0',
      },
      metadata: {},
      parent_header: {},
      content: {},
    };

    return message;
  }
}
