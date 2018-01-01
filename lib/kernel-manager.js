/* @flow */

import _ from "lodash";
import * as kernelspecs from "kernelspecs";
import { launchSpec } from "spawnteract";
import { shell } from "electron";

import ZMQKernel from "./zmq-kernel";

import KernelPicker from "./kernel-picker";
import store from "./store";
import { getEditorDirectory, kernelSpecProvidesGrammar, log } from "./utils";

import type { Connection } from "./zmq-kernel";

export const ks = kernelspecs;

export class KernelManager {
  kernelSpecs: ?Array<Kernelspec> = null;
  kernelPicker: ?KernelPicker;

  startKernelFor(
    grammar: atom$Grammar,
    editor: atom$TextEditor,
    filePath: string,
    onStarted: (kernel: ZMQKernel) => void
  ) {
    this.getKernelSpecForGrammar(grammar).then(kernelSpec => {
      if (!kernelSpec) {
        const message = `No kernel for grammar \`${grammar.name}\` found`;
        const pythonDescription =
          grammar && /python/g.test(grammar.scopeName)
            ? "\n\nTo detect your current Python install you will need to run:<pre>python -m pip install ipykernel\npython -m ipykernel install --user</pre>"
            : "";
        const description = `Check that the language for this file is set in Atom and that you have a Jupyter kernel installed for it.${
          pythonDescription
        }`;
        atom.notifications.addError(message, {
          description,
          dismissable: pythonDescription !== ""
        });
        return;
      }

      this.startKernel(kernelSpec, grammar, editor, filePath, onStarted);
    });
  }

  startKernel(
    kernelSpec: Kernelspec,
    grammar: atom$Grammar,
    editor: atom$TextEditor,
    filePath: string,
    onStarted: ?(kernel: ZMQKernel) => void
  ) {
    const displayName = kernelSpec.display_name;

    // if kernel startup already in progress don't start additional kernel
    if (store.startingKernels.get(displayName)) return;

    store.startKernel(displayName);

    let currentPath = getEditorDirectory(editor);
    let projectPath;

    log("KernelManager: startKernel:", displayName);

    switch (atom.config.get("Hydrogen.startDir")) {
      case "firstProjectDir":
        projectPath = atom.project.getPaths()[0];
        break;
      case "projectDirOfFile":
        projectPath = atom.project.relativizePath(currentPath)[0];
        break;
    }

    const kernelStartDir = projectPath != null ? projectPath : currentPath;
    const options = {
      cwd: kernelStartDir,
      stdio: ["ignore", "pipe", "pipe"]
    };

    const kernel = new ZMQKernel(kernelSpec, grammar, options, () => {
      store.newKernel(kernel, filePath, editor, grammar);
      if (onStarted) onStarted(kernel);
    });
  }

  async update() {
    const kernelSpecs = await ks.findAll();
    this.kernelSpecs = _.map(kernelSpecs, "spec");
    return this.kernelSpecs;
  }

  async getAllKernelSpecs(grammar: ?atom$Grammar) {
    if (this.kernelSpecs) return this.kernelSpecs;
    return this.updateKernelSpecs(grammar);
  }

  async getAllKernelSpecsForGrammar(grammar: ?atom$Grammar) {
    if (!grammar) return [];

    const kernelSpecs = await this.getAllKernelSpecs(grammar);
    return kernelSpecs.filter(spec => kernelSpecProvidesGrammar(spec, grammar));
  }

  async getKernelSpecForGrammar(grammar: atom$Grammar) {
    const kernelSpecs = await this.getAllKernelSpecsForGrammar(grammar);
    if (kernelSpecs.length <= 1) {
      return kernelSpecs[0];
    }

    if (this.kernelPicker) {
      this.kernelPicker.kernelSpecs = kernelSpecs;
    } else {
      this.kernelPicker = new KernelPicker(kernelSpecs);
    }

    return new Promise(resolve => {
      if (!this.kernelPicker) return resolve(null);
      this.kernelPicker.onConfirmed = kernelSpec => resolve(kernelSpec);
      this.kernelPicker.toggle();
    });
  }

  async updateKernelSpecs(grammar: ?atom$Grammar) {
    const kernelSpecs = await this.update();

    if (kernelSpecs.length === 0) {
      const message = "No Kernels Installed";

      const options = {
        description:
          "No kernels are installed on your system so you will not be able to execute code in any language.",
        dismissable: true,
        buttons: [
          {
            text: "Install Instructions",
            onDidClick: () =>
              shell.openExternal(
                "https://nteract.gitbooks.io/hydrogen/docs/Installation.html"
              )
          },
          {
            text: "Popular Kernels",
            onDidClick: () => shell.openExternal("https://nteract.io/kernels")
          },
          {
            text: "All Kernels",
            onDidClick: () =>
              shell.openExternal(
                "https://github.com/jupyter/jupyter/wiki/Jupyter-kernels"
              )
          }
        ]
      };
      atom.notifications.addError(message, options);
    } else {
      const message = "Hydrogen Kernels updated:";
      const options = {
        detail: _.map(kernelSpecs, "display_name").join("\n")
      };
      atom.notifications.addInfo(message, options);
    }
    return kernelSpecs;
  }
}

export default new KernelManager();
