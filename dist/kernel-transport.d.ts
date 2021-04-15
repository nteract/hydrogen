import { Grammar } from "atom";
import type { KernelspecMetadata } from "@nteract/types";
export declare type ResultsCallback = (message: any, channel: "shell" | "iopub" | "stdin") => void;
export default class KernelTransport {
    executionState: string;
    executionCount: number;
    lastExecutionTime: string;
    inspector: {
        bundle: {};
    };
    kernelSpec: KernelspecMetadata;
    grammar: Grammar;
    language: string;
    displayName: string;
    gatewayName: string | null | undefined;
    constructor(kernelSpec: KernelspecMetadata, grammar: Grammar);
    setExecutionState(state: string): void;
    setExecutionCount(count: number): void;
    setLastExecutionTime(timeString: string): void;
    interrupt(): void;
    shutdown(): void;
    restart(onRestarted: ((...args: Array<any>) => any) | null | undefined): void;
    execute(code: string, onResults: ResultsCallback): void;
    complete(code: string, onResults: ResultsCallback): void;
    inspect(code: string, cursorPos: number, onResults: ResultsCallback): void;
    inputReply(input: string): void;
    destroy(): void;
}
