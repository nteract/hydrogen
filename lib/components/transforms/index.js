/* @flow */

import { observable, action, computed } from "mobx";

import React from "react";
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

import Markdown from "./markdown";

export class TransformManager {
  @observable
  transforms = new Map<string, React$Element<any>>([
    ["vega3", <Vega3 />],
    ["vega2", <Vega2 />],
    ["plotly", <PlotlyTransform />],
    ["vegalite2", <VegaLite2 />],
    ["vegalite1", <VegaLite1 />],
    ["json", <Media.Json />],
    ["js", <Media.JavaScript />],
    ["html", <Media.HTML />],
    ["markdown", <Markdown />],
    ["latex", <Media.LaTeX />],
    ["svg", <Media.SVG />],
    ["gif", <Media.Image mediaType="image/gif" />],
    ["jpeg", <Media.Image mediaType="image/jpeg" />],
    ["png", <Media.Image mediaType="image/png" />],
    ["plain", <Media.Plain />]
  ]);

  @action
  addTransform(transform: any, key: string): React$Element<any> | void {
    //Add new transform to the beginning giving it priority in `Display`
    //Using Map.protoype.set() adds to the bottom, so we can't use that
    //Original components will always override a new transform with same keys
    //This forces delete before adding same key values.
    this.transforms = new Map<string, React$Element<any>>([
      [key, transform],
      ...this.transforms
    ]);
    return this.transforms.get(key);
  }

  @action
  deleteTransform(key: string): boolean {
    return this.transforms.delete(key);
  }

  @computed
  get components(): Array<React$Element<any>> {
    return Array.from(this.transforms.values());
  }
}

const transformManager = new TransformManager();
export default transformManager;

//For debugging.
window.transformManager = transformManager;
