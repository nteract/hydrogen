import { Emitter } from 'atom';

import child_process from 'child_process';
import path from 'path';

import _ from 'lodash';
import jmp from 'jmp';
import uuid from 'uuid';
let { zmq } = jmp;

import StatusView from './status-view';
import WatchSidebar from './watch-sidebar';
import HydrogenKernel from './plugin-api/hydrogen-kernel';

export default class Kernel {
  constructor(kernelSpec, grammar) {
    this.kernelSpec = kernelSpec;
    this.grammar = grammar;
    this.watchCallbacks = [];

    this.watchSidebar = new WatchSidebar(this);
    this.statusView = new StatusView(this.kernelSpec.display_name);

    this.emitter = new Emitter();

    this.pluginWrapper = null;
  }

  getPluginWrapper() {
    if (this.pluginWrapper == null) {
      this.pluginWrapper = new HydrogenKernel(this);
    }

    return this.pluginWrapper;
  }

  addWatchCallback(watchCallback) {
    return this.watchCallbacks.push(watchCallback);
  }


  _callWatchCallbacks() {
    return this.watchCallbacks.forEach(watchCallback => watchCallback());
  }


  interrupt() {
    throw new Error('Kernel: interrupt method not implemented');
  }


  shutdown() {
    throw new Error('Kernel: shutdown method not implemented');
  }


  execute(code, onResults) {
    throw new Error('Kernel: execute method not implemented');
  }


  executeWatch(code, onResults) {
    throw new Error('Kernel: executeWatch method not implemented');
  }


  complete(code, onResults) {
    throw new Error('Kernel: complete method not implemented');
  }


  inspect(code, cursor_pos, onResults) {
    throw new Error('Kernel: inspect method not implemented');
  }


  _parseIOMessage(message) {
    let result = this._parseDisplayIOMessage(message);

    if (result == null) {
      result = this._parseResultIOMessage(message);
    }

    if (result == null) {
      result = this._parseErrorIOMessage(message);
    }

    if (result == null) {
      result = this._parseStreamIOMessage(message);
    }

    if (result == null) {
      result = this._parseExecuteInputIOMessage(message);
    }

    return result;
  }


  _parseDisplayIOMessage(message) {
    if (message.header.msg_type === 'display_data') {
      var result = this._parseDataMime(message.content.data);
    }

    return result;
  }


  _parseResultIOMessage(message) {
    let { msg_type } = message.header;

    if (msg_type === 'execute_result' || msg_type === 'pyout') {
      var result = this._parseDataMime(message.content.data);
    }

    return result;
  }


  _parseDataMime(data) {
    if (data == null) {
      return null;
    }

    let mime = this._getMimeType(data);

    if (mime == null) {
      return null;
    }

    if (mime === 'text/plain') {
      var result = {
        data: {
          'text/plain': data[mime]
        },
        type: 'text',
        stream: 'pyout'
      };
      result.data['text/plain'] = result.data['text/plain'].trim();

    } else {
      var result = {
        data: {},
        type: mime,
        stream: 'pyout'
      };
      result.data[mime] = data[mime];
    }

    return result;
  }


  _getMimeType(data) {
    let imageMimes = Object.getOwnPropertyNames(data).filter(mime => mime.startsWith('image/'));

    if (data.hasOwnProperty('text/html')) {
      var mime = 'text/html';

    } else if (data.hasOwnProperty('image/svg+xml')) {
      var mime = 'image/svg+xml';

    } else if (!(imageMimes.length === 0)) {
      var mime = imageMimes[0];

    } else if (data.hasOwnProperty('text/markdown')) {
      var mime = 'text/markdown';

    } else if (data.hasOwnProperty('application/pdf')) {
      var mime = 'application/pdf';

    } else if (data.hasOwnProperty('text/latex')) {
      var mime = 'text/latex';

    } else if (data.hasOwnProperty('text/plain')) {
      var mime = 'text/plain';
    }

    return mime;
  }


  _parseErrorIOMessage(message) {
    let { msg_type } = message.header;

    if (msg_type === 'error' || msg_type === 'pyerr') {
      var result = this._parseErrorMessage(message);
    }

    return result;
  }


  _parseErrorMessage(message) {
    try {
      var errorString = message.content.traceback.join('\n');
    } catch (err) {
      let ename = message.content.ename != null ? message.content.ename : '';
      let evalue = message.content.evalue != null ? message.content.evalue : '';
      var errorString = ename + ': ' + evalue;
    }

    let result = {
      data: {
        'text/plain': errorString
      },
      type: 'text',
      stream: 'error'
    };

    return result;
  }


  _parseStreamIOMessage(message) {
    if (message.header.msg_type === 'stream') {
      var result = {
        data: {
          'text/plain': message.content.text != null ? message.content.text : message.content.data
        },
        type: 'text',
        stream: message.content.name
      };

      // For kernels that do not conform to the messaging standard
    } else if (message.idents === 'stdout' ||
      message.idents === 'stream.stdout' ||
      message.content.name === 'stdout') {
      var result = {
        data: {
          'text/plain': message.content.text != null ? message.content.text : message.content.data
        },
        type: 'text',
        stream: 'stdout'
      };

      // For kernels that do not conform to the messaging standard
    } else if (message.idents === 'stderr' ||
      message.idents === 'stream.stderr' ||
      message.content.name === 'stderr') {
      var result = {
        data: {
          'text/plain': message.content.text != null ? message.content.text : message.content.data
        },
        type: 'text',
        stream: 'stderr'
      };
    }

    if (__guard__(result, x => x.data['text/plain']) != null) {
      result.data['text/plain'] = result.data['text/plain'].trim();
    }

    return result;
  }

  _parseExecuteInputIOMessage(message) {
    if (message.header.msg_type === 'execute_input') {
      var result = {
        data: message.content.execution_count,
        type: 'number',
        stream: 'execution_count'
      };
    }

    return result;
  }

  destroy() {
    console.log('Kernel: Destroying base kernel');
    if (this.pluginWrapper) {
      this.pluginWrapper.destroyed = true;
    }
    this.emitter.emit('did-destroy');
    return this.emitter.dispose();
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
