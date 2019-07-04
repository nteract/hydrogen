/* @flow */

import React from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import {
  DisplayData,
  ExecuteResult,
  StreamText,
  KernelOutputError,
  Output,
  Media,
  RichMedia
} from "@nteract/outputs";
import PlotlyTransform from "@nteract/transform-plotly";
import { VegaLite1, VegaLite2, Vega2, Vega3 } from "@nteract/transform-vega";

import transforms from "./../transforms";

export function isTextOutputOnly(data: Object) {
  const supported = React.Children.map(
    transforms.components,
    mediaComponent => mediaComponent.props.mediaType
  );
  const bundleMediaTypes = [...Object.keys(data)].filter(mediaType =>
    supported.includes(mediaType)
  );

  return bundleMediaTypes.length === 1 && bundleMediaTypes[0] === "text/plain"
    ? true
    : false;
}

@observer
class Display extends React.Component<{ output: any }> {
  render() {
    return (
      <Output output={toJS(this.props.output)}>
        <ExecuteResult expanded>{transforms.components}</ExecuteResult>
        <DisplayData expanded>{transforms.components}</DisplayData>
        <StreamText expanded />
        <KernelOutputError expanded />
      </Output>
    );
  }
}

export default Display;
