"use babel";

import { Store } from "../lib/store";
import { toggleInspector } from "../lib/commands";
import Kernel from "../lib/kernel";

describe("commands", () => {
  let storeMock, mockKernel, filePath, grammar, editor;

  beforeAll(() => {
    storeMock = new Store();
    filePath = "fake.py";
    grammar = atom.grammars.grammarForScopeName("source.python");
    editor = atom.workspace.buildTextEditor();
    mockKernel = new Kernel({
      display_name: "Python 3",
      language: "python"
    });

    spyOn(editor, "getPath").and.returnValue(filePath);
    spyOn(storeMock.subscriptions, "dispose");
    storeMock.newKernel(mockKernel, filePath, editor, grammar);
  });

  describe("toggleInspector", () => {
    let codeText, cursorPos, bundle;
    beforeEach(() => {
      codeText = `print('hello world')`;
      bundle = { "text/plain": "Mockstring: so helpful" };

      editor.setText(codeText);
      storeMock.updateEditor(editor);
      spyOn(storeMock.kernel, "inspect");
    });

    it("calls kernel.inspect with code and cursor position", () => {
      toggleInspector(storeMock);
      expect(storeMock.kernel.inspect).toHaveBeenCalledWith(
        codeText,
        codeText.length,
        jasmine.any(Function)
      );
    });
  });
});
