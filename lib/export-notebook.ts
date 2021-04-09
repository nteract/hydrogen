import * as path from "path";
import { writeFile } from "fs";
import { remote } from "electron";
const { dialog } = remote;

import { stringifyNotebook } from "@nteract/commutable";

import store from "./store";
export default function exportNotebook() {
  // TODO: Refactor to use promises, this is a bit "nested".
  const saveNotebook = function (filename) {
    if (!filename) {
      return;
    }

    const ext = path.extname(filename) === "" ? ".ipynb" : "";
    const fname = `${filename}${ext}`;
    writeFile(fname, stringifyNotebook(store.notebook), (err) => {
      if (err) {
        atom.notifications.addError("Error saving file", {
          detail: err.message,
        });
      } else {
        atom.notifications.addSuccess("Save successful", {
          detail: `Saved notebook as ${fname}`,
        });
      }
    });
  };
  // TODO this API is promisified -> should be fixed
  dialog.showSaveDialog(saveNotebook);
}
