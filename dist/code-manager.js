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
    lines.forEach((line) => {
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
    return scopes.includes(referenceScope);
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
    return compact_1.default(breakpoints.map((end) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NvZGUtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBZ0Q7QUFDaEQsZ0ZBQXNEO0FBQ3RELGdFQUF1QztBQUN2Qyw2REFBcUM7QUFDckMsbUNBTWlCO0FBR2pCLFNBQWdCLGVBQWUsQ0FBQyxJQUErQjtJQUM3RCxJQUFJLElBQUksRUFBRTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFORCwwQ0FNQztBQUNELFNBQWdCLE1BQU0sQ0FBQyxNQUFrQixFQUFFLEdBQVc7SUFDcEQsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUZELHdCQUVDO0FBQ0QsU0FBZ0IsY0FBYyxDQUFDLE1BQWtCLEVBQUUsS0FBWSxFQUFFLEdBQVU7SUFDekUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkQsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUhELHdDQUdDO0FBQ0QsU0FBZ0IsT0FBTyxDQUFDLE1BQWtCLEVBQUUsUUFBZ0IsRUFBRSxNQUFjO0lBQzFFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztRQUN2QyxLQUFLLEVBQUU7WUFDTCxHQUFHLEVBQUUsUUFBUTtZQUNiLE1BQU0sRUFBRSxDQUFDO1NBQ1Y7UUFDRCxHQUFHLEVBQUU7WUFDSCxHQUFHLEVBQUUsTUFBTTtZQUNYLE1BQU0sRUFBRSxPQUFPO1NBQ2hCO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENB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QVUsQ0FBQyxFQUMvQixJQUFJLFlBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQzVCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsTUFBa0IsRUFBRSxHQUFVO0lBQ3JFLE9BQU8sR0FBRyxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUZELDREQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9pbnQsIFJhbmdlLCBUZXh0RWRpdG9yIH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IGVzY2FwZVN0cmluZ1JlZ2V4cCBmcm9tIFwiZXNjYXBlLXN0cmluZy1yZWdleHBcIjtcclxuaW1wb3J0IHN0cmlwSW5kZW50IGZyb20gXCJzdHJpcC1pbmRlbnRcIjtcclxuaW1wb3J0IGNvbXBhY3QgZnJvbSBcImxvZGFzaC9jb21wYWN0XCI7XHJcbmltcG9ydCB7XHJcbiAgbG9nLFxyXG4gIGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIsXHJcbiAgZ2V0RW1iZWRkZWRTY29wZSxcclxuICByb3dSYW5nZUZvckNvZGVGb2xkQXRCdWZmZXJSb3csXHJcbiAganNfaWR4X3RvX2NoYXJfaWR4LFxyXG59IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB0eXBlIHsgSHlkcm9nZW5DZWxsVHlwZSB9IGZyb20gXCIuL2h5ZHJvZ2VuXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3RyaW5nKGNvZGU6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICBpZiAoY29kZSkge1xyXG4gICAgcmV0dXJuIGNvZGUucmVwbGFjZSgvXFxyXFxufFxcci9nLCBcIlxcblwiKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBudWxsO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSb3coZWRpdG9yOiBUZXh0RWRpdG9yLCByb3c6IG51bWJlcikge1xyXG4gIHJldHVybiBub3JtYWxpemVTdHJpbmcoZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdykpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXh0SW5SYW5nZShlZGl0b3I6IFRleHRFZGl0b3IsIHN0YXJ0OiBQb2ludCwgZW5kOiBQb2ludCkge1xyXG4gIGNvbnN0IGNvZGUgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW3N0YXJ0LCBlbmRdKTtcclxuICByZXR1cm4gbm9ybWFsaXplU3RyaW5nKGNvZGUpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSb3dzKGVkaXRvcjogVGV4dEVkaXRvciwgc3RhcnRSb3c6IG51bWJlciwgZW5kUm93OiBudW1iZXIpIHtcclxuICBjb25zdCBjb2RlID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHtcclxuICAgIHN0YXJ0OiB7XHJcbiAgICAgIHJvdzogc3RhcnRSb3csXHJcbiAgICAgIGNvbHVtbjogMCxcclxuICAgIH0sXHJcbiAgICBlbmQ6IHtcclxuICAgICAgcm93OiBlbmRSb3csXHJcbiAgICAgIGNvbHVtbjogOTk5OTk5OSxcclxuICAgIH0sXHJcbiAgfSk7XHJcbiAgcmV0dXJuIG5vcm1hbGl6ZVN0cmluZyhjb2RlKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWV0YWRhdGFGb3JSb3coXHJcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gIGFueVBvaW50SW5DZWxsOiBQb2ludFxyXG4pOiBIeWRyb2dlbkNlbGxUeXBlIHtcclxuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgcmV0dXJuIFwiY29kZWNlbGxcIjtcclxuICB9XHJcblxyXG4gIGxldCBjZWxsVHlwZTogSHlkcm9nZW5DZWxsVHlwZSA9IFwiY29kZWNlbGxcIjtcclxuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgYW55UG9pbnRJbkNlbGwgPSBuZXcgUG9pbnQoXHJcbiAgICBhbnlQb2ludEluQ2VsbC5yb3csXHJcbiAgICBidWZmZXIubGluZUxlbmd0aEZvclJvdyhhbnlQb2ludEluQ2VsbC5yb3cpXHJcbiAgKTtcclxuICBjb25zdCByZWdleFN0cmluZyA9IGdldFJlZ2V4U3RyaW5nKGVkaXRvcik7XHJcblxyXG4gIGlmIChyZWdleFN0cmluZykge1xyXG4gICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4U3RyaW5nKTtcclxuICAgIGJ1ZmZlci5iYWNrd2FyZHNTY2FuSW5SYW5nZShcclxuICAgICAgcmVnZXgsXHJcbiAgICAgIG5ldyBSYW5nZShuZXcgUG9pbnQoMCwgMCksIGFueVBvaW50SW5DZWxsKSxcclxuICAgICAgKHsgbWF0Y2ggfSkgPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbWF0Y2gubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmIChtYXRjaFtpXSkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG1hdGNoW2ldKSB7XHJcbiAgICAgICAgICAgICAgY2FzZSBcIm1kXCI6XHJcbiAgICAgICAgICAgICAgY2FzZSBcIm1hcmtkb3duXCI6XHJcbiAgICAgICAgICAgICAgICBjZWxsVHlwZSA9IFwibWFya2Rvd25cIjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICBjYXNlIFwiY29kZWNlbGxcIjpcclxuICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgY2VsbFR5cGUgPSBcImNvZGVjZWxsXCI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjZWxsVHlwZTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ29tbWVudHNNYXJrZG93bkNlbGwoXHJcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gIHRleHQ6IHN0cmluZ1xyXG4pOiBzdHJpbmcge1xyXG4gIGNvbnN0IGNvbW1lbnRTdGFydFN0cmluZyA9IGdldENvbW1lbnRTdGFydFN0cmluZyhlZGl0b3IpO1xyXG4gIGlmICghY29tbWVudFN0YXJ0U3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGV4dDtcclxuICB9XHJcbiAgY29uc3QgbGluZXMgPSB0ZXh0LnNwbGl0KFwiXFxuXCIpO1xyXG4gIGNvbnN0IGVkaXRlZExpbmVzID0gW107XHJcblxyXG4gIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcclxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoY29tbWVudFN0YXJ0U3RyaW5nKSkge1xyXG4gICAgICAvLyBSZW1vdmUgY29tbWVudCBmcm9tIHN0YXJ0IG9mIGxpbmVcclxuICAgICAgZWRpdGVkTGluZXMucHVzaChsaW5lLnNsaWNlKGNvbW1lbnRTdGFydFN0cmluZy5sZW5ndGgpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRlZExpbmVzLnB1c2gobGluZSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBzdHJpcEluZGVudChlZGl0ZWRMaW5lcy5qb2luKFwiXFxuXCIpKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRUZXh0KGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gIHJldHVybiBub3JtYWxpemVTdHJpbmcoZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gaXNDb21tZW50KGVkaXRvcjogVGV4dEVkaXRvciwgcG9zaXRpb246IFBvaW50KSB7XHJcbiAgY29uc3Qgc2NvcGUgPSBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24ocG9zaXRpb24pO1xyXG4gIGNvbnN0IHNjb3BlU3RyaW5nID0gc2NvcGUuZ2V0U2NvcGVDaGFpbigpO1xyXG4gIHJldHVybiBzY29wZVN0cmluZy5pbmNsdWRlcyhcImNvbW1lbnQubGluZVwiKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gaXNCbGFuayhlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XHJcbiAgcmV0dXJuIGVkaXRvci5nZXRCdWZmZXIoKS5pc1Jvd0JsYW5rKHJvdyk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUJsYW5rUm93cyhcclxuICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgc3RhcnRSb3c6IG51bWJlcixcclxuICBlbmRSb3c6IG51bWJlclxyXG4pIHtcclxuICB3aGlsZSAoZW5kUm93ID4gc3RhcnRSb3cpIHtcclxuICAgIGlmICghaXNCbGFuayhlZGl0b3IsIGVuZFJvdykpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBlbmRSb3cgLT0gMTtcclxuICB9XHJcblxyXG4gIHJldHVybiBlbmRSb3c7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZvbGRSYW5nZShlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XHJcbiAgY29uc3QgcmFuZ2UgPSByb3dSYW5nZUZvckNvZGVGb2xkQXRCdWZmZXJSb3coZWRpdG9yLCByb3cpO1xyXG4gIGlmICghcmFuZ2UpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChcclxuICAgIHJhbmdlWzFdIDwgZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKSAmJlxyXG4gICAgZ2V0Um93KGVkaXRvciwgcmFuZ2VbMV0gKyAxKSA9PT0gXCJlbmRcIlxyXG4gICkge1xyXG4gICAgcmFuZ2VbMV0gKz0gMTtcclxuICB9XHJcblxyXG4gIGxvZyhcImdldEZvbGRSYW5nZTpcIiwgcmFuZ2UpO1xyXG4gIHJldHVybiByYW5nZTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Rm9sZENvbnRlbnRzKGVkaXRvcjogVGV4dEVkaXRvciwgcm93OiBudW1iZXIpIHtcclxuICBjb25zdCByYW5nZSA9IGdldEZvbGRSYW5nZShlZGl0b3IsIHJvdyk7XHJcbiAgaWYgKCFyYW5nZSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgY29kZTogZ2V0Um93cyhlZGl0b3IsIHJhbmdlWzBdLCByYW5nZVsxXSksXHJcbiAgICByb3c6IHJhbmdlWzFdLFxyXG4gIH07XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENvZGVUb0luc3BlY3QoZWRpdG9yOiBUZXh0RWRpdG9yKSB7XHJcbiAgY29uc3Qgc2VsZWN0ZWRUZXh0ID0gZ2V0U2VsZWN0ZWRUZXh0KGVkaXRvcik7XHJcbiAgbGV0IGNvZGU7XHJcbiAgbGV0IGN1cnNvclBvc2l0aW9uO1xyXG5cclxuICBpZiAoc2VsZWN0ZWRUZXh0KSB7XHJcbiAgICBjb2RlID0gc2VsZWN0ZWRUZXh0O1xyXG4gICAgY3Vyc29yUG9zaXRpb24gPSBjb2RlLmxlbmd0aDtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgY3Vyc29yID0gZWRpdG9yLmdldExhc3RDdXJzb3IoKTtcclxuICAgIGNvbnN0IHJvdyA9IGN1cnNvci5nZXRCdWZmZXJSb3coKTtcclxuICAgIGNvZGUgPSBnZXRSb3coZWRpdG9yLCByb3cpO1xyXG4gICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyQ29sdW1uKCk7XHJcbiAgICAvLyBUT0RPOiB1c2Uga2VybmVsLmNvbXBsZXRlIHRvIGZpbmQgYSBzZWxlY3Rpb25cclxuICAgIGNvbnN0IGlkZW50aWZpZXJFbmQgPSBjb2RlID8gY29kZS5zbGljZShjdXJzb3JQb3NpdGlvbikuc2VhcmNoKC9cXFcvKSA6IC0xO1xyXG5cclxuICAgIGlmIChpZGVudGlmaWVyRW5kICE9PSAtMSkge1xyXG4gICAgICBjdXJzb3JQb3NpdGlvbiArPSBpZGVudGlmaWVyRW5kO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY3Vyc29yUG9zaXRpb24gPSBqc19pZHhfdG9fY2hhcl9pZHgoY3Vyc29yUG9zaXRpb24sIGNvZGUpO1xyXG4gIHJldHVybiBbY29kZSwgY3Vyc29yUG9zaXRpb25dO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21tZW50U3RhcnRTdHJpbmcoXHJcbiAgZWRpdG9yOiBUZXh0RWRpdG9yXHJcbik6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQge1xyXG4gIGNvbnN0IHtcclxuICAgIGNvbW1lbnRTdGFydFN0cmluZywgLy8gJEZsb3dGaXhNZTogVGhpcyBpcyBhbiB1bm9mZmljaWFsIEFQSVxyXG4gIH0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLmNvbW1lbnRTdHJpbmdzRm9yUG9zaXRpb24oXHJcbiAgICBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxyXG4gICk7XHJcblxyXG4gIGlmICghY29tbWVudFN0YXJ0U3RyaW5nKSB7XHJcbiAgICBsb2coXCJDZWxsTWFuYWdlcjogTm8gY29tbWVudCBzdHJpbmcgZGVmaW5lZCBpbiByb290IHNjb3BlXCIpO1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY29tbWVudFN0YXJ0U3RyaW5nLnRyaW1SaWdodCgpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWdleFN0cmluZyhlZGl0b3I6IFRleHRFZGl0b3IpIHtcclxuICBjb25zdCBjb21tZW50U3RhcnRTdHJpbmcgPSBnZXRDb21tZW50U3RhcnRTdHJpbmcoZWRpdG9yKTtcclxuICBpZiAoIWNvbW1lbnRTdGFydFN0cmluZykge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG4gIGNvbnN0IGVzY2FwZWRDb21tZW50U3RhcnRTdHJpbmcgPSBlc2NhcGVTdHJpbmdSZWdleHAoY29tbWVudFN0YXJ0U3RyaW5nKTtcclxuICBjb25zdCByZWdleFN0cmluZyA9IGAke2VzY2FwZWRDb21tZW50U3RhcnRTdHJpbmd9IColJSAqKG1kfG1hcmtkb3duKT98ICo8KGNvZGVjZWxsfG1kfG1hcmtkb3duKT58ICooSW5cXFtbMC05IF0qXFxdKWA7XHJcbiAgcmV0dXJuIHJlZ2V4U3RyaW5nO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRCcmVha3BvaW50cyhlZGl0b3I6IFRleHRFZGl0b3IpIHtcclxuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgY29uc3QgYnJlYWtwb2ludHMgPSBbXTtcclxuICBjb25zdCByZWdleFN0cmluZyA9IGdldFJlZ2V4U3RyaW5nKGVkaXRvcik7XHJcblxyXG4gIGlmIChyZWdleFN0cmluZykge1xyXG4gICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4U3RyaW5nLCBcImdcIik7XHJcbiAgICBidWZmZXIuc2NhbihyZWdleCwgKHsgcmFuZ2UgfSkgPT4ge1xyXG4gICAgICBpZiAoaXNDb21tZW50KGVkaXRvciwgcmFuZ2Uuc3RhcnQpKSB7XHJcbiAgICAgICAgYnJlYWtwb2ludHMucHVzaChyYW5nZS5zdGFydCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYnJlYWtwb2ludHMucHVzaChidWZmZXIuZ2V0RW5kUG9zaXRpb24oKSk7XHJcbiAgbG9nKFwiQ2VsbE1hbmFnZXI6IEJyZWFrcG9pbnRzOlwiLCBicmVha3BvaW50cyk7XHJcbiAgcmV0dXJuIGJyZWFrcG9pbnRzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRDZWxsKGVkaXRvcjogVGV4dEVkaXRvciwgYW55UG9pbnRJbkNlbGw/OiBQb2ludCkge1xyXG4gIGlmICghYW55UG9pbnRJbkNlbGwpIHtcclxuICAgIGFueVBvaW50SW5DZWxsID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgYW55UG9pbnRJbkNlbGwgPSBuZXcgUG9pbnQoXHJcbiAgICBhbnlQb2ludEluQ2VsbC5yb3csXHJcbiAgICBidWZmZXIubGluZUxlbmd0aEZvclJvdyhhbnlQb2ludEluQ2VsbC5yb3cpXHJcbiAgKTtcclxuICBsZXQgc3RhcnQgPSBuZXcgUG9pbnQoMCwgMCk7XHJcbiAgbGV0IGVuZCA9IGJ1ZmZlci5nZXRFbmRQb3NpdGlvbigpO1xyXG4gIGNvbnN0IHJlZ2V4U3RyaW5nID0gZ2V0UmVnZXhTdHJpbmcoZWRpdG9yKTtcclxuXHJcbiAgaWYgKCFyZWdleFN0cmluZykge1xyXG4gICAgcmV0dXJuIG5ldyBSYW5nZShzdGFydCwgZW5kKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyk7XHJcblxyXG4gIGlmIChhbnlQb2ludEluQ2VsbC5yb3cgPj0gMCkge1xyXG4gICAgYnVmZmVyLmJhY2t3YXJkc1NjYW5JblJhbmdlKFxyXG4gICAgICByZWdleCxcclxuICAgICAgbmV3IFJhbmdlKHN0YXJ0LCBhbnlQb2ludEluQ2VsbCksXHJcbiAgICAgICh7IHJhbmdlIH0pID0+IHtcclxuICAgICAgICBzdGFydCA9IG5ldyBQb2ludChyYW5nZS5zdGFydC5yb3cgKyAxLCAwKTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGJ1ZmZlci5zY2FuSW5SYW5nZShyZWdleCwgbmV3IFJhbmdlKGFueVBvaW50SW5DZWxsLCBlbmQpLCAoeyByYW5nZSB9KSA9PiB7XHJcbiAgICBlbmQgPSByYW5nZS5zdGFydDtcclxuICB9KTtcclxuICBsb2coXHJcbiAgICBcIkNlbGxNYW5hZ2VyOiBDZWxsIFtzdGFydCwgZW5kXTpcIixcclxuICAgIFtzdGFydCwgZW5kXSxcclxuICAgIFwiYW55UG9pbnRJbkNlbGw6XCIsXHJcbiAgICBhbnlQb2ludEluQ2VsbFxyXG4gICk7XHJcbiAgcmV0dXJuIG5ldyBSYW5nZShzdGFydCwgZW5kKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNFbWJlZGRlZENvZGUoXHJcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gIHJlZmVyZW5jZVNjb3BlOiBzdHJpbmcsXHJcbiAgcm93OiBudW1iZXJcclxuKSB7XHJcbiAgY29uc3Qgc2NvcGVzID0gZWRpdG9yXHJcbiAgICAuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24obmV3IFBvaW50KHJvdywgMCkpXHJcbiAgICAuZ2V0U2NvcGVzQXJyYXkoKTtcclxuICByZXR1cm4gc2NvcGVzLmluY2x1ZGVzKHJlZmVyZW5jZVNjb3BlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q3VycmVudEZlbmNlZENvZGVCbG9jayhlZGl0b3I6IFRleHRFZGl0b3IpIHtcclxuICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgY29uc3QgeyByb3c6IGJ1ZmZlckVuZFJvdyB9ID0gYnVmZmVyLmdldEVuZFBvc2l0aW9uKCk7XHJcbiAgY29uc3QgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgbGV0IHN0YXJ0ID0gY3Vyc29yLnJvdztcclxuICBsZXQgZW5kID0gY3Vyc29yLnJvdztcclxuICBjb25zdCBzY29wZSA9IGdldEVtYmVkZGVkU2NvcGUoZWRpdG9yLCBjdXJzb3IpO1xyXG4gIGlmICghc2NvcGUpIHtcclxuICAgIHJldHVybiBnZXRDZWxsKGVkaXRvcik7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAoc3RhcnQgPiAwICYmIGlzRW1iZWRkZWRDb2RlKGVkaXRvciwgc2NvcGUsIHN0YXJ0IC0gMSkpIHtcclxuICAgIHN0YXJ0IC09IDE7XHJcbiAgfVxyXG5cclxuICB3aGlsZSAoZW5kIDwgYnVmZmVyRW5kUm93ICYmIGlzRW1iZWRkZWRDb2RlKGVkaXRvciwgc2NvcGUsIGVuZCArIDEpKSB7XHJcbiAgICBlbmQgKz0gMTtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXcgUmFuZ2UoW3N0YXJ0LCAwXSwgW2VuZCArIDEsIDBdKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRDZWxsKGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gIGlmIChpc011bHRpbGFuZ3VhZ2VHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpKSB7XHJcbiAgICByZXR1cm4gZ2V0Q3VycmVudEZlbmNlZENvZGVCbG9jayhlZGl0b3IpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGdldENlbGwoZWRpdG9yKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2VsbHMoZWRpdG9yOiBUZXh0RWRpdG9yLCBicmVha3BvaW50czogQXJyYXk8UG9pbnQ+ID0gW10pIHtcclxuICBpZiAoYnJlYWtwb2ludHMubGVuZ3RoICE9PSAwKSB7XHJcbiAgICBicmVha3BvaW50cy5zb3J0KChhLCBiKSA9PiBhLmNvbXBhcmUoYikpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBicmVha3BvaW50cyA9IGdldEJyZWFrcG9pbnRzKGVkaXRvcik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZ2V0Q2VsbHNGb3JCcmVha1BvaW50cyhlZGl0b3IsIGJyZWFrcG9pbnRzKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2VsbHNGb3JCcmVha1BvaW50cyhcclxuICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgYnJlYWtwb2ludHM6IEFycmF5PFBvaW50PlxyXG4pOiBBcnJheTxSYW5nZT4ge1xyXG4gIGxldCBzdGFydCA9IG5ldyBQb2ludCgwLCAwKTtcclxuICAvLyBMZXQgc3RhcnQgYmUgZWFybGllc3Qgcm93IHdpdGggdGV4dFxyXG4gIGVkaXRvci5zY2FuKC9cXFMvLCAobWF0Y2gpID0+IHtcclxuICAgIHN0YXJ0ID0gbmV3IFBvaW50KG1hdGNoLnJhbmdlLnN0YXJ0LnJvdywgMCk7XHJcbiAgICBtYXRjaC5zdG9wKCk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGNvbXBhY3QoXHJcbiAgICBicmVha3BvaW50cy5tYXAoKGVuZCkgPT4ge1xyXG4gICAgICBjb25zdCBjZWxsID0gZW5kLmlzRXF1YWwoc3RhcnQpID8gbnVsbCA6IG5ldyBSYW5nZShzdGFydCwgZW5kKTtcclxuICAgICAgc3RhcnQgPSBuZXcgUG9pbnQoZW5kLnJvdyArIDEsIDApO1xyXG4gICAgICByZXR1cm4gY2VsbDtcclxuICAgIH0pXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2VudGVyU2NyZWVuT25DdXJzb3JQb3NpdGlvbihlZGl0b3I6IFRleHRFZGl0b3IpIHtcclxuICBjb25zdCBjdXJzb3JQb3NpdGlvbiA9IGVkaXRvci5lbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihcclxuICAgIGVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpXHJcbiAgKS50b3A7XHJcbiAgY29uc3QgZWRpdG9ySGVpZ2h0ID0gZWRpdG9yLmVsZW1lbnQuZ2V0SGVpZ2h0KCk7XHJcbiAgZWRpdG9yLmVsZW1lbnQuc2V0U2Nyb2xsVG9wKGN1cnNvclBvc2l0aW9uIC0gZWRpdG9ySGVpZ2h0IC8gMik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb3ZlRG93bihlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XHJcbiAgY29uc3QgbGFzdFJvdyA9IGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KCk7XHJcblxyXG4gIGlmIChyb3cgPj0gbGFzdFJvdykge1xyXG4gICAgZWRpdG9yLm1vdmVUb0JvdHRvbSgpO1xyXG4gICAgZWRpdG9yLmluc2VydE5ld2xpbmUoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHdoaWxlIChyb3cgPCBsYXN0Um93KSB7XHJcbiAgICByb3cgKz0gMTtcclxuICAgIGlmICghaXNCbGFuayhlZGl0b3IsIHJvdykpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oe1xyXG4gICAgcm93LFxyXG4gICAgY29sdW1uOiAwLFxyXG4gIH0pO1xyXG4gIGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmNlbnRlck9uTW92ZURvd25cIikgJiZcclxuICAgIGNlbnRlclNjcmVlbk9uQ3Vyc29yUG9zaXRpb24oZWRpdG9yKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZmluZFByZWNlZGluZ0Jsb2NrKFxyXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICByb3c6IG51bWJlcixcclxuICBpbmRlbnRMZXZlbDogbnVtYmVyXHJcbikge1xyXG4gIGxldCBwcmV2aW91c1JvdyA9IHJvdyAtIDE7XHJcblxyXG4gIHdoaWxlIChwcmV2aW91c1JvdyA+PSAwKSB7XHJcbiAgICBjb25zdCBwcmV2aW91c0luZGVudExldmVsID0gZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHByZXZpb3VzUm93KTtcclxuICAgIGNvbnN0IHNhbWVJbmRlbnQgPSBwcmV2aW91c0luZGVudExldmVsIDw9IGluZGVudExldmVsO1xyXG4gICAgY29uc3QgYmxhbmsgPSBpc0JsYW5rKGVkaXRvciwgcHJldmlvdXNSb3cpO1xyXG4gICAgY29uc3QgaXNFbmQgPSBnZXRSb3coZWRpdG9yLCBwcmV2aW91c1JvdykgPT09IFwiZW5kXCI7XHJcblxyXG4gICAgaWYgKGlzQmxhbmsoZWRpdG9yLCByb3cpKSB7XHJcbiAgICAgIHJvdyA9IHByZXZpb3VzUm93O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzYW1lSW5kZW50ICYmICFibGFuayAmJiAhaXNFbmQpIHtcclxuICAgICAgY29uc3QgY2VsbCA9IGdldENlbGwoZWRpdG9yLCBuZXcgUG9pbnQocm93LCAwKSk7XHJcblxyXG4gICAgICBpZiAoY2VsbC5zdGFydC5yb3cgPiByb3cpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29kZTogXCJcIixcclxuICAgICAgICAgIHJvdyxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvZGU6IGdldFJvd3MoZWRpdG9yLCBwcmV2aW91c1Jvdywgcm93KSxcclxuICAgICAgICByb3csXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJldmlvdXNSb3cgLT0gMTtcclxuICB9XHJcblxyXG4gIHJldHVybiBudWxsO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29kZUJsb2NrKGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gIGNvbnN0IHNlbGVjdGVkVGV4dCA9IGdldFNlbGVjdGVkVGV4dChlZGl0b3IpO1xyXG5cclxuICBpZiAoc2VsZWN0ZWRUZXh0KSB7XHJcbiAgICBjb25zdCBzZWxlY3RlZFJhbmdlID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKTtcclxuICAgIGNvbnN0IGNlbGwgPSBnZXRDZWxsKGVkaXRvciwgc2VsZWN0ZWRSYW5nZS5lbmQpO1xyXG4gICAgY29uc3Qgc3RhcnRQb2ludCA9IGNlbGwuc3RhcnQuaXNHcmVhdGVyVGhhbihzZWxlY3RlZFJhbmdlLnN0YXJ0KVxyXG4gICAgICA/IGNlbGwuc3RhcnRcclxuICAgICAgOiBzZWxlY3RlZFJhbmdlLnN0YXJ0O1xyXG4gICAgbGV0IGVuZFJvdyA9IHNlbGVjdGVkUmFuZ2UuZW5kLnJvdztcclxuXHJcbiAgICBpZiAoc2VsZWN0ZWRSYW5nZS5lbmQuY29sdW1uID09PSAwKSB7XHJcbiAgICAgIGVuZFJvdyAtPSAxO1xyXG4gICAgfVxyXG5cclxuICAgIGVuZFJvdyA9IGVzY2FwZUJsYW5rUm93cyhlZGl0b3IsIHN0YXJ0UG9pbnQucm93LCBlbmRSb3cpO1xyXG5cclxuICAgIGlmIChzdGFydFBvaW50LmlzR3JlYXRlclRoYW5PckVxdWFsKHNlbGVjdGVkUmFuZ2UuZW5kKSkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvZGU6IFwiXCIsXHJcbiAgICAgICAgcm93OiBlbmRSb3csXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29kZTogZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydFBvaW50LCBzZWxlY3RlZFJhbmdlLmVuZCksXHJcbiAgICAgIHJvdzogZW5kUm93LFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XHJcbiAgY29uc3Qgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpO1xyXG4gIGxvZyhcImZpbmRDb2RlQmxvY2s6XCIsIHJvdyk7XHJcbiAgY29uc3QgaW5kZW50TGV2ZWwgPSBjdXJzb3IuZ2V0SW5kZW50TGV2ZWwoKTtcclxuICBsZXQgZm9sZGFibGUgPSBlZGl0b3IuaXNGb2xkYWJsZUF0QnVmZmVyUm93KHJvdyk7XHJcbiAgY29uc3QgZm9sZFJhbmdlID0gcm93UmFuZ2VGb3JDb2RlRm9sZEF0QnVmZmVyUm93KGVkaXRvciwgcm93KTtcclxuXHJcbiAgaWYgKCFmb2xkUmFuZ2UgfHwgZm9sZFJhbmdlWzBdID09IG51bGwgfHwgZm9sZFJhbmdlWzFdID09IG51bGwpIHtcclxuICAgIGZvbGRhYmxlID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBpZiAoZm9sZGFibGUpIHtcclxuICAgIHJldHVybiBnZXRGb2xkQ29udGVudHMoZWRpdG9yLCByb3cpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGlzQmxhbmsoZWRpdG9yLCByb3cpIHx8IGdldFJvdyhlZGl0b3IsIHJvdykgPT09IFwiZW5kXCIpIHtcclxuICAgIHJldHVybiBmaW5kUHJlY2VkaW5nQmxvY2soZWRpdG9yLCByb3csIGluZGVudExldmVsKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNlbGwgPSBnZXRDZWxsKGVkaXRvciwgbmV3IFBvaW50KHJvdywgMCkpO1xyXG5cclxuICBpZiAoY2VsbC5zdGFydC5yb3cgPiByb3cpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvZGU6IFwiXCIsXHJcbiAgICAgIHJvdyxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgY29kZTogZ2V0Um93KGVkaXRvciwgcm93KSxcclxuICAgIHJvdyxcclxuICB9O1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBmb2xkQ3VycmVudENlbGwoZWRpdG9yOiBUZXh0RWRpdG9yKSB7XHJcbiAgY29uc3QgY2VsbFJhbmdlID0gZ2V0Q3VycmVudENlbGwoZWRpdG9yKTtcclxuICBjb25zdCBuZXdSYW5nZSA9IGFkanVzdENlbGxGb2xkUmFuZ2UoZWRpdG9yLCBjZWxsUmFuZ2UpO1xyXG4gIGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKG5ld1JhbmdlKTtcclxuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpWzBdLmZvbGQoKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZm9sZEFsbEJ1dEN1cnJlbnRDZWxsKGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gIGNvbnN0IGluaXRpYWxTZWxlY3Rpb25zID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKCk7XHJcbiAgLy8gSSB0YWtlIC5zbGljZSgxKSBiZWNhdXNlIHRoZXJlJ3MgYWx3YXlzIGFuIGVtcHR5IGNlbGwgcmFuZ2UgZnJvbSBbMCwwXSB0b1xyXG4gIC8vIFswLDBdXHJcbiAgY29uc3QgYWxsQ2VsbFJhbmdlcyA9IGdldENlbGxzKGVkaXRvcikuc2xpY2UoMSk7XHJcbiAgY29uc3QgY3VycmVudENlbGxSYW5nZSA9IGdldEN1cnJlbnRDZWxsKGVkaXRvcik7XHJcbiAgY29uc3QgbmV3UmFuZ2VzID0gYWxsQ2VsbFJhbmdlc1xyXG4gICAgLmZpbHRlcigoY2VsbFJhbmdlKSA9PiAhY2VsbFJhbmdlLmlzRXF1YWwoY3VycmVudENlbGxSYW5nZSkpXHJcbiAgICAubWFwKChjZWxsUmFuZ2UpID0+IGFkanVzdENlbGxGb2xkUmFuZ2UoZWRpdG9yLCBjZWxsUmFuZ2UpKTtcclxuICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMobmV3UmFuZ2VzKTtcclxuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmZvckVhY2goKHNlbGVjdGlvbikgPT4gc2VsZWN0aW9uLmZvbGQoKSk7XHJcbiAgLy8gUmVzdG9yZSBzZWxlY3Rpb25zXHJcbiAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKGluaXRpYWxTZWxlY3Rpb25zKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWRqdXN0Q2VsbEZvbGRSYW5nZShlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSkge1xyXG4gIGNvbnN0IHN0YXJ0Um93ID0gcmFuZ2Uuc3RhcnQucm93ID4gMCA/IHJhbmdlLnN0YXJ0LnJvdyAtIDEgOiAwO1xyXG4gIGNvbnN0IHN0YXJ0V2lkdGggPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coc3RhcnRSb3cpLmxlbmd0aDtcclxuICBjb25zdCBlbmRSb3cgPVxyXG4gICAgcmFuZ2UuZW5kLnJvdyA9PSBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXHJcbiAgICAgID8gcmFuZ2UuZW5kLnJvd1xyXG4gICAgICA6IHJhbmdlLmVuZC5yb3cgLSAxO1xyXG4gIGNvbnN0IGVuZFdpZHRoID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGVuZFJvdykubGVuZ3RoO1xyXG4gIHJldHVybiBuZXcgUmFuZ2UoXHJcbiAgICBuZXcgUG9pbnQoc3RhcnRSb3csIHN0YXJ0V2lkdGgpLFxyXG4gICAgbmV3IFBvaW50KGVuZFJvdywgZW5kV2lkdGgpXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEVzY2FwZUJsYW5rUm93c0VuZFJvdyhlZGl0b3I6IFRleHRFZGl0b3IsIGVuZDogUG9pbnQpIHtcclxuICByZXR1cm4gZW5kLnJvdyA9PT0gZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKSA/IGVuZC5yb3cgOiBlbmQucm93IC0gMTtcclxufVxyXG4iXX0=