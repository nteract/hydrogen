import { Panel } from "atom";
import SelectListView from "atom-select-list";
import type { KernelspecMetadata } from "@nteract/types";
export default class KernelPicker {
    kernelSpecs: Array<KernelspecMetadata>;
    onConfirmed: ((kernelSpecs: KernelspecMetadata) => void) | null | undefined;
    selectListView: SelectListView;
    panel: Panel | null | undefined;
    previouslyFocusedElement: HTMLElement | null | undefined;
    constructor(kernelSpecs: Array<KernelspecMetadata>);
    destroy(): any;
    cancel(): void;
    attach(): void;
    toggle(): Promise<void>;
}
