/* @flow */

import { allowUnsafeNewFunction } from "loophole";
import React from "react";
import { fromJS } from "immutable";
import { observer } from "mobx-react";
import {
  standardTransforms,
  standardDisplayOrder,
  registerTransform,
  richestMimetype
} from "@nteract/transforms";
import { Display } from "@nteract/display-area";

import type { IObservableArray, IObservableValue } from "mobx";

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

type Props = {
  outputs: IObservableArray<Object>,
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
          <div className="react1" />
          <div className="react2" />
          <div className="react3" />
          <div className="react4" />
          <div className="react5" />
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
    return showStatus && outputs.length === 0
      ? <Status status={status} />
      : <Display
          outputs={fromJS(outputs.slice())}
          displayOrder={displayOrder}
          transforms={transforms}
        />;
  }
);

export default ResultViewComponent;
