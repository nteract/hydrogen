'use babel';

import ReactDOM from 'react-dom';
import React from 'react';
import * as transformime from 'transformime';

import log from './log';
import store from './store';
import InspectorComponent from './components/inspector';

const transform = transformime.createTransform();

export default class Inspector {
  constructor(codeManager) {
    this.codeManager = codeManager;
    this.element = document.createElement('div');

    this.panel = atom.workspace.addBottomPanel({ item: this.element });

    ReactDOM.render(
      <InspectorComponent store={store} panel={this.panel} />,
      this.element,
    );
  }

  dispose() {
    ReactDOM.unmountComponentAtNode(this.element);
    this.panel.destroy();
  }

  toggle() {
    const kernel = store.currentKernel;
    if (!kernel) {
      atom.notifications.addInfo('No kernel running!');
      return;
    }

    const [code, cursorPos] = this.codeManager.getCodeToInspect();
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
