import child_process from 'child_process';
import path from 'path';

import _ from 'lodash';
import fs from 'fs';
import jmp from 'jmp';
import uuid from 'uuid';
let { zmq } = jmp;

import Kernel from './kernel';
import InputView from './input-view';

export default class ZMQKernel extends Kernel {
  constructor(kernelSpec, grammar, connection, connectionFile, kernelProcess) {
    this.connection = connection;
    this.connectionFile = connectionFile;
    this.kernelProcess = kernelProcess;
    super(kernelSpec, grammar);

    this.executionCallbacks = {};

    this._connect();

    if (this.kernelProcess != null) {
      console.log('ZMQKernel: @kernelProcess:', this.kernelProcess);

      let getKernelNotificationsRegExp = function() {
        try {
          let pattern = atom.config.get('Hydrogen.kernelNotifications');
          let flags = 'im';
          return new RegExp(pattern, flags);
        } catch (err) {
          return null;
        }
      };

      this.kernelProcess.stdout.on('data', data => {
        data = data.toString();

        console.log('ZMQKernel: stdout:', data);

        let regexp = getKernelNotificationsRegExp();
        if (__guard__(regexp, x => x.test(data))) {
          return atom.notifications.addInfo(this.kernelSpec.display_name, { description: data, dismissable: true });
        }
      });

      this.kernelProcess.stderr.on('data', data => {
        data = data.toString();

        console.log('ZMQKernel: stderr:', data);

        let regexp = getKernelNotificationsRegExp();
        if (__guard__(regexp, x => x.test(data))) {
          return atom.notifications.addError(this.kernelSpec.display_name, { description: data, dismissable: true });
        }
      });
    } else {
      console.log('ZMQKernel: connectionFile:', this.connectionFile);
      atom.notifications.addInfo('Using an existing kernel connection');
    }
  }


