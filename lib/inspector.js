'use babel';

import React from 'react';
import * as transformime from 'transformime';

import log from './utils/log';
import store from './store';
import reactFactory from './utils/react';
import { getCodeToInspect } from './code-manager';
import InspectorComponent from './components/inspector';

const transform = transformime.createTransform();

export default class Inspector {
  constructor() {
    this.element = document.createElement('div');

    const panel = atom.workspace.addBottomPanel({ item: this.element });

    reactFactory(
      <InspectorComponent store={store} panel={panel} />,
      this.element,
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

    kernel.inspect(code, cursorPos, result =>
      // TODO: handle case when inspect request returns an error
      this.showInspectionResult(kernel, result));
  }


  showInspectionResult(kernel, result) {
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
