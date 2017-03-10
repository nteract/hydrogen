'use babel';

import _ from 'lodash';
import { exec } from 'child_process';
import { launchSpec } from 'spawnteract';
import fs from 'fs';
import path from 'path';

import Config from './config';
import WSKernel from './ws-kernel';
import ZMQKernel from './zmq-kernel';
import KernelPicker from './kernel-picker';
import log from './log';
import { initKernel, getInitConfig } from './kernel-init';

export default class KernelManager {
  constructor() {
    this._runningKernels = {};
    this._kernelSpecs = this.getKernelSpecsFromSettings();
  }


  destroy() {
    _.forEach(this._runningKernels, kernel => kernel.destroy());
    this._runningKernels = {};
  }


  setRunningKernelFor(grammar, kernel) {
    const language = this.getLanguageFor(grammar);

    kernel.kernelSpec.language = language;

    this._runningKernels[language] = kernel;
  }


  destroyRunningKernelFor(grammar) {
    const language = this.getLanguageFor(grammar);
    const kernel = this._runningKernels[language];
    delete this._runningKernels[language];
    if (kernel) kernel.destroy();
  }


  restartRunningKernelFor(grammar, onRestarted) {
    const language = this.getLanguageFor(grammar);
    const kernel = this._runningKernels[language];

    if (kernel instanceof WSKernel) {
      const future = kernel.restart();
      if (onRestarted) future.then(() => onRestarted(kernel));
      return;
    }

    if (kernel instanceof ZMQKernel && kernel.kernelProcess) {
      const { kernelSpec } = kernel;
      this.destroyRunningKernelFor(grammar);
      this.startKernel(kernelSpec, grammar, onRestarted);
      return;
    }

    log('KernelManager: restartRunningKernelFor: ignored', kernel);
    atom.notifications.addWarning('Cannot restart this kernel');
    if (onRestarted) onRestarted(kernel);
  }


  startKernelFor(grammar, onStarted) {
    try {
      const rootDirectory = (atom.project.rootDirectories[0]) ?
        atom.project.rootDirectories[0].path :
        path.dirname(atom.workspace.getActiveTextEditor().getPath());
      const connectionFile = path.join(
        rootDirectory, 'hydrogen', 'connection.json',
      );
      const connectionString = fs.readFileSync(connectionFile, 'utf8');
      const connection = JSON.parse(connectionString);
      this.startExistingKernel(grammar, connection, connectionFile, onStarted);
      return;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error('KernelManager: Cannot start existing kernel:\n', e);
      }
    }

    const language = this.getLanguageFor(grammar);
    this.getKernelSpecFor(language, (kernelSpec) => {
      if (!kernelSpec) {
        const message = `No kernel for language \`${language}\` found`;
        const description = 'Check that the language for this file is set in Atom and that you have a Jupyter kernel installed for it.';
        atom.notifications.addError(message, { description });
        return;
      }

      this.startKernel(kernelSpec, grammar, onStarted);
    });
  }


  startExistingKernel(grammar, connection, connectionFile, onStarted) {
    const language = this.getLanguageFor(grammar);

    log('KernelManager: startExistingKernel: Assuming', language);

    const kernelSpec = {
      display_name: 'Existing Kernel',
      language,
      argv: [],
      env: {},
    };

    const kernel = new ZMQKernel(kernelSpec, grammar, connection, connectionFile);

    this.setRunningKernelFor(grammar, kernel);

    initKernel(kernel);

    if (onStarted) onStarted(kernel);
  }


  startKernel(kernelSpec, grammar, onStarted) {
    const language = this.getLanguageFor(grammar);

    log('KernelManager: startKernelFor:', language);

    const projectPath = atom.project.getPaths()[0];
    const spawnOptions = { cwd: projectPath };
    launchSpec(kernelSpec, spawnOptions)
    .then(({ config, connectionFile, spawn }) => {
      const kernel = new ZMQKernel(
        kernelSpec, grammar,
        config, connectionFile,
        spawn,
      );
      this.setRunningKernelFor(grammar, kernel);

      initKernel(kernel);

      if (onStarted) onStarted(kernel);
    });
  }

  getAllRunningKernels() {
    return _.clone(this._runningKernels);
  }

  getRunningKernelFor(language) {
    return this._runningKernels[language];
  }


  getLanguageFor(grammar) {
    return (grammar) ? grammar.name.toLowerCase() : null;
  }


  getAllKernelSpecs(callback) {
    if (_.isEmpty(this._kernelSpecs)) {
      return this.updateKernelSpecs(() => callback(_.map(this._kernelSpecs, 'spec')));
    }
    return callback(_.map(this._kernelSpecs, 'spec'));
  }


  getAllKernelSpecsFor(language, callback) {
    if (language) {
      return this.getAllKernelSpecs((kernelSpecs) => {
        const specs = kernelSpecs.filter(spec => this.kernelSpecProvidesLanguage(spec, language));

        return callback(specs);
      });
    }
    return callback([]);
  }


  getKernelSpecFor(language, callback) {
    if (!language) {
      return;
    }

    this.getAllKernelSpecsFor(language, (kernelSpecs) => {
      if (kernelSpecs.length <= 1) {
        callback(kernelSpecs[0]);
        return;
      }
      const { kernel } = getInitConfig()[0][language];
      if (kernel) {
        callback(_.find(kernelSpecs, { display_name: kernel }));
        return;
      }

      if (!this.kernelPicker) {
        this.kernelPicker = new KernelPicker(onUpdated => onUpdated(kernelSpecs));
        this.kernelPicker.onConfirmed = ({ kernelSpec }) => callback(kernelSpec);
      }
      this.kernelPicker.toggle();
    });
  }


  kernelSpecProvidesLanguage(kernelSpec, language) {
    const kernelLanguage = kernelSpec.language;
    const mappedLanguage = Config.getJson('languageMappings')[kernelLanguage];

    if (mappedLanguage) {
      return mappedLanguage === language;
    }

    return kernelLanguage.toLowerCase() === language;
  }


  getKernelSpecsFromSettings() {
    const settings = Config.getJson('kernelspec');

    if (!settings.kernelspecs) {
      return {};
    }

    // remove invalid entries
    return _.pickBy(settings.kernelspecs, ({ spec }) =>
      spec && spec.language && spec.display_name && spec.argv);
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
        const message = 'No kernel specs found';
        const options = {
          description: 'Use kernelSpec option in Hydrogen or update IPython/Jupyter to a version that supports: `jupyter kernelspec list --json` or `ipython kernelspec list --json`',
          dismissable: true,
        };
        atom.notifications.addError(message, options);
      } else {
        err = null;
        const message = 'Hydrogen Kernels updated:';
        const options = {
          detail:
            (_.map(this._kernelSpecs, 'spec.display_name')).join('\n'),
        };
        atom.notifications.addInfo(message, options);
      }

      if (callback) callback(err, this._kernelSpecs);
    });
  }


  getKernelSpecsFromJupyter(callback) {
    const jupyter = 'jupyter kernelspec list --json --log-level=CRITICAL';
    const ipython = 'ipython kernelspec list --json --log-level=CRITICAL';

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
    const options = { killSignal: 'SIGINT' };
    let kernelSpecs;
    return exec(command, options, (err, stdout) => {
      if (!err) {
        try {
          kernelSpecs = JSON.parse(stdout).kernelspecs;
        } catch (error) {
          err = error;
          log('Could not parse kernelspecs:', err);
        }
      }

      return callback(err, kernelSpecs);
    });
  }
}
