import _ from 'lodash';
import child_process from 'child_process';
import { launchSpec } from 'spawnteract';
import fs from 'fs';
import path from 'path';

import Config from './config';
import WSKernel from './ws-kernel';
import ZMQKernel from './zmq-kernel';
import KernelPicker from './kernel-picker';

export default class KernelManager {
  constructor() {
    this.getAllKernelSpecs = this.getAllKernelSpecs.bind(this);
    this.getKernelSpecsFromJupyter = this.getKernelSpecsFromJupyter.bind(this);
    this._runningKernels = {};
    this._kernelSpecs = this.getKernelSpecsFromSettings();
  }


  destroy() {
    _.forEach(this._runningKernels, kernel => kernel.destroy());
    return this._runningKernels = {};
  }


  setRunningKernelFor(grammar, kernel) {
    let language = this.getLanguageFor(grammar);

    kernel.kernelSpec.language = language;

    return this._runningKernels[language] = kernel;
  }


  destroyRunningKernelFor(grammar) {
    let language = this.getLanguageFor(grammar);
    let kernel = this._runningKernels[language];
    delete this._runningKernels[language];
    return __guard__(kernel, x => x.destroy());
  }


  restartRunningKernelFor(grammar, onRestarted) {
    let language = this.getLanguageFor(grammar);
    let kernel = this._runningKernels[language];

    if (kernel instanceof WSKernel) {
      kernel.restart().then(() => __guardFunc__(onRestarted, f => f(kernel)));
      return;
    }

    if (kernel instanceof ZMQKernel && kernel.kernelProcess) {
      let { kernelSpec } = kernel;
      this.destroyRunningKernelFor(grammar);
      this.startKernel(kernelSpec, grammar, kernel => __guardFunc__(onRestarted, f => f(kernel)));
      return;
    }

    console.log('KernelManager: restartRunningKernelFor: ignored', kernel);
    atom.notifications.addWarning('Cannot restart this kernel');
    return __guardFunc__(onRestarted, f => f(kernel));
  }


  startKernelFor(grammar, onStarted) {
    try {
      let rootDirectory = __guard__(atom.project.rootDirectories[0], x => x.path) ||
        path.dirname(atom.workspace.getActiveTextEditor().getPath());
      let connectionFile = path.join(
        rootDirectory, 'hydrogen', 'connection.json'
      );
      let connectionString = fs.readFileSync(connectionFile, 'utf8');
      let connection = JSON.parse(connectionString);
      this.startExistingKernel(grammar, connection, connectionFile, onStarted);
      return;

    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error('KernelManager: Cannot start existing kernel:\n', e);
      }
    }

