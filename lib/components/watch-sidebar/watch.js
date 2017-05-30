/* @flow */

import React from "react";

import History from "./../result-view/history";
import type WatchStore from "./../../store/watch";

export default class Watch extends React.Component {
  props: { store: WatchStore };
  container: HTMLElement;

  componentDidMount() {
    this.container.insertBefore(
      this.props.store.editor.element,
      this.container.firstChild
    );
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
