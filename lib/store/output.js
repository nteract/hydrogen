/* @flow */

import { action, computed, observable } from "mobx";
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
  outputs: IObservableArray<Object>,
  output: Object
): IObservableArray<Object> {
  const last = outputs.length - 1;
  if (
    outputs.length > 0 &&
    output.output_type === "stream" &&
    outputs[last].output_type === "stream"
  ) {
    function appendText(previous: Object, next: Object) {
      previous.text = escapeCarriageReturnSafe(previous.text + next.text);
    }

    if (outputs[last].name === output.name) {
      appendText(outputs[last], output);
      return outputs;
    }

    if (outputs.length > 1 && outputs[last - 1].name === output.name) {
      appendText(outputs[last - 1], output);
      return outputs;
    }
  }
  outputs.push(output);
  return outputs;
}

export function isSingeLine(text: string, availableSpace: number) {
  // If it turns out escapeCarriageReturn is a bottleneck, we should remove it.
  return (
    (text.indexOf("\n") === -1 || text.indexOf("\n") === text.length - 1) &&
    availableSpace > escapeCarriageReturn(text).length
  );
}

export default class OutputStore {
  outputs: IObservableArray<Object> = observable([]);
  @observable status: string = "running";
  @observable executionCount: ?number = null;
  @observable index: number = -1;
  @observable
  position = {
    lineHeight: 0,
    lineLength: 0,
    editorWidth: 0,
    charWidth: 0
  };

  @computed
  get isPlain(): boolean {
    if (this.outputs.length !== 1) return false;

    const availableSpace = Math.floor(
      (this.position.editorWidth - this.position.lineLength) /
        this.position.charWidth
    );
    if (availableSpace <= 0) return false;

    const output = this.outputs[0];
    switch (output.output_type) {
      case "execute_result":
      case "display_data": {
        const bundle = output.data;
        const mimetype = richestMimetype(bundle, displayOrder, transforms);
        return mimetype === "text/plain"
          ? isSingeLine(bundle[mimetype], availableSpace)
          : false;
      }
      case "stream": {
        return isSingeLine(output.text, availableSpace);
      }
      default: {
        return false;
      }
    }
  }

  @action
  appendOutput(message: Object) {
    if (message.stream === "execution_count") {
      this.executionCount = message.data;
    } else if (message.stream === "status") {
      this.status = message.data;
    } else if (outputTypes.indexOf(message.output_type) > -1) {
      reduceOutputs(this.outputs, message);
      this.setIndex(this.outputs.length - 1);
    }
  }

  @action
  updatePosition(position: {
    lineHeight?: number,
    lineLength?: number,
    editorWidth?: number
  }) {
    Object.assign(this.position, position);
  }

  @action
  setIndex = (index: number) => {
    if (index < 0) {
      this.index = 0;
    } else if (index < this.outputs.length) {
      this.index = index;
    } else {
      this.index = this.outputs.length - 1;
    }
  };

  @action
  incrementIndex = () => {
    this.index =
      this.index < this.outputs.length - 1
        ? this.index + 1
        : this.outputs.length - 1;
  };

  @action
  decrementIndex = () => {
    this.index = this.index > 0 ? this.index - 1 : 0;
  };

  @action
  clear = () => {
    this.outputs.clear();
    this.index = -1;
  };
}
