/* @flow */
/**
 * Adapted from https://github.com/nteract/nteract/blob/master/packages/transform-plotly/src/index.tsx
 * Copyright (c) 2016 - present, nteract contributors
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @NOTE: This `PlotlyTransform` component could be used exactly same as the original `PlotlyTransform` component of @nteract/transform-plotly,
 *        except that this file adds the ability to download a plot from an electron context.
 */

import { cloneDeep } from "lodash";
import * as React from "react";

interface Props {
  data: string | Object;
  mediaType: "application/vnd.plotly.v1+json";
}

type ObjectType = Object;

interface FigureLayout extends ObjectType {
  height?: string;
  autosize?: boolean;
}

interface Figure extends ObjectType {
  data: Object;
  layout: FigureLayout;
}

class PlotlyHTMLElement extends HTMLDivElement {
  data: Object;
  layout: Object;
  newPlot: () => void;
  redraw: () => void;
}

const NULL_MIMETYPE = "text/vnd.plotly.v1+html";
const MIMETYPE = "application/vnd.plotly.v1+json";

/*
 * As part of the init notebook mode, Plotly sneaks a <script> tag in to load
 * the plotlyjs lib. We have already loaded this though, so we "handle" the
 * transform by doing nothing and returning null.
 */
const PlotlyNullTransform = () => null;
PlotlyNullTransform.MIMETYPE = NULL_MIMETYPE;
PlotlyNullTransform.defaultProps = {
  mediaType: NULL_MIMETYPE
};

export class PlotlyTransform extends React.Component<Props> {
  static MIMETYPE = MIMETYPE;

  static defaultProps = {
    mediaType: MIMETYPE
  };

  plotDiv: PlotlyHTMLElement | null;
  Plotly: {
    newPlot: (
      div: PlotlyHTMLElement | null | void,
      data: Object,
      layout: FigureLayout
    ) => void,
    redraw: (div?: PlotlyHTMLElement) => void,
    toImage: (gd: any) => Promise<string>
  };

  constructor(props: Props) {
    super(props);
    this.downloadImage = this.downloadImage.bind(this);
  }

  componentDidMount(): void {
    // Handle case of either string to be `JSON.parse`d or pure object
    const figure = this.getFigure();
    this.Plotly = require("@nteract/plotly");
    this.Plotly.newPlot(this.plotDiv, figure.data, figure.layout, {
      modeBarButtonsToRemove: ["toImage"],
      modeBarButtonsToAdd: [
        {
          name: "Download plot as a png",
          icon: this.Plotly.Icons.camera,
          click: this.downloadImage
        }
      ]
    });
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    return this.props.data !== nextProps.data;
  }

  componentDidUpdate() {
    const figure = this.getFigure();
    if (!this.plotDiv) {
      return;
    }
    this.plotDiv.data = figure.data;
    this.plotDiv.layout = figure.layout;
    this.Plotly.redraw(this.plotDiv);
  }

  plotDivRef = (plotDiv: PlotlyHTMLElement | null): void => {
    this.plotDiv = plotDiv;
  };

  getFigure = (): Figure => {
    const figure = this.props.data;
    if (typeof figure === "string") {
      return JSON.parse(figure);
    }

    // The Plotly API *mutates* the figure to include a UID, which means
    // they won't take our frozen objects
    if (Object.isFrozen(figure)) {
      return cloneDeep(figure);
    }

    const { data = {}, layout = {} } = figure;

    return { data, layout };
  };

  downloadImage = (gd: any) => {
    this.Plotly.toImage(gd).then(function(dataUrl) {
      const electron = require("electron");
      electron.remote.getCurrentWebContents().downloadURL(dataUrl);
    });
  };

  render() {
    const { layout } = this.getFigure();
    const style: Object = {};
    if (layout && layout.height && !layout.autosize) {
      style.height = layout.height;
    }
    return <div ref={this.plotDivRef} style={style} />;
  }
}

export { PlotlyNullTransform };
export default PlotlyTransform;
