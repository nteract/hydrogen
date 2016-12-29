'use babel';

import escapeStringRegexp from 'escape-string-regexp';
import _ from 'lodash';

import log from './log';

export default class CodeManager {
  constructor() {
    this.editor = atom.workspace.getActiveTextEditor();
  }


  findCodeBlock() {
    const selectedText = this.getSelectedText();

    if (selectedText) {
      const selectedRange = this.editor.getSelectedBufferRange();
      let endRow = selectedRange.end.row;
      if (selectedRange.end.column === 0) {
        endRow -= 1;
      }
      endRow = this.escapeBlankRows(selectedRange.start.row, endRow);
      return [selectedText, endRow];
    }

    const cursor = this.editor.getLastCursor();

    const row = cursor.getBufferRow();
    log('findCodeBlock:', row);

    const indentLevel = cursor.getIndentLevel();

    let foldable = this.editor.isFoldableAtBufferRow(row);
    const foldRange = this.editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
    if (!foldRange || !foldRange[0] || !foldRange[1]) {
      foldable = false;
    }

    if (foldable) {
      return this.getFoldContents(row);
    }
    if (this.isBlank(row) || this.getRow(row) === 'end') {
      return this.findPrecedingBlock(row, indentLevel);
    }
    return [this.getRow(row), row];
  }


  findPrecedingBlock(row, indentLevel) {
    let previousRow = row - 1;
    while (previousRow >= 0) {
      const previousIndentLevel = this.editor.indentationForBufferRow(previousRow);
      const sameIndent = previousIndentLevel <= indentLevel;
      const blank = this.isBlank(previousRow);
      const isEnd = this.getRow(previousRow) === 'end';

      if (this.isBlank(row)) {
        row = previousRow;
      }
      if (sameIndent && !blank && !isEnd) {
        return [this.getRows(previousRow, row), row];
      }
      previousRow -= 1;
    }
    return null;
  }


  getRow(row) {
    return this.normalizeString(this.editor.lineTextForBufferRow(row));
  }


  getTextInRange(start, end) {
    const code = this.editor.getTextInBufferRange([start, end]);
    return this.normalizeString(code);
  }


  getRows(startRow, endRow) {
    const code = this.editor.getTextInBufferRange({
      start: {
        row: startRow,
        column: 0,
      },
      end: {
        row: endRow,
        column: 9999999,
      },
    });
    return this.normalizeString(code);
  }


  getSelectedText() {
    return this.normalizeString(this.editor.getSelectedText());
  }


  getFoldRange(row) {
    const range = this.editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
    if (range[1] < this.editor.getLastBufferRow() &&
      this.getRow(range[1] + 1) === 'end') {
      range[1] += 1;
    }
    log('getFoldRange:', range);
    return range;
  }


  getFoldContents(row) {
    const range = this.getFoldRange(row);
    return [this.getRows(range[0], range[1]), range[1]];
  }


  getCodeToInspect() {
    const selectedText = this.getSelectedText();
    let code;
    let cursorPosition;
    if (selectedText) {
      code = selectedText;
      cursorPosition = code.length;
    } else {
      const cursor = this.editor.getLastCursor();
      const row = cursor.getBufferRow();
      code = this.getRow(row);
      cursorPosition = cursor.getBufferColumn();

      // TODO: use kernel.complete to find a selection
      const identifierEnd = code.slice(cursorPosition).search(/\W/);
      if (identifierEnd !== -1) {
        cursorPosition += identifierEnd;
      }
    }

    return [code, cursorPosition];
  }


  getCurrentCell() {
    const buffer = this.editor.getBuffer();
    let start = buffer.getFirstPosition();
    let end = buffer.getEndPosition();
    const regexString = this.getRegexString(this.editor);

    if (!regexString) {
      return [start, end];
    }

    const regex = new RegExp(regexString);
    const cursor = this.editor.getCursorBufferPosition();

    while (cursor.row < end.row && this.isComment(cursor)) {
      cursor.row += 1;
      cursor.column = 0;
    }

    if (cursor.row > 0) {
      buffer.backwardsScanInRange(regex, [start, cursor], ({ range }) => {
        start = range.start;
      });
    }

    buffer.scanInRange(regex, [cursor, end], ({ range }) => {
      end = range.start;
    });

    log('CellManager: Cell [start, end]:', [start, end],
      'cursor:', cursor);

    return [start, end];
  }


  getBreakpoints() {
    const buffer = this.editor.getBuffer();
    const breakpoints = [buffer.getFirstPosition()];

    const regexString = this.getRegexString(this.editor);
    if (regexString) {
      const regex = new RegExp(regexString, 'g');
      buffer.scan(regex, ({ range }) => breakpoints.push(range.start));
    }

    breakpoints.push(buffer.getEndPosition());

    log('CellManager: Breakpoints:', breakpoints);

    return breakpoints;
  }


  getRegexString() {
    const scope = this.editor.getRootScopeDescriptor();

    const { commentStartString } = this.getCommentStrings(scope);

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


  getCommentStrings(scope) {
    if (parseFloat(atom.getVersion()) <= 1.1) {
      return this.editor.languageMode.commentStartAndEndStringsForScope(scope);
    }
    return this.editor.getCommentStrings(scope);
  }


  normalizeString(code) {
    if (code) {
      return code.replace(/\r\n|\r/g, '\n').trim();
    }
    return null;
  }


  isComment(position) {
    const scope = this.editor.scopeDescriptorForBufferPosition(position);
    const scopeString = scope.getScopeChain();
    return _.includes(scopeString, 'comment.line');
  }


  isBlank(row) {
    return this.editor.getBuffer().isRowBlank(row) ||
      this.editor.languageMode.isLineCommentedAtBufferRow(row);
  }


  escapeBlankRows(startRow, endRow) {
    while (endRow > startRow) {
      if (!this.isBlank(endRow)) break;
      endRow -= 1;
    }
    return endRow;
  }


  moveDown(row) {
    const lastRow = this.editor.getLastBufferRow();

    if (row >= lastRow) {
      this.editor.moveToBottom();
      this.editor.insertNewline();
      return;
    }

    while (row < lastRow) {
      row += 1;
      if (!this.isBlank(row)) break;
    }

    this.editor.setCursorBufferPosition({
      row,
      column: 0,
    });
  }
}
