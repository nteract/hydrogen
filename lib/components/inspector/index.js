/* @flow */

import React from "react";
import { Map as ImmutableMap } from "immutable";

import { log, reactFactory } from "./../../utils";
import store from "./../../store";
import { getCodeToInspect } from "./../../code-manager";
import InspectorComponent from "./component";

export default class Inspector {
  constructor() {
    const element = document.createElement("div");

    const panel = atom.workspace.addBottomPanel({ item: element });

    reactFactory(
      <InspectorComponent store={store} panel={panel} />,
      element
      // We should add panel.destroy here but Atom errors
    );
  }

  toggle() {
    const { kernel, editor } = store;
    if (!editor || !kernel) {
      atom.notifications.addInfo("No kernel running!");
      return;
    }

    const [code, cursorPos] = getCodeToInspect(editor);
    if (!code || cursorPos === 0) {
      atom.notifications.addInfo("No code to introspect!");
      return;
    }

    kernel.inspect(
      code,
      cursorPos,
      (result: { data: Object, found: Boolean }) => {
        log("Inspector: Result:", result);

        if (!result.found) {
          kernel.setInspectorVisibility(false);
          atom.notifications.addInfo("No introspection available!");
          return;
        }
        const bundle = new ImmutableMap(result.data);

        kernel.setInspectorResult(bundle);
      }
    );
  }
}
