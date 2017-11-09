/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { action, observable } from "mobx";
import { observer } from "mobx-react";
import Anser from "anser";

import History from "./result-view/history";
import ScrollList from "./result-view/list";
import { OUTPUT_AREA_URI, EmptyMessage } from "./../utils";

import typeof store from "../store";
import type { IObservableValue } from "mobx";

@observer
class OutputArea extends React.Component<{ store: store }> {
  showHistory: IObservableValue<boolean> = observable(true);
  @action
  setHistory = () => {
    this.showHistory.set(true);
  };

  @action
  setScrollList = () => {
    this.showHistory.set(false);
  };

  getOutputText(output: Object): ?string {
    switch (output.output_type) {
      case "stream":
        return output.text;
      case "execute_result":
        return output.data["text/plain"];
      case "error":
        return output.traceback.toJS().join("\n");
    }
  }

  handleClick = () => {
    const kernel = this.props.store.kernel;
    if (!kernel || !kernel.outputStore) return;
    const output = kernel.outputStore.outputs[kernel.outputStore.index];
    const copyOutput = this.getOutputText(output);

    if (copyOutput) {
      atom.clipboard.write(Anser.ansiToText(copyOutput));
      atom.notifications.addSuccess("Copied to clipboard");
    } else {
      atom.notifications.addWarning("Nothing to copy");
    }
  };

  render() {
    const kernel = this.props.store.kernel;

    if (!kernel) {
      if (atom.config.get("Hydrogen.outputAreaDock")) {
        return <EmptyMessage />;
      } else {
        atom.workspace.hide(OUTPUT_AREA_URI);
        return null;
      }
    }
    return (
      <div className="sidebar output-area">
        {kernel.outputStore.outputs.length > 0 ? (
          <div className="block">
            <div className="btn-group">
              <button
                className={`btn icon icon-clock${
                  this.showHistory.get() ? " selected" : ""
                }`}
                onClick={this.setHistory}
              />
              <button
                className={`btn icon icon-three-bars${
                  !this.showHistory.get() ? " selected" : ""
                }`}
                onClick={this.setScrollList}
              />
            </div>
            <div style={{ float: "right" }}>
              {this.showHistory.get() ? (
                <button
                  className="btn icon icon-clippy"
                  onClick={this.handleClick}
                >
                  Copy
                </button>
              ) : null}
              <button
                className="btn icon icon-trashcan"
                onClick={kernel.outputStore.clear}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <EmptyMessage />
        )}
        {this.showHistory.get() ? (
          <History store={kernel.outputStore} />
        ) : (
          <ScrollList outputs={kernel.outputStore.outputs} />
        )}
      </div>
    );
  }
}

export default OutputArea;
