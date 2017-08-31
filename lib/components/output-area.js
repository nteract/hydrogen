/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";
import { toJS } from "mobx";
import _ from "lodash";

import History from "./result-view/history";
import { OUTPUT_AREA_URI } from "./../utils";

import typeof store from "../store";

const EmptyMessage = () => {
  return (
    <ul className="background-message centered">
      <li>No output to display</li>
    </ul>
  );
};

const buttonStyle = {
  flex: "0 0 auto",
  width: "fit-content"
};

const OutputArea = observer(({ store: { kernel } }: { store: store }) => {
  if (!kernel) {
    if (atom.config.get("Hydrogen.outputAreaDock")) {
      return <EmptyMessage />;
    } else {
      atom.workspace.hide(OUTPUT_AREA_URI);
      return null;
    }
  }

  const handleClick = () => {
    if (!kernel || !kernel.outputStore) return;
    //convert output to a plain js object
    const output = toJS(kernel.outputStore.outputs[kernel.outputStore.index]);
    // check for a text property and fall back to data["text/plain"]
    const textOrBundle = _.has(output, "text")
      ? output.text
      : output.data["text/plain"];
    atom.clipboard.write(textOrBundle);
    atom.notifications.addSuccess("Copied to clipboard");
  };

  return (
    <div className="sidebar output-area">
      {kernel.outputStore.outputs.length > 0 ? (
        <div
          style={{
            left: "100%",
            transform: "translateX(-100%)",
            position: "relative"
          }}
        >
          <div
            className="btn icon icon-clippy"
            onClick={function() {
              if (!kernel || !kernel.outputStore) return;
              // output should be converted to a plain js object first:
              const output = toJS(
                kernel.outputStore.outputs[kernel.outputStore.index]
              );
              const textOrBundle = _.has(output, "text")
                ? output.text
                : output.data["text/plain"];

              atom.clipboard.write(textOrBundle);
              atom.notifications.addSuccess("Copied to clipboard");
            }}
            style={{ buttonStyle }}
          >
            Copy
          </div>
          <div
            className="btn icon icon-trashcan"
            onClick={kernel.outputStore.clear}
            style={{ buttonStyle }}
          >
            Clear
          </div>
        </div>
      ) : (
        <EmptyMessage />
      )}
      <History store={kernel.outputStore} />
    </div>
  );
});

export default OutputArea;
