import { Grammar } from "atom";
import KernelTransport from "./kernel-transport";
import type { ResultsCallback } from "./kernel-transport";
import type { Session } from "@jupyterlab/services";
import type { KernelspecMetadata } from "@nteract/types";
export default class WSKernel extends KernelTransport {
    session: Session.ISession;
    constructor(gatewayName: string, kernelSpec: KernelspecMetadata, grammar: Grammar, session: Session.ISession);
    interrupt(): void;
    shutdown(): Promise<void>;
    restart(onRestarted: ((...args: Array<any>) => any) | null | undefined): void;
    execute(code: string, onResults: ResultsCallback): void;
    complete(code: string, onResults: ResultsCallback): void;
    inspect(code: string, cursorPos: number, onResults: ResultsCallback): void;
    inputReply(input: string): void;
    promptRename(): void;
    destroy(): void;
}
