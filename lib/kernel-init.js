'use babel';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import CSONParser from 'cson-parser';

import log from './log';

const PROJECT_CONFIG_FILE = 'hydrogen.cson';

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

function kernelInit(kernel) {
  _.map(getInitConfig(), (initConfig) => {
    const init = initConfig[kernel.kernelSpec.language];
    if (!init) return;
    if (init.code) {
      kernel.execute(init.code, () => execInitFiles(kernel, init.files));
    } else {
      execInitFiles(kernel, init.files);
    }
  });
}

function _getInitConfig() {
  return _.map(atom.project.getPaths(), (projectRoot) => {
    try {
      const init = CSONParser.parse(fs.readFileSync(projectRoot + path.sep + PROJECT_CONFIG_FILE));
      return _.map(init, (kernelInit) => {
        kernelInit.files = _.map(_.defaultTo(kernelInit.files, []),
         f => projectRoot + path.sep + f);
         
        return kernelInit
      });
    } catch (e) {
      log(e);
    }
    return ''; //Satisfy eslint rules :(
  });
}

function getInitConfig() {
  return _.filter(_getInitConfig())
}

export default { kernelInit, getInitConfig }
