/* @flow */

import { CompositeDisposable } from "atom";
import ResizeObserver from "resize-observer-polyfill";

import React from "react";

import { reactFactory, OUTPUT_AREA_URI } from "./../utils";
import typeof store from "../store";
import OutputArea from "./../components/output-area";

export default class OutputPane {
  element = document.createElement("div");
  disposer = new CompositeDisposable();

  constructor(store: store) {
    this.element.classList.add("hydrogen", "watch-sidebar");

    // HACK: Dispatch a window resize Event for the slider history to recompute
    // We should use native ResizeObserver once Atom ships with a newer version of Electron
    // Or fork react-rangeslider to fix https://github.com/whoisandie/react-rangeslider/issues/62
    const resizeObserver = new ResizeObserver(this.resize);
    resizeObserver.observe(this.element);

    reactFactory(
      <OutputArea store={store} />,
      this.element,
      null,
      this.disposer
    );
  }

  resize = () => {
    window.dispatchEvent(new Event("resize"));
  };

  getTitle = () => "Hydrogen Output Area";

  getURI = () => OUTPUT_AREA_URI;

  getDefaultLocation = () => "right";

  getAllowedLocations = () => ["left", "right", "bottom"];

  destroy() {
    this.disposer.dispose();
    this.element.remove();
  }
}
