/* @flow */

import type Kernel from "./../kernel";
import type { HydrogenKernelMiddleware } from "./hydrogen-types";

/*
 * The `HydrogenKernel` class wraps Hydrogen's internal representation of kernels
 * and exposes a small set of methods that should be usable by plugins.
 * @class HydrogenKernel
 */

export default class HydrogenKernel {
  _kernel: Kernel;
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
   *
   * If the methods of a `middleware` object are added/modified/deleted after
   * `addMiddleware` has been called, the changes will take effect immediately.
   *
   * @param {HydrogenKernelMiddleware} middleware
   */
  addMiddleware(middleware: HydrogenKernelMiddleware) {
    this._assertNotDestroyed();
    this._kernel.addMiddleware(middleware);
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
    // $FlowFixMe
    const connectionFile = this._kernel.transport.connectionFile
      ? this._kernel.transport.connectionFile
      : null;
    if (!connectionFile) {
      throw new Error(
        `No connection file for ${this._kernel.kernelSpec.display_name} kernel found`
      );
    }

    return connectionFile;
  }
}
