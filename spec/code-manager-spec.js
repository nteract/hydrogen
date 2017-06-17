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

  describe("cells", () => {
    const toPoint = point => Point.fromObject(point);
    const toRange = range => Range.fromObject(range);

    describe("getCellsForBreakPoints", () => {
      it("return cells(ranges) from array of points", () => {
        const points = [
          [1, 2], // bp1
          [3, 4], // bp2
          [5, 6], // bp3
          [10, 5] // bp4
        ].map(toPoint);
        const cellsExpected = [
          [[0, 0], [1, 2]], // zero-to-bp1
          [[2, 0], [3, 4]], // nextRow of bp1 to bp2
          [[4, 0], [5, 6]], // nextRow of bp2 to bp3
          [[6, 0], [10, 5]] // nextRow of bp3 to bp4
        ].map(toRange);

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
          const code = [
            "v0 = 0 # %%", // row0:bp
            "v1 = 1", // row1
            "v2 = 2 # %%", // row2:bp
            "v3 = 3" // row3
          ];
          editor.setText(code.join("\n") + "\n");
        })
      );
      describe("no arg", () => {
        it("return cell(range) by detecting breakpoints in comment", () => {
          // EOF is always treated as implicit breakpoints
          const cellsExpected = [
            [[0, 0], [0, 7]], // zero-to-row0:bp
            [[1, 0], [2, 7]], // nextRow of row0:bp to row2:bp
            [[3, 0], [4, 0]] // nextRow of row2:bp to EOF(= implicit bp)
          ].map(toRange);
          expect(CM.getCells(editor)).toEqual(cellsExpected);
        });
      });
      describe("with arg(= breakpoints)", () => {
        it("return cells(range) from passed breakpoints(with auto-sort-by-position)", () => {
          breakpoints = [
            [0, 11], // row0:bp
            [2, 11], // row2:bp
            [1, 6] // row1:bp
          ].map(toPoint);
          const cellsExpected = [
            [[0, 0], [0, 11]], // zero to row0:bp
            [[1, 0], [1, 6]], // nextRow of row0:bp to row1:bp
            [[2, 0], [2, 11]] // nextRow of row1:bp to row2:bp
          ].map(toRange);

          expect(CM.getCells(editor, breakpoints)).toEqual(cellsExpected);
        });
      });
    });
  });
});
