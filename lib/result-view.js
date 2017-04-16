"use babel";

import { CompositeDisposable } from "atom";
import { allowUnsafeNewFunction } from "loophole";
import {
  standardTransforms,
  standardDisplayOrder,
  registerTransform,
  richestMimetype
} from "@nteract/transforms";
import React from "react";
import ReactDOM from "react-dom";
import { Map as ImmutableMap } from "immutable";

import { log } from "./utils";

// Due to Atom's CSP we need to use loophole :(
let PlotlyTransform;
allowUnsafeNewFunction(() => {
  PlotlyTransform = require("@nteract/transform-plotly").default;
});

// We can easily add other transforms here:
const additionalTransforms = [PlotlyTransform];

const {
  transforms,
  displayOrder
} = additionalTransforms.reduce(registerTransform, {
  transforms: standardTransforms,
  displayOrder: standardDisplayOrder
});

export default class ResultViewOld {
  constructor(marker) {
    this.marker = marker;
    this.element = document.createElement("div");
    this.element.classList.add("hydrogen", "output-bubble", "hidden");

    const outputContainer = document.createElement("div");
    outputContainer.classList.add("bubble-output-container");
    const onWheel = event => {
      const clientHeight = outputContainer.clientHeight;
      const scrollHeight = outputContainer.scrollHeight;
      const scrollTop = outputContainer.scrollTop;
      const atTop = scrollTop !== 0 && event.deltaY < 0;
      const atBottom =
        scrollTop !== scrollHeight - clientHeight && event.deltaY > 0;

      if (clientHeight < scrollHeight && (atTop || atBottom)) {
        event.stopPropagation();
      }
    };
    outputContainer.addEventListener("wheel", onWheel, { passive: true });
    this.element.appendChild(outputContainer);

    this.resultContainer = document.createElement("div");
    this.resultContainer.classList.add("bubble-result-container");
    outputContainer.appendChild(this.resultContainer);

    this.errorContainer = document.createElement("div");
    this.errorContainer.classList.add("bubble-error-container");
    outputContainer.appendChild(this.errorContainer);

    this.statusContainer = document.createElement("div");
    this.statusContainer.classList.add("bubble-status-container");
    this.spinner = this.buildSpinner();
    this.statusContainer.appendChild(this.spinner);
    outputContainer.appendChild(this.statusContainer);

    const richCloseButton = document.createElement("div");
    richCloseButton.classList.add("rich-close-button", "icon", "icon-x");
    richCloseButton.onclick = () => this.destroy();
    this.element.appendChild(richCloseButton);

    const actionPanel = document.createElement("div");
    actionPanel.classList.add("bubble-action-panel");
    this.element.appendChild(actionPanel);

    const closeButton = document.createElement("div");
    closeButton.classList.add(
      "action-button",
      "close-button",
      "icon",
      "icon-x"
    );
    closeButton.onclick = () => this.destroy();
    actionPanel.appendChild(closeButton);

    const padding = document.createElement("div");
    padding.classList.add("padding");
    actionPanel.appendChild(padding);

    const copyButton = document.createElement("div");
    copyButton.classList.add(
      "action-button",
      "copy-button",
      "icon",
      "icon-clippy"
    );
    copyButton.onclick = () => {
      atom.clipboard.write(this.getAllText());
      atom.notifications.addSuccess("Copied to clipboard");
    };
    actionPanel.appendChild(copyButton);

    const openButton = document.createElement("div");
    openButton.classList.add(
      "action-button",
      "open-button",
      "icon",
      "icon-file-symlink-file"
    );
    openButton.onclick = () => {
      const bubbleText = this.getAllText();
      atom.workspace.open().then(editor => editor.insertText(bubbleText));
    };
    actionPanel.appendChild(openButton);

    this.setMultiline(false);

    this.tooltips = new CompositeDisposable();
    this.addCopyTooltip(copyButton);
    this.tooltips.add(
      atom.tooltips.add(openButton, { title: "Open in new editor" })
    );

    this._hasResult = false;
    this._executionCount = null;

    return this;
  }

  addCopyTooltip(element) {
    this.tooltips.add(
      atom.tooltips.add(element, {
        title: () => {
          if (!this._executionCount) {
            return "Copy to clipboard";
          }
          return `Copy to clipboard (Out[${this._executionCount}])`;
        }
      })
    );
  }

