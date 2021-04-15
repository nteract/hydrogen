export declare type HydrogenResultsCallback = (message: any, channel: "shell" | "iopub" | "stdin") => void;
export interface HydrogenKernelMiddlewareThunk {
    readonly interrupt: () => void;
    readonly shutdown: () => void;
    readonly restart: (onRestarted: ((...args: Array<any>) => any) | null | undefined) => void;
    readonly execute: (code: string, onResults: HydrogenResultsCallback) => void;
    readonly complete: (code: string, onResults: HydrogenResultsCallback) => void;
    readonly inspect: (code: string, cursorPos: number, onResults: HydrogenResultsCallback) => void;
}
export interface HydrogenKernelMiddleware {
    readonly interrupt?: (next: HydrogenKernelMiddlewareThunk) => void;
    readonly shutdown?: (next: HydrogenKernelMiddlewareThunk) => void;
    readonly restart?: (next: HydrogenKernelMiddlewareThunk, onRestarted: ((...args: Array<any>) => any) | null | undefined) => void;
    readonly execute?: (next: HydrogenKernelMiddlewareThunk, code: string, onResults: HydrogenResultsCallback) => void;
    readonly complete?: (next: HydrogenKernelMiddlewareThunk, code: string, onResults: HydrogenResultsCallback) => void;
    readonly inspect?: (next: HydrogenKernelMiddlewareThunk, code: string, cursorPos: number, onResults: HydrogenResultsCallback) => void;
}
