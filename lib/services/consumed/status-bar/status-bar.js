/* @flow */

import React from "react";
import { Disposable } from "atom";

import { StatusBar } from "./status-bar-component";
import { SignalListView } from "./signal-list-view";

import type { Store } from "./../../../store";
import { reactFactory } from "./../../../utils";

export function addStatusBar(
  store: Store,
  statusBar: atom$StatusBar,
  handleKernelCommand: Function
) {
  const statusBarElement = document.createElement("div");
  statusBarElement.classList.add("inline-block", "hydrogen");

  const statusBarTile = statusBar.addLeftTile({
    item: statusBarElement,
    priority: 100
  });

  const signalListView = new SignalListView(store, handleKernelCommand);
  const onClick = () => {
    signalListView.toggle();
  };

  reactFactory(<StatusBar store={store} onClick={onClick} />, statusBarElement);

  return new Disposable(() => statusBarTile.destroy());
}
