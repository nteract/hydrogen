/* @flow */

import {
  standardTransforms,
  standardDisplayOrder,
  registerTransform
} from "@nteract/transforms";
import PlotlyTransform from "@nteract/transform-plotly";
import { VegaLite1, VegaLite2, Vega2, Vega3 } from "@nteract/transform-vega";

// We can easily add other transforms here:
const additionalTransforms: Array<any> = [
  PlotlyTransform,
  VegaLite1,
  VegaLite2,
  Vega2,
  Vega3
];

export const { transforms, displayOrder } = additionalTransforms.reduce(
  registerTransform,
  {
    transforms: standardTransforms,
    displayOrder: standardDisplayOrder
  }
);
