/* @flow */

import { allowUnsafeNewFunction } from "loophole";
import React from "react";
import { List as ImmutableList } from "immutable";
import { observer } from "mobx-react";
import {
  standardTransforms,
  standardDisplayOrder,
  registerTransform,
  richestMimetype
} from "@nteract/transforms";
import { Display } from "@nteract/display-area";

import type { IObservableArray, IObservableValue } from "mobx";
import type { ImmutableOutput } from "@nteract/commutable/lib/types";

// Due to Atom's CSP we need to use loophole :(
let PlotlyTransform;
allowUnsafeNewFunction(() => {
  PlotlyTransform = require("@nteract/transform-plotly").default;
});

// We can easily add other transforms here:
const additional = [PlotlyTransform];

// $FlowFixMe
const { transforms, displayOrder } = additional.reduce(registerTransform, {
  transforms: standardTransforms,
  displayOrder: standardDisplayOrder
});

type Outputs = IObservableArray<ImmutableOutput>;
type Props = {
  outputs: Outputs,
  status: IObservableValue<string>,
  showStatus: boolean,
  multiline: boolean
};
type StatusProps = { status: IObservableValue<string> };

const Status = observer(({ status }: StatusProps) => {
  switch (status.get()) {
    case "running":
      return (
        <div className="spinner">
          <div className="rect1" />
          <div className="rect2" />
          <div className="rect3" />
          <div className="rect4" />
          <div className="rect5" />
        </div>
      );
    case "ok":
      return <div className="bubble-status-container icon icon-check" />;
    default:
      return <div className="bubble-status-container icon icon-x" />;
  }
});

const ResultViewComponent = observer(
  ({ outputs, status, showStatus = true, multiline = false }: Props) => {
    if (isStatus(outputs, showStatus)) return <Status status={status} />;
    isPlain(outputs, multiline)
      ? console.log("Single Line output")
      : console.log("Multi Line output");
    return (
      <Display
        outputs={ImmutableList(outputs.peek())}
        displayOrder={displayOrder}
        transforms={transforms}
      />
    );
  }
);

const isStatus = (outputs: Outputs, showStatus: boolean) => {
  return showStatus && outputs.length === 0;
};

const isSingeLine = (text: string) => {
  return (
    text.length < 50 &&
    (text.indexOf("\n") === text.length - 1 || text.indexOf("\n") === -1)
  );
};

const isPlain = (outputs: Outputs, multiline: boolean) => {
  if (multiline || outputs.length !== 1) return false;

  const output = outputs[0];
  switch (output.get("output_type")) {
    case "execute_result":
    case "display_data": {
      const bundle = output.get("data");
      const mimetype = richestMimetype(bundle, displayOrder, transforms);
      return mimetype === "text/plain"
        ? isSingeLine(bundle.get(mimetype))
        : false;
    }
    case "stream": {
      return isSingeLine(output.get("text"));
    }
    default: {
      return false;
    }
  }
};

export default ResultViewComponent;
