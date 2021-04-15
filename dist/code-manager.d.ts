import { Point, Range, TextEditor } from "atom";
import type { HydrogenCellType } from "./hydrogen";
export declare function normalizeString(code: string | null | undefined): string;
export declare function getRow(editor: TextEditor, row: number): string;
export declare function getTextInRange(editor: TextEditor, start: Point, end: Point): string;
export declare function getRows(editor: TextEditor, startRow: number, endRow: number): string;
export declare function getMetadataForRow(editor: TextEditor, anyPointInCell: Point): HydrogenCellType;
export declare function removeCommentsMarkdownCell(editor: TextEditor, text: string): string;
export declare function getSelectedText(editor: TextEditor): string;
export declare function isComment(editor: TextEditor, position: Point): boolean;
export declare function isBlank(editor: TextEditor, row: number): boolean;
export declare function escapeBlankRows(editor: TextEditor, startRow: number, endRow: number): number;
export declare function getFoldRange(editor: TextEditor, row: number): any;
export declare function getFoldContents(editor: TextEditor, row: number): {
    code: string;
    row: any;
};
export declare function getCodeToInspect(editor: TextEditor): any[];
export declare function getCommentStartString(editor: TextEditor): string | null | undefined;
export declare function getRegexString(editor: TextEditor): string;
export declare function getBreakpoints(editor: TextEditor): any[];
export declare function getCurrentCell(editor: TextEditor): Range;
export declare function getCells(editor: TextEditor, breakpoints?: Array<Point>): Range[];
export declare function getCellsForBreakPoints(editor: TextEditor, breakpoints: Array<Point>): Array<Range>;
export declare function moveDown(editor: TextEditor, row: number): void;
export declare function findPrecedingBlock(editor: TextEditor, row: number, indentLevel: number): {
    code: string;
    row: number;
};
export declare function findCodeBlock(editor: TextEditor): {
    code: string;
    row: any;
};
export declare function foldCurrentCell(editor: TextEditor): void;
export declare function foldAllButCurrentCell(editor: TextEditor): void;
