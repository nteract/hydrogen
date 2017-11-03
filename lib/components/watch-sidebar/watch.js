/* @flow */

import React from "react";
import { CompositeDisposable } from "atom";
import History from "./../result-view/history";
import type WatchStore from "./../../store/watch";

export default class Watch extends React.Component<{ store: WatchStore }> {
  container: ?HTMLElement;
  subscriptions: atom$CompositeDisposable = new CompositeDisposable();
  componentDidMount() {
    if (!this.container) return;
    const container = this.container;
    container.insertBefore(
      this.props.store.editor.element,
      container.firstChild
    );

    this.subscriptions.add(
      atom.commands.add(container, "core:move-left", () =>
        this.props.store.outputStore.decrementIndex()
      ),
      atom.commands.add(container, "core:move-right", () =>
        this.props.store.outputStore.incrementIndex()
      )
    );
  }

  componentWillUnmount() {
    this.subscriptions.dispose();
  }

  render() {
    return (
      <div
        className="hydrogen watch-view"
        ref={c => {
          this.container = c;
        }}
      >
        <History store={this.props.store.outputStore} />
      </div>
    );
  }
}
