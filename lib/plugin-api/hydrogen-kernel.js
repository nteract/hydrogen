/* @flow */

import type Kernel from "./../kernel";
import type ZMQKernel from "./../zmq-kernel";

// We define all our own types here to isolate the plugin API from internal
// implementation details of hydrogen.
type HydrogenResultsCallback = (
  message: any,
  channel: "shell" | "iopub" | "stdin"
) => void;

interface HydrogenKernelMiddlewareStack {
  interrupt: () => void;
  shutdown: () => void;
  restart: (onRestarted: ?Function) => void;
  execute: (
    code: string,
    callWatches: boolean,
    onResults: HydrogenResultsCallback
  ) => void;
  complete: (code: string, onResults: HydrogenResultsCallback) => void;
  inspect: (
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}

interface HydrogenKernelMiddleware {
  interrupt?: (next: HydrogenKernelMiddlewareStack) => void;
  shutdown?: (next: HydrogenKernelMiddlewareStack) => void;
  restart?: (
    next: HydrogenKernelMiddlewareStack,
    onRestarted: ?Function
  ) => void;
  execute?: (
    next: HydrogenKernelMiddlewareStack,
    code: string,
    callWatches: boolean,
    onResults: HydrogenResultsCallback
  ) => void;
  complete?: (
    next: HydrogenKernelMiddlewareStack,
    code: string,
    onResults: HydrogenResultsCallback
  ) => void;
  inspect?: (
    next: HydrogenKernelMiddlewareStack,
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}

/*
 * The `HydrogenKernel` class wraps Hydrogen's internal representation of kernels
 * and exposes a small set of methods that should be usable by plugins.
 * @class HydrogenKernel
 */

export default class HydrogenKernel {
  _kernel: Kernel | ZMQKernel;
  destroyed: boolean;

  constructor(_kernel: Kernel) {
    this._kernel = _kernel;
    this.destroyed = false;
  }

  _assertNotDestroyed() {
    // Internal: plugins might hold references to long-destroyed kernels, so
    // all API calls should guard against this case
    if (this.destroyed) {
      throw new Error(
        "HydrogenKernel: operation not allowed because the kernel has been destroyed"
      );
    }
  }

  /*
   * The language of the kernel, as specified in its kernelspec
   */
  get language(): string {
    this._assertNotDestroyed();
    return this._kernel.language;
  }

  /*
   * The display name of the kernel, as specified in its kernelspec
   */
  get displayName(): string {
    this._assertNotDestroyed();
    return this._kernel.displayName;
  }

  /*
   * Add a kernel middleware, which allows intercepting and issuing commands to
   * the kernel.
   */
  addMiddleware(middleware: HydrogenKernelMiddleware) {
    this._assertNotDestroyed();

    const prevMiddlewareStack = this._kernel.middlewareStack;
    const middlewareStack = Object.assign({}, prevMiddlewareStack);

    // The middleware object we get as an argument may later be mutated to
    // remove/replace some of its methods. The current plugin API is designed to
    // ignore any such changes, which requires making a copy here. We use local
    // variables instead of copying the entire object to make flow happy.
    if (middleware.interrupt) {
      const interrupt = middleware.interrupt;
      middlewareStack.interrupt = (...args) =>
        interrupt(prevMiddlewareStack, ...args);
    }
    if (middleware.shutdown) {
      const shutdown = middleware.shutdown;
      middlewareStack.shutdown = (...args) =>
        shutdown(prevMiddlewareStack, ...args);
    }
    if (middleware.restart) {
      const restart = middleware.restart;
      middlewareStack.restart = (...args) =>
        restart(prevMiddlewareStack, ...args);
    }
    if (middleware.execute) {
      const execute = middleware.execute;
      middlewareStack.execute = (...args) =>
        execute(prevMiddlewareStack, ...args);
    }
    if (middleware.complete) {
      const complete = middleware.complete;
      middlewareStack.complete = (...args) =>
        complete(prevMiddlewareStack, ...args);
    }
    if (middleware.inspect) {
      const inspect = middleware.inspect;
      middlewareStack.inspect = (...args) =>
        inspect(prevMiddlewareStack, ...args);
    }

    this._kernel.setMiddlewareStack(middlewareStack);
  }

  /*
   * Calls your callback when the kernel has been destroyed.
   * @param {Function} Callback
   */
  onDidDestroy(callback: Function): void {
    this._assertNotDestroyed();
    this._kernel.emitter.on("did-destroy", callback);
  }

  /*
   * Get the [connection file](http://jupyter-notebook.readthedocs.io/en/latest/examples/Notebook/Connecting%20with%20the%20Qt%20Console.html) of the kernel.
   * @return {String} Path to connection file.
   */
  getConnectionFile() {
    this._assertNotDestroyed();

    const connectionFile = this._kernel.connectionFile
      ? this._kernel.connectionFile
      : null;
    if (!connectionFile) {
      throw new Error(
        `No connection file for ${
          this._kernel.kernelSpec.display_name
        } kernel found`
      );
    }

    return connectionFile;
  }
}
