import { Emitter, TextEditor, Grammar } from "atom";
import WatchesStore from "./store/watches";
import OutputStore from "./store/output";
import HydrogenKernel from "./plugin-api/hydrogen-kernel";
import type { HydrogenKernelMiddlewareThunk, HydrogenKernelMiddleware } from "./plugin-api/hydrogen-types";
import KernelTransport from "./kernel-transport";
import type { ResultsCallback } from "./kernel-transport";
import type { Message } from "./hydrogen";
import type { KernelspecMetadata } from "@nteract/types";
declare class MiddlewareAdapter implements HydrogenKernelMiddlewareThunk {
    _middleware: HydrogenKernelMiddleware;
    _next: MiddlewareAdapter | KernelTransport;
    constructor(middleware: HydrogenKernelMiddleware, next: MiddlewareAdapter | KernelTransport);
    get _nextAsPluginType(): HydrogenKernelMiddlewareThunk;
    interrupt(): void;
    shutdown(): void;
    restart(onRestarted: ((...args: Array<any>) => any) | null | undefined): void;
    execute(code: string, onResults: ResultsCallback): void;
    complete(code: string, onResults: ResultsCallback): void;
    inspect(code: string, cursorPos: number, onResults: ResultsCallback): void;
}
export default class Kernel {
    inspector: {
        bundle: {};
    };
    outputStore: OutputStore;
    watchesStore: WatchesStore;
    watchCallbacks: Array<(...args: Array<any>) => any>;
    emitter: Emitter<{
        [key: string]: any;
    }, {}>;
    pluginWrapper: HydrogenKernel | null;
    transport: KernelTransport;
    middleware: Array<MiddlewareAdapter>;
    constructor(kernel: KernelTransport);
    get kernelSpec(): KernelspecMetadata;
    get grammar(): Grammar;
    get language(): string;
    get displayName(): string;
    get firstMiddlewareAdapter(): MiddlewareAdapter;
    addMiddleware(middleware: HydrogenKernelMiddleware): void;
    get executionState(): string;
    setExecutionState(state: string): void;
    get executionCount(): number;
    setExecutionCount(count: number): void;
    get lastExecutionTime(): string;
    setLastExecutionTime(timeString: string): void;
    setInspectorResult(bundle: Record<string, any>, editor: TextEditor | null | undefined): Promise<void>;
    getPluginWrapper(): HydrogenKernel;
    addWatchCallback(watchCallback: (...args: Array<any>) => any): void;
    interrupt(): void;
    shutdown(): void;
    restart(onRestarted: ((...args: Array<any>) => any) | null | undefined): void;
    execute(code: string, onResults: (...args: Array<any>) => any): void;
    executeWatch(code: string, onResults: (...args: Array<any>) => any): void;
    _callWatchCallbacks(): void;
    _wrapExecutionResultsCallback(onResults: (...args: Array<any>) => any): (message: Message, channel: string) => void;
    complete(code: string, onResults: (...args: Array<any>) => any): void;
    inspect(code: string, cursorPos: number, onResults: (...args: Array<any>) => any): void;
    destroy(): void;
}
export {};
