export declare function reduceOutputs(outputs: Array<Record<string, any>>, output: Record<string, any>): Array<Record<string, any>>;
export declare function isSingleLine(text: string | null | undefined, availableSpace: number): boolean;
export default class OutputStore {
    outputs: Array<Record<string, any>>;
    status: string;
    executionCount: number | null | undefined;
    index: number;
    position: {
        lineHeight: number;
        lineLength: number;
        editorWidth: number;
        charWidth: number;
    };
    get isPlain(): boolean;
    appendOutput(message: Record<string, any>): void;
    updatePosition(position: {
        lineHeight?: number;
        lineLength?: number;
        editorWidth?: number;
    }): void;
    setIndex: (index: number) => void;
    incrementIndex: () => void;
    decrementIndex: () => void;
    clear: () => void;
}
