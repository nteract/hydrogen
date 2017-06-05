/* @flow */

import { log, reactFactory, INSPECTOR_URI } from "./utils";
import { getCodeToInspect } from "./code-manager";

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
