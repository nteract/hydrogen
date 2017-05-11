/* @flow */

import { CompositeDisposable, Point } from "atom";
import React from "react";
import { action, observable } from "mobx";
import { createImmutableOutput } from "@nteract/commutable";

import { reactFactory } from "./../../utils";
import ResultViewComponent from "./result-view";

import type { IObservableArray, IObservableValue } from "mobx";

import type { ImmutableOutput } from "@nteract/commutable/lib/types";

import type { Output, StreamOutput } from "@nteract/commutable/lib/v4";

const outputTypes = ["execute_result", "display_data", "stream", "error"];

/**
 * https://github.com/nteract/hydrogen/issues/466#issuecomment-274822937
 * An output can be a stream of data that does not arrive at a single time. This
 * function handles the different types of outputs and accumulates the data
 * into a reduced output.
 *
 * @param {Array<Object>} outputs - Kernel output messages
 * @param {Object} output - Outputted to be reduced into list of outputs
 * @return {Array<Object>} updated-outputs - Outputs + Output
 */
export function reduceOutputs(
  outputs: IObservableArray<ImmutableOutput>,
  output: Output
): IObservableArray<any> {
  const last = outputs.length - 1;
  if (
    outputs.length > 0 &&
    output.output_type === "stream" &&
    outputs[last].get("output_type") === "stream"
  ) {
    const stream: StreamOutput = output;
    outputs[last] = outputs[last].update("text", text => text + stream.text);
    return outputs;
  }
  outputs.push(createImmutableOutput(output));
  return outputs;
}

export default class ResultView {
  outputs: IObservableArray<Object> = observable.shallowArray();
  status: IObservableValue<string> = observable("running");
  executionCount: IObservableValue<?number> = observable(null);
  @observable position: Object;

  element: HTMLElement;
  disposer: atom$CompositeDisposable;
  marker: ?atom$Marker;

  destroy = () => {
    this.disposer.dispose();
    if (this.marker) this.marker.destroy();
  };

  constructor(
    opts: { marker?: atom$Marker, position?: Object, props?: Object }
  ) {
    this.marker = opts.marker;
    this.position = opts.position || {};
    this.element = document.createElement("div");
    this.element.classList.add("hydrogen", "output-bubble");

    this.disposer = new CompositeDisposable();

    reactFactory(
      <ResultViewComponent
        outputs={this.outputs}
        status={this.status}
        executionCount={this.executionCount}
        destroy={this.destroy}
        position={this.position}
        {...opts.props}
      />,
      this.element,
      null,
      this.disposer
    );
  }

  @action appendOutput(message: Object) {
    if (message.stream === "execution_count") {
      this.executionCount.set(message.data);
    } else if (message.stream === "status") {
      this.status.set(message.data);
    } else if (outputTypes.indexOf(message.output_type) > -1) {
      // $FlowFixMe
      this.outputs = reduceOutputs(this.outputs, message);
    }
  }

  @action updatePosition(
    position: {
      lineHeight?: number,
      lineLength?: number,
      editorWidth?: number
    }
  ) {
    Object.assign(this.position, position);
  }
}