  _connect() {
    let scheme = this.connection.signature_scheme.slice('hmac-'.length);
    let { key } = this.connection;

    this.shellSocket = new jmp.Socket('dealer', scheme, key);
    this.controlSocket = new jmp.Socket('dealer', scheme, key);
    this.stdinSocket = new jmp.Socket('dealer', scheme, key);
    this.ioSocket = new jmp.Socket('sub', scheme, key);

    let id = uuid.v4();
    this.shellSocket.identity = `dealer${id}`;
    this.controlSocket.identity = `control${id}`;
    this.stdinSocket.identity = `dealer${id}`;
    this.ioSocket.identity = `sub${id}`;

    let address = `${ this.connection.transport }://${ this.connection.ip }:`;
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
      return this.stdinSocket.monitor();
    } catch (err) {
      return console.error('Kernel:', err);
    }
  }


  interrupt() {
    if (this.kernelProcess != null) {
      console.log('ZMQKernel: sending SIGINT');
      return this.kernelProcess.kill('SIGINT');
    } else {
      console.log('ZMQKernel: cannot interrupt an existing kernel');
      return atom.notifications.addWarning('Cannot interrupt this kernel');
    }
  }


  _kill() {
    if (this.kernelProcess != null) {
      console.log('ZMQKernel: sending SIGKILL');
      return this.kernelProcess.kill('SIGKILL');
    } else {
      console.log('ZMQKernel: cannot kill an existing kernel');
      return atom.notifications.addWarning('Cannot kill this kernel');
    }
  }


  shutdown(restart = false) {
    let requestId = `shutdown_${uuid.v4()}`;
    let message = this._createMessage('shutdown_request', requestId);

    message.content = { restart };

    return this.shellSocket.send(new jmp.Message(message));
  }


  // onResults is a callback that may be called multiple times
  // as results come in from the kernel
  _execute(code, requestId, onResults) {
    let message = this._createMessage('execute_request', requestId);

    message.content = {
      code,
      silent: false,
      store_history: true,
      user_expressions: {},
      allow_stdin: true
    };

    this.executionCallbacks[requestId] = onResults;

    return this.shellSocket.send(new jmp.Message(message));
  }


  execute(code, onResults) {
    console.log('Kernel.execute:', code);

    let requestId = `execute_${uuid.v4()}`;
    return this._execute(code, requestId, onResults);
  }


  executeWatch(code, onResults) {
    console.log('Kernel.executeWatch:', code);

    let requestId = `watch_${uuid.v4()}`;
    return this._execute(code, requestId, onResults);
  }


  complete(code, onResults) {
    console.log('Kernel.complete:', code);

    let requestId = `complete_${uuid.v4()}`;

    let message = this._createMessage('complete_request', requestId);

    message.content = {
      code,
      text: code,
      line: code,
      cursor_pos: code.length
    };

    this.executionCallbacks[requestId] = onResults;

    return this.shellSocket.send(new jmp.Message(message));
  }


  inspect(code, cursor_pos, onResults) {
    console.log('Kernel.inspect:', code, cursor_pos);

    let requestId = `inspect_${uuid.v4()}`;

    let message = this._createMessage('inspect_request', requestId);

    message.content = {
      code,
      cursor_pos,
      detail_level: 0
    };

    this.executionCallbacks[requestId] = onResults;

    return this.shellSocket.send(new jmp.Message(message));
  }

  inputReply(input) {
    let requestId = `input_reply_${uuid.v4()}`;

    let message = this._createMessage('input_reply', requestId);

    message.content = { value: input };

    return this.stdinSocket.send(new jmp.Message(message));
  }


  onShellMessage(message) {
    console.log('shell message:', message);

    if (!this._isValidMessage(message)) {
      return;
    }

    let { msg_id } = message.parent_header;
    if (msg_id != null) {
      var callback = this.executionCallbacks[msg_id];
    }

    if (callback == null) {
      return;
    }

    let { status } = message.content;
    if (status === 'error') {
      // Drop 'status: error' shell messages, wait for IO messages instead
      return;
    }

    if (status === 'ok') {
      let { msg_type } = message.header;

      if (msg_type === 'execution_reply') {
        return callback({
          data: 'ok',
          type: 'text',
          stream: 'status'
        });

      } else if (msg_type === 'complete_reply') {
        return callback(message.content);

      } else if (msg_type === 'inspect_reply') {
        return callback({
          data: message.content.data,
          found: message.content.found
        });

      } else {
        return callback({
          data: 'ok',
          type: 'text',
          stream: 'status'
        });
      }
    }
  }


  onStdinMessage(message) {
    console.log('stdin message:', message);

    if (!this._isValidMessage(message)) {
      return;
    }

    let { msg_type } = message.header;

    if (msg_type === 'input_request') {
      let { prompt } = message.content;

      let inputView = new InputView(prompt, input => {
        return this.inputReply(input);
      });

      return inputView.attach();
    }
  }


  onIOMessage(message) {
    console.log('IO message:', message);

    if (!this._isValidMessage(message)) {
      return;
    }

    let { msg_type } = message.header;

    if (msg_type === 'status') {
      let status = message.content.execution_state;
      this.statusView.setStatus(status);

      var msg_id = __guard__(message.parent_header, x => x.msg_id);
      if (status === 'idle' && __guard__(msg_id, x1 => x1.startsWith('execute'))) {
        this._callWatchCallbacks();
      }
    }

    var { msg_id } = message.parent_header;
    if (msg_id != null) {
      var callback = this.executionCallbacks[msg_id];
    }

    if (callback == null) {
      return;
    }

    let result = this._parseIOMessage(message);

    if (result != null) {
      return callback(result);
    }
  }


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

    return super.destroy(...arguments);
  }


  _getUsername() {
    return process.env.LOGNAME ||
      process.env.USER ||
      process.env.LNAME ||
      process.env.USERNAME;
  }


  _createMessage(msg_type, msg_id = uuid.v4()) {
    let message = {
      header: {
        username: this._getUsername(),
        session: '00000000-0000-0000-0000-000000000000',
        msg_type,
        msg_id,
        date: new Date(),
        version: '5.0'
      },
      metadata: {},
      parent_header: {},
      content: {}
    };

    return message;
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
