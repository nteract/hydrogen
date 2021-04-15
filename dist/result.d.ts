import { TextEditor } from "atom";
import type MarkerStore from "./store/markers";
import type Kernel from "./kernel";
import type { HydrogenCellType } from "./hydrogen";
export declare function createResult({ editor, kernel, markers, }: Readonly<{
    editor: TextEditor | null | undefined;
    kernel: Kernel | null | undefined;
    markers: MarkerStore | null | undefined;
}>, { code, row, cellType, }: {
    code: string;
    row: number;
    cellType: HydrogenCellType;
}): void;
export declare function importResult({ editor, markers, }: {
    editor: TextEditor | null | undefined;
    markers: MarkerStore | null | undefined;
}, { outputs, row, }: {
    outputs: Array<Record<string, any>>;
    row: number;
}): void;
export declare function clearResult({ editor, markers, }: Readonly<{
    editor: TextEditor | null | undefined;
    markers: MarkerStore | null | undefined;
}>): void;
export declare function clearResults({ kernel, markers, }: Readonly<{
    kernel: Kernel | null | undefined;
    markers: MarkerStore | null | undefined;
}>): void;
export declare function convertMarkdownToOutput(markdownString: string): {
    output_type: string;
    data: {
        "text/markdown": string;
    };
    metadata: {};
};
