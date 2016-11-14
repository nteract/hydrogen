import escapeStringRegexp from 'escape-string-regexp';
import _ from 'lodash';

export default class CodeManager {
  constructor() {
    this.editor = atom.workspace.getActiveTextEditor();
  }


  findCodeBlock() {
    let selectedText = this.getSelectedText();

    if (selectedText) {
      let selectedRange = this.editor.getSelectedBufferRange();
      let endRow = selectedRange.end.row;
      if (selectedRange.end.column === 0) {
        endRow = endRow - 1;
      }
      endRow = this.escapeBlankRows(selectedRange.start.row, endRow);
      return [selectedText, endRow];
    }

    let cursor = this.editor.getLastCursor();

    let row = cursor.getBufferRow();
    console.log('findCodeBlock:', row);

    let indentLevel = cursor.getIndentLevel();

    let foldable = this.editor.isFoldableAtBufferRow(row);
    let foldRange = this.editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
    if ((foldRange == null) || (foldRange[0] == null) || (foldRange[1] == null)) {
      foldable = false;
    }

    if (foldable) {
      return this.getFoldContents(row);
    } else if (this.isBlank(row)) {
      return this.findPrecedingBlock(row, indentLevel);
    } else if (this.getRow(row).trim() === 'end') {
      return this.findPrecedingBlock(row, indentLevel);
    } else {
      return [this.getRow(row), row];
    }
  }


  findPrecedingBlock(row, indentLevel) {
    let previousRow = row - 1;
    while (previousRow >= 0) {
      let previousIndentLevel = this.editor.indentationForBufferRow(previousRow);
      let sameIndent = previousIndentLevel <= indentLevel;
      let blank = this.isBlank(previousRow);
      let isEnd = this.getRow(previousRow).trim() === 'end';

      if (this.isBlank(row)) {
        row = previousRow;
      }
      if (sameIndent && !blank && !isEnd) {
        return [this.getRows(previousRow, row), row];
      }
      previousRow--;
    }
    return null;
  }


  getRow(row) {
    return this.normalizeString(this.editor.lineTextForBufferRow(row));
  }


  getTextInRange(start, end) {
    let code = this.editor.getTextInBufferRange([start, end]);
    return this.normalizeString(code);
  }


  getRows(startRow, endRow) {
    let code = this.editor.getTextInBufferRange({
      start: {
        row: startRow,
        column: 0
      },
      end: {
        row: endRow,
        column: 9999999
      }
    });
    return this.normalizeString(code);
  }


  getSelectedText() {
    return this.normalizeString(this.editor.getSelectedText());
  }


  normalizeString(code) {
    if (code != null) {
      return code.replace(/\r\n|\r/g, '\n');
    }
  }


  getFoldRange(row) {
    let range = this.editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
    if (__guard__(this.getRow(range[1] + 1), x => x.trim()) === 'end') {
      range[1] = range[1] + 1;
    }
    console.log('getFoldRange:', range);
    return range;
  }


  getFoldContents(row) {
    let range = this.getFoldRange(row);
    return [this.getRows(range[0], range[1]), range[1]];
  }


  getCodeToInspect() {
    let selectedText = this.getSelectedText();
    if (selectedText) {
      var code = selectedText;
      var cursor_pos = code.length;
    } else {
      let cursor = this.editor.getLastCursor();
      let row = cursor.getBufferRow();
      var code = this.getRow(row);
      var cursor_pos = cursor.getBufferColumn();

      // TODO: use kernel.complete to find a selection
      let identifier_end = code.slice(cursor_pos).search(/\W/);
      if (identifier_end !== -1) {
        cursor_pos += identifier_end;
      }
    }

    return [code, cursor_pos];
  }


  getCurrentCell() {
    let buffer = this.editor.getBuffer();
    let start = buffer.getFirstPosition();
    let end = buffer.getEndPosition();
    let regexString = this.getRegexString(this.editor);

    if (regexString == null) {
      return [start, end];
    }

    let regex = new RegExp(regexString);
    let cursor = this.editor.getCursorBufferPosition();

    while (cursor.row < end.row && this.isComment(cursor)) {
      cursor.row += 1;
      cursor.column = 0;
    }

    if (cursor.row > 0) {
      buffer.backwardsScanInRange(regex, [start, cursor], ({ range }) => start = range.start);
    }

    buffer.scanInRange(regex, [cursor, end], ({ range }) => end = range.start);

    console.log('CellManager: Cell [start, end]:', [start, end],
      'cursor:', cursor);

    return [start, end];
  }


  getBreakpoints() {
    let buffer = this.editor.getBuffer();
    let breakpoints = [buffer.getFirstPosition()];

    let regexString = this.getRegexString(this.editor);
    if (regexString != null) {
      let regex = new RegExp(regexString, 'g');
      buffer.scan(regex, ({ range }) => breakpoints.push(range.start));
    }

    breakpoints.push(buffer.getEndPosition());

    console.log('CellManager: Breakpoints:', breakpoints);

    return breakpoints;
  }


  getRegexString() {
    let scope = this.editor.getRootScopeDescriptor();

    let { commentStartString, commentEndString } = this.getCommentStrings(scope);

    if (!commentStartString) {
      console.log('CellManager: No comment string defined in root scope');
      return;
    }

    let escapedCommentStartString =
      escapeStringRegexp(commentStartString.trimRight());

    let regexString =
      escapedCommentStartString + '(%%| %%| <codecell>| In\[[0-9 ]*\]:?)';

    return regexString;
  }


  getCommentStrings(scope) {
    if (parseFloat(atom.getVersion()) <= 1.1) {
      return this.editor.languageMode.commentStartAndEndStringsForScope(scope);
    } else {
      return this.editor.getCommentStrings(scope);
    }
  }


  isComment(position) {
    let scope = this.editor.scopeDescriptorForBufferPosition(position);
    let scopeString = scope.getScopeChain();
    return _.includes(scopeString, 'comment.line');
  }


  isBlank(row) {
    return this.editor.getBuffer().isRowBlank(row) ||
      this.editor.languageMode.isLineCommentedAtBufferRow(row);
  }


  escapeBlankRows(startRow, endRow) {
    if (endRow > startRow) {
      for (let i of __range__(startRow, endRow - 1, true)) {
        if (this.isBlank(endRow)) {
          endRow -= 1;
        }
      }
    }
    return endRow;
  }


  moveDown(row) {
    let lastRow = this.editor.getLastBufferRow();

    if (row >= lastRow) {
      this.editor.moveToBottom();
      this.editor.insertNewline();
      return;
    }

    while (row < lastRow) {
      row++;
      if (!this.isBlank(row)) { break; }
    }

    return this.editor.setCursorBufferPosition({
      row,
      column: 0
    });
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
