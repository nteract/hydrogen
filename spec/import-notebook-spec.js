"use babel";

// const { dialog } = require("electron").remote;
const { existsSync } = require("fs");
const { EOL } = require("os");
import { _loadNotebook } from "../lib/import-notebook";
import { waitAsync } from "./helpers/test-utils";

describe("Import notebook", () => {
  const sampleNotebook = require.resolve("./helpers/test-notebook.ipynb");
  beforeEach(
    waitAsync(async () => {
      await atom.packages.activatePackage("language-python");
      await _loadNotebook(sampleNotebook);
    })
  );

  it("Should import a notebook and convert it to a script", () => {
    const editor = atom.workspace.getActiveTextEditor();
    const code = editor.getText();
    expect(code.split(EOL)).toEqual([
      "# %%",
      "import pandas as pd",
      "# %%",
      "pd.util.testing.makeDataFrame()",
      "# %%",
      ""
    ]);
  });
});
