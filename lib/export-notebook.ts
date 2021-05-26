import * as path from "path";
import { promises } from "fs";
const { writeFile } = promises;
import { remote } from "electron";
const { dialog } = remote;

import { stringifyNotebook } from "@nteract/commutable";

import store from "./store";
export async function exportNotebook() {
  const editor = atom.workspace.getActiveTextEditor();
  const editorPath = editor.getPath();
  const directory = path.dirname(editorPath);
  const rawFileName = path.basename(editorPath, path.extname(editorPath));
  const noteBookPath = path.join(directory, `${rawFileName}.ipynb`);

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: editor.getTitle(),
    defaultPath: noteBookPath,
  });
  if (!canceled) {
    await saveNoteBook(filePath);
  }
}

async function saveNoteBook(filePath: string) {
  if (filePath.length === 0) {
    return;
  }
  // add default extension
  const ext = path.extname(filePath) === "" ? ".ipynb" : "";
  const fname = `${filePath}${ext}`;

  try {
    await writeFile(fname, stringifyNotebook(store.notebook));
    atom.notifications.addSuccess("Save successful", {
      detail: `Saved notebook as ${fname}`,
    });
  } catch (err) {
    atom.notifications.addError("Error saving file", {
      detail: err.message,
    });
  }
}
