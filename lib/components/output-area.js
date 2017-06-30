/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";

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
      {kernel.outputStore.outputs.length > 0
        ? <div
            className="btn icon icon-trashcan"
            onClick={kernel.outputStore.clear}
            style={{
              left: "100%",
              transform: "translateX(-100%)",
              position: "relative",
              flex: "0 0 auto",
              width: "fit-content"
            }}
          >
            Clear
          </div>
        : <EmptyMessage />}
      <History store={kernel.outputStore} />
    </div>
  );
});

export default OutputArea;
