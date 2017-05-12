"use babel";

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

class KernelManager {
  constructor() {
    this._kernelSpecs = this.getKernelSpecsFromSettings();
  }

  startKernelFor(grammar, onStarted) {
    try {
      const rootDirectory = atom.project.rootDirectories[0]
        ? atom.project.rootDirectories[0].path
        : getEditorDirectory(store.editor);
      const connectionFile = path.join(
        rootDirectory,
        "hydrogen",
        "connection.json"
      );
      const connectionString = fs.readFileSync(connectionFile, "utf8");
      const connection = JSON.parse(connectionString);
      this.startExistingKernel(grammar, connection, connectionFile, onStarted);
      return;
    } catch (e) {
      if (e.code !== "ENOENT") {
        console.error("KernelManager: Cannot start existing kernel:\n", e);
      }
    }

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

  startExistingKernel(grammar, connection, connectionFile, onStarted) {
    const language = grammar.name;

    log("KernelManager: startExistingKernel: Assuming", language);

    const kernelSpec = {
      display_name: "Existing Kernel",
      language,
      argv: [],
      env: {}
    };

    const kernel = new ZMQKernel(
      kernelSpec,
      grammar,
      connection,
      connectionFile
    );

    kernel.connect(() => {
      log(
        "KernelManager: startExistingKernelFor: existing kernel for",
        language,
        "connected"
      );

      store.newKernel(kernel);

      this._executeStartupCode(kernel);

      if (onStarted) onStarted(kernel);
    });
  }

  startKernel(kernelSpec, grammar, onStarted) {
    const displayName = kernelSpec.display_name;
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

    launchSpec(kernelSpec, {
      cwd: kernelStartDir
    }).then(({ config, connectionFile, spawn }) => {
      const kernel = new ZMQKernel(
        kernelSpec,
        grammar,
        config,
        connectionFile,
        spawn
      );

      kernel.connect(() => {
        log("KernelManager: startKernel:", displayName, "connected");

        store.newKernel(kernel);

        this._executeStartupCode(kernel);

        if (onStarted) onStarted(kernel);
      });
    });
  }

  _executeStartupCode(kernel) {
    const displayName = kernel.kernelSpec.display_name;
    let startupCode = Config.getJson("startupCode")[displayName];
    if (startupCode) {
      log("KernelManager: Executing startup code:", startupCode);
      startupCode = `${startupCode} \n`;
      kernel.execute(startupCode);
    }
  }

  getAllKernelSpecs(callback) {
    if (_.isEmpty(this._kernelSpecs)) {
      return this.updateKernelSpecs(() =>
        callback(_.map(this._kernelSpecs, "spec"))
      );
    }
    return callback(_.map(this._kernelSpecs, "spec"));
  }

  getAllKernelSpecsForGrammar(grammar, callback) {
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

  getKernelSpecForGrammar(grammar, callback) {
    if (!grammar) {
      return;
    }

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

  kernelSpecProvidesLanguage(kernelSpec, grammarLanguage) {
    return kernelSpec.language.toLowerCase() === grammarLanguage.toLowerCase();
  }

  kernelSpecProvidesGrammar(kernelSpec, grammar) {
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

  mergeKernelSpecs(kernelSpecs) {
    _.assign(this._kernelSpecs, kernelSpecs);
  }

  updateKernelSpecs(callback) {
    this._kernelSpecs = this.getKernelSpecsFromSettings;
    this.getKernelSpecsFromJupyter((err, kernelSpecsFromJupyter) => {
      if (!err) {
        this.mergeKernelSpecs(kernelSpecsFromJupyter);
      }

      if (_.isEmpty(this._kernelSpecs)) {
        const message = "No kernel specs found";
        const options = {
          description: "Use kernelSpec option in Hydrogen or update IPython/Jupyter to a version that supports: `jupyter kernelspec list --json` or `ipython kernelspec list --json`",
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

  getKernelSpecsFromJupyter(callback) {
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

  getKernelSpecsFrom(command, callback) {
    const options = { killSignal: "SIGINT" };
    let kernelSpecs;
    return exec(command, options, (err, stdout) => {
      if (!err) {
        try {
          kernelSpecs = JSON.parse(stdout).kernelspecs;
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
