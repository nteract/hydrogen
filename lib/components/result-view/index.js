/* @flow */

import { Point } from "atom";
import React from "react";
import { action, observable } from "mobx";

import { reactFactory } from "./../../utils";
import ResultViewComponent from "./component";

import type { IObservableArray, IObservableValue } from "mobx";

const outputTypes = ["execute_result", "display_data", "stream", "error"];

/**
 * https://github.com/nteract/hydrogen/issues/466#issuecomment-274822937
 * An output can be a stream of data that does not arrive at a single time. This
 * function handles the different types of outputs and accumulates the data
 * into a reduced output.
 *
 * @param {IObservableArray<Object>} outputs - Kernel output messages
 * @param {Object} output - Outputted to be reduced into list of outputs
 * @return {Array<Object>} updated-outputs - Outputs + Output
 */
export function reduceOutputs(
  outputs: IObservableArray<Object>,
  output: Object
) {
  const lastOutputIndex = outputs.length - 1;
  if (
    outputs.length > 0 &&
    outputs[lastOutputIndex].output_type === "stream" &&
    output.output_type === "stream"
  ) {
    outputs[lastOutputIndex].text = outputs[lastOutputIndex].text + output.text;
    return outputs;
  }
  outputs.push(output);
  return outputs;
}

export default class ResultView {
  outputs: IObservableArray<Object> = observable([]);
  status: IObservableValue<string> = observable("running");
  executionCount: ?number = null;
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

  @action appendOutput(message: Object) {
    if (message.stream === "execution_count") {
      this.executionCount = message.data;
    } else if (message.stream === "status") {
      this.status.set(message.data);
    } else if (outputTypes.indexOf(message.output_type) > -1) {
      reduceOutputs(this.outputs, message);
    }
  }
}
