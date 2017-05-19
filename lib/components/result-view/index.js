/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";

import { reactFactory } from "./../../utils";
import ResultViewComponent from "./result-view";

import type OutputStore from "./../../store/output";

export default class ResultView {
  element: HTMLElement;
  disposer: atom$CompositeDisposable;
  marker: atom$Marker;

  destroy = () => {
    this.disposer.dispose();
    if (this.marker) this.marker.destroy();
  };

  constructor(store: OutputStore, marker: atom$Marker) {
    this.marker = marker;
    this.element = document.createElement("div");
    this.element.classList.add("hydrogen", "marker");

    this.disposer = new CompositeDisposable();

    reactFactory(
      <ResultViewComponent store={store} destroy={this.destroy} />,
      this.element,
      null,
      this.disposer
    );
  }
}
