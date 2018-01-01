/* @flow */

import { Point, Range } from "atom";

import escapeStringRegexp from "escape-string-regexp";
import _ from "lodash";

import {
  log,
  isMultilanguageGrammar,
  getEmbeddedScope,
  rowRangeForCodeFoldAtBufferRow
} from "./utils";

export function normalizeString(code: ?string) {
  if (code) {
    return code.replace(/\r\n|\r/g, "\n").trim();
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

export function getRegexString(editor: atom$TextEditor) {
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

  const escapedCommentStartString = escapeStringRegexp(
    commentStartString.trimRight()
  );

  const regexString = `${
    escapedCommentStartString
  }(%%| %%| <codecell>| In\[[0-9 ]*\]:?)`;

  return regexString;
}

export function getBreakpoints(editor: atom$TextEditor) {
  const buffer = editor.getBuffer();
  const breakpoints = [];

  const regexString = getRegexString(editor);
  if (regexString) {
    const regex = new RegExp(regexString, "g");
    buffer.scan(regex, ({ range }) => {
      breakpoints.push(range.start);
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
  return getCellsForBreakPoints(breakpoints);
}

export function getCellsForBreakPoints(breakpoints: Array<atom$Point>) {
  let start = new Point(0, 0);
  return _.map(breakpoints, end => {
    const cell = new Range(start, end);
    start = new Point(end.row + 1, 0);
    return cell;
  });
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
