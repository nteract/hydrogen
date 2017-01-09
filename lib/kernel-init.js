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

export default function kernelInit(kernel) {
  _.map(atom.project.getPaths(), (projectRoot) => {
    let projectInit;
    try {
      projectInit = CSONParser.parse(fs.readFileSync(projectRoot + path.sep + PROJECT_CONFIG_FILE));
    } catch (e) {
      log(e);
      return;
    }
    if (!projectInit.init) return;
    const init = projectInit.init[kernel.kernelSpec.display_name];
    init.files = _.map(_.defaultTo(init.files, []), f => projectRoot + path.sep + f);
    if (init.code) {
      kernel.execute(init.code, () => execInitFiles(kernel, init.files));
    } else {
      execInitFiles(kernel, init.files);
    }
  });
}
