/* @flow */

import { Point } from "atom";
import React from "react";
import { List as ImmutableList } from "immutable";
import { observable } from "mobx";
import { createImmutableOutput } from "@nteract/commutable";

import { reactFactory } from "./../../utils";
import ResultViewComponent from "./component";

import type { Output, StreamOutput } from "@nteract/commutable/lib/v4";
import type {
  ImmutableOutput,
  ImmutableOutputs
} from "@nteract/commutable/lib/types";

const outputTypes = ["execute_result", "display_data", "stream", "error"];

export default class ResultView {
  store = observable({
    outputs: [],
    status: "running"
  });
  executionCount = null;
  constructor(editor: atom$TextEditor, row: number) {
    const point = new Point(row, editor.getBuffer().lineLengthForRow(row));

    const marker = editor.markBufferPosition(point, { invalidate: "touch" });

    const element = document.createElement("div");
    element.classList.add("hydrogen", "output-bubble");

    reactFactory(<ResultViewComponent store={this.store} />, element);

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
      this.store.status = message.data;
    } else if (outputTypes.indexOf(message.output_type) > -1) {
      this.store.outputs.push(createImmutableOutput(message));
    }
  }
}
