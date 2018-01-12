/* @flow */

import Kernel from "./kernel";
import type { ResultsCallback } from "./kernel";
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

  rawInterrupt() {
    this.session.kernel.interrupt();
  }

  rawShutdown() {
    this.session.kernel.shutdown();
  }

  rawRestart(onRestarted: ?Function) {
    const future = this.session.kernel.restart();
    future.then(() => {
      if (onRestarted) onRestarted(this.session.kernel);
    });
  }

  rawExecute(code: string, callWatches: boolean, onResults: ResultsCallback) {
    const future = this.session.kernel.requestExecute({ code });

    future.onIOPub = (message: Message) => {
      if (
        callWatches &&
        message.header.msg_type === "status" &&
        message.content.execution_state === "idle"
      ) {
        this._callWatchCallbacks();
      }

      log("WSKernel: rawExecute:", message);
      onResults(message, "iopub");
    };

    future.onReply = (message: Message) => onResults(message, "shell");
    future.onStdin = (message: Message) => onResults(message, "stdin");
  }

  rawComplete(code: string, onResults: ResultsCallback) {
    this.session.kernel
      .requestComplete({
        code,
        cursor_pos: code.length
      })
      .then((message: Message) => onResults(message, "shell"));
  }

  rawInspect(code: string, cursorPos: number, onResults: ResultsCallback) {
    this.session.kernel
      .requestInspect({
        code,
        cursor_pos: cursorPos,
        detail_level: 0
      })
      .then((message: Message) => onResults(message, "shell"));
  }

  rawInputReply(input: string) {
    this.session.kernel.sendInputReply({ value: input });
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
