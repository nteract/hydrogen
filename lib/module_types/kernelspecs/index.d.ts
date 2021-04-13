import { KernelspecMetadata } from "@nteract/types";

export interface KernelResources {
  /** Name of the kernel */
  name: string;

  files: string[];

  /** Kernel's resources directory */
  resourceDir: string;

  spec: KernelspecMetadata;
}

export type KernelResourcesRecord = Record<
  KernelResources["name"],
  KernelResources
>;

/** Description of a kernel */
export interface KernelInfo {
  /** Name of the kernel */
  name: string;

  /** Kernel's resources directory */
  resourceDir: string;
}

/**
 * Get a kernel resources object
 *
 * @param {Object} kernelInfo Description of a kernel
 * @param {string} kernelInfo.name Name of the kernel
 * @param {string} kernelInfo.resourceDir Kernel's resources directory
 * @returns {Promise<KernelResources>} Promise for a kernelResources object
 */
export declare function getKernelResources(
  kernelInfo: KernelInfo
): Promise<KernelResources>;

/**
 * Gets a list of kernelInfo objects for a given directory of kernels
 *
 * @param {string} directory Path to a directory full of kernels
 * @returns {Promise<KernelInfo[]>} Promise for an array of kernelInfo objects
 */
export declare function getKernelInfos(
  directory: string
): Promise<KernelInfo[]>;

/**
 * Find a kernel by name
 *
 * @param {string} kernelName The kernel to locate
 * @returns {Promise<KernelResources>} A promise for the kernelResource object
 */
export declare function find(kernelName: string): Promise<KernelResources>;

declare function extractKernelResources(
  kernelInfos: Array<KernelInfo>
): Promise<KernelResourcesRecord>;

/**
 * Get a record of kernelResources objects for the host environment This matches
 * the Jupyter notebook API for kernelspecs exactly
 *
 * @returns {Promise<KernelResourcesRecord>} Promise for a record of
 *   {KernelResources} objects that are indexable by their name
 */
export declare function findAll(): Promise<KernelResourcesRecord>;
