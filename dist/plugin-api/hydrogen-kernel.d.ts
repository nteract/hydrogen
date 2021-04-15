import type Kernel from "../kernel";
import type { HydrogenKernelMiddleware } from "./hydrogen-types";
export default class HydrogenKernel {
    _kernel: Kernel;
    destroyed: boolean;
    constructor(_kernel: Kernel);
    _assertNotDestroyed(): void;
    get language(): string;
    get displayName(): string;
    addMiddleware(middleware: HydrogenKernelMiddleware): void;
    onDidDestroy(callback: (...args: Array<any>) => any): void;
    getConnectionFile(): any;
}
