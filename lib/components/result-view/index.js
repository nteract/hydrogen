/* @flow */

import { CompositeDisposable, Point } from "atom";
import React from "react";

import { reactFactory } from "./../../utils";
import OutputStore from "./../../store/output";
import ResultViewComponent from "./result-view";

import type MarkerStore from "./../../store/markers";
import type Kernel from "./../../kernel";

export default class ResultView {
  disposer: atom$CompositeDisposable;
  marker: atom$Marker;

  destroy = () => {
    this.disposer.dispose();
    this.marker.destroy();
  };

  constructor(
    markerStore: MarkerStore,
    kernel: Kernel,
    editor: atom$TextEditor,
    row: number,
    showResult: boolean = true
  ) {
    const element = document.createElement("div");
    element.classList.add("hydrogen", "marker");

    this.disposer = new CompositeDisposable();

    markerStore.clearOnRow(row);

    const buffer = editor.getBuffer();
    const lineLength = buffer.lineLengthForRow(row);

    const point = new Point(row, lineLength);
    this.marker = editor.markBufferPosition(point, { invalidate: "touch" });
    const lineHeight = editor.getLineHeightInPixels();

    const outputStore = new OutputStore();
    outputStore.updatePosition({
      lineLength: lineLength,
      lineHeight: editor.getLineHeightInPixels(),
      editorWidth: editor.getEditorWidthInChars()
    });

    editor.decorateMarker(this.marker, {
      type: "block",
      item: element,
      position: "after"
    });

    this.marker.onDidChange(event => {
      if (!event.isValid) {
        markerStore.delete(this.marker.id);
      } else {
        outputStore.updatePosition({
          lineLength: this.marker.getStartBufferPosition().column
        });
      }
    });

    markerStore.new(this);

    reactFactory(
      <ResultViewComponent
        store={outputStore}
        kernel={kernel}
        destroy={this.destroy}
        showResult={showResult}
      />,
      element,
      null,
      this.disposer
    );

    return outputStore;
  }
}
