'use babel';

import store from './../store';
import { grammarToLanguage } from './../utils';
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
  constructor(_hydrogen) {
    this._hydrogen = _hydrogen;
    this._happy = true;
  }

  /*
   * Calls your callback when the kernel has changed.
   * @param {Function} Callback
   */
  onDidChangeKernel(callback) {
    this._hydrogen.emitter.on('did-change-kernel', (kernel) => {
      if (kernel) {
        return callback(kernel.getPluginWrapper());
      }
      return callback(null);
    });
  }

  /*
   * Get the `HydrogenKernel` of the currently active text editor.
   * @return {Class} `HydrogenKernel`
   */
  getActiveKernel() {
    if (!store.kernel) {
      const grammar = store.editor.getGrammar();
      const language = grammarToLanguage(grammar);
      throw new Error(`No running kernel for language \`${language}\` found`);
    }

    return store.kernel.getPluginWrapper();
  }
}
