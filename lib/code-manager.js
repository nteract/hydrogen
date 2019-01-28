/* @flow */

import { Point, Range } from "atom";

import escapeStringRegexp from "escape-string-regexp";
import stripIndent from "strip-indent";
import _ from "lodash";

import {
  log,
  isMultilanguageGrammar,
  getEmbeddedScope,
  rowRangeForCodeFoldAtBufferRow
} from "./utils";

export function normalizeString(code: ?string) {
  if (code) {
    return code.replace(/\r\n|\r/g, "\n");
  }
  return null;
}

export function getRow(editor: atom$TextEditor, row: number) {
  return normalizeString(editor.lineTextForBufferRow(row));
}

export function getTextInRange(
  editor: atom$TextEditor,
  start: atom$Point,
  end: atom$Point
) {
  const code = editor.getTextInBufferRange([start, end]);
  return normalizeString(code);
}

export function getRows(
  editor: atom$TextEditor,
  startRow: number,
  endRow: number
) {
  const code = editor.getTextInBufferRange({
    start: {
      row: startRow,
      column: 0
    },
    end: {
      row: endRow,
      column: 9999999
    }
  });
  return normalizeString(code);
}

export function getMetadataForRow(
  editor: atom$TextEditor,
  start: atom$Point
): string {
  // `start` is a Point on the first line of the cell. The cell marker is on the
  // previous line
  if (start.row === 0) {
    return "code";
  }
  var rowText = getRow(editor, start.row - 1);
  if (_.includes(rowText, "md") || _.includes(rowText, "markdown")) {
    return "markdown";
  } else {
    return "code";
  }
}

export function removeCommentsMarkdownCell(
  editor: atom$TextEditor,
  text: string
): string {
  const commentStartString = getCommentStartString(editor);
  if (!commentStartString) return text;

  const lines = text.split("\n");
  const editedLines = [];
  _.forEach(lines, line => {
    if (line.startsWith(commentStartString)) {
      // Remove comment from start of line
      editedLines.push(line.slice(commentStartString.length));
    } else {
      editedLines.push(line);
    }
  });
  return stripIndent(editedLines.join("\n"));
}

export function getSelectedText(editor: atom$TextEditor) {
  return normalizeString(editor.getSelectedText());
}

export function isComment(editor: atom$TextEditor, position: atom$Point) {
  const scope = editor.scopeDescriptorForBufferPosition(position);
  const scopeString = scope.getScopeChain();
  return _.includes(scopeString, "comment.line");
}

export function isBlank(editor: atom$TextEditor, row: number) {
  return editor.getBuffer().isRowBlank(row) || editor.isBufferRowCommented(row);
}

export function escapeBlankRows(
  editor: atom$TextEditor,
  startRow: number,
  endRow: number
) {
  while (endRow > startRow) {
    if (!isBlank(editor, endRow)) break;
    endRow -= 1;
  }
  return endRow;
}

export function getFoldRange(editor: atom$TextEditor, row: number) {
  const range = rowRangeForCodeFoldAtBufferRow(editor, row);
  if (!range) return;
  if (
    range[1] < editor.getLastBufferRow() &&
    getRow(editor, range[1] + 1) === "end"
  ) {
    range[1] += 1;
  }
  log("getFoldRange:", range);
  return range;
}

export function getFoldContents(editor: atom$TextEditor, row: number) {
  const range = getFoldRange(editor, row);
  if (!range) return;
  return [getRows(editor, range[0], range[1]), range[1]];
}

export function getCodeToInspect(editor: atom$TextEditor) {
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

  return [code, cursorPosition];
}

export function getCommentStartString(editor: atom$TextEditor): ?string {
  const {
    commentStartString
    // $FlowFixMe: This is an unofficial API
  } = editor.tokenizedBuffer.commentStringsForPosition(
    editor.getCursorBufferPosition()
  );

  if (!commentStartString) {
    log("CellManager: No comment string defined in root scope");
    return null;
  }
  return commentStartString.trimRight();
}

export function getRegexString(editor: atom$TextEditor) {
  const commentStartString = getCommentStartString(editor);
  if (!commentStartString) return null;

  const escapedCommentStartString = escapeStringRegexp(commentStartString);

  const regexString = `${escapedCommentStartString}(%%| %%| <(?:codecell|md|markdown)>| In\[[0-9 ]*\]:?)`;

  return regexString;
}

