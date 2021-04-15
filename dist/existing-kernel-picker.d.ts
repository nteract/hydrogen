import { Panel } from "atom";
import SelectListView from "atom-select-list";
import type { KernelspecMetadata } from "@nteract/types";
export default class ExistingKernelPicker {
    kernelSpecs: Array<KernelspecMetadata>;
    selectListView: SelectListView;
    panel: Panel | null | undefined;
    previouslyFocusedElement: HTMLElement | null | undefined;
    constructor();
    destroy(): any;
    cancel(): void;
    attach(): void;
    toggle(): Promise<void>;
}
