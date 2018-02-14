/* @flow */

import { Emitter } from "atom";
import { observable, action, computed } from "mobx";
import { isEqual } from "lodash";

import {
  log,
  focus,
  msgSpecToNotebookFormat,
  msgSpecV4toV5,
  INSPECTOR_URI
} from "./utils";
import store from "./store";

import WatchesStore from "./store/watches";
import OutputStore from "./store/output";
import HydrogenKernel from "./plugin-api/hydrogen-kernel";
import type {
  HydrogenKernelMiddlewareThunk,
  HydrogenKernelMiddleware
} from "./plugin-api/hydrogen-types";
import InputView from "./input-view";
import KernelTransport from "./kernel-transport";
import type { ResultsCallback } from "./kernel-transport";

// Adapts middleware objects provided by plugins to an internal interface. In
// particular, this implements fallthrough logic for when a plugin defines some
// methods (e.g. execute) but doesn't implement others (e.g. interrupt). Note
// that HydrogenKernelMiddleware objects are mutable: they may lose/gain methods
// at any time, including in the middle of processing a request.
// TODO(nikita): insert checks between plugins that ensure that messages being
// passed around via results callbacks comply with the Jupyter messaging spec.
class MiddlewareAdapter implements HydrogenKernelMiddlewareThunk {
  _middleware: HydrogenKernelMiddleware;
  _next: MiddlewareAdapter | KernelTransport;
  constructor(
    middleware: HydrogenKernelMiddleware,
    next: MiddlewareAdapter | KernelTransport
  ) {
    this._middleware = middleware;
    this._next = next;
  }

  // The return value of this method gets passed to plugins! For now we just
  // return the MiddlewareAdapter object itself, which is why all private
  // functionality is prefixed with _, and why MiddlewareAdapter is marked as
  // implementing HydrogenKernelMiddlewareThunk. Once multiple plugin API
  // versions exist, we may want to generate a HydrogenKernelMiddlewareThunk
  // specialized for a particular plugin API version.
  get _nextAsPluginType(): HydrogenKernelMiddlewareThunk {
    if (this._next instanceof KernelTransport) {
      throw new Error(
        "MiddlewareAdapter: _nextAsPluginType must never be called when _next is KernelTransport"
      );
    }
    return this._next;
  }

  interrupt(): void {
    if (this._middleware.interrupt) {
      this._middleware.interrupt(this._nextAsPluginType);
    } else {
      this._next.interrupt();
    }
  }

  shutdown(): void {
    if (this._middleware.shutdown) {
      this._middleware.shutdown(this._nextAsPluginType);
    } else {
      this._next.shutdown();
    }
  }

  restart(onRestarted: ?Function): void {
    if (this._middleware.restart) {
      this._middleware.restart(this._nextAsPluginType, onRestarted);
    } else {
      this._next.restart(onRestarted);
    }
  }

  execute(
    code: string,
    callWatches: boolean,
    onResults: ResultsCallback
  ): void {
    if (this._middleware.execute) {
      this._middleware.execute(
        this._nextAsPluginType,
        code,
        callWatches,
        onResults
      );
    } else {
      this._next.execute(code, callWatches, onResults);
    }
  }

  complete(code: string, onResults: ResultsCallback): void {
    if (this._middleware.complete) {
      this._middleware.complete(this._nextAsPluginType, code, onResults);
    } else {
      this._next.complete(code, onResults);
    }
  }

  inspect(code: string, cursorPos: number, onResults: ResultsCallback): void {
    if (this._middleware.inspect) {
      this._middleware.inspect(
        this._nextAsPluginType,
        code,
        cursorPos,
        onResults
      );
    } else {
      this._next.inspect(code, cursorPos, onResults);
    }
  }
}

export default class Kernel {
  @observable inspector = { bundle: {} };
  outputStore = new OutputStore();

  watchesStore: WatchesStore;
  emitter = new Emitter();
  pluginWrapper: HydrogenKernel | null = null;
  transport: KernelTransport;

  // Invariant: the `._next` of each entry in this array must point to the next
  // element of the array. The `._next` of the last element must point to
  // `this.transport`.
  middleware: Array<MiddlewareAdapter>;

  constructor(kernel: KernelTransport) {
    this.transport = kernel;

    this.watchesStore = new WatchesStore(this);

    // A MiddlewareAdapter that forwards all requests to `this.transport`.
    // Needed to terminate the middleware chain in a way such that the `next`
    // object passed to the last middleware is not the KernelTransport instance
    // itself (which would be violate isolation of internals from plugins).
    const delegateToTransport = new MiddlewareAdapter({}, this.transport);
    this.middleware = [delegateToTransport];
  }

