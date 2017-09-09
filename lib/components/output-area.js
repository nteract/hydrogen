/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";
import { toJS } from "mobx";

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

const OutputArea = observer(({ store: { kernel } }: { store: store }) => {
  if (!kernel || !kernel.outputStore) {
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
    const textOrBundle = output.text || output.data["text/plain"];
    if (textOrBundle) {
      atom.clipboard.write(textOrBundle);
      atom.notifications.addSuccess("Copied to clipboard");
    } else {
      atom.notifications.addWarning("Nothing to copy");
    }
  };

  return (
    <div className="sidebar output-area">
      {kernel.outputStore.outputs.length > 0 ? (
        <div
          style={{
            left: "100%",
            transform: "translateX(-100%)",
            position: "relative",
            flex: "0 0 auto",
            width: "fit-content"
          }}
        >
          <div className="btn icon icon-clippy" onClick={handleClick}>
            Copy
          </div>
          <div
            className="btn icon icon-trashcan"
            onClick={kernel.outputStore.clear}
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
