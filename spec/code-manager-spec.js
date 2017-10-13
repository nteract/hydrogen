"use babel";

import * as CM from "../lib/code-manager";
import { Point, Range } from "atom";

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
    // beforeEach(() => spyOn(CM, "normalizeString"));
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
        start: { row: 1, column: 0 },
        end: { row: 10, column: 9999999 }
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

  describe("cells", () => {
    const toPoint = point => Point.fromObject(point);
    const toRange = range => Range.fromObject(range);

    describe("getCellsForBreakPoints", () => {
      it("return cells(ranges) from array of points", () => {
        const points = [[1, 2], [3, 4], [5, 6], [10, 5]].map(toPoint); // bp1 // bp2 // bp3 // bp4
        const cellsExpected = [
          [[0, 0], [1, 2]],
          [[2, 0], [3, 4]],
          [[4, 0], [5, 6]],
          [[6, 0], [10, 5]]
        ].map(toRange); // zero-to-bp1 // nextRow of bp1 to bp2 // nextRow of bp2 to bp3 // nextRow of bp3 to bp4

        expect(CM.getCellsForBreakPoints(points)).toEqual(cellsExpected);
      });
    });
    describe("getCells", () => {
      // runAsync is borrowed and modified from link below.
      // https://github.com/jasmine/jasmine/issues/923#issuecomment-169634461
      function waitAsync(fn) {
        return done => {
          fn().then(done, function rejected(e) {
            fail(e);
            done();
          });
        };
      }
      beforeEach(
        waitAsync(async () => {
          await atom.packages.activatePackage("language-python");
          editor.setGrammar(atom.grammars.grammarForScopeName("source.python"));
          const code = ["v0 = 0 # %%", "v1 = 1", "v2 = 2 # %%", "v3 = 3"]; // row0:bp // row1 // row2:bp // row3
          editor.setText(code.join("\n") + "\n");
        })
      );
      describe("no arg", () => {
        it("return cell(range) by detecting breakpoints in comment", () => {
          // EOF is always treated as implicit breakpoints
          const cellsExpected = [
            [[0, 0], [0, 7]],
            [[1, 0], [2, 7]],
            [[3, 0], [4, 0]]
          ].map(toRange); // zero-to-row0:bp // nextRow of row0:bp to row2:bp // nextRow of row2:bp to EOF(= implicit bp)
          expect(CM.getCells(editor)).toEqual(cellsExpected);
        });
      });
      describe("with arg(= breakpoints)", () => {
        it("return cells(range) from passed breakpoints(with auto-sort-by-position)", () => {
          breakpoints = [[0, 11], [2, 11], [1, 6]].map(toPoint); // row0:bp // row2:bp // row1:bp
          const cellsExpected = [
            [[0, 0], [0, 11]],
            [[1, 0], [1, 6]],
            [[2, 0], [2, 11]]
          ].map(toRange); // zero to row0:bp // nextRow of row0:bp to row1:bp // nextRow of row1:bp to row2:bp

          expect(CM.getCells(editor, breakpoints)).toEqual(cellsExpected);
        });
      });
    });
  });
});
