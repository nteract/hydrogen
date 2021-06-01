import { TextEditor, Range, Emitter } from "atom";
import store from "../store";
import type Kernel from "../kernel";
import { getCurrentCell } from "../code-manager";
/**
 * @version 1.0.0 The Plugin API allows you to make Hydrogen awesome. You will
 *   be able to interact with this class in your Hydrogen Plugin using Atom's
 *   [Service API](http://blog.atom.io/2015/03/25/new-services-API.html).
 *
 *   Take a look at our [Example
 *   Plugin](https://github.com/lgeiger/hydrogen-example-plugin) and the [Atom
 *   Flight Manual](http://flight-manual.atom.io/hacking-atom/) for learning how
 *   to interact with Hydrogen in your own plugin.
 * @class HydrogenProvider
 */

export default class HydrogenProvider {
  private _emitter: Emitter<{}, { "did-change-kernel": Kernel }> | undefined;
  constructor(emitter: Emitter<{}, { "did-change-kernel": Kernel }>) {
    this._emitter = emitter;
  }

  /*
   * Calls your callback when the kernel has changed.
   * @param {Function} Callback
   */
  onDidChangeKernel(callback: (...args: Array<any>) => any) {
    this._emitter.on(
      "did-change-kernel",
      (kernel: Kernel | null | undefined) => {
        if (kernel) {
          return callback(kernel.getPluginWrapper());
        }

        return callback(null);
      }
    );
  }

  /*
   * Get the `HydrogenKernel` of the currently active text editor.
   * @return {Class} `HydrogenKernel`
   */
  getActiveKernel() {
    if (!store.kernel) {
      const grammar = store.editor ? store.editor.getGrammar().name : "";
      throw new Error(`No running kernel for grammar \`${grammar}\` found`);
    }

    return store.kernel.getPluginWrapper();
  }

  /*
   * Get the `Range` that will run if `hydrogen:run-cell` is called.
   * `null` is returned if no active text editor.
   * @return {Class} `Range`
   */
  getCellRange(editor: TextEditor | null | undefined) {
    if (!store.editor) {
      return null;
    }
    return getCurrentCell(store.editor);
  }
  /*
   *--------
   */
}
