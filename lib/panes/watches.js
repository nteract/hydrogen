/* @flow */

import { CompositeDisposable } from "atom";
import ResizeObserver from "resize-observer-polyfill";

import React from "react";

import { reactFactory, WATCHES_URI } from "./../utils";
import typeof store from "../store";
import Watches from "./../components/watch-sidebar";

export default class WatchesPane {
  element = document.createElement("div");
  disposer = new CompositeDisposable();

  constructor(store: store) {
    this.element.classList.add("hydrogen", "watch-sidebar");

    // HACK: Dispatch a window resize Event for the slider history to recompute
    // We should use native ResizeObserver once Atom ships with a newer version of Electron
    // Or fork react-rangeslider to fix https://github.com/whoisandie/react-rangeslider/issues/62
    const resizeObserver = new ResizeObserver(this.resize);
    resizeObserver.observe(this.element);

    reactFactory(<Watches store={store} />, this.element, null, this.disposer);
  }

  resize = () => {
    window.dispatchEvent(new Event("resize"));
  };

  getTitle = () => "Hydrogen Watch";

  getURI = () => WATCHES_URI;

  getDefaultLocation = () => "right";

  getAllowedLocations = () => ["left", "right"];

  destroy() {
    this.disposer.dispose();
    this.element.remove();
  }
}
