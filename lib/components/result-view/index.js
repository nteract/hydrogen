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
  outputStore: OutputStore;

  destroy = () => {
    this.disposer.dispose();
    this.marker.destroy();
  };

  constructor(
    markerStore: MarkerStore,
    kernel: ?Kernel,
    editor: atom$TextEditor,
    row: number,
    showResult: boolean = true
  ) {
    const element = document.createElement("div");
    element.classList.add("hydrogen", "marker");

    this.disposer = new CompositeDisposable();

    markerStore.clearOnRow(row);

    this.marker = editor.markBufferPosition([row, Infinity], {
      invalidate: "touch"
    });

    this.outputStore = new OutputStore();
    this.outputStore.updatePosition({
      lineLength: editor.getBuffer().lineLengthForRow(row),
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
        this.outputStore.updatePosition({
          lineLength: this.marker.getStartBufferPosition().column
        });
      }
    });

    markerStore.new(this);

    reactFactory(
      <ResultViewComponent
        store={this.outputStore}
        kernel={kernel}
        destroy={this.destroy}
        showResult={showResult}
      />,
      element,
      null,
      this.disposer
    );
  }
}
