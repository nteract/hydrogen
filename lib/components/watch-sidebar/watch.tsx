import React from "react";
import { CompositeDisposable } from "atom";
import History from "../result-view/history";
import type WatchStore from "../../store/watch";
export default class Watch extends React.Component<{
  store: WatchStore;
}> {
  container: HTMLElement | null | undefined;
  subscriptions: CompositeDisposable = new CompositeDisposable();

  componentDidMount() {
    if (!this.container) {
      return;
    }
    const container = this.container;
    container.insertBefore(
      this.props.store.editor.element,
      container.firstChild
    );
  }

  componentWillUnmount() {
    this.subscriptions.dispose();
  }

  render() {
    return (
      <div
        className="hydrogen watch-view"
        ref={(c) => {
          this.container = c;
        }}
      >
        <History store={this.props.store.outputStore} />
      </div>
    );
  }
}
