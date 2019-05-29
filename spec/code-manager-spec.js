"use babel";

import { waitAsync } from "./helpers/test-utils";

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

        expect(CM.getCellsForBreakPoints(editor, points)).toEqual(
          cellsExpected
        );
      });
    });
    describe("getCells", () => {
      beforeEach(
        waitAsync(async () => {
          await atom.packages.activatePackage("language-python");
          editor.setGrammar(atom.grammars.grammarForScopeName("source.python"));
          const code = ["v0 = 0 #   %%", "v1 = 1", "v2 = 2 #%%", "v3 = 3"]; // row0:bp // row1 // row2:bp // row3
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
        it("doesn't create cell from initial empty whitespace", () => {
          const code = [
            "",
            "",
            "print('hello world')",
            "# %%",
            "print('foo bar')"
          ];
          editor.setText(code.join("\n") + "\n");
          const cellsExpected = [[[2, 0], [3, 0]], [[4, 0], [5, 0]]].map(
            toRange
          );
          expect(CM.getCells(editor)).toEqual(cellsExpected);
        });
        it("doesn't create cell from initial empty whitespace with cell marker", () => {
          const code = [
            "",
            "# %%",
            "print('hello world')",
            "# %%",
            "print('foo bar')"
          ];
          editor.setText(code.join("\n") + "\n");
          const cellsExpected = [[[2, 0], [3, 0]], [[4, 0], [5, 0]]].map(
            toRange
          );
          expect(CM.getCells(editor)).toEqual(cellsExpected);
        });
        it("doesn't create initial empty cell with no whitespace", () => {
          const code = ["print('hello world')", "# %%", "print('foo bar')"];
          editor.setText(code.join("\n") + "\n");
          const cellsExpected = [[[0, 0], [1, 0]], [[2, 0], [3, 0]]].map(
            toRange
          );
          expect(CM.getCells(editor)).toEqual(cellsExpected);
        });
        it("doesn't start a cell outside of a line comment scope", () => {
          const code = ["# %%", "print('# %%')"];
          editor.setText(code.join("\n") + "\n");
          const cellsExpected = [[[1, 0], [2, 0]]].map(toRange);
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
      describe("labeled markdown", () => {
        beforeEach(() => {
          const code = [
            "#%% md Block 1",
            "##Markdown Header",
            "Plain Text",
            "# %%markdown Block 2",
            "#`code`",
            "`code`",
            "# <markdown> Block 3",
            "#*Italics*"
          ];
          editor.setText(code.join("\n") + "\n");
        });
        it("returns correct cellType", () => {
          expect(CM.getMetadataForRow(editor, new Point(1, 0))).toBe(
            "markdown"
          );
          expect(CM.getMetadataForRow(editor, new Point(5, 0))).toBe(
            "markdown"
          );
          expect(CM.getMetadataForRow(editor, new Point(7, 0))).toBe(
            "markdown"
          );
        });
      });
      describe("labeled markdown and codecell", () => {
        beforeEach(() => {
          const code = [
            "#%% md Block 1",
            "##Markdown Header",
            "Plain Text",
            "# %% Block 2",
            "#comment",
            "print('hi')",
            "# ln[0] Block 3",
            "#comment"
          ];
          editor.setText(code.join("\n") + "\n");
        });
        it("returns correct cellType", () => {
          expect(CM.getMetadataForRow(editor, new Point(2, 0))).toBe(
            "markdown"
          );
          expect(CM.getMetadataForRow(editor, new Point(5, 0))).toBe(
            "codecell"
          );
          expect(CM.getMetadataForRow(editor, new Point(7, 0))).toBe(
            "codecell"
          );
        });
      });
    });

    describe("foldCells", () => {
      beforeEach(
        waitAsync(async () => {
          await atom.packages.activatePackage("language-python");
          editor.setGrammar(atom.grammars.grammarForScopeName("source.python"));
          const code = [
            "# %% Block 1",
            "print('hi')",
            "",
            "# %% Block 2",
            "print('hi')",
            "",
            "# %% Block 3",
            "print('hi')"
          ];
          editor.setText(code.join("\n") + "\n");
          // # %% Block 1
          // print('hi')
          //
          // # %% Block 2
          // print('hi')
          //
          // # %% Block 3
          // print('hi')
          //
        })
      );
      describe("foldCurrentCell", () => {
        it("folds cell range correctly", () => {
          editor.setCursorBufferPosition([1, 0]);
          CM.foldCurrentCell(editor);
          const screenRowsExpected = [
            "# %% Block 1",
            "# %% Block 2",
            "print('hi')",
            "",
            "# %% Block 3",
            "print('hi')",
            ""
          ];
          expect(editor.getScreenLineCount()).toEqual(
            screenRowsExpected.length
          );
          for (var i = 0; i < screenRowsExpected.length; i++) {
            expect(editor.lineTextForScreenRow(i).trim()).toEqual(
              screenRowsExpected[i]
            );
          }
        });
        it("folds last cell range correctly", () => {
          editor.setCursorBufferPosition([6, 0]);
          CM.foldCurrentCell(editor);
          const screenRowsExpected = [
            "# %% Block 1",
            "print('hi')",
            "",
            "# %% Block 2",
            "print('hi')",
            "",
            "# %% Block 3"
          ];
          expect(editor.getScreenLineCount()).toEqual(
            screenRowsExpected.length
          );
          for (var i = 0; i < screenRowsExpected.length; i++) {
            expect(editor.lineTextForScreenRow(i).trim()).toEqual(
              screenRowsExpected[i]
            );
          }
        });
      });
      describe("foldAllButCurrentCell", () => {
        it("folds cell ranges correctly", () => {
          editor.setCursorBufferPosition([1, 0]);
          CM.foldAllButCurrentCell(editor);
          const screenRowsExpected = [
            "# %% Block 1",
            "print('hi')",
            "",
            "# %% Block 2",
            "# %% Block 3"
          ];
          expect(editor.getScreenLineCount()).toEqual(
            screenRowsExpected.length
          );
          for (var i = 0; i < screenRowsExpected.length; i++) {
            expect(editor.lineTextForScreenRow(i).trim()).toEqual(
              screenRowsExpected[i]
            );
          }
        });
      });
    });
  });

  describe("Get comment start string", () => {
    beforeEach(
      waitAsync(async () => {
        await atom.packages.activatePackage("language-python");
        editor.setGrammar(atom.grammars.grammarForScopeName("source.python"));
      })
    );
    it("Should return the comment string for an editor", () => {
      const commentString = CM.getCommentStartString(editor);
      expect(commentString).toEqual("#");
    });
  });
});
