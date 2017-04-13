"use babel";

import { TextEditor } from "atom";

import ResultView from "./result-view";
import { log } from "./utils";

export default class WatchView {
  constructor(kernel) {
    this.kernel = kernel;
    this.element = document.createElement("div");
    this.element.classList.add("hydrogen", "watch-view");

    this.inputEditor = new TextEditor();
    this.inputEditor.element.classList.add("watch-input");
    this.inputEditor.setGrammar(this.kernel.grammar);
    this.inputEditor.setSoftWrapped(true);
    this.inputEditor.setLineNumberGutterVisible(false);
    this.inputEditor.moveToTop();

    this.resultView = new ResultView();
    this.resultView.setMultiline(true);

    this.element.appendChild(this.inputEditor.element);
    this.element.appendChild(this.resultView.element);

    this.addHistorySwitch().clearHistory();
  }

  clearHistory(currentHistory = []) {
    this.currentHistory = currentHistory;
    return this;
  }

  addToHistory(result) {
    if (result.stream === "status" || result.stream === "execution_count")
      return;
    this.currentHistory.push(result);
    this.currentHistory.pos = this.currentHistory.length - 1;
    this.counter
      .innerText = `${this.currentHistory.length} / ${this.currentHistory.length}`;
    const total = this.currentHistory.length * this.scrollbar.offsetWidth;
    this.scrollbar.querySelector(".hidden").style.width = `${total}px`;
    this.scrollbar.scrollLeft = total;
    this.historySwitch.classList.add("show");
  }

  addHistorySwitch() {
    this.historySwitch = document.createElement("div");
    this.historySwitch.classList.add("history-switch", "hide");

    this.scrollbar = document.createElement("div");
    const filler = document.createElement("div");
    this.scrollbar.classList.add("scrollbar");
    filler.classList.add("hidden");
    this.scrollbar.appendChild(filler);
    this.scrollbar.onscroll = () => {
      this.currentHistory.pos = Math.ceil(
        this.scrollbar.scrollLeft / (this.scrollbar.offsetWidth + 1)
      );
      this.counter
        .innerText = `${this.currentHistory.pos + 1} / ${this.currentHistory.length}`;
      this.clearResults();
      this.resultView.addResult(this.currentHistory[this.currentHistory.pos]);
    };

    this.counter = document.createElement("div");
    this.counter.classList.add("counter");

    const nextButton = document.createElement("button");
    nextButton.classList.add(
      "btn",
      "btn-xs",
      "icon",
      "icon-chevron-right",
      "next-btn"
    );
    nextButton.onclick = () => {
      if (
        this.currentHistory.pos &&
        this.currentHistory.pos !== this.currentHistory.length - 1
      ) {
        this.currentHistory.pos += 1;
        this.counter
          .innerText = `${this.currentHistory.pos + 1} / ${this.currentHistory.length}`;
        this.scrollbar.scrollLeft =
          this.currentHistory.pos * (this.scrollbar.offsetWidth + 1);
        this.clearResults();
        this.resultView.addResult(this.currentHistory[this.currentHistory.pos]);
      }
    };

    const prevButton = document.createElement("button");
    prevButton.classList.add("btn", "btn-xs", "icon", "icon-chevron-left");
    prevButton.onclick = () => {
      if (this.currentHistory.pos && this.currentHistory.pos !== 0) {
        this.currentHistory.pos -= 1;
        this.counter
          .innerText = `${this.currentHistory.pos + 1} / ${this.currentHistory.length}`;
        this.scrollbar.scrollLeft =
          this.currentHistory.pos * (this.scrollbar.offsetWidth + 1);
        this.clearResults();
        this.resultView.addResult(this.currentHistory[this.currentHistory.pos]);
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
    const code = this.getCode();
    this.clearResults();
    log("watchview running:", code);
    if (code && code.length && code.length > 0) {
      this.kernel.executeWatch(code, result => {
        log("watchview got result:", result);
        this.resultView.addResult(result);
        this.addToHistory(result);
      });
    }
  }

  setCode(code) {
    this.inputEditor.setText(code);
  }

  getCode() {
    return this.inputEditor.getText();
  }

  focus() {
    this.inputEditor.element.focus();
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
    this.element.appendChild(this.resultView.element);
  }

  destroy() {
    this.clearResults();
    this.element.parentNode.removeChild(this.element);
  }
}
