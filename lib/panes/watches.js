/* @flow */

import { CompositeDisposable } from "atom";

import React from "react";

import { reactFactory, WATCHES_URI } from "./../utils";
import typeof store from "../store";
import Watches from "./../components/watch-sidebar";

export default class WatchesPane {
  element = document.createElement("div");
  disposer = new CompositeDisposable();

  constructor(store: store) {
    this.element.classList.add("hydrogen");

    reactFactory(<Watches store={store} />, this.element, null, this.disposer);
  }

  getTitle = () => "Hydrogen Watch";

  getURI = () => WATCHES_URI;

  getDefaultLocation = () => "right";

  getAllowedLocations = () => ["left", "right"];

  destroy() {
    this.disposer.dispose();
    this.element.remove();
  }
}
