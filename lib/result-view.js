'use babel';

import { CompositeDisposable } from 'atom';

import * as transformime from 'transformime';
import MarkdownTransform from 'transformime-marked';

const transform = transformime.createTransform([MarkdownTransform]);

export default class ResultView {

  constructor(marker) {
    this.marker = marker;

    this.element = document.createElement('div');
    this.element.classList.add('hydrogen', 'result-view', 'hidden');

    this.outputContainer = document.createElement('div');
    this.outputContainer.classList.add('output-container', 'hidden');

    this.statusContainer = document.createElement('div');
    this.statusContainer.classList.add('status-container');

    this.spinner = this.buildSpinner();

    const actionPanel = document.createElement('div');
    actionPanel.classList.add('action-panel');

    const copyButton = document.createElement('div');
    copyButton.classList.add('action-button', 'icon', 'icon-clippy');
    copyButton.onclick = () => {
      atom.clipboard.write(this.getAllText());
      atom.notifications.addSuccess('Copied to clipboard');
    };

    const openButton = document.createElement('div');
    openButton.classList.add('action-button', 'icon', 'icon-file-symlink-file');
    openButton.onclick = () => {
      const bubbleText = this.getAllText();
      atom.workspace.open().then(editor => editor.insertText(bubbleText));
    };


    const closeButton = document.createElement('div');
    closeButton.classList.add('action-button', 'icon', 'icon-x');
    closeButton.onclick = () => this.destroy();

    actionPanel.appendChild(copyButton);
    actionPanel.appendChild(openButton);
    actionPanel.appendChild(closeButton);

    this.element.appendChild(actionPanel);
    this.element.appendChild(this.outputContainer);
    this.element.appendChild(this.statusContainer);
    this.statusContainer.appendChild(this.spinner);


    this.tooltips = new CompositeDisposable();
    this.addCopyTooltip(copyButton);
    this.tooltips.add(atom.tooltips.add(openButton, { title: 'Open in new editor' }));

    this._hasResult = false;
    this._executionCount = null;
    this.setMultiline(false);

    return this;
  }

  addCopyTooltip(element) {
    this.tooltips.add(atom.tooltips.add(element, {
      title: () => {
        if (!this._executionCount) {
          return 'Copy to clipboard';
        }
        return `Copy to clipboard (Out[${this._executionCount}])`;
      },
    }));
  }

  addResult(result) {
    console.log('ResultView: Add result', result);

    if (result.stream === 'execution_count') {
      this._executionCount = result.data;
      return;
    }

    this.spinner.style.display = 'none';

    if (result.stream === 'status') {
      if (!this._hasResult && result.data === 'ok') {
        console.log('ResultView: Show status container');
        this.statusContainer.classList.add('icon', 'icon-check');
        this.statusContainer.style.display = 'inline-block';
      }
      return;
    }

    this.outputContainer.classList.remove('hidden');
    this.element.classList.remove('hidden');

    const onSuccess = ({ mimetype, el }) => {
      console.log('ResultView: Hide status container');
      this._hasResult = true;
      this.statusContainer.style.display = 'none';

      const mimeType = mimetype;
      let htmlElement = el;

      if (mimeType === 'text/plain') {
        const previousText = this.getAllText();
        const text = result.data['text/plain'];
        if (previousText === '' && text.length < 50 && text.indexOf('\n') === -1) {
          this.setMultiline(false);
          // this.addCopyTooltip(this.outputContainer);

          this.outputContainer.onclick = () => {
            atom.clipboard.write(this.getAllText());
            atom.notifications.addSuccess('Copied to clipboard');
          };
        } else {
          this.setMultiline(true);
        }
      } else {
        this.setMultiline(true);
      }

      if (mimeType === 'application/pdf') {
        const webview = document.createElement('webview');
        webview.src = htmlElement.href;
        htmlElement = webview;
      }

      if ((result.stream === 'stderr' || result.stream === 'error') &&
      this.outputContainer.getElementsByTagName('span').length === 0) {
        this.outputContainer.classList.add('plain-error');
      } else {
        this.outputContainer.classList.remove('plain-error');
      }

      console.log('ResultView: Rendering as MIME ', mimeType);
      console.log('ResultView: Rendering as ', htmlElement);
      this.outputContainer.appendChild(htmlElement);
    };

    const onError = error => console.error('ResultView: Rendering error:', error);

    transform(result.data).then(onSuccess, onError);
  }


  getAllText() {
    const resultText = this.outputContainer.innerText.trim();
    return (resultText.length > 0) ? resultText : '';
  }


  setMultiline(multiline) {
    if (multiline) {
      this.element.classList.add('multiline');
    } else {
      this.element.classList.remove('multiline');
    }
  }


  buildSpinner() {
    const container = document.createElement('div');
    container.classList.add('spinner');

    const rect1 = document.createElement('div');
    rect1.classList.add('rect1');
    const rect2 = document.createElement('div');
    rect2.classList.add('rect2');
    const rect3 = document.createElement('div');
    rect3.classList.add('rect3');
    const rect4 = document.createElement('div');
    rect4.classList.add('rect4');
    const rect5 = document.createElement('div');
    rect5.classList.add('rect5');

    container.appendChild(rect1);
    container.appendChild(rect2);
    container.appendChild(rect3);
    container.appendChild(rect4);
    container.appendChild(rect5);

    return container;
  }

  spin(shouldSpin) {
    if (shouldSpin) {
      this.element.classList.remove('hidden');
      this.spinner.style.display = 'block';
    } else {
      this.spinner.style.display = 'none';
    }
  }

  destroy() {
    this.tooltips.dispose();
    if (this.marker) {
      this.marker.destroy();
    }
    this.element.innerHTML = '';
  }
}
