import { MessagePanelView, PlainMessageView } from 'atom-message-panel';
import transformime from 'transformime';

export default class Inspector {
  constructor(kernelManager, codeManager) {
    this.kernelManager = kernelManager;
    this.codeManager = codeManager;
    this._lastInspectionResult = '';
  }

  toggle() {
    let editor = atom.workspace.getActiveTextEditor();
    let grammar = editor.getGrammar();
    let language = this.kernelManager.getLanguageFor(grammar);
    let kernel = this.kernelManager.getRunningKernelFor(language);
    if (kernel == null) {
      atom.notifications.addInfo('No kernel running!');
      __guard__(this.view, x => x.close());
      return;
    }

    if (this.view == null) {
      this.view = new MessagePanelView({
        title: 'Hydrogen Inspector',
        closeMethod: 'destroy'
      });
    }

    let [code, cursor_pos] = this.codeManager.getCodeToInspect();
    if (cursor_pos === 0) {
      return;
    }

    return kernel.inspect(code, cursor_pos, result => {
      // TODO: handle case when inspect request returns an error
      return this.showInspectionResult(result);
    });
  }


  showInspectionResult(result) {
    console.log('Inspector: Result:', result);

    if (!result.found) {
      atom.notifications.addInfo('No introspection available!');
      __guard__(this.view, x => x.close());
      return;
    }

    let onInspectResult = ({ mimetype, el }) => {
      if (mimetype === 'text/plain') {
        let lines = el.innerHTML.split('\n');
        let firstline = lines[0];
        lines.splice(0, 1);
        var message = lines.join('\n');

        if (this._lastInspectionResult === message && (this.view.panel != null)) {
          __guard__(this.view, x1 => x1.close());
          return;
        }

        this.view.clear();
        this.view.attach();
        this.view.add(new PlainMessageView({
          message: firstline,
          className: 'inspect-message',
          raw: true
        }));
        this.view.add(new PlainMessageView({
          message,
          className: 'inspect-message',
          raw: true
        }));

        this._lastInspectionResult = message;
        return;

      } else if (mimetype === 'text/html') {
        let container = document.createElement('div');
        container.appendChild(el);
        var message = container.innerHTML;
        if (this._lastInspectionResult === message && (this.view.panel != null)) {
          __guard__(this.view, x2 => x2.close());
          return;
        }

        this.view.clear();
        this.view.attach();
        this.view.add(new PlainMessageView({
          message,
          className: 'inspect-message',
          raw: true
        }));

        this._lastInspectionResult = message;
        return;
      }

      console.error('Inspector: Rendering error:', mimetype, el);
      atom.notifications.addInfo('Cannot render introspection result!');
      __guard__(this.view, x3 => x3.close());
    };

    let onError = error => {
      console.error('Inspector: Rendering error:', error);
      atom.notifications.addInfo('Cannot render introspection result!');
      return __guard__(this.view, x1 => x1.close());
    };

    return transform(result.data).then(onInspectResult, onError);
  }
};

var transform = transformime.createTransform();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
