"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEscapeBlankRowsEndRow = exports.foldAllButCurrentCell = exports.foldCurrentCell = exports.findCodeBlock = exports.findPrecedingBlock = exports.moveDown = exports.getCellsForBreakPoints = exports.getCells = exports.getCurrentCell = exports.getBreakpoints = exports.getRegexString = exports.getCommentStartString = exports.getCodeToInspect = exports.getFoldContents = exports.getFoldRange = exports.escapeBlankRows = exports.isBlank = exports.isComment = exports.getSelectedText = exports.removeCommentsMarkdownCell = exports.getMetadataForRow = exports.getRows = exports.getTextInRange = exports.getRow = exports.normalizeString = void 0;
const atom_1 = require("atom");
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const strip_indent_1 = __importDefault(require("strip-indent"));
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("./utils");
function normalizeString(code) {
    if (code) {
        return code.replace(/\r\n|\r/g, "\n");
    }
    return null;
}
exports.normalizeString = normalizeString;
function getRow(editor, row) {
    return normalizeString(editor.lineTextForBufferRow(row));
}
exports.getRow = getRow;
function getTextInRange(editor, start, end) {
    const code = editor.getTextInBufferRange([start, end]);
    return normalizeString(code);
}
exports.getTextInRange = getTextInRange;
function getRows(editor, startRow, endRow) {
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
exports.getRows = getRows;
function getMetadataForRow(editor, anyPointInCell) {
    if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
        return "codecell";
    }
    let cellType = "codecell";
    const buffer = editor.getBuffer();
    anyPointInCell = new atom_1.Point(anyPointInCell.row, buffer.lineLengthForRow(anyPointInCell.row));
    const regexString = getRegexString(editor);
    if (regexString) {
        const regex = new RegExp(regexString);
        buffer.backwardsScanInRange(regex, new atom_1.Range(new atom_1.Point(0, 0), anyPointInCell), ({ match }) => {
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
        });
    }
    return cellType;
}
exports.getMetadataForRow = getMetadataForRow;
function removeCommentsMarkdownCell(editor, text) {
    const commentStartString = getCommentStartString(editor);
    if (!commentStartString) {
        return text;
    }
    const lines = text.split("\n");
    const editedLines = [];
    lodash_1.default.forEach(lines, (line) => {
        if (line.startsWith(commentStartString)) {
            editedLines.push(line.slice(commentStartString.length));
        }
        else {
            editedLines.push(line);
        }
    });
    return strip_indent_1.default(editedLines.join("\n"));
}
exports.removeCommentsMarkdownCell = removeCommentsMarkdownCell;
function getSelectedText(editor) {
    return normalizeString(editor.getSelectedText());
}
exports.getSelectedText = getSelectedText;
function isComment(editor, position) {
    const scope = editor.scopeDescriptorForBufferPosition(position);
    const scopeString = scope.getScopeChain();
    return lodash_1.default.includes(scopeString, "comment.line");
}
exports.isComment = isComment;
function isBlank(editor, row) {
    return editor.getBuffer().isRowBlank(row);
}
exports.isBlank = isBlank;
function escapeBlankRows(editor, startRow, endRow) {
    while (endRow > startRow) {
        if (!isBlank(editor, endRow)) {
            break;
        }
        endRow -= 1;
    }
    return endRow;
}
exports.escapeBlankRows = escapeBlankRows;
function getFoldRange(editor, row) {
    const range = utils_1.rowRangeForCodeFoldAtBufferRow(editor, row);
    if (!range) {
        return;
    }
    if (range[1] < editor.getLastBufferRow() &&
        getRow(editor, range[1] + 1) === "end") {
        range[1] += 1;
    }
    utils_1.log("getFoldRange:", range);
    return range;
}
exports.getFoldRange = getFoldRange;
function getFoldContents(editor, row) {
    const range = getFoldRange(editor, row);
    if (!range) {
        return;
    }
    return {
        code: getRows(editor, range[0], range[1]),
        row: range[1],
    };
}
exports.getFoldContents = getFoldContents;
function getCodeToInspect(editor) {
    const selectedText = getSelectedText(editor);
    let code;
    let cursorPosition;
    if (selectedText) {
        code = selectedText;
        cursorPosition = code.length;
    }
    else {
        const cursor = editor.getLastCursor();
        const row = cursor.getBufferRow();
        code = getRow(editor, row);
        cursorPosition = cursor.getBufferColumn();
        const identifierEnd = code ? code.slice(cursorPosition).search(/\W/) : -1;
        if (identifierEnd !== -1) {
            cursorPosition += identifierEnd;
        }
    }
    cursorPosition = utils_1.js_idx_to_char_idx(cursorPosition, code);
    return [code, cursorPosition];
}
exports.getCodeToInspect = getCodeToInspect;
function getCommentStartString(editor) {
    const { commentStartString, } = editor.tokenizedBuffer.commentStringsForPosition(editor.getCursorBufferPosition());
    if (!commentStartString) {
        utils_1.log("CellManager: No comment string defined in root scope");
        return null;
    }
    return commentStartString.trimRight();
}
exports.getCommentStartString = getCommentStartString;
function getRegexString(editor) {
    const commentStartString = getCommentStartString(editor);
    if (!commentStartString) {
        return null;
    }
    const escapedCommentStartString = escape_string_regexp_1.default(commentStartString);
    const regexString = `${escapedCommentStartString} *%% *(md|markdown)?| *<(codecell|md|markdown)>| *(In\[[0-9 ]*\])`;
    return regexString;
}
exports.getRegexString = getRegexString;
function getBreakpoints(editor) {
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
    utils_1.log("CellManager: Breakpoints:", breakpoints);
    return breakpoints;
}
exports.getBreakpoints = getBreakpoints;
function getCell(editor, anyPointInCell) {
    if (!anyPointInCell) {
        anyPointInCell = editor.getCursorBufferPosition();
    }
    const buffer = editor.getBuffer();
    anyPointInCell = new atom_1.Point(anyPointInCell.row, buffer.lineLengthForRow(anyPointInCell.row));
    let start = new atom_1.Point(0, 0);
    let end = buffer.getEndPosition();
    const regexString = getRegexString(editor);
    if (!regexString) {
        return new atom_1.Range(start, end);
    }
    const regex = new RegExp(regexString);
    if (anyPointInCell.row >= 0) {
        buffer.backwardsScanInRange(regex, new atom_1.Range(start, anyPointInCell), ({ range }) => {
            start = new atom_1.Point(range.start.row + 1, 0);
        });
    }
    buffer.scanInRange(regex, new atom_1.Range(anyPointInCell, end), ({ range }) => {
        end = range.start;
    });
    utils_1.log("CellManager: Cell [start, end]:", [start, end], "anyPointInCell:", anyPointInCell);
    return new atom_1.Range(start, end);
}
function isEmbeddedCode(editor, referenceScope, row) {
    const scopes = editor
        .scopeDescriptorForBufferPosition(new atom_1.Point(row, 0))
        .getScopesArray();
    return lodash_1.default.includes(scopes, referenceScope);
}
function getCurrentFencedCodeBlock(editor) {
    const buffer = editor.getBuffer();
    const { row: bufferEndRow } = buffer.getEndPosition();
    const cursor = editor.getCursorBufferPosition();
    let start = cursor.row;
    let end = cursor.row;
    const scope = utils_1.getEmbeddedScope(editor, cursor);
    if (!scope) {
        return getCell(editor);
    }
    while (start > 0 && isEmbeddedCode(editor, scope, start - 1)) {
        start -= 1;
    }
    while (end < bufferEndRow && isEmbeddedCode(editor, scope, end + 1)) {
        end += 1;
    }
    return new atom_1.Range([start, 0], [end + 1, 0]);
}
function getCurrentCell(editor) {
    if (utils_1.isMultilanguageGrammar(editor.getGrammar())) {
        return getCurrentFencedCodeBlock(editor);
    }
    return getCell(editor);
}
exports.getCurrentCell = getCurrentCell;
function getCells(editor, breakpoints = []) {
    if (breakpoints.length !== 0) {
        breakpoints.sort((a, b) => a.compare(b));
    }
    else {
        breakpoints = getBreakpoints(editor);
    }
    return getCellsForBreakPoints(editor, breakpoints);
}
exports.getCells = getCells;
function getCellsForBreakPoints(editor, breakpoints) {
    let start = new atom_1.Point(0, 0);
    editor.scan(/\S/, (match) => {
        start = new atom_1.Point(match.range.start.row, 0);
        match.stop();
    });
    return lodash_1.default.compact(lodash_1.default.map(breakpoints, (end) => {
        const cell = end.isEqual(start) ? null : new atom_1.Range(start, end);
        start = new atom_1.Point(end.row + 1, 0);
        return cell;
    }));
}
exports.getCellsForBreakPoints = getCellsForBreakPoints;
function centerScreenOnCursorPosition(editor) {
    const cursorPosition = editor.element.pixelPositionForScreenPosition(editor.getCursorScreenPosition()).top;
    const editorHeight = editor.element.getHeight();
    editor.element.setScrollTop(cursorPosition - editorHeight / 2);
}
function moveDown(editor, row) {
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
exports.moveDown = moveDown;
function findPrecedingBlock(editor, row, indentLevel) {
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
            const cell = getCell(editor, new atom_1.Point(row, 0));
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
exports.findPrecedingBlock = findPrecedingBlock;
function findCodeBlock(editor) {
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
    utils_1.log("findCodeBlock:", row);
    const indentLevel = cursor.getIndentLevel();
    let foldable = editor.isFoldableAtBufferRow(row);
    const foldRange = utils_1.rowRangeForCodeFoldAtBufferRow(editor, row);
    if (!foldRange || foldRange[0] == null || foldRange[1] == null) {
        foldable = false;
    }
    if (foldable) {
        return getFoldContents(editor, row);
    }
    if (isBlank(editor, row) || getRow(editor, row) === "end") {
        return findPrecedingBlock(editor, row, indentLevel);
    }
    const cell = getCell(editor, new atom_1.Point(row, 0));
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
exports.findCodeBlock = findCodeBlock;
function foldCurrentCell(editor) {
    const cellRange = getCurrentCell(editor);
    const newRange = adjustCellFoldRange(editor, cellRange);
    editor.setSelectedBufferRange(newRange);
    editor.getSelections()[0].fold();
}
exports.foldCurrentCell = foldCurrentCell;
function foldAllButCurrentCell(editor) {
    const initialSelections = editor.getSelectedBufferRanges();
    const allCellRanges = getCells(editor).slice(1);
    const currentCellRange = getCurrentCell(editor);
    const newRanges = allCellRanges
        .filter((cellRange) => !cellRange.isEqual(currentCellRange))
        .map((cellRange) => adjustCellFoldRange(editor, cellRange));
    editor.setSelectedBufferRanges(newRanges);
    editor.getSelections().forEach((selection) => selection.fold());
    editor.setSelectedBufferRanges(initialSelections);
}
exports.foldAllButCurrentCell = foldAllButCurrentCell;
function adjustCellFoldRange(editor, range) {
    const startRow = range.start.row > 0 ? range.start.row - 1 : 0;
    const startWidth = editor.lineTextForBufferRow(startRow).length;
    const endRow = range.end.row == editor.getLastBufferRow()
        ? range.end.row
        : range.end.row - 1;
    const endWidth = editor.lineTextForBufferRow(endRow).length;
    return new atom_1.Range(new atom_1.Point(startRow, startWidth), new atom_1.Point(endRow, endWidth));
}
function getEscapeBlankRowsEndRow(editor, end) {
    return end.row === editor.getLastBufferRow() ? end.row : end.row - 1;
}
exports.getEscapeBlankRowsEndRow = getEscapeBlankRowsEndRow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NvZGUtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBZ0Q7QUFDaEQsZ0ZBQXNEO0FBQ3RELGdFQUF1QztBQUN2QyxvREFBdUI7QUFDdkIsbUNBTWlCO0FBR2pCLFNBQWdCLGVBQWUsQ0FBQyxJQUErQjtJQUM3RCxJQUFJLElBQUksRUFBRTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFORCwwQ0FNQztBQUNELFNBQWdCLE1BQU0sQ0FBQyxNQUFrQixFQUFFLEdBQVc7SUFDcEQsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUZELHdCQUVDO0FBQ0QsU0FBZ0IsY0FBYyxDQUFDLE1BQWtCLEVBQUUsS0FBWSxFQUFFLEdBQVU7SUFDekUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkQsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUhELHdDQUdDO0FBQ0QsU0FBZ0IsT0FBTyxDQUFDLE1BQWtCLEVBQUUsUUFBZ0IsRUFBRSxNQUFjO0lBQzFFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztRQUN2QyxLQUFLLEVBQUU7WUFDTCxHQUFHLEVBQUUsUUFBUTtZQUNiLE1BQU0sRUFBRSxDQUFDO1NBQ1Y7UUFDRCxHQUFHLEVBQUU7WUFDSCxHQUFHLEVBQUUsTUFBTTtZQUNYLE1BQU0sRUFBRSxPQUFPO1NBQ2hCO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENB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O0lBQzVELE9BQU8sSUFBSSxZQUFLLENBQ2QsSUFBSSxZQUFLLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxFQUMvQixJQUFJLFlBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQzVCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsTUFBa0IsRUFBRSxHQUFVO0lBQ3JFLE9BQU8sR0FBRyxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUZELDREQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9pbnQsIFJhbmdlLCBUZXh0RWRpdG9yIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBlc2NhcGVTdHJpbmdSZWdleHAgZnJvbSBcImVzY2FwZS1zdHJpbmctcmVnZXhwXCI7XG5pbXBvcnQgc3RyaXBJbmRlbnQgZnJvbSBcInN0cmlwLWluZGVudFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtcbiAgbG9nLFxuICBpc011bHRpbGFuZ3VhZ2VHcmFtbWFyLFxuICBnZXRFbWJlZGRlZFNjb3BlLFxuICByb3dSYW5nZUZvckNvZGVGb2xkQXRCdWZmZXJSb3csXG4gIGpzX2lkeF90b19jaGFyX2lkeCxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB0eXBlIHsgSHlkcm9nZW5DZWxsVHlwZSB9IGZyb20gXCIuL2h5ZHJvZ2VuXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmcoY29kZTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBpZiAoY29kZSkge1xuICAgIHJldHVybiBjb2RlLnJlcGxhY2UoL1xcclxcbnxcXHIvZywgXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb3coZWRpdG9yOiBUZXh0RWRpdG9yLCByb3c6IG51bWJlcikge1xuICByZXR1cm4gbm9ybWFsaXplU3RyaW5nKGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXh0SW5SYW5nZShlZGl0b3I6IFRleHRFZGl0b3IsIHN0YXJ0OiBQb2ludCwgZW5kOiBQb2ludCkge1xuICBjb25zdCBjb2RlID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtzdGFydCwgZW5kXSk7XG4gIHJldHVybiBub3JtYWxpemVTdHJpbmcoY29kZSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Um93cyhlZGl0b3I6IFRleHRFZGl0b3IsIHN0YXJ0Um93OiBudW1iZXIsIGVuZFJvdzogbnVtYmVyKSB7XG4gIGNvbnN0IGNvZGUgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2Uoe1xuICAgIHN0YXJ0OiB7XG4gICAgICByb3c6IHN0YXJ0Um93LFxuICAgICAgY29sdW1uOiAwLFxuICAgIH0sXG4gICAgZW5kOiB7XG4gICAgICByb3c6IGVuZFJvdyxcbiAgICAgIGNvbHVtbjogOTk5OTk5OSxcbiAgICB9LFxuICB9KTtcbiAgcmV0dXJuIG5vcm1hbGl6ZVN0cmluZyhjb2RlKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhZGF0YUZvclJvdyhcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICBhbnlQb2ludEluQ2VsbDogUG9pbnRcbik6IEh5ZHJvZ2VuQ2VsbFR5cGUge1xuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xuICAgIHJldHVybiBcImNvZGVjZWxsXCI7XG4gIH1cblxuICBsZXQgY2VsbFR5cGU6IEh5ZHJvZ2VuQ2VsbFR5cGUgPSBcImNvZGVjZWxsXCI7XG4gIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgYW55UG9pbnRJbkNlbGwgPSBuZXcgUG9pbnQoXG4gICAgYW55UG9pbnRJbkNlbGwucm93LFxuICAgIGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGFueVBvaW50SW5DZWxsLnJvdylcbiAgKTtcbiAgY29uc3QgcmVnZXhTdHJpbmcgPSBnZXRSZWdleFN0cmluZyhlZGl0b3IpO1xuXG4gIGlmIChyZWdleFN0cmluZykge1xuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyk7XG4gICAgYnVmZmVyLmJhY2t3YXJkc1NjYW5JblJhbmdlKFxuICAgICAgcmVnZXgsXG4gICAgICBuZXcgUmFuZ2UobmV3IFBvaW50KDAsIDApLCBhbnlQb2ludEluQ2VsbCksXG4gICAgICAoeyBtYXRjaCB9KSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbWF0Y2gubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAobWF0Y2hbaV0pIHtcbiAgICAgICAgICAgIHN3aXRjaCAobWF0Y2hbaV0pIHtcbiAgICAgICAgICAgICAgY2FzZSBcIm1kXCI6XG4gICAgICAgICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICAgICAgICAgIGNlbGxUeXBlID0gXCJtYXJrZG93blwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgIGNhc2UgXCJjb2RlY2VsbFwiOlxuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNlbGxUeXBlID0gXCJjb2RlY2VsbFwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICByZXR1cm4gY2VsbFR5cGU7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgdGV4dDogc3RyaW5nXG4pOiBzdHJpbmcge1xuICBjb25zdCBjb21tZW50U3RhcnRTdHJpbmcgPSBnZXRDb21tZW50U3RhcnRTdHJpbmcoZWRpdG9yKTtcbiAgaWYgKCFjb21tZW50U3RhcnRTdHJpbmcpIHtcbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVkaXRlZExpbmVzID0gW107XG5cbiAgXy5mb3JFYWNoKGxpbmVzLCAobGluZSkgPT4ge1xuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoY29tbWVudFN0YXJ0U3RyaW5nKSkge1xuICAgICAgLy8gUmVtb3ZlIGNvbW1lbnQgZnJvbSBzdGFydCBvZiBsaW5lXG4gICAgICBlZGl0ZWRMaW5lcy5wdXNoKGxpbmUuc2xpY2UoY29tbWVudFN0YXJ0U3RyaW5nLmxlbmd0aCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlZGl0ZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHN0cmlwSW5kZW50KGVkaXRlZExpbmVzLmpvaW4oXCJcXG5cIikpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkVGV4dChlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgcmV0dXJuIG5vcm1hbGl6ZVN0cmluZyhlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tbWVudChlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCkge1xuICBjb25zdCBzY29wZSA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihwb3NpdGlvbik7XG4gIGNvbnN0IHNjb3BlU3RyaW5nID0gc2NvcGUuZ2V0U2NvcGVDaGFpbigpO1xuICByZXR1cm4gXy5pbmNsdWRlcyhzY29wZVN0cmluZywgXCJjb21tZW50LmxpbmVcIik7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNCbGFuayhlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XG4gIHJldHVybiBlZGl0b3IuZ2V0QnVmZmVyKCkuaXNSb3dCbGFuayhyb3cpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUJsYW5rUm93cyhcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICBzdGFydFJvdzogbnVtYmVyLFxuICBlbmRSb3c6IG51bWJlclxuKSB7XG4gIHdoaWxlIChlbmRSb3cgPiBzdGFydFJvdykge1xuICAgIGlmICghaXNCbGFuayhlZGl0b3IsIGVuZFJvdykpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBlbmRSb3cgLT0gMTtcbiAgfVxuXG4gIHJldHVybiBlbmRSb3c7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Rm9sZFJhbmdlKGVkaXRvcjogVGV4dEVkaXRvciwgcm93OiBudW1iZXIpIHtcbiAgY29uc3QgcmFuZ2UgPSByb3dSYW5nZUZvckNvZGVGb2xkQXRCdWZmZXJSb3coZWRpdG9yLCByb3cpO1xuICBpZiAoIXJhbmdlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKFxuICAgIHJhbmdlWzFdIDwgZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKSAmJlxuICAgIGdldFJvdyhlZGl0b3IsIHJhbmdlWzFdICsgMSkgPT09IFwiZW5kXCJcbiAgKSB7XG4gICAgcmFuZ2VbMV0gKz0gMTtcbiAgfVxuXG4gIGxvZyhcImdldEZvbGRSYW5nZTpcIiwgcmFuZ2UpO1xuICByZXR1cm4gcmFuZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Rm9sZENvbnRlbnRzKGVkaXRvcjogVGV4dEVkaXRvciwgcm93OiBudW1iZXIpIHtcbiAgY29uc3QgcmFuZ2UgPSBnZXRGb2xkUmFuZ2UoZWRpdG9yLCByb3cpO1xuICBpZiAoIXJhbmdlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJldHVybiB7XG4gICAgY29kZTogZ2V0Um93cyhlZGl0b3IsIHJhbmdlWzBdLCByYW5nZVsxXSksXG4gICAgcm93OiByYW5nZVsxXSxcbiAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RlVG9JbnNwZWN0KGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBzZWxlY3RlZFRleHQgPSBnZXRTZWxlY3RlZFRleHQoZWRpdG9yKTtcbiAgbGV0IGNvZGU7XG4gIGxldCBjdXJzb3JQb3NpdGlvbjtcblxuICBpZiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgY29kZSA9IHNlbGVjdGVkVGV4dDtcbiAgICBjdXJzb3JQb3NpdGlvbiA9IGNvZGUubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XG4gICAgY29uc3Qgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpO1xuICAgIGNvZGUgPSBnZXRSb3coZWRpdG9yLCByb3cpO1xuICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlckNvbHVtbigpO1xuICAgIC8vIFRPRE86IHVzZSBrZXJuZWwuY29tcGxldGUgdG8gZmluZCBhIHNlbGVjdGlvblxuICAgIGNvbnN0IGlkZW50aWZpZXJFbmQgPSBjb2RlID8gY29kZS5zbGljZShjdXJzb3JQb3NpdGlvbikuc2VhcmNoKC9cXFcvKSA6IC0xO1xuXG4gICAgaWYgKGlkZW50aWZpZXJFbmQgIT09IC0xKSB7XG4gICAgICBjdXJzb3JQb3NpdGlvbiArPSBpZGVudGlmaWVyRW5kO1xuICAgIH1cbiAgfVxuXG4gIGN1cnNvclBvc2l0aW9uID0ganNfaWR4X3RvX2NoYXJfaWR4KGN1cnNvclBvc2l0aW9uLCBjb2RlKTtcbiAgcmV0dXJuIFtjb2RlLCBjdXJzb3JQb3NpdGlvbl07XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbWVudFN0YXJ0U3RyaW5nKFxuICBlZGl0b3I6IFRleHRFZGl0b3Jcbik6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQge1xuICBjb25zdCB7XG4gICAgY29tbWVudFN0YXJ0U3RyaW5nLCAvLyAkRmxvd0ZpeE1lOiBUaGlzIGlzIGFuIHVub2ZmaWNpYWwgQVBJXG4gIH0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLmNvbW1lbnRTdHJpbmdzRm9yUG9zaXRpb24oXG4gICAgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgKTtcblxuICBpZiAoIWNvbW1lbnRTdGFydFN0cmluZykge1xuICAgIGxvZyhcIkNlbGxNYW5hZ2VyOiBObyBjb21tZW50IHN0cmluZyBkZWZpbmVkIGluIHJvb3Qgc2NvcGVcIik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gY29tbWVudFN0YXJ0U3RyaW5nLnRyaW1SaWdodCgpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlZ2V4U3RyaW5nKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBjb21tZW50U3RhcnRTdHJpbmcgPSBnZXRDb21tZW50U3RhcnRTdHJpbmcoZWRpdG9yKTtcbiAgaWYgKCFjb21tZW50U3RhcnRTdHJpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBlc2NhcGVkQ29tbWVudFN0YXJ0U3RyaW5nID0gZXNjYXBlU3RyaW5nUmVnZXhwKGNvbW1lbnRTdGFydFN0cmluZyk7XG4gIGNvbnN0IHJlZ2V4U3RyaW5nID0gYCR7ZXNjYXBlZENvbW1lbnRTdGFydFN0cmluZ30gKiUlICoobWR8bWFya2Rvd24pP3wgKjwoY29kZWNlbGx8bWR8bWFya2Rvd24pPnwgKihJblxcW1swLTkgXSpcXF0pYDtcbiAgcmV0dXJuIHJlZ2V4U3RyaW5nO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyZWFrcG9pbnRzKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gIGNvbnN0IGJyZWFrcG9pbnRzID0gW107XG4gIGNvbnN0IHJlZ2V4U3RyaW5nID0gZ2V0UmVnZXhTdHJpbmcoZWRpdG9yKTtcblxuICBpZiAocmVnZXhTdHJpbmcpIHtcbiAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcsIFwiZ1wiKTtcbiAgICBidWZmZXIuc2NhbihyZWdleCwgKHsgcmFuZ2UgfSkgPT4ge1xuICAgICAgaWYgKGlzQ29tbWVudChlZGl0b3IsIHJhbmdlLnN0YXJ0KSkge1xuICAgICAgICBicmVha3BvaW50cy5wdXNoKHJhbmdlLnN0YXJ0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGJyZWFrcG9pbnRzLnB1c2goYnVmZmVyLmdldEVuZFBvc2l0aW9uKCkpO1xuICBsb2coXCJDZWxsTWFuYWdlcjogQnJlYWtwb2ludHM6XCIsIGJyZWFrcG9pbnRzKTtcbiAgcmV0dXJuIGJyZWFrcG9pbnRzO1xufVxuXG5mdW5jdGlvbiBnZXRDZWxsKGVkaXRvcjogVGV4dEVkaXRvciwgYW55UG9pbnRJbkNlbGw/OiBQb2ludCkge1xuICBpZiAoIWFueVBvaW50SW5DZWxsKSB7XG4gICAgYW55UG9pbnRJbkNlbGwgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgfVxuXG4gIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgYW55UG9pbnRJbkNlbGwgPSBuZXcgUG9pbnQoXG4gICAgYW55UG9pbnRJbkNlbGwucm93LFxuICAgIGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGFueVBvaW50SW5DZWxsLnJvdylcbiAgKTtcbiAgbGV0IHN0YXJ0ID0gbmV3IFBvaW50KDAsIDApO1xuICBsZXQgZW5kID0gYnVmZmVyLmdldEVuZFBvc2l0aW9uKCk7XG4gIGNvbnN0IHJlZ2V4U3RyaW5nID0gZ2V0UmVnZXhTdHJpbmcoZWRpdG9yKTtcblxuICBpZiAoIXJlZ2V4U3RyaW5nKSB7XG4gICAgcmV0dXJuIG5ldyBSYW5nZShzdGFydCwgZW5kKTtcbiAgfVxuXG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyk7XG5cbiAgaWYgKGFueVBvaW50SW5DZWxsLnJvdyA+PSAwKSB7XG4gICAgYnVmZmVyLmJhY2t3YXJkc1NjYW5JblJhbmdlKFxuICAgICAgcmVnZXgsXG4gICAgICBuZXcgUmFuZ2Uoc3RhcnQsIGFueVBvaW50SW5DZWxsKSxcbiAgICAgICh7IHJhbmdlIH0pID0+IHtcbiAgICAgICAgc3RhcnQgPSBuZXcgUG9pbnQocmFuZ2Uuc3RhcnQucm93ICsgMSwgMCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGJ1ZmZlci5zY2FuSW5SYW5nZShyZWdleCwgbmV3IFJhbmdlKGFueVBvaW50SW5DZWxsLCBlbmQpLCAoeyByYW5nZSB9KSA9PiB7XG4gICAgZW5kID0gcmFuZ2Uuc3RhcnQ7XG4gIH0pO1xuICBsb2coXG4gICAgXCJDZWxsTWFuYWdlcjogQ2VsbCBbc3RhcnQsIGVuZF06XCIsXG4gICAgW3N0YXJ0LCBlbmRdLFxuICAgIFwiYW55UG9pbnRJbkNlbGw6XCIsXG4gICAgYW55UG9pbnRJbkNlbGxcbiAgKTtcbiAgcmV0dXJuIG5ldyBSYW5nZShzdGFydCwgZW5kKTtcbn1cblxuZnVuY3Rpb24gaXNFbWJlZGRlZENvZGUoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgcmVmZXJlbmNlU2NvcGU6IHN0cmluZyxcbiAgcm93OiBudW1iZXJcbikge1xuICBjb25zdCBzY29wZXMgPSBlZGl0b3JcbiAgICAuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24obmV3IFBvaW50KHJvdywgMCkpXG4gICAgLmdldFNjb3Blc0FycmF5KCk7XG4gIHJldHVybiBfLmluY2x1ZGVzKHNjb3BlcywgcmVmZXJlbmNlU2NvcGUpO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50RmVuY2VkQ29kZUJsb2NrKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gIGNvbnN0IHsgcm93OiBidWZmZXJFbmRSb3cgfSA9IGJ1ZmZlci5nZXRFbmRQb3NpdGlvbigpO1xuICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgbGV0IHN0YXJ0ID0gY3Vyc29yLnJvdztcbiAgbGV0IGVuZCA9IGN1cnNvci5yb3c7XG4gIGNvbnN0IHNjb3BlID0gZ2V0RW1iZWRkZWRTY29wZShlZGl0b3IsIGN1cnNvcik7XG4gIGlmICghc2NvcGUpIHtcbiAgICByZXR1cm4gZ2V0Q2VsbChlZGl0b3IpO1xuICB9XG5cbiAgd2hpbGUgKHN0YXJ0ID4gMCAmJiBpc0VtYmVkZGVkQ29kZShlZGl0b3IsIHNjb3BlLCBzdGFydCAtIDEpKSB7XG4gICAgc3RhcnQgLT0gMTtcbiAgfVxuXG4gIHdoaWxlIChlbmQgPCBidWZmZXJFbmRSb3cgJiYgaXNFbWJlZGRlZENvZGUoZWRpdG9yLCBzY29wZSwgZW5kICsgMSkpIHtcbiAgICBlbmQgKz0gMTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUmFuZ2UoW3N0YXJ0LCAwXSwgW2VuZCArIDEsIDBdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRDZWxsKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xuICAgIHJldHVybiBnZXRDdXJyZW50RmVuY2VkQ29kZUJsb2NrKGVkaXRvcik7XG4gIH1cblxuICByZXR1cm4gZ2V0Q2VsbChlZGl0b3IpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldENlbGxzKGVkaXRvcjogVGV4dEVkaXRvciwgYnJlYWtwb2ludHM6IEFycmF5PFBvaW50PiA9IFtdKSB7XG4gIGlmIChicmVha3BvaW50cy5sZW5ndGggIT09IDApIHtcbiAgICBicmVha3BvaW50cy5zb3J0KChhLCBiKSA9PiBhLmNvbXBhcmUoYikpO1xuICB9IGVsc2Uge1xuICAgIGJyZWFrcG9pbnRzID0gZ2V0QnJlYWtwb2ludHMoZWRpdG9yKTtcbiAgfVxuXG4gIHJldHVybiBnZXRDZWxsc0ZvckJyZWFrUG9pbnRzKGVkaXRvciwgYnJlYWtwb2ludHMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldENlbGxzRm9yQnJlYWtQb2ludHMoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgYnJlYWtwb2ludHM6IEFycmF5PFBvaW50PlxuKTogQXJyYXk8UmFuZ2U+IHtcbiAgbGV0IHN0YXJ0ID0gbmV3IFBvaW50KDAsIDApO1xuICAvLyBMZXQgc3RhcnQgYmUgZWFybGllc3Qgcm93IHdpdGggdGV4dFxuICBlZGl0b3Iuc2NhbigvXFxTLywgKG1hdGNoKSA9PiB7XG4gICAgc3RhcnQgPSBuZXcgUG9pbnQobWF0Y2gucmFuZ2Uuc3RhcnQucm93LCAwKTtcbiAgICBtYXRjaC5zdG9wKCk7XG4gIH0pO1xuICByZXR1cm4gXy5jb21wYWN0KFxuICAgIF8ubWFwKGJyZWFrcG9pbnRzLCAoZW5kKSA9PiB7XG4gICAgICBjb25zdCBjZWxsID0gZW5kLmlzRXF1YWwoc3RhcnQpID8gbnVsbCA6IG5ldyBSYW5nZShzdGFydCwgZW5kKTtcbiAgICAgIHN0YXJ0ID0gbmV3IFBvaW50KGVuZC5yb3cgKyAxLCAwKTtcbiAgICAgIHJldHVybiBjZWxsO1xuICAgIH0pXG4gICk7XG59XG5cbmZ1bmN0aW9uIGNlbnRlclNjcmVlbk9uQ3Vyc29yUG9zaXRpb24oZWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gZWRpdG9yLmVsZW1lbnQucGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKFxuICAgIGVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpXG4gICkudG9wO1xuICBjb25zdCBlZGl0b3JIZWlnaHQgPSBlZGl0b3IuZWxlbWVudC5nZXRIZWlnaHQoKTtcbiAgZWRpdG9yLmVsZW1lbnQuc2V0U2Nyb2xsVG9wKGN1cnNvclBvc2l0aW9uIC0gZWRpdG9ySGVpZ2h0IC8gMik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3ZlRG93bihlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XG4gIGNvbnN0IGxhc3RSb3cgPSBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpO1xuXG4gIGlmIChyb3cgPj0gbGFzdFJvdykge1xuICAgIGVkaXRvci5tb3ZlVG9Cb3R0b20oKTtcbiAgICBlZGl0b3IuaW5zZXJ0TmV3bGluZSgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHdoaWxlIChyb3cgPCBsYXN0Um93KSB7XG4gICAgcm93ICs9IDE7XG4gICAgaWYgKCFpc0JsYW5rKGVkaXRvciwgcm93KSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHtcbiAgICByb3csXG4gICAgY29sdW1uOiAwLFxuICB9KTtcbiAgYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4uY2VudGVyT25Nb3ZlRG93blwiKSAmJlxuICAgIGNlbnRlclNjcmVlbk9uQ3Vyc29yUG9zaXRpb24oZWRpdG9yKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUHJlY2VkaW5nQmxvY2soXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgcm93OiBudW1iZXIsXG4gIGluZGVudExldmVsOiBudW1iZXJcbikge1xuICBsZXQgcHJldmlvdXNSb3cgPSByb3cgLSAxO1xuXG4gIHdoaWxlIChwcmV2aW91c1JvdyA+PSAwKSB7XG4gICAgY29uc3QgcHJldmlvdXNJbmRlbnRMZXZlbCA9IGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhwcmV2aW91c1Jvdyk7XG4gICAgY29uc3Qgc2FtZUluZGVudCA9IHByZXZpb3VzSW5kZW50TGV2ZWwgPD0gaW5kZW50TGV2ZWw7XG4gICAgY29uc3QgYmxhbmsgPSBpc0JsYW5rKGVkaXRvciwgcHJldmlvdXNSb3cpO1xuICAgIGNvbnN0IGlzRW5kID0gZ2V0Um93KGVkaXRvciwgcHJldmlvdXNSb3cpID09PSBcImVuZFwiO1xuXG4gICAgaWYgKGlzQmxhbmsoZWRpdG9yLCByb3cpKSB7XG4gICAgICByb3cgPSBwcmV2aW91c1JvdztcbiAgICB9XG5cbiAgICBpZiAoc2FtZUluZGVudCAmJiAhYmxhbmsgJiYgIWlzRW5kKSB7XG4gICAgICBjb25zdCBjZWxsID0gZ2V0Q2VsbChlZGl0b3IsIG5ldyBQb2ludChyb3csIDApKTtcblxuICAgICAgaWYgKGNlbGwuc3RhcnQucm93ID4gcm93KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29kZTogXCJcIixcbiAgICAgICAgICByb3csXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvZGU6IGdldFJvd3MoZWRpdG9yLCBwcmV2aW91c1Jvdywgcm93KSxcbiAgICAgICAgcm93LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBwcmV2aW91c1JvdyAtPSAxO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5leHBvcnQgZnVuY3Rpb24gZmluZENvZGVCbG9jayhlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgY29uc3Qgc2VsZWN0ZWRUZXh0ID0gZ2V0U2VsZWN0ZWRUZXh0KGVkaXRvcik7XG5cbiAgaWYgKHNlbGVjdGVkVGV4dCkge1xuICAgIGNvbnN0IHNlbGVjdGVkUmFuZ2UgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xuICAgIGNvbnN0IGNlbGwgPSBnZXRDZWxsKGVkaXRvciwgc2VsZWN0ZWRSYW5nZS5lbmQpO1xuICAgIGNvbnN0IHN0YXJ0UG9pbnQgPSBjZWxsLnN0YXJ0LmlzR3JlYXRlclRoYW4oc2VsZWN0ZWRSYW5nZS5zdGFydClcbiAgICAgID8gY2VsbC5zdGFydFxuICAgICAgOiBzZWxlY3RlZFJhbmdlLnN0YXJ0O1xuICAgIGxldCBlbmRSb3cgPSBzZWxlY3RlZFJhbmdlLmVuZC5yb3c7XG5cbiAgICBpZiAoc2VsZWN0ZWRSYW5nZS5lbmQuY29sdW1uID09PSAwKSB7XG4gICAgICBlbmRSb3cgLT0gMTtcbiAgICB9XG5cbiAgICBlbmRSb3cgPSBlc2NhcGVCbGFua1Jvd3MoZWRpdG9yLCBzdGFydFBvaW50LnJvdywgZW5kUm93KTtcblxuICAgIGlmIChzdGFydFBvaW50LmlzR3JlYXRlclRoYW5PckVxdWFsKHNlbGVjdGVkUmFuZ2UuZW5kKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29kZTogXCJcIixcbiAgICAgICAgcm93OiBlbmRSb3csXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBnZXRUZXh0SW5SYW5nZShlZGl0b3IsIHN0YXJ0UG9pbnQsIHNlbGVjdGVkUmFuZ2UuZW5kKSxcbiAgICAgIHJvdzogZW5kUm93LFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpO1xuICBjb25zdCByb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KCk7XG4gIGxvZyhcImZpbmRDb2RlQmxvY2s6XCIsIHJvdyk7XG4gIGNvbnN0IGluZGVudExldmVsID0gY3Vyc29yLmdldEluZGVudExldmVsKCk7XG4gIGxldCBmb2xkYWJsZSA9IGVkaXRvci5pc0ZvbGRhYmxlQXRCdWZmZXJSb3cocm93KTtcbiAgY29uc3QgZm9sZFJhbmdlID0gcm93UmFuZ2VGb3JDb2RlRm9sZEF0QnVmZmVyUm93KGVkaXRvciwgcm93KTtcblxuICBpZiAoIWZvbGRSYW5nZSB8fCBmb2xkUmFuZ2VbMF0gPT0gbnVsbCB8fCBmb2xkUmFuZ2VbMV0gPT0gbnVsbCkge1xuICAgIGZvbGRhYmxlID0gZmFsc2U7XG4gIH1cblxuICBpZiAoZm9sZGFibGUpIHtcbiAgICByZXR1cm4gZ2V0Rm9sZENvbnRlbnRzKGVkaXRvciwgcm93KTtcbiAgfVxuXG4gIGlmIChpc0JsYW5rKGVkaXRvciwgcm93KSB8fCBnZXRSb3coZWRpdG9yLCByb3cpID09PSBcImVuZFwiKSB7XG4gICAgcmV0dXJuIGZpbmRQcmVjZWRpbmdCbG9jayhlZGl0b3IsIHJvdywgaW5kZW50TGV2ZWwpO1xuICB9XG5cbiAgY29uc3QgY2VsbCA9IGdldENlbGwoZWRpdG9yLCBuZXcgUG9pbnQocm93LCAwKSk7XG5cbiAgaWYgKGNlbGwuc3RhcnQucm93ID4gcm93KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IFwiXCIsXG4gICAgICByb3csXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY29kZTogZ2V0Um93KGVkaXRvciwgcm93KSxcbiAgICByb3csXG4gIH07XG59XG5leHBvcnQgZnVuY3Rpb24gZm9sZEN1cnJlbnRDZWxsKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBjZWxsUmFuZ2UgPSBnZXRDdXJyZW50Q2VsbChlZGl0b3IpO1xuICBjb25zdCBuZXdSYW5nZSA9IGFkanVzdENlbGxGb2xkUmFuZ2UoZWRpdG9yLCBjZWxsUmFuZ2UpO1xuICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShuZXdSYW5nZSk7XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKClbMF0uZm9sZCgpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvbGRBbGxCdXRDdXJyZW50Q2VsbChlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgY29uc3QgaW5pdGlhbFNlbGVjdGlvbnMgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMoKTtcbiAgLy8gSSB0YWtlIC5zbGljZSgxKSBiZWNhdXNlIHRoZXJlJ3MgYWx3YXlzIGFuIGVtcHR5IGNlbGwgcmFuZ2UgZnJvbSBbMCwwXSB0b1xuICAvLyBbMCwwXVxuICBjb25zdCBhbGxDZWxsUmFuZ2VzID0gZ2V0Q2VsbHMoZWRpdG9yKS5zbGljZSgxKTtcbiAgY29uc3QgY3VycmVudENlbGxSYW5nZSA9IGdldEN1cnJlbnRDZWxsKGVkaXRvcik7XG4gIGNvbnN0IG5ld1JhbmdlcyA9IGFsbENlbGxSYW5nZXNcbiAgICAuZmlsdGVyKChjZWxsUmFuZ2UpID0+ICFjZWxsUmFuZ2UuaXNFcXVhbChjdXJyZW50Q2VsbFJhbmdlKSlcbiAgICAubWFwKChjZWxsUmFuZ2UpID0+IGFkanVzdENlbGxGb2xkUmFuZ2UoZWRpdG9yLCBjZWxsUmFuZ2UpKTtcbiAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKG5ld1Jhbmdlcyk7XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCgoc2VsZWN0aW9uKSA9PiBzZWxlY3Rpb24uZm9sZCgpKTtcbiAgLy8gUmVzdG9yZSBzZWxlY3Rpb25zXG4gIGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyhpbml0aWFsU2VsZWN0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGFkanVzdENlbGxGb2xkUmFuZ2UoZWRpdG9yOiBUZXh0RWRpdG9yLCByYW5nZTogUmFuZ2UpIHtcbiAgY29uc3Qgc3RhcnRSb3cgPSByYW5nZS5zdGFydC5yb3cgPiAwID8gcmFuZ2Uuc3RhcnQucm93IC0gMSA6IDA7XG4gIGNvbnN0IHN0YXJ0V2lkdGggPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coc3RhcnRSb3cpLmxlbmd0aDtcbiAgY29uc3QgZW5kUm93ID1cbiAgICByYW5nZS5lbmQucm93ID09IGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KClcbiAgICAgID8gcmFuZ2UuZW5kLnJvd1xuICAgICAgOiByYW5nZS5lbmQucm93IC0gMTtcbiAgY29uc3QgZW5kV2lkdGggPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coZW5kUm93KS5sZW5ndGg7XG4gIHJldHVybiBuZXcgUmFuZ2UoXG4gICAgbmV3IFBvaW50KHN0YXJ0Um93LCBzdGFydFdpZHRoKSxcbiAgICBuZXcgUG9pbnQoZW5kUm93LCBlbmRXaWR0aClcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVzY2FwZUJsYW5rUm93c0VuZFJvdyhlZGl0b3I6IFRleHRFZGl0b3IsIGVuZDogUG9pbnQpIHtcbiAgcmV0dXJuIGVuZC5yb3cgPT09IGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KCkgPyBlbmQucm93IDogZW5kLnJvdyAtIDE7XG59XG4iXX0=