export function getBreakpoints(editor: atom$TextEditor) {
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

function getCurrentCodeCell(editor: atom$TextEditor) {
  const buffer = editor.getBuffer();
  let start = new Point(0, 0);
  let end = buffer.getEndPosition();
  const regexString = getRegexString(editor);

  if (!regexString) {
    return new Range(start, end);
  }

  const regex = new RegExp(regexString);
  const cursor = editor.getCursorBufferPosition();

  while (cursor.row < end.row && isComment(editor, cursor)) {
    cursor.row += 1;
    cursor.column = 0;
  }

  if (cursor.row > 0) {
    buffer.backwardsScanInRange(
      regex,
      new Range(start, cursor),
      ({ range }) => {
        start = new Point(range.start.row + 1, 0);
      }
    );
  }

  buffer.scanInRange(regex, new Range(cursor, end), ({ range }) => {
    end = range.start;
  });

  log("CellManager: Cell [start, end]:", [start, end], "cursor:", cursor);

  return new Range(start, end);
}

function isEmbeddedCode(
  editor: atom$TextEditor,
  referenceScope: string,
  row: number
) {
  const scopes = editor
    .scopeDescriptorForBufferPosition(new Point(row, 0))
    .getScopesArray();
  return _.includes(scopes, referenceScope);
}

function getCurrentFencedCodeBlock(editor: atom$TextEditor) {
  const buffer = editor.getBuffer();
  const { row: bufferEndRow } = buffer.getEndPosition();

  const cursor = editor.getCursorBufferPosition();
  let start = cursor.row;
  let end = cursor.row;
  const scope = getEmbeddedScope(editor, cursor);
  if (!scope) return getCurrentCodeCell(editor);
  while (start > 0 && isEmbeddedCode(editor, scope, start - 1)) {
    start -= 1;
  }

  while (end < bufferEndRow && isEmbeddedCode(editor, scope, end + 1)) {
    end += 1;
  }

  return new Range([start, 0], [end, 9999999]);
}

export function getCurrentCell(editor: atom$TextEditor) {
  if (isMultilanguageGrammar(editor.getGrammar())) {
    return getCurrentFencedCodeBlock(editor);
  }
  return getCurrentCodeCell(editor);
}

export function getCells(
  editor: atom$TextEditor,
  breakpoints: Array<atom$Point> = []
) {
  if (breakpoints.length !== 0) {
    breakpoints.sort((a, b) => a.compare(b));
  } else {
    breakpoints = getBreakpoints(editor);
  }
  return getCellsForBreakPoints(editor, breakpoints);
}

export function getCellsForBreakPoints(
  editor: atom$TextEditor,
  breakpoints: Array<atom$Point>
): Array<atom$Range> {
  let start = new Point(0, 0);
  // Let start be earliest row with text
  editor.scan(/\S/, match => {
    start = new Point(match.range.start.row, 0);
    match.stop();
  });
  return _.compact(
    _.map(breakpoints, end => {
      const cell = end.isEqual(start) ? null : new Range(start, end);
      start = new Point(end.row + 1, 0);
      return cell;
    })
  );
}

export function moveDown(editor: atom$TextEditor, row: number) {
  const lastRow = editor.getLastBufferRow();

  if (row >= lastRow) {
    editor.moveToBottom();
    editor.insertNewline();
    return;
  }

  while (row < lastRow) {
    row += 1;
    if (!isBlank(editor, row)) break;
  }

  editor.setCursorBufferPosition({
    row,
    column: 0
  });
}

export function findPrecedingBlock(
  editor: atom$TextEditor,
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
      return [getRows(editor, previousRow, row), row];
    }
    previousRow -= 1;
  }
  return null;
}

export function findCodeBlock(editor: atom$TextEditor) {
  const selectedText = getSelectedText(editor);

  if (selectedText) {
    const selectedRange = editor.getSelectedBufferRange();
    let endRow = selectedRange.end.row;
    if (selectedRange.end.column === 0) {
      endRow -= 1;
    }
    endRow = escapeBlankRows(editor, selectedRange.start.row, endRow);
    return [selectedText, endRow];
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
  return [getRow(editor, row), row];
}

export function foldCurrentCell(editor: atom$TextEditor) {
  const cellRange = getCurrentCell(editor);
  const newRange = adjustCellFoldRange(editor, cellRange);
  editor.setSelectedBufferRange(newRange);
  editor.getSelections()[0].fold();
}

export function foldAllButCurrentCell(editor: atom$TextEditor) {
  const initialSelections = editor.getSelectedBufferRanges();

  // I take .slice(1) because there's always an empty cell range from [0,0] to
  // [0,0]
  const allCellRanges = getCells(editor).slice(1);
  const currentCellRange = getCurrentCell(editor);
  const newRanges = allCellRanges
    .filter(cellRange => !cellRange.isEqual(currentCellRange))
    .map(cellRange => adjustCellFoldRange(editor, cellRange));

  editor.setSelectedBufferRanges(newRanges);
  editor.getSelections().forEach(selection => selection.fold());

  // Restore selections
  editor.setSelectedBufferRanges(initialSelections);
}

function adjustCellFoldRange(editor: atom$TextEditor, range: atom$Range) {
  const startRow = range.start.row > 0 ? range.start.row - 1 : 0;
  const startWidth = editor.lineTextForBufferRow(startRow).length;
  const endRow =
    range.end.row == editor.getLastBufferRow()
      ? range.end.row
      : range.end.row - 1;

  return new Range(
    new Point(startRow, startWidth),
    new Point(endRow, range.end.column)
  );
}
