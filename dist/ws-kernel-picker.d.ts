import { Panel } from "atom";
import SelectListView from "atom-select-list";
import { Kernel } from "@jupyterlab/services";
import WSKernel from "./ws-kernel";
declare class CustomListView {
    onConfirmed: ((...args: Array<any>) => any) | null | undefined;
    onCancelled: ((...args: Array<any>) => any) | null | undefined;
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
    toggle(_kernelSpecFilter: (kernelSpec: Kernel.ISpecModel) => boolean): Promise<void>;
    promptForText(prompt: string): Promise<any>;
    promptForCookie(options: any): Promise<boolean>;
    promptForToken(options: any): Promise<boolean>;
    promptForCredentials(options: any): Promise<boolean>;
    onGateway(gatewayInfo: any): Promise<void>;
    onSession(gatewayName: string, sessionInfo: any): Promise<void>;
    startSession(gatewayName: string, sessionInfo: any): void;
    onSessionChosen(gatewayName: string, session: any): Promise<void>;
}
export {};
