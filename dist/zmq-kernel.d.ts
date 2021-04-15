/// <reference types="node" />
import { Grammar } from "atom";
import { ChildProcess } from "child_process";
import { Message, Socket } from "@aminya/jmp";
import KernelTransport from "./kernel-transport";
import type { ResultsCallback } from "./kernel-transport";
import type { KernelspecMetadata } from "@nteract/types";
export declare type Connection = {
    control_port: number;
    hb_port: number;
    iopub_port: number;
    ip: string;
    key: string;
    shell_port: number;
    signature_scheme: string;
    stdin_port: number;
    transport: string;
    version: number;
};
export default class ZMQKernel extends KernelTransport {
    executionCallbacks: Record<string, any>;
    connection: Connection;
    connectionFile: string;
    kernelProcess: ChildProcess;
    options: Record<string, any>;
    shellSocket: Socket;
    stdinSocket: Socket;
    ioSocket: Socket;
    constructor(kernelSpec: KernelspecMetadata, grammar: Grammar, options: Record<string, any>, onStarted: ((...args: Array<any>) => any) | null | undefined);
    connect(done: ((...args: Array<any>) => any) | null | undefined): void;
    monitorNotifications(childProcess: ChildProcess): void;
    monitor(done: ((...args: Array<any>) => any) | null | undefined): void;
    interrupt(): void;
    _kill(): void;
    _executeStartupCode(): void;
    shutdown(): void;
    restart(onRestarted: ((...args: Array<any>) => any) | null | undefined): void;
    _socketShutdown(restart?: boolean | null | undefined): void;
    _socketRestart(onRestarted: ((...args: Array<any>) => any) | null | undefined): void;
    execute(code: string, onResults: ResultsCallback): void;
    complete(code: string, onResults: ResultsCallback): void;
    inspect(code: string, cursorPos: number, onResults: ResultsCallback): void;
    inputReply(input: string): void;
    onShellMessage(message: Message): void;
    onStdinMessage(message: Message): void;
    onIOMessage(message: Message): void;
    _isValidMessage(message: Message): boolean;
    destroy(): void;
    _getUsername(): string;
    _createMessage(msgType: string, msgId?: string): {
        header: {
            username: string;
            session: string;
            msg_type: string;
            msg_id: string;
            date: Date;
            version: string;
        };
        metadata: {};
        parent_header: {};
        content: {};
    };
}
