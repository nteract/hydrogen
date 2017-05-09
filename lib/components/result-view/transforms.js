/* @flow */

import { allowUnsafeNewFunction } from "loophole";
import {
  standardTransforms,
  standardDisplayOrder,
  registerTransform
} from "@nteract/transforms";

// Due to Atom's CSP we need to use loophole :(
let PlotlyTransform;
allowUnsafeNewFunction(() => {
  PlotlyTransform = require("@nteract/transform-plotly").default;
});

// We can easily add other transforms here:
const additionalTransforms: Array<any> = [PlotlyTransform];

export const {
  transforms,
  displayOrder
} = additionalTransforms.reduce(registerTransform, {
  transforms: standardTransforms,
  displayOrder: standardDisplayOrder
});
