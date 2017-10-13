/* @flow */

import Kernel from "./kernel";
import InputView from "./input-view";
import { log } from "./utils";

import type { Session } from "@jupyterlab/services";

export default class WSKernel extends Kernel {
  session: Session;
  gatewayName: string;

  constructor(
    gatewayName: string,
    kernelSpec: Kernelspec,
    grammar: atom$Grammar,
    session: Session
  ) {
    super(kernelSpec, grammar);
    this.session = session;
    this.gatewayName = gatewayName;

    this.session.statusChanged.connect(() =>
      this.setExecutionState(this.session.status)
    );
    this.setExecutionState(this.session.status); // Set initial status correctly
  }

  interrupt() {
    return this.session.kernel.interrupt();
  }

  shutdown() {
    return this.session.kernel.shutdown();
  }

  restart(onRestarted: ?Function) {
    const future = this.session.kernel.restart();
    future.then(() => {
      if (onRestarted) onRestarted(this.session.kernel);
    });
  }

  _execute(code: string, callWatches: boolean, onResults: Function) {
    const future = this.session.kernel.requestExecute({ code });

    future.onIOPub = (message: Message) => {
      if (
        callWatches &&
        message.header.msg_type === "status" &&
        message.content.execution_state === "idle"
      ) {
        this._callWatchCallbacks();
      }

      if (onResults) {
        log("WSKernel: _execute:", message);
        const result = this._parseIOMessage(message);
        if (result) onResults(result);
      }
    };

    future.onReply = (message: Message) => {
      const result = {
        data: message.content.status,
        stream: "status"
      };
      if (onResults) onResults(result);
    };

    future.onStdin = (message: Message) => {
      if (message.header.msg_type !== "input_request") {
        return;
      }

      const { prompt } = message.content;

      const inputView = new InputView({ prompt }, (input: string) =>
        this.session.kernel.sendInputReply({ value: input })
      );

      inputView.attach();
    };
  }

  execute(code: string, onResults: Function) {
    this._execute(code, true, onResults);
  }

  executeWatch(code: string, onResults: Function) {
    this._execute(code, false, onResults);
  }

  complete(code: string, onResults: Function) {
    this.session.kernel
      .requestComplete({
        code,
        cursor_pos: code.length
      })
      .then((message: Message) => onResults(message.content));
  }

  inspect(code: string, cursorPos: number, onResults: Function) {
    this.session.kernel
      .requestInspect({
        code,
        cursor_pos: cursorPos,
        detail_level: 0
      })
      .then((message: Message) =>
        onResults({
          data: message.content.data,
          found: message.content.found
        })
      );
  }

  promptRename() {
    const view = new InputView(
      {
        prompt: "Name your current session",
        defaultText: this.session.path,
        allowCancel: true
      },
      (input: string) => this.session.setPath(input)
    );

    view.attach();
  }

  destroy() {
    log("WSKernel: destroying jupyter-js-services Session");
    this.session.dispose();
    super.destroy();
  }
}