    let language = this.getLanguageFor(grammar);
    return this.getKernelSpecFor(language, kernelSpec => {
      if (kernelSpec == null) {
        let message = `No kernel for language \`${language}\` found`;
        let description = 'Check that the language for this file is set in Atom and that you have a Jupyter kernel installed for it.';
        atom.notifications.addError(message, { description });
        return;
      }

      return this.startKernel(kernelSpec, grammar, onStarted);
    });
  }


  startExistingKernel(grammar, connection, connectionFile, onStarted) {
    let language = this.getLanguageFor(grammar);

    console.log('KernelManager: startExistingKernel: Assuming', language);

    let kernelSpec = {
      display_name: 'Existing Kernel',
      language,
      argv: [],
      env: {}
    };

    let kernel = new ZMQKernel(kernelSpec, grammar, connection, connectionFile);

    this.setRunningKernelFor(grammar, kernel);

    this._executeStartupCode(kernel);

    return __guardFunc__(onStarted, f => f(kernel));
  }


  startKernel(kernelSpec, grammar, onStarted) {
    let language = this.getLanguageFor(grammar);

    console.log('KernelManager: startKernelFor:', language);

    let projectPath = path.dirname(
      atom.workspace.getActiveTextEditor().getPath()
    );
    let spawnOptions = { cwd: projectPath };
    return launchSpec(kernelSpec, spawnOptions).
    then(({ config, connectionFile, spawn }) => {
      let kernel = new ZMQKernel(
        kernelSpec, grammar,
        config, connectionFile,
        spawn
      );
      this.setRunningKernelFor(grammar, kernel);

      this._executeStartupCode(kernel);

      return __guardFunc__(onStarted, f => f(kernel));
    });
  }


  _executeStartupCode(kernel) {
    let displayName = kernel.kernelSpec.display_name;
    let startupCode = Config.getJson('startupCode')[displayName];
    if (startupCode != null) {
      console.log('KernelManager: Executing startup code:', startupCode);
      startupCode = startupCode + ' \n';
      return kernel.execute(startupCode);
    }
  }


  getAllRunningKernels() {
    return _.clone(this._runningKernels);
  }


  getRunningKernelFor(language) {
    return this._runningKernels[language];
  }


  getLanguageFor(grammar) {
    return __guard__(grammar, x => x.name.toLowerCase());
  }


  getAllKernelSpecs(callback) {
    if (_.isEmpty(this._kernelSpecs)) {
      return this.updateKernelSpecs(() => {
        return callback(_.map(this._kernelSpecs, 'spec'));
      });
    } else {
      return callback(_.map(this._kernelSpecs, 'spec'));
    }
  }


  getAllKernelSpecsFor(language, callback) {
    if (language != null) {
      return this.getAllKernelSpecs(kernelSpecs => {
        let specs = kernelSpecs.filter(spec => {
          return this.kernelSpecProvidesLanguage(spec, language);
        });

        return callback(specs);
      });
    } else {
      return callback([]);
    }
  }


  getKernelSpecFor(language, callback) {
    if (language == null) {
      return null;
    }

    return this.getAllKernelSpecsFor(language, kernelSpecs => {
      if (kernelSpecs.length <= 1) {
        return callback(kernelSpecs[0]);
      } else {
        if (this.kernelPicker == null) {
          this.kernelPicker = new KernelPicker(onUpdated => onUpdated(kernelSpecs));
          this.kernelPicker.onConfirmed = ({ kernelSpec }) => callback(kernelSpec);
        }
        return this.kernelPicker.toggle();
      }
    });
  }


  kernelSpecProvidesLanguage(kernelSpec, language) {
    let kernelLanguage = kernelSpec.language;
    let mappedLanguage = Config.getJson('languageMappings')[kernelLanguage];

    if (mappedLanguage) {
      return mappedLanguage === language;
    }

    return kernelLanguage.toLowerCase() === language;
  }


  getKernelSpecsFromSettings() {
    let settings = Config.getJson('kernelspec');

    if (!settings.kernelspecs) {
      return {};
    }

    // remove invalid entries
    return _.pickBy(settings.kernelspecs, ({ spec }) => __guard__(spec, x => x.language) && spec.display_name && spec.argv);
  }


  mergeKernelSpecs(kernelSpecs) {
    return _.assign(this._kernelSpecs, kernelSpecs);
  }


  updateKernelSpecs(callback) {
    this._kernelSpecs = this.getKernelSpecsFromSettings;
    return this.getKernelSpecsFromJupyter((err, kernelSpecsFromJupyter) => {
      if (!err) {
        this.mergeKernelSpecs(kernelSpecsFromJupyter);
      }

      if (_.isEmpty(this._kernelSpecs)) {
        var message = 'No kernel specs found';
        var options = {
          description: 'Use kernelSpec option in Hydrogen or update IPython/Jupyter to a version that supports: `jupyter kernelspec list --json` or `ipython kernelspec list --json`',
          dismissable: true
        };
        atom.notifications.addError(message, options);
      } else {
        err = null;
        var message = 'Hydrogen Kernels updated:';
        var options = {
          detail:
            (_.map(this._kernelSpecs, 'spec.display_name')).join('\n')
        };
        atom.notifications.addInfo(message, options);
      }

      return __guardFunc__(callback, f => f(err, this._kernelSpecs));
    });
  }


  getKernelSpecsFromJupyter(callback) {
    let jupyter = 'jupyter kernelspec list --json --log-level=CRITICAL';
    let ipython = 'ipython kernelspec list --json --log-level=CRITICAL';

    return this.getKernelSpecsFrom(jupyter, (jupyterError, kernelSpecs) => {
      if (!jupyterError) {
        __guardFunc__(callback, f => f(jupyterError, kernelSpecs));
        return;
      }

      return this.getKernelSpecsFrom(ipython, function(ipythonError, kernelSpecs) {
        if (!ipythonError) {
          return __guardFunc__(callback, f1 => f1(ipythonError, kernelSpecs));
        } else {
          return __guardFunc__(callback, f2 => f2(jupyterError, kernelSpecs));
        }
      });
    });
  }


  getKernelSpecsFrom(command, callback) {
    let options = { killSignal: 'SIGINT' };
    return child_process.exec(command, options, function(err, stdout, stderr) {
      if (!err) {
        try {
          var kernelSpecs = JSON.parse(stdout).kernelspecs;
        } catch (error) {
          err = error;
          console.log('Could not parse kernelspecs:', err);
        }
      }

      return __guardFunc__(callback, f => f(err, kernelSpecs));
    });
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}
