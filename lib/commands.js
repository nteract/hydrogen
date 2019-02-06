/* @flow */

import {
  log,
  reactFactory,
  INSPECTOR_URI,
  OUTPUT_AREA_URI,
  openOrShowDock
} from "./utils";
import { getCodeToInspect } from "./code-manager";
import OutputPane from "./panes/output-area";

import typeof store from "./store";

export function toggleInspector(store: store) {
  const { editor, kernel } = store;
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
        atom.workspace.hide(INSPECTOR_URI);
        atom.notifications.addInfo("No introspection available!");
        return;
      }

      kernel.setInspectorResult(result.data, editor);
    }
  );
}

export function toggleOutputMode(): void {
  // There should never be more than one instance of OutputArea
  const outputArea = atom.workspace
    .getPaneItems()
    .find(paneItem => paneItem instanceof OutputPane);

  if (outputArea) {
    return outputArea.destroy();
  } else {
    openOrShowDock(OUTPUT_AREA_URI);
  }
}
