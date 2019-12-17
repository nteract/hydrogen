/* @flow */

import fs from "fs";
import { createMainChannel } from "enchannel-zmq-backend";
import v4 from "uuid/v4";
import { launchSpec, launchSpecFromConnectionInfo } from "spawnteract";

import Config from "./config";
import KernelTransport from "./kernel-transport";
import type { ResultsCallback } from "./kernel-transport";
import { log, js_idx_to_char_idx } from "./utils";

export type Connection = {
  control_port: number,
  hb_port: number,
  iopub_port: number,
  ip: string,
  key: string,
  shell_port: number,
  signature_scheme: string,
  stdin_port: number,
  transport: string,
  version: number
};

const nullChannel = {
  next: ()=>{},
  complete: ()=>{},
  subscribe: ()=>{},
};


export default class ZMQKernel extends KernelTransport {
  executionCallbacks: Object = {};
  connection: Connection;
  connectionFile: string;
  kernelProcess: child_process$ChildProcess;
  options: Object;
  channel: {
    next: Function,
    complete: Function,
    subscribe: Function
  } = nullChannel;
  channelObserver: {
    unsubscribe: Function
  } | void;

  constructor(
    kernelSpec: Kernelspec,
    grammar: atom$Grammar,
    options: Object,
    onStarted: ?Function
  ) {
    super(kernelSpec, grammar);
    this.options = options || {};
    // Otherwise spawnteract deletes the file and hydrogen's restart kernel fails
    options.cleanupConnectionFile = false;

    launchSpec(kernelSpec, options).then(
      ({ config, connectionFile, spawn }) => {
        this.connection = config;
        this.connectionFile = connectionFile;
        this.kernelProcess = spawn;

        this.monitorNotifications(spawn);

        this.connect(() => {
          this._executeStartupCode();

          if (onStarted) onStarted(this);
        });
      }
    );
  }

  connect(done: ?Function) {
    createMainChannel(this.connection).then(c => {
      this.channel = c;
      this.channelObserver = c.subscribe(msg => {
        switch(msg.channel) {
          case 'stdin':
            this.onStdinMessage.bind(this)(msg);
            break;
          case 'iopub':
            this.onIOMessage.bind(this)(msg);
            break;
          case 'shell':
            this.onShellMessage.bind(this)(msg);
            break;
        }
      });
    }).finally(() => {
      this.setExecutionState("idle");
      if (done) done();
    });
  }

  monitorNotifications(childProcess: child_process$ChildProcess) {
    childProcess.stdout.on("data", (data: string | Buffer) => {
      data = data.toString();

      if (atom.config.get("Hydrogen.kernelNotifications")) {
        atom.notifications.addInfo(this.kernelSpec.display_name, {
          description: data,
          dismissable: true
        });
      } else {
        log("ZMQKernel: stdout:", data);
      }
    });

    childProcess.stderr.on("data", (data: string | Buffer) => {
      atom.notifications.addError(this.kernelSpec.display_name, {
        description: data.toString(),
        dismissable: true
      });
    });
  }

  interrupt() {
    if (process.platform === "win32") {
      atom.notifications.addWarning("Cannot interrupt this kernel", {
        detail: "Kernel interruption is currently not supported in Windows."
      });
    } else {
      log("ZMQKernel: sending SIGINT");
      this.kernelProcess.kill("SIGINT");
    }
  }

  _kill() {
    log("ZMQKernel: sending SIGKILL");
    this.kernelProcess.kill("SIGKILL");
  }

  _executeStartupCode() {
    const displayName = this.kernelSpec.display_name;
    let startupCode = Config.getJson("startupCode")[displayName];
    if (startupCode) {
      log("KernelManager: Executing startup code:", startupCode);
      startupCode += "\n";
      this.execute(startupCode, (message, channel) => {});
    }
  }

  shutdown() {
    this._socketShutdown();
  }

  restart(onRestarted: ?Function) {
    this._socketRestart(onRestarted);
  }

  _socketShutdown(restart: ?boolean = false) {
    const requestId = `shutdown_${v4()}`;
    const message = this._createMessage("shell", "shutdown_request", requestId);
    message.content = { restart };

    this.channel.next(message);
    if (this.channelObserver) this.channelObserver.unsubscribe();
    this.channelObserver = undefined;
    this.channel.complete();
    this.channel = nullChannel;
  }

  _socketRestart(onRestarted: ?Function) {
    if (this.executionState === "restarting") {
      return;
    }
    this.setExecutionState("restarting");
    this._socketShutdown(true);
    this._kill();
    const { spawn } = launchSpecFromConnectionInfo(
      this.kernelSpec,
      this.connection,
      this.connectionFile,
      this.options
    );
    this.kernelProcess = spawn;
    this.connect(() => {
      this._executeStartupCode();
      if (onRestarted) onRestarted();
    });
  }

