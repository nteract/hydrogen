import { Point, Range, TextEditor } from "atom";
import escapeStringRegexp from "escape-string-regexp";
import stripIndent from "strip-indent";
import compact from "lodash/compact";
import {
  log,
  isMultilanguageGrammar,
  getEmbeddedScope,
  rowRangeForCodeFoldAtBufferRow,
  js_idx_to_char_idx,
} from "./utils";
import type { HydrogenCellType } from "./hydrogen";

export function normalizeString(code: string | null | undefined) {
  if (code) {
    return code.replace(/\r\n|\r/g, "\n");
  }

  return null;
}
export function getRow(editor: TextEditor, row: number) {
  return normalizeString(editor.lineTextForBufferRow(row));
}
export function getTextInRange(editor: TextEditor, start: Point, end: Point) {
  const code = editor.getTextInBufferRange([start, end]);
  return normalizeString(code);
}
export function getRows(editor: TextEditor, startRow: number, endRow: number) {
  const code = editor.getTextInBufferRange({
    start: {
      row: startRow,
      column: 0,
    },
    end: {
      row: endRow,
      column: 9999999,
    },
  });
  return normalizeString(code);
}
export function getMetadataForRow(
  editor: TextEditor,
  anyPointInCell: Point
): HydrogenCellType {
  if (isMultilanguageGrammar(editor.getGrammar())) {
    return "codecell";
  }

  let cellType: HydrogenCellType = "codecell";
  const buffer = editor.getBuffer();
  anyPointInCell = new Point(
    anyPointInCell.row,
    buffer.lineLengthForRow(anyPointInCell.row)
  );
  const regexString = getRegexString(editor);

  if (regexString) {
    const regex = new RegExp(regexString);
    buffer.backwardsScanInRange(
      regex,
      new Range(new Point(0, 0), anyPointInCell),
      ({ match }) => {
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            switch (match[i]) {
              case "md":
              case "markdown":
                cellType = "markdown";
                break;

              case "codecell":
              default:
                cellType = "codecell";
                break;
            }
          }
        }
      }
    );
  }

  return cellType;
}
export function removeCommentsMarkdownCell(
  editor: TextEditor,
  text: string
): string {
  const commentStartString = getCommentStartString(editor);
  if (!commentStartString) {
    return text;
  }
  const lines = text.split("\n");
  const editedLines = [];

  lines.forEach((line) => {
    if (line.startsWith(commentStartString)) {
      // Remove comment from start of line
      editedLines.push(line.slice(commentStartString.length));
    } else {
      editedLines.push(line);
    }
  });

  return stripIndent(editedLines.join("\n"));
}
export function getSelectedText(editor: TextEditor) {
  return normalizeString(editor.getSelectedText());
}
export function isComment(editor: TextEditor, position: Point) {
  const scope = editor.scopeDescriptorForBufferPosition(position);
  const scopeString = scope.getScopeChain();
  return scopeString.includes("comment.line");
}
export function isBlank(editor: TextEditor, row: number) {
  return editor.getBuffer().isRowBlank(row);
}
export function escapeBlankRows(
  editor: TextEditor,
  startRow: number,
  endRow: number
) {
  while (endRow > startRow) {
    if (!isBlank(editor, endRow)) {
      break;
    }
    endRow -= 1;
  }

  return endRow;
}
export function getFoldRange(editor: TextEditor, row: number) {
  const range = rowRangeForCodeFoldAtBufferRow(editor, row);
  if (!range) {
    return;
  }

  if (
    range[1] < editor.getLastBufferRow() &&
    getRow(editor, range[1] + 1) === "end"
  ) {
    range[1] += 1;
  }

  log("getFoldRange:", range);
  return range;
}
export function getFoldContents(editor: TextEditor, row: number) {
  const range = getFoldRange(editor, row);
  if (!range) {
    return;
  }
  return {
    code: getRows(editor, range[0], range[1]),
    row: range[1],
  };
}
export function getCodeToInspect(editor: TextEditor) {
  const selectedText = getSelectedText(editor);
  let code;
  let cursorPosition;

  if (selectedText) {
    code = selectedText;
    cursorPosition = code.length;
  } else {
    const cursor = editor.getLastCursor();
    const row = cursor.getBufferRow();
    code = getRow(editor, row);
    cursorPosition = cursor.getBufferColumn();
    // TODO: use kernel.complete to find a selection
    const identifierEnd = code ? code.slice(cursorPosition).search(/\W/) : -1;

    if (identifierEnd !== -1) {
      cursorPosition += identifierEnd;
    }
  }

  cursorPosition = js_idx_to_char_idx(cursorPosition, code);
  return [code, cursorPosition];
}
export function getCommentStartString(
  editor: TextEditor
): string | null | undefined {
  const {
    commentStartString, // $FlowFixMe: This is an unofficial API
  } = editor.tokenizedBuffer.commentStringsForPosition(
    editor.getCursorBufferPosition()
  );

  if (!commentStartString) {
    log("CellManager: No comment string defined in root scope");
    return null;
  }

  return commentStartString.trimRight();
}
export function getRegexString(editor: TextEditor) {
  const commentStartString = getCommentStartString(editor);
  if (!commentStartString) {
    return null;
  }
  const escapedCommentStartString = escapeStringRegexp(commentStartString);
  const regexString = `${escapedCommentStartString} *%% *(md|markdown)?| *<(codecell|md|markdown)>| *(In\[[0-9 ]*\])`;
  return regexString;
}
export function getBreakpoints(editor: TextEditor) {
  const buffer = editor.getBuffer();
  const breakpoints = [];
  const regexString = getRegexString(editor);

  if (regexString) {
    const regex = new RegExp(regexString, "g");
    buffer.scan(regex, ({ range }) => {
      if (isComment(editor, range.start)) {
        breakpoints.push(range.start);
      }
    });
  }

  breakpoints.push(buffer.getEndPosition());
  log("CellManager: Breakpoints:", breakpoints);
  return breakpoints;
}

