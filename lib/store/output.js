/* @flow */

import { action, computed, observable } from "mobx";
import { createImmutableOutput } from "@nteract/commutable";
import { richestMimetype } from "@nteract/transforms";
import {
  escapeCarriageReturn,
  escapeCarriageReturnSafe
} from "escape-carriage";

import {
  transforms,
  displayOrder
} from "./../components/result-view/transforms";

import type { IObservableArray } from "mobx";
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
  outputs: Array<ImmutableOutput>,
  output: Output
): Array<any> {
  const last = outputs.length - 1;
  if (
    outputs.length > 0 &&
    output.output_type === "stream" &&
    outputs[last].get("output_type") === "stream"
  ) {
    const stream: StreamOutput = output;

    function appendText(previous: ImmutableOutput, next: StreamOutput) {
      return previous.update("text", text =>
        escapeCarriageReturnSafe(text + next.text)
      );
    }

    if (outputs[last].get("name") === stream.name) {
      outputs[last] = appendText(outputs[last], stream);
      return outputs;
    }

    if (outputs.length > 1 && outputs[last - 1].get("name") === stream.name) {
      outputs[last - 1] = appendText(outputs[last - 1], stream);
      return outputs;
    }
  }
  outputs.push(createImmutableOutput(output));
  return outputs;
}

function isSingeLine(text: string, availableSpace: number) {
  // If it turns out escapeCarriageReturn is a bottleneck, we should remove it.
  return (
    (text.indexOf("\n") === -1 || text.indexOf("\n") === text.length - 1) &&
    availableSpace > escapeCarriageReturn(text).length
  );
}

export default class OutputStore {
  outputs: IObservableArray<Object> = observable.shallowArray();
  @observable status: string = "running";
  @observable executionCount: ?number = null;
  @observable index: number = -1;
  @observable position = {
    lineHeight: 0,
    lineLength: 0,
    editorWidth: 0
  };

  @computed get isPlain(): boolean {
    if (this.outputs.length !== 1) return false;

    const availableSpace = this.position.editorWidth - this.position.lineLength;
    if (availableSpace <= 0) return false;

    const output = this.outputs[0];
    switch (output.get("output_type")) {
      case "execute_result":
      case "display_data": {
        const bundle = output.get("data");
        const mimetype = richestMimetype(bundle, displayOrder, transforms);
        return mimetype === "text/plain"
          ? isSingeLine(bundle.get(mimetype), availableSpace)
          : false;
      }
      case "stream": {
        return isSingeLine(output.get("text"), availableSpace);
      }
      default: {
        return false;
      }
    }
  }

  @action appendOutput(message: Object) {
    if (message.stream === "execution_count") {
      this.executionCount = message.data;
    } else if (message.stream === "status") {
      this.status = message.data;
    } else if (outputTypes.indexOf(message.output_type) > -1) {
      // $FlowFixMe
      this.outputs = reduceOutputs(this.outputs, message);
      this.setIndex(this.outputs.length - 1);
    }
  }

  @action updatePosition(position: {
    lineHeight?: number,
    lineLength?: number,
    editorWidth?: number
  }) {
    Object.assign(this.position, position);
  }

  @action setIndex = (index: number) => {
    this.index = index < this.outputs.length ? index : this.outputs.length - 1;
  };

  @action incrementIndex = () => {
    this.index = this.index < this.outputs.length - 1
      ? this.index + 1
      : this.outputs.length - 1;
  };

  @action decrementIndex = () => {
    this.index = this.index > 0 ? this.index - 1 : 0;
  };
}
