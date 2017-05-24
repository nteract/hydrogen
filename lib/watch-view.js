/* @flow */

// This file should be removed after watch-sidebar.js is refactored as a React Component

import React from "react";
import { TextEditor, CompositeDisposable } from "atom";

import WatchStore from "./store/watch";
import Watch from "./components/watch";
import { log, reactFactory } from "./utils";

import type Kernel from "./kernel";

export default class WatchView {
  watchStore: WatchStore;
  element = document.createElement("div");
  disposer = new CompositeDisposable();
  run: Function;
  setCode: Function;
  getCode: Function;
  focus: Function;

  constructor(kernel: Kernel) {
    this.watchStore = new WatchStore(kernel);

    this.run = this.watchStore.run;
    this.setCode = this.watchStore.setCode;
    this.getCode = this.watchStore.getCode;
    this.focus = this.watchStore.focus;

    reactFactory(
      <Watch store={this.watchStore} />,
      this.element,
      null,
      this.disposer
    );
  }

  destroy() {
    this.disposer.dispose();
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
