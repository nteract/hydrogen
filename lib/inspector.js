'use babel';

import { MessagePanelView, PlainMessageView } from 'atom-message-panel';
import * as transformime from 'transformime';

import getRobustGrammar from './robust-grammar';

const transform = transformime.createTransform();

export default class Inspector {
  constructor(kernelManager, codeManager) {
    this.kernelManager = kernelManager;
    this.codeManager = codeManager;
    this._lastInspectionResult = '';
  }

  toggle() {
    const editor = atom.workspace.getActiveTextEditor();
    const grammar = getRobustGrammar(editor);
    const language = this.kernelManager.getLanguageFor(grammar);
    const kernel = this.kernelManager.getRunningKernelFor(language);
    if (!kernel) {
      atom.notifications.addInfo('No kernel running!');
      if (this.view) this.view.close();
      return;
    }

    if (!this.view) {
      this.view = new MessagePanelView({
        title: 'Hydrogen Inspector',
        closeMethod: 'destroy',
      });
    }

    const [code, cursorPos] = this.codeManager.getCodeToInspect();
    if (cursorPos === 0) {
      return;
    }

    kernel.inspect(code, cursorPos, result =>
      // TODO: handle case when inspect request returns an error
      this.showInspectionResult(result));
  }


  showInspectionResult(result) {
    console.log('Inspector: Result:', result);

    if (!result.found) {
      atom.notifications.addInfo('No introspection available!');
      if (this.view) this.view.close();
      return;
    }

    const onInspectResult = ({ mimetype, el }) => {
      if (mimetype === 'text/plain') {
        const lines = el.innerHTML.split('\n');
        const firstline = lines[0];
        lines.splice(0, 1);
        const message = lines.join('\n');

        if (this._lastInspectionResult === message && this.view.panel) {
          if (this.view) this.view.close();
          return;
        }

        this.view.clear();
        this.view.attach();
        this.view.add(new PlainMessageView({
          message: firstline,
          className: 'inspect-message',
          raw: true,
        }));
        this.view.add(new PlainMessageView({
          message,
          className: 'inspect-message',
          raw: true,
        }));

        this._lastInspectionResult = message;
        return;
      } else if (mimetype === 'text/html' || mimetype === 'text/markdown') {
        const container = document.createElement('div');
        container.appendChild(el);
        const message = container.innerHTML;
        if (this._lastInspectionResult === message && this.view.panel) {
          if (this.view) this.view.close();
          return;
        }

        this.view.clear();
        this.view.attach();
        this.view.add(new PlainMessageView({
          message,
          className: 'inspect-message',
          raw: true,
        }));

        this._lastInspectionResult = message;
        return;
      }

      console.error('Inspector: Rendering error:', mimetype, el);
      atom.notifications.addInfo('Cannot render introspection result!');
      if (this.view) this.view.close();
    };

    const onError = (error) => {
      console.error('Inspector: Rendering error:', error);
      atom.notifications.addInfo('Cannot render introspection result!');
      if (this.view) this.view.close();
    };

    transform(result.data).then(onInspectResult, onError);
  }
}
