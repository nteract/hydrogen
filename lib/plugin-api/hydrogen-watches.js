"use babel";

/*
 * The `HydrogenKernel` class wraps Hydrogen's internal representation of kernels
 * and exposes a small set of methods that should be usable by plugins.
 * @class HydrogenKernel
 */

export default class HydrogenWatches {
  constructor(_watchSidebar) {
    this._watchSidebar = _watchSidebar;
  }

  /*
   * Calls your callback when a watch has been added
   * @param {Function} Callback
   */
  onDidAddWatch(callback) {
    this._watchSidebar.emitter.on("did-add-watch", callback);
  }

  /*
   * Get the [connection file](http://jupyter-notebook.readthedocs.io/en/latest/examples/Notebook/Connecting%20with%20the%20Qt%20Console.html) of the kernel.
   * @return {String} Path to connection file.
   */
  getConnectionFile() {
    const { connectionFile } = this._kernel;
    if (!connectionFile) {
      throw new Error(
        `No connection file for ${this._kernel.kernelSpec.display_name} kernel found`
      );
    }

    return connectionFile;
  }
}
