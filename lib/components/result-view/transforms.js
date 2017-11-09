/* @flow */

import {
  standardTransforms,
  standardDisplayOrder,
  registerTransform
} from "@nteract/transforms";
import PlotlyTransform from "@nteract/transform-plotly";
import { VegaLite, Vega } from "@nteract/transform-vega";

// We can easily add other transforms here:
const additionalTransforms: Array<any> = [PlotlyTransform, VegaLite, Vega];

export const { transforms, displayOrder } = additionalTransforms.reduce(
  registerTransform,
  {
    transforms: standardTransforms,
    displayOrder: standardDisplayOrder
  }
);
