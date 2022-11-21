"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEscapeBlankRowsEndRow = exports.foldAllButCurrentCell = exports.foldCurrentCell = exports.findCodeBlock = exports.findPrecedingBlock = exports.moveDown = exports.getCellsForBreakPoints = exports.getCells = exports.getCurrentCell = exports.getBreakpoints = exports.getRegexString = exports.getCommentStartString = exports.getCodeToInspect = exports.getFoldContents = exports.getFoldRange = exports.escapeBlankRows = exports.isBlank = exports.isComment = exports.getSelectedText = exports.removeCommentsMarkdownCell = exports.getMetadataForRow = exports.getRows = exports.getTextInRange = exports.getRow = exports.normalizeString = void 0;
const atom_1 = require("atom");
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const strip_indent_1 = __importDefault(require("strip-indent"));
const compact_1 = __importDefault(require("lodash/compact"));
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
    if ((0, utils_1.isMultilanguageGrammar)(editor.getGrammar())) {
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
    lines.forEach((line) => {
        if (line.startsWith(commentStartString)) {
            editedLines.push(line.slice(commentStartString.length));
        }
        else {
            editedLines.push(line);
        }
    });
    return (0, strip_indent_1.default)(editedLines.join("\n"));
}
exports.removeCommentsMarkdownCell = removeCommentsMarkdownCell;
function getSelectedText(editor) {
    return normalizeString(editor.getSelectedText());
}
exports.getSelectedText = getSelectedText;
function isComment(editor, position) {
    const scope = editor.scopeDescriptorForBufferPosition(position);
    const scopeString = scope.getScopeChain();
    return scopeString.includes("comment.line");
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
    const range = (0, utils_1.rowRangeForCodeFoldAtBufferRow)(editor, row);
    if (!range) {
        return;
    }
    if (range[1] < editor.getLastBufferRow() &&
        getRow(editor, range[1] + 1) === "end") {
        range[1] += 1;
    }
    (0, utils_1.log)("getFoldRange:", range);
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
    cursorPosition = (0, utils_1.js_idx_to_char_idx)(cursorPosition, code);
    return [code, cursorPosition];
}
exports.getCodeToInspect = getCodeToInspect;
function getCommentStartString(editor) {
    const { commentStartString, } = editor.tokenizedBuffer.commentStringsForPosition(editor.getCursorBufferPosition());
    if (!commentStartString) {
        (0, utils_1.log)("CellManager: No comment string defined in root scope");
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
    const escapedCommentStartString = (0, escape_string_regexp_1.default)(commentStartString);
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
    (0, utils_1.log)("CellManager: Breakpoints:", breakpoints);
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
    (0, utils_1.log)("CellManager: Cell [start, end]:", [start, end], "anyPointInCell:", anyPointInCell);
    return new atom_1.Range(start, end);
}
function isEmbeddedCode(editor, referenceScope, row) {
    const scopes = editor
        .scopeDescriptorForBufferPosition(new atom_1.Point(row, 0))
        .getScopesArray();
    return scopes.includes(referenceScope);
}
function getCurrentFencedCodeBlock(editor) {
    const buffer = editor.getBuffer();
    const { row: bufferEndRow } = buffer.getEndPosition();
    const cursor = editor.getCursorBufferPosition();
    let start = cursor.row;
    let end = cursor.row;
    const scope = (0, utils_1.getEmbeddedScope)(editor, cursor);
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
    if ((0, utils_1.isMultilanguageGrammar)(editor.getGrammar())) {
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
    return (0, compact_1.default)(breakpoints.map((end) => {
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
    (0, utils_1.log)("findCodeBlock:", row);
    const indentLevel = cursor.getIndentLevel();
    let foldable = editor.isFoldableAtBufferRow(row);
    const foldRange = (0, utils_1.rowRangeForCodeFoldAtBufferRow)(editor, row);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NvZGUtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBZ0Q7QUFDaEQsZ0ZBQXNEO0FBQ3RELGdFQUF1QztBQUN2Qyw2REFBcUM7QUFDckMsbUNBTWlCO0FBR2pCLFNBQWdCLGVBQWUsQ0FBQyxJQUErQjtJQUM3RCxJQUFJLElBQUksRUFBRTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFORCwwQ0FNQztBQUNELFNBQWdCLE1BQU0sQ0FBQyxNQUFrQixFQUFFLEdBQVc7SUFDcEQsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUZELHdCQUVDO0FBQ0QsU0FBZ0IsY0FBYyxDQUFDLE1BQWtCLEVBQUUsS0FBWSxFQUFFLEdBQVU7SUFDekUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkQsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUhELHdDQUdDO0FBQ0QsU0FBZ0IsT0FBTyxDQUFDLE1BQWtCLEVBQUUsUUFBZ0IsRUFBRSxNQUFjO0lBQzFFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztRQUN2QyxLQUFLLEVBQUU7WUFDTCxHQUFHLEVBQUUsUUFBUTtZQUNiLE1BQU0sRUFBRSxDQUFDO1NBQ1Y7UUFDRCxHQUFHLEVBQUU7WUFDSCxHQUFHLEVBQUUsTUFBTTtZQUNYLE1BQU0sRUFBRSxPQUFPO1NBQ2hCO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENB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QyxDQUFDLE1BQU0sQ0FBQztJQUM1RCxPQUFPLElBQUksWUFBSyxDQUNkLElBQUksWUFBSyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsRUFDL0IsSUFBSSxZQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUM1QixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLE1BQWtCLEVBQUUsR0FBVTtJQUNyRSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEtBQUssTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFGRCw0REFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBvaW50LCBSYW5nZSwgVGV4dEVkaXRvciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgZXNjYXBlU3RyaW5nUmVnZXhwIGZyb20gXCJlc2NhcGUtc3RyaW5nLXJlZ2V4cFwiO1xuaW1wb3J0IHN0cmlwSW5kZW50IGZyb20gXCJzdHJpcC1pbmRlbnRcIjtcbmltcG9ydCBjb21wYWN0IGZyb20gXCJsb2Rhc2gvY29tcGFjdFwiO1xuaW1wb3J0IHtcbiAgbG9nLFxuICBpc011bHRpbGFuZ3VhZ2VHcmFtbWFyLFxuICBnZXRFbWJlZGRlZFNjb3BlLFxuICByb3dSYW5nZUZvckNvZGVGb2xkQXRCdWZmZXJSb3csXG4gIGpzX2lkeF90b19jaGFyX2lkeCxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB0eXBlIHsgSHlkcm9nZW5DZWxsVHlwZSB9IGZyb20gXCIuL2h5ZHJvZ2VuXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmcoY29kZTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBpZiAoY29kZSkge1xuICAgIHJldHVybiBjb2RlLnJlcGxhY2UoL1xcclxcbnxcXHIvZywgXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb3coZWRpdG9yOiBUZXh0RWRpdG9yLCByb3c6IG51bWJlcikge1xuICByZXR1cm4gbm9ybWFsaXplU3RyaW5nKGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXh0SW5SYW5nZShlZGl0b3I6IFRleHRFZGl0b3IsIHN0YXJ0OiBQb2ludCwgZW5kOiBQb2ludCkge1xuICBjb25zdCBjb2RlID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtzdGFydCwgZW5kXSk7XG4gIHJldHVybiBub3JtYWxpemVTdHJpbmcoY29kZSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Um93cyhlZGl0b3I6IFRleHRFZGl0b3IsIHN0YXJ0Um93OiBudW1iZXIsIGVuZFJvdzogbnVtYmVyKSB7XG4gIGNvbnN0IGNvZGUgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2Uoe1xuICAgIHN0YXJ0OiB7XG4gICAgICByb3c6IHN0YXJ0Um93LFxuICAgICAgY29sdW1uOiAwLFxuICAgIH0sXG4gICAgZW5kOiB7XG4gICAgICByb3c6IGVuZFJvdyxcbiAgICAgIGNvbHVtbjogOTk5OTk5OSxcbiAgICB9LFxuICB9KTtcbiAgcmV0dXJuIG5vcm1hbGl6ZVN0cmluZyhjb2RlKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhZGF0YUZvclJvdyhcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICBhbnlQb2ludEluQ2VsbDogUG9pbnRcbik6IEh5ZHJvZ2VuQ2VsbFR5cGUge1xuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xuICAgIHJldHVybiBcImNvZGVjZWxsXCI7XG4gIH1cblxuICBsZXQgY2VsbFR5cGU6IEh5ZHJvZ2VuQ2VsbFR5cGUgPSBcImNvZGVjZWxsXCI7XG4gIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgYW55UG9pbnRJbkNlbGwgPSBuZXcgUG9pbnQoXG4gICAgYW55UG9pbnRJbkNlbGwucm93LFxuICAgIGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGFueVBvaW50SW5DZWxsLnJvdylcbiAgKTtcbiAgY29uc3QgcmVnZXhTdHJpbmcgPSBnZXRSZWdleFN0cmluZyhlZGl0b3IpO1xuXG4gIGlmIChyZWdleFN0cmluZykge1xuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyk7XG4gICAgYnVmZmVyLmJhY2t3YXJkc1NjYW5JblJhbmdlKFxuICAgICAgcmVnZXgsXG4gICAgICBuZXcgUmFuZ2UobmV3IFBvaW50KDAsIDApLCBhbnlQb2ludEluQ2VsbCksXG4gICAgICAoeyBtYXRjaCB9KSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbWF0Y2gubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAobWF0Y2hbaV0pIHtcbiAgICAgICAgICAgIHN3aXRjaCAobWF0Y2hbaV0pIHtcbiAgICAgICAgICAgICAgY2FzZSBcIm1kXCI6XG4gICAgICAgICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICAgICAgICAgIGNlbGxUeXBlID0gXCJtYXJrZG93blwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgIGNhc2UgXCJjb2RlY2VsbFwiOlxuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNlbGxUeXBlID0gXCJjb2RlY2VsbFwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICByZXR1cm4gY2VsbFR5cGU7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgdGV4dDogc3RyaW5nXG4pOiBzdHJpbmcge1xuICBjb25zdCBjb21tZW50U3RhcnRTdHJpbmcgPSBnZXRDb21tZW50U3RhcnRTdHJpbmcoZWRpdG9yKTtcbiAgaWYgKCFjb21tZW50U3RhcnRTdHJpbmcpIHtcbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVkaXRlZExpbmVzID0gW107XG5cbiAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoY29tbWVudFN0YXJ0U3RyaW5nKSkge1xuICAgICAgLy8gUmVtb3ZlIGNvbW1lbnQgZnJvbSBzdGFydCBvZiBsaW5lXG4gICAgICBlZGl0ZWRMaW5lcy5wdXNoKGxpbmUuc2xpY2UoY29tbWVudFN0YXJ0U3RyaW5nLmxlbmd0aCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlZGl0ZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHN0cmlwSW5kZW50KGVkaXRlZExpbmVzLmpvaW4oXCJcXG5cIikpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkVGV4dChlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgcmV0dXJuIG5vcm1hbGl6ZVN0cmluZyhlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tbWVudChlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCkge1xuICBjb25zdCBzY29wZSA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihwb3NpdGlvbik7XG4gIGNvbnN0IHNjb3BlU3RyaW5nID0gc2NvcGUuZ2V0U2NvcGVDaGFpbigpO1xuICByZXR1cm4gc2NvcGVTdHJpbmcuaW5jbHVkZXMoXCJjb21tZW50LmxpbmVcIik7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNCbGFuayhlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XG4gIHJldHVybiBlZGl0b3IuZ2V0QnVmZmVyKCkuaXNSb3dCbGFuayhyb3cpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUJsYW5rUm93cyhcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICBzdGFydFJvdzogbnVtYmVyLFxuICBlbmRSb3c6IG51bWJlclxuKSB7XG4gIHdoaWxlIChlbmRSb3cgPiBzdGFydFJvdykge1xuICAgIGlmICghaXNCbGFuayhlZGl0b3IsIGVuZFJvdykpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBlbmRSb3cgLT0gMTtcbiAgfVxuXG4gIHJldHVybiBlbmRSb3c7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Rm9sZFJhbmdlKGVkaXRvcjogVGV4dEVkaXRvciwgcm93OiBudW1iZXIpIHtcbiAgY29uc3QgcmFuZ2UgPSByb3dSYW5nZUZvckNvZGVGb2xkQXRCdWZmZXJSb3coZWRpdG9yLCByb3cpO1xuICBpZiAoIXJhbmdlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKFxuICAgIHJhbmdlWzFdIDwgZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKSAmJlxuICAgIGdldFJvdyhlZGl0b3IsIHJhbmdlWzFdICsgMSkgPT09IFwiZW5kXCJcbiAgKSB7XG4gICAgcmFuZ2VbMV0gKz0gMTtcbiAgfVxuXG4gIGxvZyhcImdldEZvbGRSYW5nZTpcIiwgcmFuZ2UpO1xuICByZXR1cm4gcmFuZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Rm9sZENvbnRlbnRzKGVkaXRvcjogVGV4dEVkaXRvciwgcm93OiBudW1iZXIpIHtcbiAgY29uc3QgcmFuZ2UgPSBnZXRGb2xkUmFuZ2UoZWRpdG9yLCByb3cpO1xuICBpZiAoIXJhbmdlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJldHVybiB7XG4gICAgY29kZTogZ2V0Um93cyhlZGl0b3IsIHJhbmdlWzBdLCByYW5nZVsxXSksXG4gICAgcm93OiByYW5nZVsxXSxcbiAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RlVG9JbnNwZWN0KGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBzZWxlY3RlZFRleHQgPSBnZXRTZWxlY3RlZFRleHQoZWRpdG9yKTtcbiAgbGV0IGNvZGU7XG4gIGxldCBjdXJzb3JQb3NpdGlvbjtcblxuICBpZiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgY29kZSA9IHNlbGVjdGVkVGV4dDtcbiAgICBjdXJzb3JQb3NpdGlvbiA9IGNvZGUubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XG4gICAgY29uc3Qgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpO1xuICAgIGNvZGUgPSBnZXRSb3coZWRpdG9yLCByb3cpO1xuICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlckNvbHVtbigpO1xuICAgIC8vIFRPRE86IHVzZSBrZXJuZWwuY29tcGxldGUgdG8gZmluZCBhIHNlbGVjdGlvblxuICAgIGNvbnN0IGlkZW50aWZpZXJFbmQgPSBjb2RlID8gY29kZS5zbGljZShjdXJzb3JQb3NpdGlvbikuc2VhcmNoKC9cXFcvKSA6IC0xO1xuXG4gICAgaWYgKGlkZW50aWZpZXJFbmQgIT09IC0xKSB7XG4gICAgICBjdXJzb3JQb3NpdGlvbiArPSBpZGVudGlmaWVyRW5kO1xuICAgIH1cbiAgfVxuXG4gIGN1cnNvclBvc2l0aW9uID0ganNfaWR4X3RvX2NoYXJfaWR4KGN1cnNvclBvc2l0aW9uLCBjb2RlKTtcbiAgcmV0dXJuIFtjb2RlLCBjdXJzb3JQb3NpdGlvbl07XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbWVudFN0YXJ0U3RyaW5nKFxuICBlZGl0b3I6IFRleHRFZGl0b3Jcbik6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQge1xuICBjb25zdCB7XG4gICAgY29tbWVudFN0YXJ0U3RyaW5nLCAvLyAkRmxvd0ZpeE1lOiBUaGlzIGlzIGFuIHVub2ZmaWNpYWwgQVBJXG4gIH0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLmNvbW1lbnRTdHJpbmdzRm9yUG9zaXRpb24oXG4gICAgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgKTtcblxuICBpZiAoIWNvbW1lbnRTdGFydFN0cmluZykge1xuICAgIGxvZyhcIkNlbGxNYW5hZ2VyOiBObyBjb21tZW50IHN0cmluZyBkZWZpbmVkIGluIHJvb3Qgc2NvcGVcIik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gY29tbWVudFN0YXJ0U3RyaW5nLnRyaW1SaWdodCgpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlZ2V4U3RyaW5nKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBjb21tZW50U3RhcnRTdHJpbmcgPSBnZXRDb21tZW50U3RhcnRTdHJpbmcoZWRpdG9yKTtcbiAgaWYgKCFjb21tZW50U3RhcnRTdHJpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBlc2NhcGVkQ29tbWVudFN0YXJ0U3RyaW5nID0gZXNjYXBlU3RyaW5nUmVnZXhwKGNvbW1lbnRTdGFydFN0cmluZyk7XG4gIGNvbnN0IHJlZ2V4U3RyaW5nID0gYCR7ZXNjYXBlZENvbW1lbnRTdGFydFN0cmluZ30gKiUlICoobWR8bWFya2Rvd24pP3wgKjwoY29kZWNlbGx8bWR8bWFya2Rvd24pPnwgKihJblxcW1swLTkgXSpcXF0pYDtcbiAgcmV0dXJuIHJlZ2V4U3RyaW5nO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyZWFrcG9pbnRzKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gIGNvbnN0IGJyZWFrcG9pbnRzID0gW107XG4gIGNvbnN0IHJlZ2V4U3RyaW5nID0gZ2V0UmVnZXhTdHJpbmcoZWRpdG9yKTtcblxuICBpZiAocmVnZXhTdHJpbmcpIHtcbiAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcsIFwiZ1wiKTtcbiAgICBidWZmZXIuc2NhbihyZWdleCwgKHsgcmFuZ2UgfSkgPT4ge1xuICAgICAgaWYgKGlzQ29tbWVudChlZGl0b3IsIHJhbmdlLnN0YXJ0KSkge1xuICAgICAgICBicmVha3BvaW50cy5wdXNoKHJhbmdlLnN0YXJ0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGJyZWFrcG9pbnRzLnB1c2goYnVmZmVyLmdldEVuZFBvc2l0aW9uKCkpO1xuICBsb2coXCJDZWxsTWFuYWdlcjogQnJlYWtwb2ludHM6XCIsIGJyZWFrcG9pbnRzKTtcbiAgcmV0dXJuIGJyZWFrcG9pbnRzO1xufVxuXG5mdW5jdGlvbiBnZXRDZWxsKGVkaXRvcjogVGV4dEVkaXRvciwgYW55UG9pbnRJbkNlbGw/OiBQb2ludCkge1xuICBpZiAoIWFueVBvaW50SW5DZWxsKSB7XG4gICAgYW55UG9pbnRJbkNlbGwgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgfVxuXG4gIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgYW55UG9pbnRJbkNlbGwgPSBuZXcgUG9pbnQoXG4gICAgYW55UG9pbnRJbkNlbGwucm93LFxuICAgIGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGFueVBvaW50SW5DZWxsLnJvdylcbiAgKTtcbiAgbGV0IHN0YXJ0ID0gbmV3IFBvaW50KDAsIDApO1xuICBsZXQgZW5kID0gYnVmZmVyLmdldEVuZFBvc2l0aW9uKCk7XG4gIGNvbnN0IHJlZ2V4U3RyaW5nID0gZ2V0UmVnZXhTdHJpbmcoZWRpdG9yKTtcblxuICBpZiAoIXJlZ2V4U3RyaW5nKSB7XG4gICAgcmV0dXJuIG5ldyBSYW5nZShzdGFydCwgZW5kKTtcbiAgfVxuXG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyk7XG5cbiAgaWYgKGFueVBvaW50SW5DZWxsLnJvdyA+PSAwKSB7XG4gICAgYnVmZmVyLmJhY2t3YXJkc1NjYW5JblJhbmdlKFxuICAgICAgcmVnZXgsXG4gICAgICBuZXcgUmFuZ2Uoc3RhcnQsIGFueVBvaW50SW5DZWxsKSxcbiAgICAgICh7IHJhbmdlIH0pID0+IHtcbiAgICAgICAgc3RhcnQgPSBuZXcgUG9pbnQocmFuZ2Uuc3RhcnQucm93ICsgMSwgMCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGJ1ZmZlci5zY2FuSW5SYW5nZShyZWdleCwgbmV3IFJhbmdlKGFueVBvaW50SW5DZWxsLCBlbmQpLCAoeyByYW5nZSB9KSA9PiB7XG4gICAgZW5kID0gcmFuZ2Uuc3RhcnQ7XG4gIH0pO1xuICBsb2coXG4gICAgXCJDZWxsTWFuYWdlcjogQ2VsbCBbc3RhcnQsIGVuZF06XCIsXG4gICAgW3N0YXJ0LCBlbmRdLFxuICAgIFwiYW55UG9pbnRJbkNlbGw6XCIsXG4gICAgYW55UG9pbnRJbkNlbGxcbiAgKTtcbiAgcmV0dXJuIG5ldyBSYW5nZShzdGFydCwgZW5kKTtcbn1cblxuZnVuY3Rpb24gaXNFbWJlZGRlZENvZGUoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgcmVmZXJlbmNlU2NvcGU6IHN0cmluZyxcbiAgcm93OiBudW1iZXJcbikge1xuICBjb25zdCBzY29wZXMgPSBlZGl0b3JcbiAgICAuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24obmV3IFBvaW50KHJvdywgMCkpXG4gICAgLmdldFNjb3Blc0FycmF5KCk7XG4gIHJldHVybiBzY29wZXMuaW5jbHVkZXMocmVmZXJlbmNlU2NvcGUpO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50RmVuY2VkQ29kZUJsb2NrKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gIGNvbnN0IHsgcm93OiBidWZmZXJFbmRSb3cgfSA9IGJ1ZmZlci5nZXRFbmRQb3NpdGlvbigpO1xuICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgbGV0IHN0YXJ0ID0gY3Vyc29yLnJvdztcbiAgbGV0IGVuZCA9IGN1cnNvci5yb3c7XG4gIGNvbnN0IHNjb3BlID0gZ2V0RW1iZWRkZWRTY29wZShlZGl0b3IsIGN1cnNvcik7XG4gIGlmICghc2NvcGUpIHtcbiAgICByZXR1cm4gZ2V0Q2VsbChlZGl0b3IpO1xuICB9XG5cbiAgd2hpbGUgKHN0YXJ0ID4gMCAmJiBpc0VtYmVkZGVkQ29kZShlZGl0b3IsIHNjb3BlLCBzdGFydCAtIDEpKSB7XG4gICAgc3RhcnQgLT0gMTtcbiAgfVxuXG4gIHdoaWxlIChlbmQgPCBidWZmZXJFbmRSb3cgJiYgaXNFbWJlZGRlZENvZGUoZWRpdG9yLCBzY29wZSwgZW5kICsgMSkpIHtcbiAgICBlbmQgKz0gMTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUmFuZ2UoW3N0YXJ0LCAwXSwgW2VuZCArIDEsIDBdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRDZWxsKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xuICAgIHJldHVybiBnZXRDdXJyZW50RmVuY2VkQ29kZUJsb2NrKGVkaXRvcik7XG4gIH1cblxuICByZXR1cm4gZ2V0Q2VsbChlZGl0b3IpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldENlbGxzKGVkaXRvcjogVGV4dEVkaXRvciwgYnJlYWtwb2ludHM6IEFycmF5PFBvaW50PiA9IFtdKSB7XG4gIGlmIChicmVha3BvaW50cy5sZW5ndGggIT09IDApIHtcbiAgICBicmVha3BvaW50cy5zb3J0KChhLCBiKSA9PiBhLmNvbXBhcmUoYikpO1xuICB9IGVsc2Uge1xuICAgIGJyZWFrcG9pbnRzID0gZ2V0QnJlYWtwb2ludHMoZWRpdG9yKTtcbiAgfVxuXG4gIHJldHVybiBnZXRDZWxsc0ZvckJyZWFrUG9pbnRzKGVkaXRvciwgYnJlYWtwb2ludHMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldENlbGxzRm9yQnJlYWtQb2ludHMoXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgYnJlYWtwb2ludHM6IEFycmF5PFBvaW50PlxuKTogQXJyYXk8UmFuZ2U+IHtcbiAgbGV0IHN0YXJ0ID0gbmV3IFBvaW50KDAsIDApO1xuICAvLyBMZXQgc3RhcnQgYmUgZWFybGllc3Qgcm93IHdpdGggdGV4dFxuICBlZGl0b3Iuc2NhbigvXFxTLywgKG1hdGNoKSA9PiB7XG4gICAgc3RhcnQgPSBuZXcgUG9pbnQobWF0Y2gucmFuZ2Uuc3RhcnQucm93LCAwKTtcbiAgICBtYXRjaC5zdG9wKCk7XG4gIH0pO1xuICByZXR1cm4gY29tcGFjdChcbiAgICBicmVha3BvaW50cy5tYXAoKGVuZCkgPT4ge1xuICAgICAgY29uc3QgY2VsbCA9IGVuZC5pc0VxdWFsKHN0YXJ0KSA/IG51bGwgOiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZCk7XG4gICAgICBzdGFydCA9IG5ldyBQb2ludChlbmQucm93ICsgMSwgMCk7XG4gICAgICByZXR1cm4gY2VsbDtcbiAgICB9KVxuICApO1xufVxuXG5mdW5jdGlvbiBjZW50ZXJTY3JlZW5PbkN1cnNvclBvc2l0aW9uKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICBjb25zdCBjdXJzb3JQb3NpdGlvbiA9IGVkaXRvci5lbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihcbiAgICBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKVxuICApLnRvcDtcbiAgY29uc3QgZWRpdG9ySGVpZ2h0ID0gZWRpdG9yLmVsZW1lbnQuZ2V0SGVpZ2h0KCk7XG4gIGVkaXRvci5lbGVtZW50LnNldFNjcm9sbFRvcChjdXJzb3JQb3NpdGlvbiAtIGVkaXRvckhlaWdodCAvIDIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbW92ZURvd24oZWRpdG9yOiBUZXh0RWRpdG9yLCByb3c6IG51bWJlcikge1xuICBjb25zdCBsYXN0Um93ID0gZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKTtcblxuICBpZiAocm93ID49IGxhc3RSb3cpIHtcbiAgICBlZGl0b3IubW92ZVRvQm90dG9tKCk7XG4gICAgZWRpdG9yLmluc2VydE5ld2xpbmUoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB3aGlsZSAocm93IDwgbGFzdFJvdykge1xuICAgIHJvdyArPSAxO1xuICAgIGlmICghaXNCbGFuayhlZGl0b3IsIHJvdykpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbih7XG4gICAgcm93LFxuICAgIGNvbHVtbjogMCxcbiAgfSk7XG4gIGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmNlbnRlck9uTW92ZURvd25cIikgJiZcbiAgICBjZW50ZXJTY3JlZW5PbkN1cnNvclBvc2l0aW9uKGVkaXRvcik7XG59XG5leHBvcnQgZnVuY3Rpb24gZmluZFByZWNlZGluZ0Jsb2NrKFxuICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gIHJvdzogbnVtYmVyLFxuICBpbmRlbnRMZXZlbDogbnVtYmVyXG4pIHtcbiAgbGV0IHByZXZpb3VzUm93ID0gcm93IC0gMTtcblxuICB3aGlsZSAocHJldmlvdXNSb3cgPj0gMCkge1xuICAgIGNvbnN0IHByZXZpb3VzSW5kZW50TGV2ZWwgPSBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocHJldmlvdXNSb3cpO1xuICAgIGNvbnN0IHNhbWVJbmRlbnQgPSBwcmV2aW91c0luZGVudExldmVsIDw9IGluZGVudExldmVsO1xuICAgIGNvbnN0IGJsYW5rID0gaXNCbGFuayhlZGl0b3IsIHByZXZpb3VzUm93KTtcbiAgICBjb25zdCBpc0VuZCA9IGdldFJvdyhlZGl0b3IsIHByZXZpb3VzUm93KSA9PT0gXCJlbmRcIjtcblxuICAgIGlmIChpc0JsYW5rKGVkaXRvciwgcm93KSkge1xuICAgICAgcm93ID0gcHJldmlvdXNSb3c7XG4gICAgfVxuXG4gICAgaWYgKHNhbWVJbmRlbnQgJiYgIWJsYW5rICYmICFpc0VuZCkge1xuICAgICAgY29uc3QgY2VsbCA9IGdldENlbGwoZWRpdG9yLCBuZXcgUG9pbnQocm93LCAwKSk7XG5cbiAgICAgIGlmIChjZWxsLnN0YXJ0LnJvdyA+IHJvdykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvZGU6IFwiXCIsXG4gICAgICAgICAgcm93LFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb2RlOiBnZXRSb3dzKGVkaXRvciwgcHJldmlvdXNSb3csIHJvdyksXG4gICAgICAgIHJvdyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcHJldmlvdXNSb3cgLT0gMTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRDb2RlQmxvY2soZWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gIGNvbnN0IHNlbGVjdGVkVGV4dCA9IGdldFNlbGVjdGVkVGV4dChlZGl0b3IpO1xuXG4gIGlmIChzZWxlY3RlZFRleHQpIHtcbiAgICBjb25zdCBzZWxlY3RlZFJhbmdlID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKTtcbiAgICBjb25zdCBjZWxsID0gZ2V0Q2VsbChlZGl0b3IsIHNlbGVjdGVkUmFuZ2UuZW5kKTtcbiAgICBjb25zdCBzdGFydFBvaW50ID0gY2VsbC5zdGFydC5pc0dyZWF0ZXJUaGFuKHNlbGVjdGVkUmFuZ2Uuc3RhcnQpXG4gICAgICA/IGNlbGwuc3RhcnRcbiAgICAgIDogc2VsZWN0ZWRSYW5nZS5zdGFydDtcbiAgICBsZXQgZW5kUm93ID0gc2VsZWN0ZWRSYW5nZS5lbmQucm93O1xuXG4gICAgaWYgKHNlbGVjdGVkUmFuZ2UuZW5kLmNvbHVtbiA9PT0gMCkge1xuICAgICAgZW5kUm93IC09IDE7XG4gICAgfVxuXG4gICAgZW5kUm93ID0gZXNjYXBlQmxhbmtSb3dzKGVkaXRvciwgc3RhcnRQb2ludC5yb3csIGVuZFJvdyk7XG5cbiAgICBpZiAoc3RhcnRQb2ludC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChzZWxlY3RlZFJhbmdlLmVuZCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvZGU6IFwiXCIsXG4gICAgICAgIHJvdzogZW5kUm93LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydFBvaW50LCBzZWxlY3RlZFJhbmdlLmVuZCksXG4gICAgICByb3c6IGVuZFJvdyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY3Vyc29yID0gZWRpdG9yLmdldExhc3RDdXJzb3IoKTtcbiAgY29uc3Qgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpO1xuICBsb2coXCJmaW5kQ29kZUJsb2NrOlwiLCByb3cpO1xuICBjb25zdCBpbmRlbnRMZXZlbCA9IGN1cnNvci5nZXRJbmRlbnRMZXZlbCgpO1xuICBsZXQgZm9sZGFibGUgPSBlZGl0b3IuaXNGb2xkYWJsZUF0QnVmZmVyUm93KHJvdyk7XG4gIGNvbnN0IGZvbGRSYW5nZSA9IHJvd1JhbmdlRm9yQ29kZUZvbGRBdEJ1ZmZlclJvdyhlZGl0b3IsIHJvdyk7XG5cbiAgaWYgKCFmb2xkUmFuZ2UgfHwgZm9sZFJhbmdlWzBdID09IG51bGwgfHwgZm9sZFJhbmdlWzFdID09IG51bGwpIHtcbiAgICBmb2xkYWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKGZvbGRhYmxlKSB7XG4gICAgcmV0dXJuIGdldEZvbGRDb250ZW50cyhlZGl0b3IsIHJvdyk7XG4gIH1cblxuICBpZiAoaXNCbGFuayhlZGl0b3IsIHJvdykgfHwgZ2V0Um93KGVkaXRvciwgcm93KSA9PT0gXCJlbmRcIikge1xuICAgIHJldHVybiBmaW5kUHJlY2VkaW5nQmxvY2soZWRpdG9yLCByb3csIGluZGVudExldmVsKTtcbiAgfVxuXG4gIGNvbnN0IGNlbGwgPSBnZXRDZWxsKGVkaXRvciwgbmV3IFBvaW50KHJvdywgMCkpO1xuXG4gIGlmIChjZWxsLnN0YXJ0LnJvdyA+IHJvdykge1xuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBcIlwiLFxuICAgICAgcm93LFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNvZGU6IGdldFJvdyhlZGl0b3IsIHJvdyksXG4gICAgcm93LFxuICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvbGRDdXJyZW50Q2VsbChlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgY29uc3QgY2VsbFJhbmdlID0gZ2V0Q3VycmVudENlbGwoZWRpdG9yKTtcbiAgY29uc3QgbmV3UmFuZ2UgPSBhZGp1c3RDZWxsRm9sZFJhbmdlKGVkaXRvciwgY2VsbFJhbmdlKTtcbiAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UobmV3UmFuZ2UpO1xuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpWzBdLmZvbGQoKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBmb2xkQWxsQnV0Q3VycmVudENlbGwoZWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gIGNvbnN0IGluaXRpYWxTZWxlY3Rpb25zID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKCk7XG4gIC8vIEkgdGFrZSAuc2xpY2UoMSkgYmVjYXVzZSB0aGVyZSdzIGFsd2F5cyBhbiBlbXB0eSBjZWxsIHJhbmdlIGZyb20gWzAsMF0gdG9cbiAgLy8gWzAsMF1cbiAgY29uc3QgYWxsQ2VsbFJhbmdlcyA9IGdldENlbGxzKGVkaXRvcikuc2xpY2UoMSk7XG4gIGNvbnN0IGN1cnJlbnRDZWxsUmFuZ2UgPSBnZXRDdXJyZW50Q2VsbChlZGl0b3IpO1xuICBjb25zdCBuZXdSYW5nZXMgPSBhbGxDZWxsUmFuZ2VzXG4gICAgLmZpbHRlcigoY2VsbFJhbmdlKSA9PiAhY2VsbFJhbmdlLmlzRXF1YWwoY3VycmVudENlbGxSYW5nZSkpXG4gICAgLm1hcCgoY2VsbFJhbmdlKSA9PiBhZGp1c3RDZWxsRm9sZFJhbmdlKGVkaXRvciwgY2VsbFJhbmdlKSk7XG4gIGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyhuZXdSYW5nZXMpO1xuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmZvckVhY2goKHNlbGVjdGlvbikgPT4gc2VsZWN0aW9uLmZvbGQoKSk7XG4gIC8vIFJlc3RvcmUgc2VsZWN0aW9uc1xuICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMoaW5pdGlhbFNlbGVjdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBhZGp1c3RDZWxsRm9sZFJhbmdlKGVkaXRvcjogVGV4dEVkaXRvciwgcmFuZ2U6IFJhbmdlKSB7XG4gIGNvbnN0IHN0YXJ0Um93ID0gcmFuZ2Uuc3RhcnQucm93ID4gMCA/IHJhbmdlLnN0YXJ0LnJvdyAtIDEgOiAwO1xuICBjb25zdCBzdGFydFdpZHRoID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHN0YXJ0Um93KS5sZW5ndGg7XG4gIGNvbnN0IGVuZFJvdyA9XG4gICAgcmFuZ2UuZW5kLnJvdyA9PSBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXG4gICAgICA/IHJhbmdlLmVuZC5yb3dcbiAgICAgIDogcmFuZ2UuZW5kLnJvdyAtIDE7XG4gIGNvbnN0IGVuZFdpZHRoID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGVuZFJvdykubGVuZ3RoO1xuICByZXR1cm4gbmV3IFJhbmdlKFxuICAgIG5ldyBQb2ludChzdGFydFJvdywgc3RhcnRXaWR0aCksXG4gICAgbmV3IFBvaW50KGVuZFJvdywgZW5kV2lkdGgpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFc2NhcGVCbGFua1Jvd3NFbmRSb3coZWRpdG9yOiBUZXh0RWRpdG9yLCBlbmQ6IFBvaW50KSB7XG4gIHJldHVybiBlbmQucm93ID09PSBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpID8gZW5kLnJvdyA6IGVuZC5yb3cgLSAxO1xufVxuIl19