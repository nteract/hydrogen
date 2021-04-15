import { TextEditor, Grammar } from "atom";
import Kernel from "./kernel";
import KernelPicker from "./kernel-picker";
import type { KernelspecMetadata } from "@nteract/types";
export declare class KernelManager {
    kernelSpecs: Array<KernelspecMetadata> | null | undefined;
    kernelPicker: KernelPicker | null | undefined;
    startKernelFor(grammar: Grammar, editor: TextEditor, filePath: string, onStarted: (kernel: Kernel) => void): void;
    startKernel(kernelSpec: KernelspecMetadata, grammar: Grammar, editor: TextEditor, filePath: string, onStarted?: ((kernel: Kernel) => void) | null | undefined): void;
    update(): Promise<KernelspecMetadata[]>;
    getAllKernelSpecs(grammar: Grammar | null | undefined): Promise<KernelspecMetadata[]>;
    getAllKernelSpecsForGrammar(grammar: Grammar | null | undefined): Promise<KernelspecMetadata[]>;
    getKernelSpecForGrammar(grammar: Grammar): Promise<KernelspecMetadata>;
    updateKernelSpecs(grammar: Grammar | null | undefined): Promise<KernelspecMetadata[]>;
}
declare const _default: KernelManager;
export default _default;