  // onResults is a callback that may be called multiple times
  // as results come in from the kernel
  execute(code: string, onResults: ResultsCallback) {
    log("ZMQKernel.execute:", code);
    const requestId = `execute_${v4()}`;

    const message = this._createMessage("shell", "execute_request", requestId);

    message.content = {
      code,
      silent: false,
      store_history: true,
      user_expressions: {},
      allow_stdin: true
    };

    this.executionCallbacks[requestId] = onResults;

    this.channel.next(message);
  }

  complete(code: string, onResults: ResultsCallback) {
    log("ZMQKernel.complete:", code);

    const requestId = `complete_${v4()}`;

    const message = this._createMessage("shell", "complete_request", requestId);

    message.content = {
      code,
      text: code,
      line: code,
      cursor_pos: js_idx_to_char_idx(code.length, code)
    };

    this.executionCallbacks[requestId] = onResults;

    this.channel.next(message);
  }

  inspect(code: string, cursorPos: number, onResults: ResultsCallback) {
    log("ZMQKernel.inspect:", code, cursorPos);

    const requestId = `inspect_${v4()}`;

    const message = this._createMessage("shell", "inspect_request", requestId);

    message.content = {
      code,
      cursor_pos: cursorPos,
      detail_level: 0
    };

    this.executionCallbacks[requestId] = onResults;

    this.channel.next(message);
  }

  inputReply(input: string) {
    const requestId = `input_reply_${v4()}`;

    const message = this._createMessage("stdin", "input_reply", requestId);

    message.content = { value: input };

    this.channel.next(message);
  }

  onShellMessage(message: Message) {
    log("shell message:", message);

    if (!this._isValidMessage(message)) {
      return;
    }

    const { msg_id } = message.parent_header;
    let callback;
    if (msg_id) {
      callback = this.executionCallbacks[msg_id];
    }

    if (callback) {
      callback(message, "shell");
    }
  }

  onStdinMessage(message: Message) {
    log("stdin message:", message);

    if (!this._isValidMessage(message)) {
      return;
    }

    // input_request messages are attributable to particular execution requests,
    // and should pass through the middleware stack to allow plugins to see them
    const { msg_id } = message.parent_header;
    let callback;
    if (msg_id) {
      callback = this.executionCallbacks[msg_id];
    }

    if (callback) {
      callback(message, "stdin");
    }
  }

  onIOMessage(message: Message) {
    log("IO message:", message);

    if (!this._isValidMessage(message)) {
      return;
    }

    const { msg_type } = message.header;
    if (msg_type === "status") {
      const status = message.content.execution_state;
      this.setExecutionState(status);
    }

    const { msg_id } = message.parent_header;
    let callback;
    if (msg_id) {
      callback = this.executionCallbacks[msg_id];
    }

    if (callback) {
      callback(message, "iopub");
    }
  }

  _isValidMessage(message: Message) {
    if (!message) {
      log("Invalid message: null");
      return false;
    }

    if (!message.content) {
      log("Invalid message: Missing content");
      return false;
    }

    if (message.content.execution_state === "starting") {
      // Kernels send a starting status message with an empty parent_header
      log("Dropped starting status IO message");
      return false;
    }

    if (!message.parent_header) {
      log("Invalid message: Missing parent_header");
      return false;
    }

    if (!message.parent_header.msg_id) {
      log("Invalid message: Missing parent_header.msg_id");
      return false;
    }

    if (!message.parent_header.msg_type) {
      log("Invalid message: Missing parent_header.msg_type");
      return false;
    }

    if (!message.header) {
      log("Invalid message: Missing header");
      return false;
    }

    if (!message.header.msg_id) {
      log("Invalid message: Missing header.msg_id");
      return false;
    }

    if (!message.header.msg_type) {
      log("Invalid message: Missing header.msg_type");
      return false;
    }

    return true;
  }

  destroy() {
    log("ZMQKernel: destroy:", this);

    this.shutdown();

    this._kill();
    fs.unlinkSync(this.connectionFile);

    super.destroy();
  }

  _getUsername() {
    return (
      process.env.LOGNAME ||
      process.env.USER ||
      process.env.LNAME ||
      process.env.USERNAME
    );
  }

  _createMessage(channel: string, msgType: string, msgId: string = v4()) {
    const message = {
      channel,
      header: {
        username: this._getUsername(),
        session: "00000000-0000-0000-0000-000000000000",
        msg_type: msgType,
        msg_id: msgId,
        date: new Date(),
        version: "5.0"
      },
      metadata: {},
      parent_header: {},
      content: {}
    };

    return message;
  }
}