  addResult(result) {
    let container;

    if (result.stream === "execution_count") {
      this._executionCount = result.data;
      return;
    }

    this.spinner.classList.add("hidden");
    this.element.classList.remove("hidden");

    if (result.stream === "status") {
      if (!this._hasResult && result.data === "ok") {
        log("ResultView: Show status container");
        this.statusContainer.classList.add("icon", "icon-check");
      }
      return;
    }

    log("ResultView: Add result", result);

    if (result.stream === "stderr") {
      container = this.errorContainer;
    } else if (result.stream === "stdout") {
      container = this.resultContainer;
    } else if (result.stream === "error") {
      container = this.errorContainer;
    } else {
      container = this.resultContainer;
    }

    const bundle = new ImmutableMap(result.data);
    const mimeType = richestMimetype(bundle, displayOrder, transforms);
    if (!mimeType) {
      log("ResultView: Cannot render", bundle);
      return;
    }
    const Transform = transforms.get(mimeType);

    log("ResultView: Hide status container");
    this._hasResult = true;
    this.statusContainer.classList.add("hidden");

    // If transforms use unsafe eval, we might need to use loophole due to Atom's CSP:
    // allowUnsafeEval(() => {
    //   allowUnsafeNewFunction(() => {
    //     ReactDOM.render(<Transform data={bundle.get(mimeType)} />, div);
    //   });
    // });
    const div = document.createElement("div");
    ReactDOM.render(<Transform data={bundle.get(mimeType)} />, div);

    if (mimeType === "text/plain") {
      this.element.classList.remove("rich");
      const text = result.data["text/plain"];

      if (
        this.resultContainer.innerHTML === "" &&
        this.errorContainer.innerHTML === "" &&
        text.length < 50 &&
        (text.indexOf("\n") === text.length - 1 || text.indexOf("\n") === -1)
      ) {
        this.setMultiline(false);

        this.addCopyTooltip(container);

        container.onclick = () => {
          atom.clipboard.write(this.getAllText());
          atom.notifications.addSuccess("Copied to clipboard");
        };
      } else {
        this.setMultiline(true);
      }
    } else if (mimeType === "application/json") {
      this.setMultiline(true);
    } else {
      this.element.classList.add("rich");
      this.setMultiline(true);
    }

    log("ResultView: Rendering as MIME ", mimeType);
    // this.getAllText must be called after appending the htmlElement
    // in order to obtain innerText
    container.appendChild(div);

    if (mimeType === "text/html") {
      if (this.getAllText() !== "") {
        this.element.classList.remove("rich");
      }
    }

    if (mimeType === "image/svg+xml") {
      container.classList.add("svg");
    }

    if (mimeType === "text/markdown") {
      this.element.classList.add("markdown");
      this.element.classList.remove("rich");
    }

    if (mimeType === "text/latex") {
      this.element.classList.add("latex");
    }

    if (this.errorContainer.getElementsByTagName("span").length === 0) {
      this.errorContainer.classList.add("plain-error");
    } else {
      this.errorContainer.classList.remove("plain-error");
    }
  }

  getAllText() {
    let text = "";

    const resultText = this.resultContainer.innerText.trim();
    if (resultText.length > 0) {
      text += resultText;
    }

    const errorText = this.errorContainer.innerText.trim();
    if (errorText.length > 0) {
      text += `\n${errorText}`;
    }

    return text;
  }

  setMultiline(multiline) {
    if (multiline) {
      this.element.classList.add("multiline");
    } else {
      this.element.classList.remove("multiline");
    }
  }

  buildSpinner() {
    const container = document.createElement("div");
    container.classList.add("spinner");

    const rect1 = document.createElement("div");
    rect1.classList.add("rect1");
    const rect2 = document.createElement("div");
    rect2.classList.add("rect2");
    const rect3 = document.createElement("div");
    rect3.classList.add("rect3");
    const rect4 = document.createElement("div");
    rect4.classList.add("rect4");
    const rect5 = document.createElement("div");
    rect5.classList.add("rect5");

    container.appendChild(rect1);
    container.appendChild(rect2);
    container.appendChild(rect3);
    container.appendChild(rect4);
    container.appendChild(rect5);

    return container;
  }

  spin() {
    this.element.classList.remove("hidden");
    this.spinner.classList.remove("hidden");
  }

  destroy() {
    this.tooltips.dispose();
    if (this.marker) {
      this.marker.destroy();
    }
    [
      ...this.errorContainer.childNodes,
      ...this.resultContainer.childNodes
    ].forEach(item => {
      ReactDOM.unmountComponentAtNode(item);
    });
    this.element.innerHTML = "";
  }
}
