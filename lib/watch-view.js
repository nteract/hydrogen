import { TextEditorView } from 'atom-space-pen-views';

import ResultView from './result-view';

export default class WatchView {

    constructor(kernel) {
        this.kernel = kernel;
        this.element = document.createElement('div');
        this.element.classList.add('hydrogen', 'watch-view');

        this.inputElement = new TextEditorView();
        this.inputElement.element.classList.add('watch-input');

        this.inputEditor = this.inputElement.getModel();
        this.inputEditor.setGrammar(this.kernel.grammar);
        this.inputEditor.setSoftWrapped(true);
        this.inputEditor.setLineNumberGutterVisible(false);
        this.inputEditor.moveToTop();

        this.resultView = new ResultView();
        this.resultView.setMultiline(true);

        this.element.appendChild(this.inputElement.element);
        this.element.appendChild(this.resultView.element);

        this.addHistorySwitch().clearHistory();
    }

    clearHistory(currentHistory=[]) { this.currentHistory = currentHistory; return this; }
    addToHistory(result) {
        let total;
        if (result.data === 'ok') { return; }
        this.currentHistory.push(result);
        this.currentHistory.pos = this.currentHistory.length - 1;
        this.counter.innerText = `${this.currentHistory.length} / ${this.currentHistory.length}`;
        this.scrollbar.querySelector('.hidden').style.width =
            (total = this.currentHistory.length * this.scrollbar.offsetWidth) + 'px';
        this.scrollbar.scrollLeft = total;
        this.historySwitch.classList.add('show');
        return this;
    }

    addHistorySwitch() {
        this.historySwitch = document.createElement('div');
        this.historySwitch.classList.add('history-switch', 'hide');

        this.scrollbar = document.createElement('div');
        let filler = document.createElement('div');
        this.scrollbar.classList.add('scrollbar');
        filler.classList.add('hidden');
        this.scrollbar.appendChild(filler);
        this.scrollbar.onscroll = () => {
            this.currentHistory.pos = Math.ceil(this.scrollbar.scrollLeft / (this.scrollbar.offsetWidth+1));
            this.counter.innerText = `${this.currentHistory.pos+1} / ${this.currentHistory.length}`;
            this.clearResults();
            return this.resultView.addResult(this.currentHistory[this.currentHistory.pos]);
        };

        this.counter = document.createElement('div');
        this.counter.classList.add('counter');

        let nextButton = document.createElement('button');
        nextButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-right', 'next-btn');
        nextButton.onclick = () => {
            if (this.currentHistory.pos !== this.currentHistory.length - 1 && (this.currentHistory.pos != null)) {
                this.currentHistory.pos += 1;
                this.counter.innerText = `${this.currentHistory.pos+1} / ${this.currentHistory.length}`;
                this.scrollbar.scrollLeft = this.currentHistory.pos * (this.scrollbar.offsetWidth+1);
                this.clearResults();
                return this.resultView.addResult(this.currentHistory[this.currentHistory.pos]);
            }
        };

        let prevButton = document.createElement('button');
        prevButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-left');
        prevButton.onclick = () => {
            if (this.currentHistory.pos !== 0 && (this.currentHistory.pos != null)) {
                this.currentHistory.pos -= 1;
                this.counter.innerText = `${this.currentHistory.pos+1} / ${this.currentHistory.length}`;
                this.scrollbar.scrollLeft = this.currentHistory.pos * (this.scrollbar.offsetWidth+1);
                this.clearResults();
                return this.resultView.addResult(this.currentHistory[this.currentHistory.pos]);
            }
        };

        this.historySwitch.appendChild(prevButton);
        this.historySwitch.appendChild(this.counter);
        this.historySwitch.appendChild(nextButton);
        this.historySwitch.appendChild(this.scrollbar);
        this.element.appendChild(this.historySwitch);
        return this;
    }

    run() {
        let code = this.getCode();
        this.clearResults();
        console.log('watchview running:', code);
        if ((code != null) && (code.length != null) && code.length > 0) {
            return this.kernel.executeWatch(code, result => {
                console.log('watchview got result:', result);
                this.resultView.addResult(result);
                return this.addToHistory(result);
            }
            );
        }
    }

    setCode(code) {
        this.inputEditor.setText(code);
        return this;
    }

    getCode() {
        return this.inputElement.getText();
    }

    clearResults() {
        try {
            this.element.removeChild(this.resultView.element);
            this.resultView.destroy();
        } catch (e) {
            console.error(e);
        }

        this.resultView = new ResultView();
        this.resultView.setMultiline(true);
        return this.element.appendChild(this.resultView.element);
    }

    destroy() {
        this.clearResults();
        return this.element.parentNode.removeChild(this.element);
    }
};
