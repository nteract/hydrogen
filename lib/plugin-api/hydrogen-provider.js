/* @flow */

import { reaction } from "mobx";

import store from "./../store";
import type Kernel from "./../kernel";
import type ZMQKernel from "./../zmq-kernel.js";
/**
 * @version 1.0.0
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

  /*
   * Calls your callback when the kernel has changed.
   * @param {Function} Callback
   */
  onDidChangeKernel(callback: Function) {
    reaction(
      () => store.kernel,
      kernel => {
        if (kernel) {
          return callback(kernel.getPluginWrapper());
        }
        return callback(null);
      }
    );
  }

  /*
   * Calls your callback whenever a kernel has been newly created or connected to.
   * @param {Function} Callback
   */
  onDidCreateKernel(callback: Function) {
    reaction(
      () => store.newKernelEvent,
      () => {
        const kernel = store.kernel;
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
}
