/* @flow */

import { CompositeDisposable, Disposable } from "atom";

import React from "react";

import { reactFactory, OUTPUT_AREA_URI } from "./../utils";
import typeof store from "../store";
import OutputArea from "./../components/output-area";

export default class OutputPane {
  element = document.createElement("div");
  disposer = new CompositeDisposable();

  constructor(store: store) {
    this.element.classList.add("hydrogen");

    this.disposer.add(
      new Disposable(() => {
        if (store.kernel) store.kernel.outputStore.clear();
      })
    );

    this.disposer.add(
      atom.commands.add(this.element, {
        "core:move-left": () => {
          if (!store.kernel) return;
          store.kernel.outputStore.decrementIndex();
        },
        "core:move-right": () => {
          if (!store.kernel) return;
          store.kernel.outputStore.incrementIndex();
        }
      })
    );

    reactFactory(
      <OutputArea store={store} />,
      this.element,
      null,
      this.disposer
    );
  }

  getTitle = () => "Hydrogen Output Area";

  getURI = () => OUTPUT_AREA_URI;

  getDefaultLocation = () => "right";

  getAllowedLocations = () => ["left", "right", "bottom"];

  destroy() {
    this.disposer.dispose();
    this.element.remove();
  }
}
