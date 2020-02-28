/* @flow */

import * as path from "path";
import { writeFile } from "fs";

const { dialog } = require("electron").remote;
const { stringifyNotebook } = require("@nteract/commutable");

import store from "./store";

export default function exportNotebook() {
  // TODO: Refactor to use promises, this is a bit "nested".
  const saveNotebook = function(filename) {
    if (!filename) {
      return;
    }
    const ext = path.extname(filename) === "" ? ".ipynb" : "";
    const fname = `${filename}${ext}`;
    writeFile(fname, stringifyNotebook(store.notebook), function(err, data) {
      if (err) {
        atom.notifications.addError("Error saving file", {
          detail: err.message
        });
      } else {
        atom.notifications.addSuccess("Save successful", {
          detail: `Saved notebook as ${fname}`
        });
      }
    });
  };
  dialog.showSaveDialog(saveNotebook);
}