  get kernelSpec(): Kernelspec {
    return this.transport.kernelSpec;
  }

  get grammar(): atom$Grammar {
    return this.transport.grammar;
  }

  get language(): string {
    return this.transport.language;
  }

  get displayName(): string {
    return this.transport.displayName;
  }

  get firstMiddlewareAdapter(): MiddlewareAdapter {
    return this.middleware[0];
  }

  addMiddleware(middleware: HydrogenKernelMiddleware) {
    this.middleware.unshift(
      new MiddlewareAdapter(middleware, this.middleware[0])
    );
  }

  @computed
  get executionState(): string {
    return this.transport.executionState;
  }

  setExecutionState(state: string) {
    this.transport.setExecutionState(state);
  }

  @action
  async setInspectorResult(bundle: Object, editor: ?atom$TextEditor) {
    if (isEqual(this.inspector.bundle, bundle)) {
      await atom.workspace.toggle(INSPECTOR_URI);
    } else if (bundle.size !== 0) {
      this.inspector.bundle = bundle;
      await atom.workspace.open(INSPECTOR_URI, { searchAllPanes: true });
    }
    focus(editor);
  }

  getPluginWrapper() {
    if (!this.pluginWrapper) {
      this.pluginWrapper = new HydrogenKernel(this);
    }

    return this.pluginWrapper;
  }

  addWatchCallback(watchCallback: Function) {
    this.transport.addWatchCallback(watchCallback);
  }

  interrupt() {
    this.firstMiddlewareAdapter.interrupt();
  }

  shutdown() {
    this.firstMiddlewareAdapter.shutdown();
  }

  restart(onRestarted: ?Function) {
    this.firstMiddlewareAdapter.restart(onRestarted);
  }

  execute(code: string, onResults: Function) {
    this.firstMiddlewareAdapter.execute(
      code,
      true,
      this._wrapExecutionResultsCallback(onResults)
    );
  }

  executeWatch(code: string, onResults: Function) {
    this.firstMiddlewareAdapter.execute(
      code,
      false,
      this._wrapExecutionResultsCallback(onResults)
    );
  }

  /*
   * Takes a callback that accepts execution results in a hydrogen-internal
   * format and wraps it to accept Jupyter message/channel pairs instead.
   * Kernels and plugins all operate on types specified by the Jupyter messaging
   * protocol in order to maximize compatibility, but hydrogen internally uses
   * its own types.
   */
  _wrapExecutionResultsCallback(onResults: Function) {
    return (message: Message, channel: string) => {
      if (!this.transport.isValidMessage(message)) {
        return;
      }

      if (channel === "shell") {
        const { status } = message.content;
        if (status === "error" || status === "ok") {
          onResults({
            data: status,
            stream: "status"
          });
        } else {
          console.warn(
            "Kernel: ignoring unexpected value for message.content.status"
          );
        }
      } else if (channel === "iopub") {
        if (message.header.msg_type === "execute_input") {
          onResults({
            data: message.content.execution_count,
            stream: "execution_count"
          });
        }

        // TODO(nikita): Consider converting to V5 elsewhere, so that plugins
        // never have to deal with messages in the V4 format
        const result = msgSpecToNotebookFormat(msgSpecV4toV5(message));
        onResults(result);
      } else if (channel === "stdin") {
        if (message.header.msg_type !== "input_request") {
          return;
        }

        const { prompt } = message.content;

        // TODO(nikita): perhaps it would make sense to install middleware for
        // sending input replies
        const inputView = new InputView({ prompt }, (input: string) =>
          this.transport.inputReply(input)
        );

        inputView.attach();
      }
    };
  }

  complete(code: string, onResults: Function) {
    this.firstMiddlewareAdapter.complete(
      code,
      (message: Message, channel: string) => {
        if (channel !== "shell") {
          log("Invalid reply: wrong channel");
          return;
        }
        if (!this.transport.isValidMessage(message)) {
          return;
        }
        onResults(message.content);
      }
    );
  }

  inspect(code: string, cursorPos: number, onResults: Function) {
    this.firstMiddlewareAdapter.inspect(
      code,
      cursorPos,
      (message: Message, channel: string) => {
        if (channel !== "shell") {
          log("Invalid reply: wrong channel");
          return;
        }
        if (!this.transport.isValidMessage(message)) {
          return;
        }
        onResults({
          data: message.content.data,
          found: message.content.found
        });
      }
    );
  }

  destroy() {
    log("Kernel: Destroying");
    store.deleteKernel(this);
    this.transport.destroy();
    if (this.pluginWrapper) {
      this.pluginWrapper.destroyed = true;
    }
    this.emitter.emit("did-destroy");
    this.emitter.dispose();
  }
}
