/* @flow */

import { CompositeDisposable } from "atom";

import React from "react";

import { reactFactory, INSPECTOR_URI } from "./../utils";
import typeof store from "../store";
import Inspector from "./../components/inspector";

export default class InspectorPane {
  element = document.createElement("div");
  disposer = new CompositeDisposable();

  constructor(store: store) {
    this.element.classList.add("hydrogen", "inspector");

    reactFactory(
      <Inspector store={store} />,
      this.element,
      null,
      this.disposer
    );
  }

  getTitle = () => "Hydrogen Inspector";

  getURI = () => INSPECTOR_URI;

  getDefaultLocation = () => "bottom";

  getAllowedLocations = () => ["bottom", "left", "right"];

  destroy() {
    this.disposer.dispose();
    this.element.remove();
  }
}
