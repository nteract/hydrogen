import { Panel } from "atom";
import SelectListView from "atom-select-list";
import { Kernel, Session, ServerConnection } from "@jupyterlab/services";
import WSKernel from "./ws-kernel";
import type { KernelspecMetadata } from "@nteract/types";
import { DeepWriteable } from "./utils";
declare type SelectListItem = any;
export declare type KernelGatewayOptions = Parameters<typeof ServerConnection["makeSettings"]>[0];
export declare type MinimalServerConnectionSettings = Pick<KernelGatewayOptions, "baseUrl">;
export interface KernelGateway {
    name: string;
    options: KernelGatewayOptions;
}
export interface SessionInfoWithModel {
    model: Kernel.IModel;
    options: Parameters<typeof Session.connectTo>[1];
}
export interface SessionInfoWithoutModel {
    name?: string;
    kernelSpecs: Kernel.ISpecModel[];
    options: Parameters<typeof Session.startNew>[0];
    model?: never | null | undefined;
}
declare class CustomListView {
    onConfirmed: (item: SelectListItem) => void | null | undefined;
    onCancelled: () => void | null | undefined;
    previouslyFocusedElement: HTMLElement | null | undefined;
    selectListView: SelectListView;
    panel: Panel | null | undefined;
    constructor();
    show(): void;
    destroy(): any;
    cancel(): void;
}
export default class WSKernelPicker {
    _onChosen: (kernel: WSKernel) => void;
    _kernelSpecFilter: (kernelSpec: Kernel.ISpecModel) => boolean;
    _path: string;
    listView: CustomListView;
    constructor(onChosen: (kernel: WSKernel) => void);
    toggle(_kernelSpecFilter: (kernelSpec: Kernel.ISpecModel | KernelspecMetadata) => boolean): Promise<void>;
    promptForText(prompt: string): Promise<any>;
    promptForCookie(options: DeepWriteable<KernelGatewayOptions>): Promise<boolean>;
    promptForToken(options: DeepWriteable<KernelGatewayOptions>): Promise<boolean>;
    promptForCredentials(options: DeepWriteable<KernelGatewayOptions>): Promise<boolean>;
    onGateway(gatewayInfo: KernelGateway): Promise<void>;
    onSession(gatewayName: string, sessionInfo: SessionInfoWithModel | SessionInfoWithoutModel): Promise<void>;
    onSessionWithModel(gatewayName: string, sessionInfo: SessionInfoWithModel): Promise<void>;
    onSessionWitouthModel(gatewayName: string, sessionInfo: SessionInfoWithoutModel): Promise<void>;
    startSession(gatewayName: string, sessionInfo: SessionInfoWithoutModel): void;
    onSessionChosen(gatewayName: string, session: Session.ISession): Promise<void>;
}
export {};
