/* @flow */

import store from "./../store";
import transformManager from "./../components/transforms";
import type Kernel from "./../kernel";
import type ZMQKernel from "./../zmq-kernel.js";
import { getCurrentCell } from "./../code-manager";
/**
 * @version 1.3.0
 *
 *
 * The Plugin API allows you to make Hydrogen awesome.
 * You will be able to interact with this class in your Hydrogen Plugin using
 * Atom's [Service API](http://blog.atom.io/2015/03/25/new-services-API.html).
 *
 * Take a look at our [Example Plugin](https://github.com/lgeiger/hydrogen-example-plugin)
 * and the [Atom Flight Manual](http://flight-manual.atom.io/hacking-atom/) for
 * learning how to interact with Hydrogen in your own plugin.
 *
 * @class HydrogenProvider
 */
export default class HydrogenProvider {
  _hydrogen: any;

  constructor(_hydrogen: any) {
    this._hydrogen = _hydrogen;
  }

  /**
   * Calls your callback when the kernel has changed.
   * @param {Function(HydrogenKernel|void)} callback
   */
  onDidChangeKernel(callback: Function) {
    this._hydrogen.emitter.on("did-change-kernel", (kernel: ?Kernel) => {
      if (kernel) {
        return callback(kernel.getPluginWrapper());
      }
      return callback(null);
    });
  }

  /**
   * Get the `HydrogenKernel` of the currently active text editor.
   * @return {HydrogenKernel} Active Kernel
   */
  getActiveKernel() {
    if (!store.kernel) {
      const grammar = store.editor ? store.editor.getGrammar().name : "";
      throw new Error(`No running kernel for grammar \`${grammar}\` found`);
    }

    return store.kernel.getPluginWrapper();
  }

  /**
   * Get the `atom$Range` that will run if `hydrogen:run-cell` is called.
   * `null` is returned if no active text editor.
   * @return {atom$Range} Current Cell Range
   */
  getCellRange(editor: ?atom$TextEditor) {
    if (!store.editor) return null;
    return getCurrentCell(store.editor);
  }

  /**
   * Registers a new transform for `display_data` and `execute_result` outputs.
   * If the provided key already exists, no change will be made.
   * `void` is returned if the registry fails.
   * `React$Element<any>` is returned else-wise.
   * @param {React$Element<any>} transform
   * @param {string} key
   * @return {React$Element<any>|void} Transform For Key
   */
  registerTransform(transform: React$Element<any>, key: string) {
    return transformManager.addTransform(transform, key);
  }

  /**
   * Unregisters a transform for `display_data` and `execute_result` outputs.
   * `false` is returned if the key does not exist.
   * `true` is returned else-wise.
   * @param {string} key
   * @return {boolean}
   */
  unregisterTransform(key: string) {
    return transformManager.deleteTransform(key);
  }

  /*
   *--------
   */
}
