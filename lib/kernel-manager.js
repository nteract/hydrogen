/* @flow */

import _ from "lodash";
import { exec } from "child_process";
import { launchSpec } from "spawnteract";
import fs from "fs";
import path from "path";

import Config from "./config";
import ZMQKernel from "./zmq-kernel";

import KernelPicker from "./kernel-picker";
import store from "./store";
import { getEditorDirectory, log } from "./utils";

import type { Connection } from "./zmq-kernel";

class KernelManager {
  _kernelSpecs: ?Object;
  kernelPicker: ?KernelPicker;
  constructor() {
    this._kernelSpecs = this.getKernelSpecsFromSettings();
  }

  startKernelFor(
    grammar: atom$Grammar,
    editor: atom$TextEditor,
    onStarted: (kernel: ZMQKernel) => void
  ) {
    this.getKernelSpecForGrammar(grammar, kernelSpec => {
      if (!kernelSpec) {
        const message = `No kernel for grammar \`${grammar.name}\` found`;
        const description =
          "Check that the language for this file is set in Atom and that you have a Jupyter kernel installed for it.";
        atom.notifications.addError(message, { description });
        return;
      }

      this.startKernel(kernelSpec, grammar, onStarted);
    });
  }

  startKernel(
    kernelSpec: Kernelspec,
    grammar: atom$Grammar,
    onStarted: ?(kernel: ZMQKernel) => void
  ) {
    const displayName = kernelSpec.display_name;

    // if kernel startup already in progress don't start additional kernel
    if (store.startingKernels.get(displayName)) return;

    store.startKernel(displayName);

    let currentPath = getEditorDirectory(store.editor);
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
      store.newKernel(kernel);
      if (onStarted) onStarted(kernel);
    });
  }

  getAllKernelSpecs(callback: Function) {
    if (_.isEmpty(this._kernelSpecs)) {
      return this.updateKernelSpecs(() =>
        callback(_.map(this._kernelSpecs, "spec"))
      );
    }
    return callback(_.map(this._kernelSpecs, "spec"));
  }

  getAllKernelSpecsForGrammar(grammar: ?atom$Grammar, callback: Function) {
    if (grammar) {
      return this.getAllKernelSpecs(kernelSpecs => {
        const specs = kernelSpecs.filter(spec =>
          this.kernelSpecProvidesGrammar(spec, grammar)
        );

        return callback(specs);
      });
    }
    return callback([]);
  }

  getKernelSpecForGrammar(grammar: atom$Grammar, callback: Function) {
    this.getAllKernelSpecsForGrammar(grammar, kernelSpecs => {
      if (kernelSpecs.length <= 1) {
        callback(kernelSpecs[0]);
        return;
      }

      if (this.kernelPicker) {
        this.kernelPicker.kernelSpecs = kernelSpecs;
      } else {
        this.kernelPicker = new KernelPicker(kernelSpecs);
      }

      this.kernelPicker.onConfirmed = kernelSpec => callback(kernelSpec);
      this.kernelPicker.toggle();
    });
  }

  kernelSpecProvidesLanguage(kernelSpec: Kernelspec, grammarLanguage: string) {
    return kernelSpec.language.toLowerCase() === grammarLanguage.toLowerCase();
  }

  kernelSpecProvidesGrammar(kernelSpec: Kernelspec, grammar: ?atom$Grammar) {
    if (!grammar || !grammar.name || !kernelSpec || !kernelSpec.language) {
      return false;
    }
    const grammarLanguage = grammar.name.toLowerCase();
    const kernelLanguage = kernelSpec.language.toLowerCase();
    if (kernelLanguage === grammarLanguage) {
      return true;
    }

    const mappedLanguage = Config.getJson("languageMappings")[kernelLanguage];
    if (!mappedLanguage) {
      return false;
    }

    return mappedLanguage.toLowerCase() === grammarLanguage;
  }

  getKernelSpecsFromSettings() {
    const settings = Config.getJson("kernelspec");

    if (!settings.kernelspecs) {
      return {};
    }

    // remove invalid entries
    return _.pickBy(
      settings.kernelspecs,
      ({ spec }) => spec && spec.language && spec.display_name && spec.argv
    );
  }

  mergeKernelSpecs(kernelSpecs: Kernelspec) {
    _.assign(this._kernelSpecs, kernelSpecs);
  }

  updateKernelSpecs(callback: ?Function) {
    this._kernelSpecs = this.getKernelSpecsFromSettings();
    this.getKernelSpecsFromJupyter((err, kernelSpecsFromJupyter) => {
      if (!err) {
        this.mergeKernelSpecs(kernelSpecsFromJupyter);
      }

      if (_.isEmpty(this._kernelSpecs)) {
        const message = "No kernel specs found";
        const options = {
          description:
            "Use kernelSpec option in Hydrogen or update IPython/Jupyter to a version that supports: `jupyter kernelspec list --json` or `ipython kernelspec list --json`",
          dismissable: true
        };
        atom.notifications.addError(message, options);
      } else {
        err = null;
        const message = "Hydrogen Kernels updated:";
        const options = {
          detail: _.map(this._kernelSpecs, "spec.display_name").join("\n")
        };
        atom.notifications.addInfo(message, options);
      }

      if (callback) callback(err, this._kernelSpecs);
    });
  }

  getKernelSpecsFromJupyter(callback: Function) {
    const jupyter = "jupyter kernelspec list --json --log-level=CRITICAL";
    const ipython = "ipython kernelspec list --json --log-level=CRITICAL";

    return this.getKernelSpecsFrom(jupyter, (jupyterError, kernelSpecs) => {
      if (!jupyterError) {
        return callback(jupyterError, kernelSpecs);
      }

      return this.getKernelSpecsFrom(ipython, (ipythonError, specs) => {
        if (!ipythonError) {
          return callback(ipythonError, specs);
        }
        return callback(jupyterError, specs);
      });
    });
  }

  getKernelSpecsFrom(command: string, callback: Function) {
    const options = { killSignal: "SIGINT" };
    let kernelSpecs;
    return exec(command, options, (err, stdout) => {
      if (!err) {
        try {
          kernelSpecs = JSON.parse(stdout.toString()).kernelspecs;
        } catch (error) {
          err = error;
          log("Could not parse kernelspecs:", err);
        }
      }

      return callback(err, kernelSpecs);
    });
  }
}

export default new KernelManager();
