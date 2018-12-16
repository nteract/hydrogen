"use babel";

import { Store } from "../lib/store";
import { toggleInspector, toggleOutputMode } from "../lib/commands";
import KernelTransport from "../lib/kernel-transport";
import Kernel from "../lib/kernel";
import { OUTPUT_AREA_URI } from "../lib/utils";
import OutputPane from "../lib/panes/output-area";

describe("commands", () => {
  let storeMock, mockKernel, filePath, grammar, editor;

  beforeAll(() => {
    storeMock = new Store();
    filePath = "fake.py";
    grammar = atom.grammars.grammarForScopeName("source.python");
    editor = atom.workspace.buildTextEditor();
    mockKernel = new Kernel(
      new KernelTransport({
        display_name: "Python 3",
        language: "python"
      })
    );

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

  describe("toggle output-area", () => {
    it("should open the output area if it was not already", () => {
      spyOn(atom.workspace, "open");
      spyOn(atom.workspace, "getPaneItems").and.returnValue([]);
      toggleOutputMode();
      expect(atom.workspace.open).toHaveBeenCalledWith(
        OUTPUT_AREA_URI,
        jasmine.any(Object)
      );
    });
    it("should destroy output-pane if it was active", () => {
      const outputPane = new OutputPane(storeMock);
      const workspacePaneItems = [outputPane];
      spyOn(atom.workspace, "getPaneItems").and.returnValue(workspacePaneItems);
      spyOn(outputPane, "destroy");
      toggleOutputMode();
      expect(outputPane.destroy).toHaveBeenCalled();
    });
  });
});
