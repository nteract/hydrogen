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

    const onClick = (store: Store) => {
      this.showKernelCommands(store, handleKernelCommand);
    };

    reactFactory(
      <StatusBar store={store} onClick={onClick} />,
      statusBarElement
    );

    const disposable = new Disposable(() => statusBarTile.destroy());
    store.subscriptions.add(disposable);
    return disposable;
  }

  showKernelCommands(store: Store, handleKernelCommand: Function) {
    let signalListView = this.signalListView;
    if (!signalListView) {
      signalListView = new SignalListView(store, handleKernelCommand);
      this.signalListView = signalListView;
    } else {
      signalListView.store = store;
    }
    signalListView.toggle();
  }
}

const statusBarConsumer = new StatusBarConsumer();
export default statusBarConsumer;
