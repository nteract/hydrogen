'use babel';

import { Emitter } from 'atom';
import { observable, action } from 'mobx';

import { grammarToLanguage } from './utils';
import store from './store';

import WatchSidebar from './watch-sidebar';
import HydrogenKernel from './plugin-api/hydrogen-kernel';
import log from './log';

export default class Kernel {
  @observable executionState = 'loading'
  @observable inspector = {
    visible: false,
    HTML: '',
  }

  constructor(kernelSpec, grammar) {
    this.kernelSpec = kernelSpec;
    this.grammar = grammar;
    this.language = grammarToLanguage(grammar);
    this.displayName = kernelSpec.display_name;

    this.watchCallbacks = [];

    this.watchSidebar = new WatchSidebar(this);

    this.emitter = new Emitter();

    this.pluginWrapper = null;
  }

  @action setExecutionState(state) {
    this.executionState = state;
  }

  @action setInspectorVisibility(visible) {
    this.inspector.visible = visible;
  }

  @action setInspectorResult(HTML) {
    if (this.inspector.visible === true && this.inspector.HTML === HTML) {
      this.setInspectorVisibility(false);
    } else if (HTML) {
      this.inspector.HTML = HTML;
      this.setInspectorVisibility(true);
    }
  }

  getPluginWrapper() {
    if (!this.pluginWrapper) {
      this.pluginWrapper = new HydrogenKernel(this);
    }

    return this.pluginWrapper;
  }

  addWatchCallback(watchCallback) {
    this.watchCallbacks.push(watchCallback);
  }


  _callWatchCallbacks() {
    this.watchCallbacks.forEach(watchCallback => watchCallback());
  }


  interrupt() {
    throw new Error('Kernel: interrupt method not implemented');
  }


  shutdown() {
    throw new Error('Kernel: shutdown method not implemented');
  }


  execute() {
    throw new Error('Kernel: execute method not implemented');
  }


  executeWatch() {
    throw new Error('Kernel: executeWatch method not implemented');
  }


  complete() {
    throw new Error('Kernel: complete method not implemented');
  }


  inspect() {
    throw new Error('Kernel: inspect method not implemented');
  }


  _parseIOMessage(message) {
    let result = this._parseDisplayIOMessage(message);

    if (!result) {
      result = this._parseResultIOMessage(message);
    }

    if (!result) {
      result = this._parseErrorIOMessage(message);
    }

    if (!result) {
      result = this._parseStreamIOMessage(message);
    }

    if (!result) {
      result = this._parseExecuteInputIOMessage(message);
    }

    return result;
  }


  _parseDisplayIOMessage(message) {
    if (message.header.msg_type === 'display_data') {
      return this._parseDataMime(message.content.data);
    }
    return null;
  }

  /* eslint-disable camelcase*/
  _parseResultIOMessage(message) {
    const { msg_type } = message.header;

    if (msg_type === 'execute_result' || msg_type === 'pyout') {
      return this._parseDataMime(message.content.data);
    }
    return null;
  }
  /* eslint-enable camelcase*/


  _parseDataMime(data) {
    if (!data) {
      return null;
    }

    const mime = this._getMimeType(data);

    if (!mime) {
      return null;
    }

    let result;
    if (mime === 'text/plain') {
      result = {
        data: {
          'text/plain': data[mime],
        },
        type: 'text',
        stream: 'pyout',
      };
    } else {
      result = {
        data: {},
        type: mime,
        stream: 'pyout',
      };
      result.data[mime] = data[mime];
    }

    return result;
  }


  _getMimeType(data) {
    const imageMimes = Object.getOwnPropertyNames(data).filter(mime => mime.startsWith('image/'));

    let mime;
    if ({}.hasOwnProperty.call(data, 'text/html')) {
      mime = 'text/html';
    } else if ({}.hasOwnProperty.call(data, 'image/svg+xml')) {
      mime = 'image/svg+xml';
    } else if (!(imageMimes.length === 0)) {
      mime = imageMimes[0];
    } else if ({}.hasOwnProperty.call(data, 'text/markdown')) {
      mime = 'text/markdown';
    } else if ({}.hasOwnProperty.call(data, 'application/pdf')) {
      mime = 'application/pdf';
    } else if ({}.hasOwnProperty.call(data, 'text/latex')) {
      mime = 'text/latex';
    } else if ({}.hasOwnProperty.call(data, 'text/plain')) {
      mime = 'text/plain';
    }

    return mime;
  }

  /* eslint-disable camelcase*/
  _parseErrorIOMessage(message) {
    const { msg_type } = message.header;

    if (msg_type === 'error' || msg_type === 'pyerr') {
      return this._parseErrorMessage(message);
    }

    return null;
  }
  /* eslint-enable camelcase*/


  _parseErrorMessage(message) {
    let errorString;
    try {
      errorString = message.content.traceback.join('\n');
    } catch (err) {
      const ename = message.content.ename ? message.content.ename : '';
      const evalue = message.content.evalue ? message.content.evalue : '';
      errorString = `${ename}: ${evalue}`;
    }

    const result = {
      data: {
        'text/plain': errorString,
      },
      type: 'text',
      stream: 'error',
    };

    return result;
  }

  _parseStreamIOMessage(message) {
    let result;
    if (message.header.msg_type === 'stream') {
      result = {
        data: {
          'text/plain': message.content.text ? message.content.text : message.content.data,
        },
        type: 'text',
        stream: message.content.name,
      };

      // For kernels that do not conform to the messaging standard
    } else if (message.idents === 'stdout' ||
      message.idents === 'stream.stdout' ||
      message.content.name === 'stdout') {
      result = {
        data: {
          'text/plain': message.content.text ? message.content.text : message.content.data,
        },
        type: 'text',
        stream: 'stdout',
      };

      // For kernels that do not conform to the messaging standard
    } else if (message.idents === 'stderr' ||
      message.idents === 'stream.stderr' ||
      message.content.name === 'stderr') {
      result = {
        data: {
          'text/plain': message.content.text ? message.content.text : message.content.data,
        },
        type: 'text',
        stream: 'stderr',
      };
    }

    return result;
  }

  _parseExecuteInputIOMessage(message) {
    if (message.header.msg_type === 'execute_input') {
      return {
        data: message.content.execution_count,
        type: 'number',
        stream: 'execution_count',
      };
    }

    return null;
  }

  destroy() {
    log('Kernel: Destroying base kernel');
    store.deleteKernel(this.language);
    if (this.pluginWrapper) {
      this.pluginWrapper.destroyed = true;
    }
    this.emitter.emit('did-destroy');
    this.emitter.dispose();
  }
}