function getCell(editor: TextEditor, anyPointInCell?: Point) {
  if (!anyPointInCell) {
    anyPointInCell = editor.getCursorBufferPosition();
  }

  const buffer = editor.getBuffer();
  anyPointInCell = new Point(
    anyPointInCell.row,
    buffer.lineLengthForRow(anyPointInCell.row)
  );
  let start = new Point(0, 0);
  let end = buffer.getEndPosition();
  const regexString = getRegexString(editor);

  if (!regexString) {
    return new Range(start, end);
  }

  const regex = new RegExp(regexString);

  if (anyPointInCell.row >= 0) {
    buffer.backwardsScanInRange(
      regex,
      new Range(start, anyPointInCell),
      ({ range }) => {
        start = new Point(range.start.row + 1, 0);
      }
    );
  }

  buffer.scanInRange(regex, new Range(anyPointInCell, end), ({ range }) => {
    end = range.start;
  });
  log(
    "CellManager: Cell [start, end]:",
    [start, end],
    "anyPointInCell:",
    anyPointInCell
  );
  return new Range(start, end);
}

function isEmbeddedCode(
  editor: TextEditor,
  referenceScope: string,
  row: number
) {
  const scopes = editor
    .scopeDescriptorForBufferPosition(new Point(row, 0))
    .getScopesArray();
  return scopes.includes(referenceScope);
}

function getCurrentFencedCodeBlock(editor: TextEditor) {
  const buffer = editor.getBuffer();
  const { row: bufferEndRow } = buffer.getEndPosition();
  const cursor = editor.getCursorBufferPosition();
  let start = cursor.row;
  let end = cursor.row;
  const scope = getEmbeddedScope(editor, cursor);
  if (!scope) {
    return getCell(editor);
  }

  while (start > 0 && isEmbeddedCode(editor, scope, start - 1)) {
    start -= 1;
  }

  while (end < bufferEndRow && isEmbeddedCode(editor, scope, end + 1)) {
    end += 1;
  }

  return new Range([start, 0], [end + 1, 0]);
}

export function getCurrentCell(editor: TextEditor) {
  if (isMultilanguageGrammar(editor.getGrammar())) {
    return getCurrentFencedCodeBlock(editor);
  }

  return getCell(editor);
}
export function getCells(editor: TextEditor, breakpoints: Array<Point> = []) {
  if (breakpoints.length !== 0) {
    breakpoints.sort((a, b) => a.compare(b));
  } else {
    breakpoints = getBreakpoints(editor);
  }

  return getCellsForBreakPoints(editor, breakpoints);
}
export function getCellsForBreakPoints(
  editor: TextEditor,
  breakpoints: Array<Point>
): Array<Range> {
  let start = new Point(0, 0);
  // Let start be earliest row with text
  editor.scan(/\S/, (match) => {
    start = new Point(match.range.start.row, 0);
    match.stop();
  });
  return compact(
    breakpoints.map((end) => {
      const cell = end.isEqual(start) ? null : new Range(start, end);
      start = new Point(end.row + 1, 0);
      return cell;
    })
  );
}

function centerScreenOnCursorPosition(editor: TextEditor) {
  const cursorPosition = editor.element.pixelPositionForScreenPosition(
    editor.getCursorScreenPosition()
  ).top;
  const editorHeight = editor.element.getHeight();
  editor.element.setScrollTop(cursorPosition - editorHeight / 2);
}

