/* @flow */

import type Kernel from "./../kernel";
import type ZMQKernel from "./../zmq-kernel";
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
    return this._kernel.language;
  }

  /*
   * The display name of the kernel, as specified in its kernelspec
   */
  get displayName(): string {
    return this._kernel.displayName;
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
   * Calls your callback when the kernel is about to execute code.
   * @param {Function} Callback. Receives a single event object with the following keys:
   *   * code {string}: code to be executed
   *   * callWatches {boolean}: if true, this execution is user-initiated and will
   *       trigger watches.
   *   * onResults {?Function}: Note that the signature of this function should
   *       not be considered a part of the public plugin API and is subject to
   *       change without notice. It is provided only for passing to execute()
   *   * cancel {Function}: call this to cancel execution of the given code.
   */
  onWillExecute(callback: Function): void {
    this._assertNotDestroyed();
    this._kernel.emitter.on("will-execute", callback);
  }

  /*
   * Executes code in the kernel
   * @param {string} code. Code to be executed
   * @param {boolean} callWatches. If true, this execution is treated as a
   *   user-initiated event and will trigger watches.
   * @param {?Function} onResults. Note that the signature of this function should
   *   not be considered a part of the public plugin API and is subject to change
   *   without notice. You can, however, pass in functions received from onWillExecute
   */
  execute(code: string, callWatches: boolean, onResults: ?Function): void {
    this._assertNotDestroyed();
    this._kernel.executeMaybeWatch(code, callWatches, onResults);
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
        `No connection file for ${this._kernel.kernelSpec
          .display_name} kernel found`
      );
    }

    return connectionFile;
  }
}
