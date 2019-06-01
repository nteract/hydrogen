/* @flow */

import React from "react";
import { Media } from "@nteract/outputs";
import PlotlyTransform from "@nteract/transform-plotly";
import { VegaLite1, VegaLite2, Vega2, Vega3 } from "@nteract/transform-vega";

PlotlyTransform.defaultProps = {
  ...PlotlyTransform.defaultProps,
  mediaType: PlotlyTransform.MIMETYPE
};

VegaLite1.defaultProps = {
  ...VegaLite1.defaultProps,
  mediaType: VegaLite1.MIMETYPE
};

VegaLite2.defaultProps = {
  ...VegaLite2.defaultProps,
  mediaType: VegaLite2.MIMETYPE
};

Vega2.defaultProps = {
  ...Vega2.defaultProps,
  mediaType: Vega2.MIMETYPE
};

Vega3.defaultProps = {
  ...Vega3.defaultProps,
  mediaType: Vega3.MIMETYPE
};

// We can easily add other transforms here:
export const MediaTypes: Array<any> = [
  Media.Json,
  Media.JavaScript,
  Media.HTML,
  Media.Markdown,
  Media.LaTeX,
  Media.SVG,
  Media.Image,
  Media.Plain,
  PlotlyTransform,
  VegaLite1,
  VegaLite2,
  Vega2,
  Vega3
];

export const MediaComponents = () => {
  let arr = [];
  MediaTypes.forEach(Component => {
    arr.push(<Component key={arr.length} />);
  });
  return arr;
};
