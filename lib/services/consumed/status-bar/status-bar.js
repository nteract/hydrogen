/* @flow */

import React from "react";
import { Disposable } from "atom";

import StatusBar from "./status-bar-component";
import SignalListView from "./signal-list-view";

import { reactFactory } from "../../../utils";

import type { Store } from "../../../store";
import type Kernel from "../../../kernel";
import type MarkerStore from "../../../store/markers";

export class StatusBarConsumer {
  signalListView: SignalListView;
  handleKernelCommand: Function;

  addStatusBar(
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

    this.handleKernelCommand = handleKernelCommand;

    const onClick = ({ kernel, markers }) => {
      this.showKernelCommands({ kernel, markers });
    };

    reactFactory(
      <StatusBar store={store} onClick={onClick} />,
      statusBarElement
    );

    const disposable = new Disposable(() => statusBarTile.destroy());
    store.subscriptions.add(disposable);
    return disposable;
  }

  showKernelCommands({
    kernel,
    markers
  }: {
    kernel: Kernel,
    markers: MarkerStore
  }) {
    let signalListView = this.signalListView;
    if (!signalListView) {
      signalListView = new SignalListView(kernel);
      signalListView.onConfirmed = (kernelCommand: { command: string }) =>
        this.handleKernelCommand(kernelCommand, { kernel, markers });
      this.signalListView = signalListView;
    }
    signalListView.toggle();
  }
}

const statusBarConsumer = new StatusBarConsumer();
export default statusBarConsumer;
