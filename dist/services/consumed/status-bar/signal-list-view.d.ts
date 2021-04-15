import { Panel } from "atom";
import SelectListView from "atom-select-list";
import type { Store } from "../../../store";
export default class SignalListView {
    panel: Panel | null | undefined;
    previouslyFocusedElement: HTMLElement | null | undefined;
    selectListView: SelectListView;
    store: Store | null | undefined;
    handleKernelCommand: ((...args: Array<any>) => any) | null | undefined;
    constructor(store: Store, handleKernelCommand: (...args: Array<any>) => any);
    onConfirmed(kernelCommand: {
        command: string;
    }): void;
    toggle(): Promise<void>;
    attach(): void;
    destroy(): any;
    cancel(): void;
}
