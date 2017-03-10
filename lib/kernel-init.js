'use babel';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import CSONParser from 'cson-parser';

import log from './log';
import Config from './config';

const PROJECT_CONFIG_FILE = 'hydrogen.cson';
const DEFAULT_KERNEL_INIT = {
  files: [],
  code: '',
};

function execInitFiles(kernel, files) {
  if (_.isEmpty(files)) return;

  const file = files.shift();
  fs.readFile(file, 'utf8', (e, code) => {
    if (e) log('init: error:', e);
    if (!code || e) return;

    kernel.execute(code, (result) => {
      log('init: result', result);
      execInitFiles(kernel, files);
    });
  });
}

function getInitConfig() {
  return _.filter(_.map(atom.project.getPaths(), (projectRoot) => {
    try {
      const init = CSONParser.parse(fs.readFileSync(projectRoot + path.sep + PROJECT_CONFIG_FILE));
      return _.mapValues(init, (kernelInit) => {
        kernelInit = _.assign(DEFAULT_KERNEL_INIT, kernelInit);
        kernelInit.files = _.map(kernelInit.files, f => projectRoot + path.sep + f);

        return kernelInit;
      });
    } catch (e) {
      log(e);
    }
    return '';// Satisfy eslint rules :(
  }));
}

function initKernel(kernel) {
  const displayName = kernel.kernelSpec.display_name;
  const startupCode = Config.getJson('startupCode')[displayName];

  _.map(getInitConfig(), (initConfig) => {
    const init = initConfig[kernel.kernelSpec.language];
    kernel.execute([startupCode, init.code].join('\n'), () => execInitFiles(kernel, init.files));
  });
}

export default { initKernel, getInitConfig };
