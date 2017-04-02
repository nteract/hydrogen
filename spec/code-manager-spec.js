"use babel";

import * as CM from "../lib/code-manager";

describe("CodeManager", () => {
  let editor;
  beforeEach(() => {
    editor = atom.workspace.buildTextEditor();
  });

  describe("Convert line endings", () => {
    it("should replace CRLF and CR with LF line endings", () => {
      const string = "foo\nbar";
      expect(CM.normalizeString("foo\nbar")).toEqual(string);
      expect(CM.normalizeString("foo\r\nbar")).toEqual(string);
      expect(CM.normalizeString("foo\rbar")).toEqual(string);
    });
  });

  describe("Get code", () => {
    // normalizeString should be called
    // beforeEach(() => spyOn(CM, 'normalizeString'));
    // afterEach(() => expect(CM.normalizeString).toHaveBeenCalled());

    it("getRow", () => {
      spyOn(editor, "lineTextForBufferRow");
      CM.getRow(editor, 123);
      expect(editor.lineTextForBufferRow).toHaveBeenCalledWith(123);
    });

    it("getRows", () => {
      spyOn(editor, "getTextInBufferRange");
      CM.getRows(editor, 1, 10);
      const range = {
        start: {
          row: 1,
          column: 0
        },
        end: {
          row: 10,
          column: 9999999
        }
      };
      expect(editor.getTextInBufferRange).toHaveBeenCalledWith(range);
    });

    it("getTextInRange", () => {
      spyOn(editor, "getTextInBufferRange");
      CM.getTextInRange(editor, [1, 2], [3, 4]);
      expect(editor.getTextInBufferRange).toHaveBeenCalledWith([
        [1, 2],
        [3, 4]
      ]);
    });

    it("getSelectedText", () => {
      spyOn(editor, "getSelectedText");
      CM.getSelectedText(editor);
      expect(editor.getSelectedText).toHaveBeenCalled();
    });
  });
});
