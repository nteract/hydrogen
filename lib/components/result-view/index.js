/* @flow */

import { Point } from "atom";
import React from "react";
import { observable } from "mobx";
import { createImmutableOutput } from "@nteract/commutable";

import { reactFactory } from "./../../utils";
import ResultViewComponent from "./component";

import type { IObservableArray, IObservableValue } from "mobx";
import type { Map as ImmutableMap } from "immutable";

const outputTypes = ["execute_result", "display_data", "stream", "error"];

export default class ResultView {
  outputs: IObservableArray<ImmutableMap<any>> = observable([]);
  status: IObservableValue<string> = observable("running");
  executionCount = null;
  constructor(editor: atom$TextEditor, row: number) {
    const point = new Point(row, editor.getBuffer().lineLengthForRow(row));

    const marker = editor.markBufferPosition(point, { invalidate: "touch" });

    const element = document.createElement("div");
    element.classList.add("hydrogen", "output-bubble");

    reactFactory(
      <ResultViewComponent outputs={this.outputs} status={this.status} />,
      element
    );

    editor.decorateMarker(marker, {
      type: "block",
      item: element,
      position: "after"
    });
  }

  appendOutput(message: Object) {
    if (message.stream === "execution_count") {
      this.executionCount = message.data;
    } else if (message.stream === "status") {
      this.status.set(message.data);
    } else if (outputTypes.indexOf(message.output_type) > -1) {
      this.outputs.push(createImmutableOutput(message));
    }
  }
}
