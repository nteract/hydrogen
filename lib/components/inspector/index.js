/* @flow */

import React from 'react';
import * as transformime from 'transformime';

import { log, reactFactory } from './../../utils';
import store from './../../store';
import { getCodeToInspect } from './../../code-manager';
import InspectorComponent from './component';

import type Kernel from './../../kernel';

const transform = transformime.createTransform();

export default class Inspector {
  constructor() {
    const element = document.createElement('div');

    const panel = atom.workspace.addBottomPanel({ item: element });

    reactFactory(
      <InspectorComponent store={store} panel={panel} />,
      element,
      // We should add panel.destroy here but Atom errors
    );
  }

  toggle() {
    const kernel = store.kernel;
    if (!kernel) {
      atom.notifications.addInfo('No kernel running!');
      return;
    }

    const [code, cursorPos] = getCodeToInspect();
    if (!code || cursorPos === 0) {
      atom.notifications.addInfo('No code to introspect!');
      return;
    }

    kernel.inspect(code, cursorPos, (result: {data: Object, found: Boolean}) =>
      // TODO: handle case when inspect request returns an error
      this.showInspectionResult(kernel, result));
  }


  showInspectionResult(kernel: Kernel, result: {data: Object, found: Boolean}) {
    log('Inspector: Result:', result);

    if (!result.found) {
      kernel.setInspectorVisibility(false);
      atom.notifications.addInfo('No introspection available!');
      return;
    }

    const onInspectResult = ({ mimetype, el }) => {
      if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
        kernel.setInspectorResult(el.outerHTML);
      } else if (mimetype === 'text/html') {
        const container = document.createElement('div');
        container.appendChild(el);
        kernel.setInspectorResult(container.outerHTML);
      } else {
        console.error('Inspector: Rendering error:', mimetype, el);
        atom.notifications.addInfo('Cannot render introspection result!');
      }
    };

    const onError = (error) => {
      console.error('Inspector: Rendering error:', error);
      atom.notifications.addInfo('Cannot render introspection result!');
    };

    transform(result.data).then(onInspectResult, onError);
  }
}
