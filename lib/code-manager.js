'use babel';

import { Point, Range } from 'atom';

import escapeStringRegexp from 'escape-string-regexp';
import _ from 'lodash';

import store from './store';
import log from './utils/log';

export function normalizeString(code) {
  if (code) {
    return code.replace(/\r\n|\r/g, '\n').trim();
  }
  return null;
}

export function getRow(row) {
  return normalizeString(store.editor.lineTextForBufferRow(row));
}

export function getTextInRange(start, end) {
  const code = store.editor.getTextInBufferRange([start, end]);
  return normalizeString(code);
}

export function getRows(startRow, endRow) {
  const code = store.editor.getTextInBufferRange({
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

export function getSelectedText() {
  return normalizeString(store.editor.getSelectedText());
}

export function isComment(position) {
  const scope = store.editor.scopeDescriptorForBufferPosition(position);
  const scopeString = scope.getScopeChain();
  return _.includes(scopeString, 'comment.line');
}

export function isBlank(row) {
  return store.editor.getBuffer().isRowBlank(row) ||
    store.editor.languageMode.isLineCommentedAtBufferRow(row);
}

export function escapeBlankRows(startRow, endRow) {
  while (endRow > startRow) {
    if (!isBlank(endRow)) break;
    endRow -= 1;
  }
  return endRow;
}

export function getFoldRange(row) {
  const range = store.editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
  if (range[1] < store.editor.getLastBufferRow() &&
    getRow(range[1] + 1) === 'end') {
    range[1] += 1;
  }
  log('getFoldRange:', range);
  return range;
}

export function getFoldContents(row) {
  const range = getFoldRange(row);
  return [getRows(range[0], range[1]), range[1]];
}

export function getCodeToInspect() {
  const selectedText = getSelectedText();
  let code;
  let cursorPosition;
  if (selectedText) {
    code = selectedText;
    cursorPosition = code.length;
  } else {
    const cursor = store.editor.getLastCursor();
    const row = cursor.getBufferRow();
    code = getRow(row);
    cursorPosition = cursor.getBufferColumn();

    // TODO: use kernel.complete to find a selection
    const identifierEnd = code ? code.slice(cursorPosition).search(/\W/) : -1;
    if (identifierEnd !== -1) {
      cursorPosition += identifierEnd;
    }
  }

  return [code, cursorPosition];
}

export function getCommentStrings(scope) {
  if (parseFloat(atom.getVersion()) <= 1.1) {
    return store.editor.languageMode.commentStartAndEndStringsForScope(scope);
  }
  return store.editor.getCommentStrings(scope);
}

export function getRegexString() {
  const scope = store.editor.getRootScopeDescriptor();

  const { commentStartString } = getCommentStrings(scope);

  if (!commentStartString) {
    log('CellManager: No comment string defined in root scope');
    return null;
  }

  const escapedCommentStartString =
    escapeStringRegexp(commentStartString.trimRight());

  const regexString =
    `${escapedCommentStartString}(%%| %%| <codecell>| In\[[0-9 ]*\]:?)`;

  return regexString;
}

export function getBreakpoints() {
  const buffer = store.editor.getBuffer();
  const breakpoints = [buffer.getFirstPosition()];

  const regexString = getRegexString(store.editor);
  if (regexString) {
    const regex = new RegExp(regexString, 'g');
    buffer.scan(regex, ({ range }) => breakpoints.push(range.start));
  }

  breakpoints.push(buffer.getEndPosition());

  log('CellManager: Breakpoints:', breakpoints);

  return breakpoints;
}

export function getCurrentCell() {
  const buffer = store.editor.getBuffer();
  let start = buffer.getFirstPosition();
  let end = buffer.getEndPosition();
  const regexString = getRegexString(store.editor);

  if (!regexString) {
    return [start, end];
  }

  const regex = new RegExp(regexString);
  const cursor = store.editor.getCursorBufferPosition();

  while (cursor.row < end.row && isComment(cursor)) {
    cursor.row += 1;
    cursor.column = 0;
  }

  if (cursor.row > 0) {
    buffer.backwardsScanInRange(regex, [start, cursor], ({ range }) => {
      start = new Point(range.start.row + 1, 0);
    });
  }

  buffer.scanInRange(regex, [cursor, end], ({ range }) => {
    end = range.start;
  });

  log('CellManager: Cell [start, end]:', [start, end],
    'cursor:', cursor);

  return new Range(start, end);
}

export function getCells() {
  const breakpoints = getBreakpoints();
  let start = breakpoints.shift();

  return _.map(breakpoints, (end) => {
    const cell = new Range(start, end);
    start = new Point(end.row + 1, 0);
    return cell;
  });
}

export function moveDown(row) {
  const lastRow = store.editor.getLastBufferRow();

  if (row >= lastRow) {
    store.editor.moveToBottom();
    store.editor.insertNewline();
    return;
  }

  while (row < lastRow) {
    row += 1;
    if (!isBlank(row)) break;
  }

  store.editor.setCursorBufferPosition({
    row,
    column: 0,
  });
}

export function findPrecedingBlock(row, indentLevel) {
  let previousRow = row - 1;
  while (previousRow >= 0) {
    const previousIndentLevel = store.editor.indentationForBufferRow(previousRow);
    const sameIndent = previousIndentLevel <= indentLevel;
    const blank = isBlank(previousRow);
    const isEnd = getRow(previousRow) === 'end';

    if (isBlank(row)) {
      row = previousRow;
    }
    if (sameIndent && !blank && !isEnd) {
      return [getRows(previousRow, row), row];
    }
    previousRow -= 1;
  }
  return null;
}

export function findCodeBlock() {
  const selectedText = getSelectedText();

  if (selectedText) {
    const selectedRange = store.editor.getSelectedBufferRange();
    let endRow = selectedRange.end.row;
    if (selectedRange.end.column === 0) {
      endRow -= 1;
    }
    endRow = escapeBlankRows(selectedRange.start.row, endRow);
    return [selectedText, endRow];
  }

  const cursor = store.editor.getLastCursor();

  const row = cursor.getBufferRow();
  log('findCodeBlock:', row);

  const indentLevel = cursor.getIndentLevel();

  let foldable = store.editor.isFoldableAtBufferRow(row);
  const foldRange = store.editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
  if (!foldRange || !foldRange[0] || !foldRange[1]) {
    foldable = false;
  }

  if (foldable) {
    return getFoldContents(row);
  }
  if (isBlank(row) || getRow(row) === 'end') {
    return findPrecedingBlock(row, indentLevel);
  }
  return [getRow(row), row];
}
