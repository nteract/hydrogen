/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";

import Watch from "./watch";
import { WATCHES_URI, EmptyMessage } from "../../utils";

import type Kernel from "./../../kernel";
import typeof store from "../../store";

const Watches = observer(({ store: { kernel } }: { store: store }) => {
  if (!kernel) {
    if (atom.config.get("Hydrogen.outputAreaDock")) {
      return <EmptyMessage />;
    } else {
      atom.workspace.hide(WATCHES_URI);
      return null;
    }
  }

  return (
    <div className="sidebar watch-sidebar">
      {kernel.watchesStore.watches.map(watch => (
        <Watch key={watch.editor.id} store={watch} />
      ))}
      <div className="btn-group">
        <button
          className="btn btn-primary icon icon-plus"
          onClick={kernel.watchesStore.addWatch}
        >
          Add watch
        </button>
        <button
          className="btn btn-error icon icon-trashcan"
          onClick={kernel.watchesStore.removeWatch}
        >
          Remove watch
        </button>
      </div>
    </div>
  );
});

export default Watches;
