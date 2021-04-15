"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldAllButCurrentCell = exports.foldCurrentCell = exports.findCodeBlock = exports.findPrecedingBlock = exports.moveDown = exports.getCellsForBreakPoints = exports.getCells = exports.getCurrentCell = exports.getBreakpoints = exports.getRegexString = exports.getCommentStartString = exports.getCodeToInspect = exports.getFoldContents = exports.getFoldRange = exports.escapeBlankRows = exports.isBlank = exports.isComment = exports.getSelectedText = exports.removeCommentsMarkdownCell = exports.getMetadataForRow = exports.getRows = exports.getTextInRange = exports.getRow = exports.normalizeString = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NvZGUtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBZ0Q7QUFDaEQsZ0ZBQXNEO0FBQ3RELGdFQUF1QztBQUN2QyxvREFBdUI7QUFDdkIsbUNBTWlCO0FBR2pCLFNBQWdCLGVBQWUsQ0FBQyxJQUErQjtJQUM3RCxJQUFJLElBQUksRUFBRTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFORCwwQ0FNQztBQUNELFNBQWdCLE1BQU0sQ0FBQyxNQUFrQixFQUFFLEdBQVc7SUFDcEQsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUZELHdCQUVDO0FBQ0QsU0FBZ0IsY0FBYyxDQUFDLE1BQWtCLEVBQUUsS0FBWSxFQUFFLEdBQVU7SUFDekUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkQsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUhELHdDQUdDO0FBQ0QsU0FBZ0IsT0FBTyxDQUFDLE1BQWtCLEVBQUUsUUFBZ0IsRUFBRSxNQUFjO0lBQzFFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztRQUN2QyxLQUFLLEVBQUU7WUFDTCxHQUFHLEVBQUUsUUFBUTtZQUNiLE1BQU0sRUFBRSxDQUFDO1NBQ1Y7UUFDRCxHQUFHLEVBQUU7WUFDSCxHQUFHLEVBQUUsTUFBTTtZQUNYLE1BQU0sRUFBRSxPQUFPO1NBQ2hCO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENB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O0lBQzVELE9BQU8sSUFBSSxZQUFLLENBQ2QsSUFBSSxZQUFLLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxFQUMvQixJQUFJLFlBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQzVCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9pbnQsIFJhbmdlLCBUZXh0RWRpdG9yIH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IGVzY2FwZVN0cmluZ1JlZ2V4cCBmcm9tIFwiZXNjYXBlLXN0cmluZy1yZWdleHBcIjtcclxuaW1wb3J0IHN0cmlwSW5kZW50IGZyb20gXCJzdHJpcC1pbmRlbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge1xyXG4gIGxvZyxcclxuICBpc011bHRpbGFuZ3VhZ2VHcmFtbWFyLFxyXG4gIGdldEVtYmVkZGVkU2NvcGUsXHJcbiAgcm93UmFuZ2VGb3JDb2RlRm9sZEF0QnVmZmVyUm93LFxyXG4gIGpzX2lkeF90b19jaGFyX2lkeCxcclxufSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgdHlwZSB7IEh5ZHJvZ2VuQ2VsbFR5cGUgfSBmcm9tIFwiLi9oeWRyb2dlblwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZyhjb2RlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcbiAgaWYgKGNvZGUpIHtcclxuICAgIHJldHVybiBjb2RlLnJlcGxhY2UoL1xcclxcbnxcXHIvZywgXCJcXG5cIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbnVsbDtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um93KGVkaXRvcjogVGV4dEVkaXRvciwgcm93OiBudW1iZXIpIHtcclxuICByZXR1cm4gbm9ybWFsaXplU3RyaW5nKGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGV4dEluUmFuZ2UoZWRpdG9yOiBUZXh0RWRpdG9yLCBzdGFydDogUG9pbnQsIGVuZDogUG9pbnQpIHtcclxuICBjb25zdCBjb2RlID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtzdGFydCwgZW5kXSk7XHJcbiAgcmV0dXJuIG5vcm1hbGl6ZVN0cmluZyhjb2RlKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um93cyhlZGl0b3I6IFRleHRFZGl0b3IsIHN0YXJ0Um93OiBudW1iZXIsIGVuZFJvdzogbnVtYmVyKSB7XHJcbiAgY29uc3QgY29kZSA9IGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZSh7XHJcbiAgICBzdGFydDoge1xyXG4gICAgICByb3c6IHN0YXJ0Um93LFxyXG4gICAgICBjb2x1bW46IDAsXHJcbiAgICB9LFxyXG4gICAgZW5kOiB7XHJcbiAgICAgIHJvdzogZW5kUm93LFxyXG4gICAgICBjb2x1bW46IDk5OTk5OTksXHJcbiAgICB9LFxyXG4gIH0pO1xyXG4gIHJldHVybiBub3JtYWxpemVTdHJpbmcoY29kZSk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1ldGFkYXRhRm9yUm93KFxyXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICBhbnlQb2ludEluQ2VsbDogUG9pbnRcclxuKTogSHlkcm9nZW5DZWxsVHlwZSB7XHJcbiAgaWYgKGlzTXVsdGlsYW5ndWFnZUdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkpIHtcclxuICAgIHJldHVybiBcImNvZGVjZWxsXCI7XHJcbiAgfVxyXG5cclxuICBsZXQgY2VsbFR5cGU6IEh5ZHJvZ2VuQ2VsbFR5cGUgPSBcImNvZGVjZWxsXCI7XHJcbiAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gIGFueVBvaW50SW5DZWxsID0gbmV3IFBvaW50KFxyXG4gICAgYW55UG9pbnRJbkNlbGwucm93LFxyXG4gICAgYnVmZmVyLmxpbmVMZW5ndGhGb3JSb3coYW55UG9pbnRJbkNlbGwucm93KVxyXG4gICk7XHJcbiAgY29uc3QgcmVnZXhTdHJpbmcgPSBnZXRSZWdleFN0cmluZyhlZGl0b3IpO1xyXG5cclxuICBpZiAocmVnZXhTdHJpbmcpIHtcclxuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZyk7XHJcbiAgICBidWZmZXIuYmFja3dhcmRzU2NhbkluUmFuZ2UoXHJcbiAgICAgIHJlZ2V4LFxyXG4gICAgICBuZXcgUmFuZ2UobmV3IFBvaW50KDAsIDApLCBhbnlQb2ludEluQ2VsbCksXHJcbiAgICAgICh7IG1hdGNoIH0pID0+IHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG1hdGNoLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAobWF0Y2hbaV0pIHtcclxuICAgICAgICAgICAgc3dpdGNoIChtYXRjaFtpXSkge1xyXG4gICAgICAgICAgICAgIGNhc2UgXCJtZFwiOlxyXG4gICAgICAgICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxyXG4gICAgICAgICAgICAgICAgY2VsbFR5cGUgPSBcIm1hcmtkb3duXCI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgY2FzZSBcImNvZGVjZWxsXCI6XHJcbiAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGNlbGxUeXBlID0gXCJjb2RlY2VsbFwiO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY2VsbFR5cGU7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNvbW1lbnRzTWFya2Rvd25DZWxsKFxyXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICB0ZXh0OiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICBjb25zdCBjb21tZW50U3RhcnRTdHJpbmcgPSBnZXRDb21tZW50U3RhcnRTdHJpbmcoZWRpdG9yKTtcclxuICBpZiAoIWNvbW1lbnRTdGFydFN0cmluZykge1xyXG4gICAgcmV0dXJuIHRleHQ7XHJcbiAgfVxyXG4gIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdChcIlxcblwiKTtcclxuICBjb25zdCBlZGl0ZWRMaW5lcyA9IFtdO1xyXG5cclxuICBfLmZvckVhY2gobGluZXMsIChsaW5lKSA9PiB7XHJcbiAgICBpZiAobGluZS5zdGFydHNXaXRoKGNvbW1lbnRTdGFydFN0cmluZykpIHtcclxuICAgICAgLy8gUmVtb3ZlIGNvbW1lbnQgZnJvbSBzdGFydCBvZiBsaW5lXHJcbiAgICAgIGVkaXRlZExpbmVzLnB1c2gobGluZS5zbGljZShjb21tZW50U3RhcnRTdHJpbmcubGVuZ3RoKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0ZWRMaW5lcy5wdXNoKGxpbmUpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gc3RyaXBJbmRlbnQoZWRpdGVkTGluZXMuam9pbihcIlxcblwiKSk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkVGV4dChlZGl0b3I6IFRleHRFZGl0b3IpIHtcclxuICByZXR1cm4gbm9ybWFsaXplU3RyaW5nKGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKSk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tbWVudChlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCkge1xyXG4gIGNvbnN0IHNjb3BlID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKTtcclxuICBjb25zdCBzY29wZVN0cmluZyA9IHNjb3BlLmdldFNjb3BlQ2hhaW4oKTtcclxuICByZXR1cm4gXy5pbmNsdWRlcyhzY29wZVN0cmluZywgXCJjb21tZW50LmxpbmVcIik7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQmxhbmsoZWRpdG9yOiBUZXh0RWRpdG9yLCByb3c6IG51bWJlcikge1xyXG4gIHJldHVybiBlZGl0b3IuZ2V0QnVmZmVyKCkuaXNSb3dCbGFuayhyb3cpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVCbGFua1Jvd3MoXHJcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gIHN0YXJ0Um93OiBudW1iZXIsXHJcbiAgZW5kUm93OiBudW1iZXJcclxuKSB7XHJcbiAgd2hpbGUgKGVuZFJvdyA+IHN0YXJ0Um93KSB7XHJcbiAgICBpZiAoIWlzQmxhbmsoZWRpdG9yLCBlbmRSb3cpKSB7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgZW5kUm93IC09IDE7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZW5kUm93O1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRGb2xkUmFuZ2UoZWRpdG9yOiBUZXh0RWRpdG9yLCByb3c6IG51bWJlcikge1xyXG4gIGNvbnN0IHJhbmdlID0gcm93UmFuZ2VGb3JDb2RlRm9sZEF0QnVmZmVyUm93KGVkaXRvciwgcm93KTtcclxuICBpZiAoIXJhbmdlKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoXHJcbiAgICByYW5nZVsxXSA8IGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KCkgJiZcclxuICAgIGdldFJvdyhlZGl0b3IsIHJhbmdlWzFdICsgMSkgPT09IFwiZW5kXCJcclxuICApIHtcclxuICAgIHJhbmdlWzFdICs9IDE7XHJcbiAgfVxyXG5cclxuICBsb2coXCJnZXRGb2xkUmFuZ2U6XCIsIHJhbmdlKTtcclxuICByZXR1cm4gcmFuZ2U7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZvbGRDb250ZW50cyhlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XHJcbiAgY29uc3QgcmFuZ2UgPSBnZXRGb2xkUmFuZ2UoZWRpdG9yLCByb3cpO1xyXG4gIGlmICghcmFuZ2UpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIGNvZGU6IGdldFJvd3MoZWRpdG9yLCByYW5nZVswXSwgcmFuZ2VbMV0pLFxyXG4gICAgcm93OiByYW5nZVsxXSxcclxuICB9O1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RlVG9JbnNwZWN0KGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gIGNvbnN0IHNlbGVjdGVkVGV4dCA9IGdldFNlbGVjdGVkVGV4dChlZGl0b3IpO1xyXG4gIGxldCBjb2RlO1xyXG4gIGxldCBjdXJzb3JQb3NpdGlvbjtcclxuXHJcbiAgaWYgKHNlbGVjdGVkVGV4dCkge1xyXG4gICAgY29kZSA9IHNlbGVjdGVkVGV4dDtcclxuICAgIGN1cnNvclBvc2l0aW9uID0gY29kZS5sZW5ndGg7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XHJcbiAgICBjb25zdCByb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KCk7XHJcbiAgICBjb2RlID0gZ2V0Um93KGVkaXRvciwgcm93KTtcclxuICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlckNvbHVtbigpO1xyXG4gICAgLy8gVE9ETzogdXNlIGtlcm5lbC5jb21wbGV0ZSB0byBmaW5kIGEgc2VsZWN0aW9uXHJcbiAgICBjb25zdCBpZGVudGlmaWVyRW5kID0gY29kZSA/IGNvZGUuc2xpY2UoY3Vyc29yUG9zaXRpb24pLnNlYXJjaCgvXFxXLykgOiAtMTtcclxuXHJcbiAgICBpZiAoaWRlbnRpZmllckVuZCAhPT0gLTEpIHtcclxuICAgICAgY3Vyc29yUG9zaXRpb24gKz0gaWRlbnRpZmllckVuZDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGN1cnNvclBvc2l0aW9uID0ganNfaWR4X3RvX2NoYXJfaWR4KGN1cnNvclBvc2l0aW9uLCBjb2RlKTtcclxuICByZXR1cm4gW2NvZGUsIGN1cnNvclBvc2l0aW9uXTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbWVudFN0YXJ0U3RyaW5nKFxyXG4gIGVkaXRvcjogVGV4dEVkaXRvclxyXG4pOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHtcclxuICBjb25zdCB7XHJcbiAgICBjb21tZW50U3RhcnRTdHJpbmcsIC8vICRGbG93Rml4TWU6IFRoaXMgaXMgYW4gdW5vZmZpY2lhbCBBUElcclxuICB9ID0gZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5jb21tZW50U3RyaW5nc0ZvclBvc2l0aW9uKFxyXG4gICAgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcclxuICApO1xyXG5cclxuICBpZiAoIWNvbW1lbnRTdGFydFN0cmluZykge1xyXG4gICAgbG9nKFwiQ2VsbE1hbmFnZXI6IE5vIGNvbW1lbnQgc3RyaW5nIGRlZmluZWQgaW4gcm9vdCBzY29wZVwiKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGNvbW1lbnRTdGFydFN0cmluZy50cmltUmlnaHQoKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVnZXhTdHJpbmcoZWRpdG9yOiBUZXh0RWRpdG9yKSB7XHJcbiAgY29uc3QgY29tbWVudFN0YXJ0U3RyaW5nID0gZ2V0Q29tbWVudFN0YXJ0U3RyaW5nKGVkaXRvcik7XHJcbiAgaWYgKCFjb21tZW50U3RhcnRTdHJpbmcpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBjb25zdCBlc2NhcGVkQ29tbWVudFN0YXJ0U3RyaW5nID0gZXNjYXBlU3RyaW5nUmVnZXhwKGNvbW1lbnRTdGFydFN0cmluZyk7XHJcbiAgY29uc3QgcmVnZXhTdHJpbmcgPSBgJHtlc2NhcGVkQ29tbWVudFN0YXJ0U3RyaW5nfSAqJSUgKihtZHxtYXJrZG93bik/fCAqPChjb2RlY2VsbHxtZHxtYXJrZG93bik+fCAqKEluXFxbWzAtOSBdKlxcXSlgO1xyXG4gIHJldHVybiByZWdleFN0cmluZztcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QnJlYWtwb2ludHMoZWRpdG9yOiBUZXh0RWRpdG9yKSB7XHJcbiAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gIGNvbnN0IGJyZWFrcG9pbnRzID0gW107XHJcbiAgY29uc3QgcmVnZXhTdHJpbmcgPSBnZXRSZWdleFN0cmluZyhlZGl0b3IpO1xyXG5cclxuICBpZiAocmVnZXhTdHJpbmcpIHtcclxuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFN0cmluZywgXCJnXCIpO1xyXG4gICAgYnVmZmVyLnNjYW4ocmVnZXgsICh7IHJhbmdlIH0pID0+IHtcclxuICAgICAgaWYgKGlzQ29tbWVudChlZGl0b3IsIHJhbmdlLnN0YXJ0KSkge1xyXG4gICAgICAgIGJyZWFrcG9pbnRzLnB1c2gocmFuZ2Uuc3RhcnQpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGJyZWFrcG9pbnRzLnB1c2goYnVmZmVyLmdldEVuZFBvc2l0aW9uKCkpO1xyXG4gIGxvZyhcIkNlbGxNYW5hZ2VyOiBCcmVha3BvaW50czpcIiwgYnJlYWtwb2ludHMpO1xyXG4gIHJldHVybiBicmVha3BvaW50cztcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q2VsbChlZGl0b3I6IFRleHRFZGl0b3IsIGFueVBvaW50SW5DZWxsPzogUG9pbnQpIHtcclxuICBpZiAoIWFueVBvaW50SW5DZWxsKSB7XHJcbiAgICBhbnlQb2ludEluQ2VsbCA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gIGFueVBvaW50SW5DZWxsID0gbmV3IFBvaW50KFxyXG4gICAgYW55UG9pbnRJbkNlbGwucm93LFxyXG4gICAgYnVmZmVyLmxpbmVMZW5ndGhGb3JSb3coYW55UG9pbnRJbkNlbGwucm93KVxyXG4gICk7XHJcbiAgbGV0IHN0YXJ0ID0gbmV3IFBvaW50KDAsIDApO1xyXG4gIGxldCBlbmQgPSBidWZmZXIuZ2V0RW5kUG9zaXRpb24oKTtcclxuICBjb25zdCByZWdleFN0cmluZyA9IGdldFJlZ2V4U3RyaW5nKGVkaXRvcik7XHJcblxyXG4gIGlmICghcmVnZXhTdHJpbmcpIHtcclxuICAgIHJldHVybiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcpO1xyXG5cclxuICBpZiAoYW55UG9pbnRJbkNlbGwucm93ID49IDApIHtcclxuICAgIGJ1ZmZlci5iYWNrd2FyZHNTY2FuSW5SYW5nZShcclxuICAgICAgcmVnZXgsXHJcbiAgICAgIG5ldyBSYW5nZShzdGFydCwgYW55UG9pbnRJbkNlbGwpLFxyXG4gICAgICAoeyByYW5nZSB9KSA9PiB7XHJcbiAgICAgICAgc3RhcnQgPSBuZXcgUG9pbnQocmFuZ2Uuc3RhcnQucm93ICsgMSwgMCk7XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBidWZmZXIuc2NhbkluUmFuZ2UocmVnZXgsIG5ldyBSYW5nZShhbnlQb2ludEluQ2VsbCwgZW5kKSwgKHsgcmFuZ2UgfSkgPT4ge1xyXG4gICAgZW5kID0gcmFuZ2Uuc3RhcnQ7XHJcbiAgfSk7XHJcbiAgbG9nKFxyXG4gICAgXCJDZWxsTWFuYWdlcjogQ2VsbCBbc3RhcnQsIGVuZF06XCIsXHJcbiAgICBbc3RhcnQsIGVuZF0sXHJcbiAgICBcImFueVBvaW50SW5DZWxsOlwiLFxyXG4gICAgYW55UG9pbnRJbkNlbGxcclxuICApO1xyXG4gIHJldHVybiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRW1iZWRkZWRDb2RlKFxyXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICByZWZlcmVuY2VTY29wZTogc3RyaW5nLFxyXG4gIHJvdzogbnVtYmVyXHJcbikge1xyXG4gIGNvbnN0IHNjb3BlcyA9IGVkaXRvclxyXG4gICAgLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKG5ldyBQb2ludChyb3csIDApKVxyXG4gICAgLmdldFNjb3Blc0FycmF5KCk7XHJcbiAgcmV0dXJuIF8uaW5jbHVkZXMoc2NvcGVzLCByZWZlcmVuY2VTY29wZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEN1cnJlbnRGZW5jZWRDb2RlQmxvY2soZWRpdG9yOiBUZXh0RWRpdG9yKSB7XHJcbiAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gIGNvbnN0IHsgcm93OiBidWZmZXJFbmRSb3cgfSA9IGJ1ZmZlci5nZXRFbmRQb3NpdGlvbigpO1xyXG4gIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xyXG4gIGxldCBzdGFydCA9IGN1cnNvci5yb3c7XHJcbiAgbGV0IGVuZCA9IGN1cnNvci5yb3c7XHJcbiAgY29uc3Qgc2NvcGUgPSBnZXRFbWJlZGRlZFNjb3BlKGVkaXRvciwgY3Vyc29yKTtcclxuICBpZiAoIXNjb3BlKSB7XHJcbiAgICByZXR1cm4gZ2V0Q2VsbChlZGl0b3IpO1xyXG4gIH1cclxuXHJcbiAgd2hpbGUgKHN0YXJ0ID4gMCAmJiBpc0VtYmVkZGVkQ29kZShlZGl0b3IsIHNjb3BlLCBzdGFydCAtIDEpKSB7XHJcbiAgICBzdGFydCAtPSAxO1xyXG4gIH1cclxuXHJcbiAgd2hpbGUgKGVuZCA8IGJ1ZmZlckVuZFJvdyAmJiBpc0VtYmVkZGVkQ29kZShlZGl0b3IsIHNjb3BlLCBlbmQgKyAxKSkge1xyXG4gICAgZW5kICs9IDE7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbmV3IFJhbmdlKFtzdGFydCwgMF0sIFtlbmQgKyAxLCAwXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50Q2VsbChlZGl0b3I6IFRleHRFZGl0b3IpIHtcclxuICBpZiAoaXNNdWx0aWxhbmd1YWdlR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgcmV0dXJuIGdldEN1cnJlbnRGZW5jZWRDb2RlQmxvY2soZWRpdG9yKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBnZXRDZWxsKGVkaXRvcik7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENlbGxzKGVkaXRvcjogVGV4dEVkaXRvciwgYnJlYWtwb2ludHM6IEFycmF5PFBvaW50PiA9IFtdKSB7XHJcbiAgaWYgKGJyZWFrcG9pbnRzLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgYnJlYWtwb2ludHMuc29ydCgoYSwgYikgPT4gYS5jb21wYXJlKGIpKTtcclxuICB9IGVsc2Uge1xyXG4gICAgYnJlYWtwb2ludHMgPSBnZXRCcmVha3BvaW50cyhlZGl0b3IpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGdldENlbGxzRm9yQnJlYWtQb2ludHMoZWRpdG9yLCBicmVha3BvaW50cyk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENlbGxzRm9yQnJlYWtQb2ludHMoXHJcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gIGJyZWFrcG9pbnRzOiBBcnJheTxQb2ludD5cclxuKTogQXJyYXk8UmFuZ2U+IHtcclxuICBsZXQgc3RhcnQgPSBuZXcgUG9pbnQoMCwgMCk7XHJcbiAgLy8gTGV0IHN0YXJ0IGJlIGVhcmxpZXN0IHJvdyB3aXRoIHRleHRcclxuICBlZGl0b3Iuc2NhbigvXFxTLywgKG1hdGNoKSA9PiB7XHJcbiAgICBzdGFydCA9IG5ldyBQb2ludChtYXRjaC5yYW5nZS5zdGFydC5yb3csIDApO1xyXG4gICAgbWF0Y2guc3RvcCgpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBfLmNvbXBhY3QoXHJcbiAgICBfLm1hcChicmVha3BvaW50cywgKGVuZCkgPT4ge1xyXG4gICAgICBjb25zdCBjZWxsID0gZW5kLmlzRXF1YWwoc3RhcnQpID8gbnVsbCA6IG5ldyBSYW5nZShzdGFydCwgZW5kKTtcclxuICAgICAgc3RhcnQgPSBuZXcgUG9pbnQoZW5kLnJvdyArIDEsIDApO1xyXG4gICAgICByZXR1cm4gY2VsbDtcclxuICAgIH0pXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2VudGVyU2NyZWVuT25DdXJzb3JQb3NpdGlvbihlZGl0b3I6IFRleHRFZGl0b3IpIHtcclxuICBjb25zdCBjdXJzb3JQb3NpdGlvbiA9IGVkaXRvci5lbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihcclxuICAgIGVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpXHJcbiAgKS50b3A7XHJcbiAgY29uc3QgZWRpdG9ySGVpZ2h0ID0gZWRpdG9yLmVsZW1lbnQuZ2V0SGVpZ2h0KCk7XHJcbiAgZWRpdG9yLmVsZW1lbnQuc2V0U2Nyb2xsVG9wKGN1cnNvclBvc2l0aW9uIC0gZWRpdG9ySGVpZ2h0IC8gMik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb3ZlRG93bihlZGl0b3I6IFRleHRFZGl0b3IsIHJvdzogbnVtYmVyKSB7XHJcbiAgY29uc3QgbGFzdFJvdyA9IGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KCk7XHJcblxyXG4gIGlmIChyb3cgPj0gbGFzdFJvdykge1xyXG4gICAgZWRpdG9yLm1vdmVUb0JvdHRvbSgpO1xyXG4gICAgZWRpdG9yLmluc2VydE5ld2xpbmUoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHdoaWxlIChyb3cgPCBsYXN0Um93KSB7XHJcbiAgICByb3cgKz0gMTtcclxuICAgIGlmICghaXNCbGFuayhlZGl0b3IsIHJvdykpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oe1xyXG4gICAgcm93LFxyXG4gICAgY29sdW1uOiAwLFxyXG4gIH0pO1xyXG4gIGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmNlbnRlck9uTW92ZURvd25cIikgJiZcclxuICAgIGNlbnRlclNjcmVlbk9uQ3Vyc29yUG9zaXRpb24oZWRpdG9yKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZmluZFByZWNlZGluZ0Jsb2NrKFxyXG4gIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICByb3c6IG51bWJlcixcclxuICBpbmRlbnRMZXZlbDogbnVtYmVyXHJcbikge1xyXG4gIGxldCBwcmV2aW91c1JvdyA9IHJvdyAtIDE7XHJcblxyXG4gIHdoaWxlIChwcmV2aW91c1JvdyA+PSAwKSB7XHJcbiAgICBjb25zdCBwcmV2aW91c0luZGVudExldmVsID0gZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHByZXZpb3VzUm93KTtcclxuICAgIGNvbnN0IHNhbWVJbmRlbnQgPSBwcmV2aW91c0luZGVudExldmVsIDw9IGluZGVudExldmVsO1xyXG4gICAgY29uc3QgYmxhbmsgPSBpc0JsYW5rKGVkaXRvciwgcHJldmlvdXNSb3cpO1xyXG4gICAgY29uc3QgaXNFbmQgPSBnZXRSb3coZWRpdG9yLCBwcmV2aW91c1JvdykgPT09IFwiZW5kXCI7XHJcblxyXG4gICAgaWYgKGlzQmxhbmsoZWRpdG9yLCByb3cpKSB7XHJcbiAgICAgIHJvdyA9IHByZXZpb3VzUm93O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzYW1lSW5kZW50ICYmICFibGFuayAmJiAhaXNFbmQpIHtcclxuICAgICAgY29uc3QgY2VsbCA9IGdldENlbGwoZWRpdG9yLCBuZXcgUG9pbnQocm93LCAwKSk7XHJcblxyXG4gICAgICBpZiAoY2VsbC5zdGFydC5yb3cgPiByb3cpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29kZTogXCJcIixcclxuICAgICAgICAgIHJvdyxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvZGU6IGdldFJvd3MoZWRpdG9yLCBwcmV2aW91c1Jvdywgcm93KSxcclxuICAgICAgICByb3csXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJldmlvdXNSb3cgLT0gMTtcclxuICB9XHJcblxyXG4gIHJldHVybiBudWxsO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29kZUJsb2NrKGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gIGNvbnN0IHNlbGVjdGVkVGV4dCA9IGdldFNlbGVjdGVkVGV4dChlZGl0b3IpO1xyXG5cclxuICBpZiAoc2VsZWN0ZWRUZXh0KSB7XHJcbiAgICBjb25zdCBzZWxlY3RlZFJhbmdlID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKTtcclxuICAgIGNvbnN0IGNlbGwgPSBnZXRDZWxsKGVkaXRvciwgc2VsZWN0ZWRSYW5nZS5lbmQpO1xyXG4gICAgY29uc3Qgc3RhcnRQb2ludCA9IGNlbGwuc3RhcnQuaXNHcmVhdGVyVGhhbihzZWxlY3RlZFJhbmdlLnN0YXJ0KVxyXG4gICAgICA/IGNlbGwuc3RhcnRcclxuICAgICAgOiBzZWxlY3RlZFJhbmdlLnN0YXJ0O1xyXG4gICAgbGV0IGVuZFJvdyA9IHNlbGVjdGVkUmFuZ2UuZW5kLnJvdztcclxuXHJcbiAgICBpZiAoc2VsZWN0ZWRSYW5nZS5lbmQuY29sdW1uID09PSAwKSB7XHJcbiAgICAgIGVuZFJvdyAtPSAxO1xyXG4gICAgfVxyXG5cclxuICAgIGVuZFJvdyA9IGVzY2FwZUJsYW5rUm93cyhlZGl0b3IsIHN0YXJ0UG9pbnQucm93LCBlbmRSb3cpO1xyXG5cclxuICAgIGlmIChzdGFydFBvaW50LmlzR3JlYXRlclRoYW5PckVxdWFsKHNlbGVjdGVkUmFuZ2UuZW5kKSkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvZGU6IFwiXCIsXHJcbiAgICAgICAgcm93OiBlbmRSb3csXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29kZTogZ2V0VGV4dEluUmFuZ2UoZWRpdG9yLCBzdGFydFBvaW50LCBzZWxlY3RlZFJhbmdlLmVuZCksXHJcbiAgICAgIHJvdzogZW5kUm93LFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XHJcbiAgY29uc3Qgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpO1xyXG4gIGxvZyhcImZpbmRDb2RlQmxvY2s6XCIsIHJvdyk7XHJcbiAgY29uc3QgaW5kZW50TGV2ZWwgPSBjdXJzb3IuZ2V0SW5kZW50TGV2ZWwoKTtcclxuICBsZXQgZm9sZGFibGUgPSBlZGl0b3IuaXNGb2xkYWJsZUF0QnVmZmVyUm93KHJvdyk7XHJcbiAgY29uc3QgZm9sZFJhbmdlID0gcm93UmFuZ2VGb3JDb2RlRm9sZEF0QnVmZmVyUm93KGVkaXRvciwgcm93KTtcclxuXHJcbiAgaWYgKCFmb2xkUmFuZ2UgfHwgZm9sZFJhbmdlWzBdID09IG51bGwgfHwgZm9sZFJhbmdlWzFdID09IG51bGwpIHtcclxuICAgIGZvbGRhYmxlID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBpZiAoZm9sZGFibGUpIHtcclxuICAgIHJldHVybiBnZXRGb2xkQ29udGVudHMoZWRpdG9yLCByb3cpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGlzQmxhbmsoZWRpdG9yLCByb3cpIHx8IGdldFJvdyhlZGl0b3IsIHJvdykgPT09IFwiZW5kXCIpIHtcclxuICAgIHJldHVybiBmaW5kUHJlY2VkaW5nQmxvY2soZWRpdG9yLCByb3csIGluZGVudExldmVsKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNlbGwgPSBnZXRDZWxsKGVkaXRvciwgbmV3IFBvaW50KHJvdywgMCkpO1xyXG5cclxuICBpZiAoY2VsbC5zdGFydC5yb3cgPiByb3cpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvZGU6IFwiXCIsXHJcbiAgICAgIHJvdyxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgY29kZTogZ2V0Um93KGVkaXRvciwgcm93KSxcclxuICAgIHJvdyxcclxuICB9O1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBmb2xkQ3VycmVudENlbGwoZWRpdG9yOiBUZXh0RWRpdG9yKSB7XHJcbiAgY29uc3QgY2VsbFJhbmdlID0gZ2V0Q3VycmVudENlbGwoZWRpdG9yKTtcclxuICBjb25zdCBuZXdSYW5nZSA9IGFkanVzdENlbGxGb2xkUmFuZ2UoZWRpdG9yLCBjZWxsUmFuZ2UpO1xyXG4gIGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKG5ld1JhbmdlKTtcclxuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpWzBdLmZvbGQoKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZm9sZEFsbEJ1dEN1cnJlbnRDZWxsKGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gIGNvbnN0IGluaXRpYWxTZWxlY3Rpb25zID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKCk7XHJcbiAgLy8gSSB0YWtlIC5zbGljZSgxKSBiZWNhdXNlIHRoZXJlJ3MgYWx3YXlzIGFuIGVtcHR5IGNlbGwgcmFuZ2UgZnJvbSBbMCwwXSB0b1xyXG4gIC8vIFswLDBdXHJcbiAgY29uc3QgYWxsQ2VsbFJhbmdlcyA9IGdldENlbGxzKGVkaXRvcikuc2xpY2UoMSk7XHJcbiAgY29uc3QgY3VycmVudENlbGxSYW5nZSA9IGdldEN1cnJlbnRDZWxsKGVkaXRvcik7XHJcbiAgY29uc3QgbmV3UmFuZ2VzID0gYWxsQ2VsbFJhbmdlc1xyXG4gICAgLmZpbHRlcigoY2VsbFJhbmdlKSA9PiAhY2VsbFJhbmdlLmlzRXF1YWwoY3VycmVudENlbGxSYW5nZSkpXHJcbiAgICAubWFwKChjZWxsUmFuZ2UpID0+IGFkanVzdENlbGxGb2xkUmFuZ2UoZWRpdG9yLCBjZWxsUmFuZ2UpKTtcclxuICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMobmV3UmFuZ2VzKTtcclxuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmZvckVhY2goKHNlbGVjdGlvbikgPT4gc2VsZWN0aW9uLmZvbGQoKSk7XHJcbiAgLy8gUmVzdG9yZSBzZWxlY3Rpb25zXHJcbiAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKGluaXRpYWxTZWxlY3Rpb25zKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWRqdXN0Q2VsbEZvbGRSYW5nZShlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSkge1xyXG4gIGNvbnN0IHN0YXJ0Um93ID0gcmFuZ2Uuc3RhcnQucm93ID4gMCA/IHJhbmdlLnN0YXJ0LnJvdyAtIDEgOiAwO1xyXG4gIGNvbnN0IHN0YXJ0V2lkdGggPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coc3RhcnRSb3cpLmxlbmd0aDtcclxuICBjb25zdCBlbmRSb3cgPVxyXG4gICAgcmFuZ2UuZW5kLnJvdyA9PSBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXHJcbiAgICAgID8gcmFuZ2UuZW5kLnJvd1xyXG4gICAgICA6IHJhbmdlLmVuZC5yb3cgLSAxO1xyXG4gIGNvbnN0IGVuZFdpZHRoID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGVuZFJvdykubGVuZ3RoO1xyXG4gIHJldHVybiBuZXcgUmFuZ2UoXHJcbiAgICBuZXcgUG9pbnQoc3RhcnRSb3csIHN0YXJ0V2lkdGgpLFxyXG4gICAgbmV3IFBvaW50KGVuZFJvdywgZW5kV2lkdGgpXHJcbiAgKTtcclxufVxyXG4iXX0=