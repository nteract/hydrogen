/* @flow */

import KernelTransport from "./kernel-transport";
import type { ResultsCallback } from "./kernel-transport";
import InputView from "./input-view";
import { log, js_idx_to_char_idx } from "./utils";

import type { Session } from "@jupyterlab/services";

export default class WSKernel extends KernelTransport {
  session: Session;

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
    this.session.kernel.interrupt();
  }

  shutdown() {
    this.session.kernel.shutdown();
  }

  restart(onRestarted: ?Function) {
    const future = this.session.kernel.restart();
    future.then(() => {
      if (onRestarted) onRestarted();
    });
  }

  execute(code: string, onResults: ResultsCallback) {
    const future = this.session.kernel.requestExecute({ code });

    future.onIOPub = (message: Message) => {
      log("WSKernel: execute:", message);
      onResults(message, "iopub");
    };

    future.onReply = (message: Message) => onResults(message, "shell");
    future.onStdin = (message: Message) => onResults(message, "stdin");
  }

  complete(code: string, onResults: ResultsCallback) {
    this.session.kernel
      .requestComplete({
        code,
        cursor_pos: js_idx_to_char_idx(code.length, code)
      })
      .then((message: Message) => onResults(message, "shell"));
  }

  inspect(code: string, cursorPos: number, onResults: ResultsCallback) {
    this.session.kernel
      .requestInspect({
        code,
        cursor_pos: cursorPos,
        detail_level: 0
      })
      .then((message: Message) => onResults(message, "shell"));
  }

  inputReply(input: string) {
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