export function moveDown(editor: TextEditor, row: number) {
  const lastRow = editor.getLastBufferRow();

  if (row >= lastRow) {
    editor.moveToBottom();
    editor.insertNewline();
    return;
  }

  while (row < lastRow) {
    row += 1;
    if (!isBlank(editor, row)) {
      break;
    }
  }

  editor.setCursorBufferPosition({
    row,
    column: 0,
  });
  atom.config.get("Hydrogen.centerOnMoveDown") &&
    centerScreenOnCursorPosition(editor);
}
export function findPrecedingBlock(
  editor: TextEditor,
  row: number,
  indentLevel: number
) {
  let previousRow = row - 1;

  while (previousRow >= 0) {
    const previousIndentLevel = editor.indentationForBufferRow(previousRow);
    const sameIndent = previousIndentLevel <= indentLevel;
    const blank = isBlank(editor, previousRow);
    const isEnd = getRow(editor, previousRow) === "end";

    if (isBlank(editor, row)) {
      row = previousRow;
    }

    if (sameIndent && !blank && !isEnd) {
      const cell = getCell(editor, new Point(row, 0));

      if (cell.start.row > row) {
        return {
          code: "",
          row,
        };
      }

      return {
        code: getRows(editor, previousRow, row),
        row,
      };
    }

    previousRow -= 1;
  }

  return null;
}
export function findCodeBlock(editor: TextEditor) {
  const selectedText = getSelectedText(editor);

  if (selectedText) {
    const selectedRange = editor.getSelectedBufferRange();
    const cell = getCell(editor, selectedRange.end);
    const startPoint = cell.start.isGreaterThan(selectedRange.start)
      ? cell.start
      : selectedRange.start;
    let endRow = selectedRange.end.row;

    if (selectedRange.end.column === 0) {
      endRow -= 1;
    }

    endRow = escapeBlankRows(editor, startPoint.row, endRow);

    if (startPoint.isGreaterThanOrEqual(selectedRange.end)) {
      return {
        code: "",
        row: endRow,
      };
    }

    return {
      code: getTextInRange(editor, startPoint, selectedRange.end),
      row: endRow,
    };
  }

  const cursor = editor.getLastCursor();
  const row = cursor.getBufferRow();
  log("findCodeBlock:", row);
  const indentLevel = cursor.getIndentLevel();
  let foldable = editor.isFoldableAtBufferRow(row);
  const foldRange = rowRangeForCodeFoldAtBufferRow(editor, row);

  if (!foldRange || foldRange[0] == null || foldRange[1] == null) {
    foldable = false;
  }

  if (foldable) {
    return getFoldContents(editor, row);
  }

  if (isBlank(editor, row) || getRow(editor, row) === "end") {
    return findPrecedingBlock(editor, row, indentLevel);
  }

  const cell = getCell(editor, new Point(row, 0));

  if (cell.start.row > row) {
    return {
      code: "",
      row,
    };
  }

  return {
    code: getRow(editor, row),
    row,
  };
}
export function foldCurrentCell(editor: TextEditor) {
  const cellRange = getCurrentCell(editor);
  const newRange = adjustCellFoldRange(editor, cellRange);
  editor.setSelectedBufferRange(newRange);
  editor.getSelections()[0].fold();
}
export function foldAllButCurrentCell(editor: TextEditor) {
  const initialSelections = editor.getSelectedBufferRanges();
  // I take .slice(1) because there's always an empty cell range from [0,0] to
  // [0,0]
  const allCellRanges = getCells(editor).slice(1);
  const currentCellRange = getCurrentCell(editor);
  const newRanges = allCellRanges
    .filter((cellRange) => !cellRange.isEqual(currentCellRange))
    .map((cellRange) => adjustCellFoldRange(editor, cellRange));
  editor.setSelectedBufferRanges(newRanges);
  editor.getSelections().forEach((selection) => selection.fold());
  // Restore selections
  editor.setSelectedBufferRanges(initialSelections);
}

function adjustCellFoldRange(editor: TextEditor, range: Range) {
  const startRow = range.start.row > 0 ? range.start.row - 1 : 0;
  const startWidth = editor.lineTextForBufferRow(startRow).length;
  const endRow =
    range.end.row == editor.getLastBufferRow()
      ? range.end.row
      : range.end.row - 1;
  const endWidth = editor.lineTextForBufferRow(endRow).length;
  return new Range(
    new Point(startRow, startWidth),
    new Point(endRow, endWidth)
  );
}

export function getEscapeBlankRowsEndRow(editor: TextEditor, end: Point) {
  return end.row === editor.getLastBufferRow() ? end.row : end.row - 1;
}
