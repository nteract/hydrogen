/* @flow */

import React from "react";
import { Disposable } from "atom";

import StatusBar from "./status-bar";
import SignalListView from "./signal-list-view";

import { reactFactory } from "../../utils";

import type { Store } from "../../store";
import type Kernel from "../../kernel";

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

  const onClick = showKernelCommands.bind(this, handleKernelCommand);

  reactFactory(<StatusBar store={store} onClick={onClick} />, statusBarElement);

  return new Disposable(() => statusBarTile.destroy());
}

function showKernelCommands(handleKernelCommand, kernel) {
  if (!this.signalListView) {
    this.signalListView = new SignalListView(kernel);
    this.signalListView.onConfirmed = (kernelCommand: { command: string }) =>
      handleKernelCommand(kernelCommand);
  }
  this.signalListView.toggle();
}
