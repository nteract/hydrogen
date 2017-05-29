/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";

import History from "./result-view/history";
import { OUTPUT_AREA_URI } from "./../utils";

import typeof store from "../store";

const OututArea = observer(({ store: { kernel } }: { store: store }) => {
  if (!kernel) {
    atom.workspace.hide(OUTPUT_AREA_URI);
    return null;
  }
  return (
    <div>
      {kernel.outputStore.outputs.length > 0
        ? <div
            className="btn btn-error icon icon-trashcan"
            onClick={kernel.outputStore.clear}
            style={{
              left: "50%",
              transform: "translate(-50%, 0)",
              position: "relative"
            }}
          >
            Clear
          </div>
        : null}
      <History store={kernel.outputStore} />
    </div>
  );
});

export default OututArea;
