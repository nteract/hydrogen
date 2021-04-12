import { KernelspecMetadata } from "@nteract/types"

export interface KernelResources {
  /** name of the kernel */
  name: string

  files: string[]

  /** kernel's resources directory */
  resourceDir: string

  spec: KernelspecMetadata
}

export type KernelResourcesRecord =  Record<KernelResources["name"], KernelResources>

/** description of a kernel */
export interface KernelInfo {
  /** name of the kernel */
  name: string

  /** kernel's resources directory */
  resourceDir: string
}

/**
 * Get a kernel resources object
 * @param  {Object}   kernelInfo              description of a kernel
 * @param  {string}   kernelInfo.name         name of the kernel
 * @param  {string}   kernelInfo.resourceDir  kernel's resources directory
 * @return {Promise<KernelResources>}                  Promise for a kernelResources object
 */
export declare function getKernelResources(kernelInfo: KernelInfo): Promise<KernelResources>

/**
 * Gets a list of kernelInfo objects for a given directory of kernels
 * @param  {string}   directory path to a directory full of kernels
 * @return {Promise<KernelInfo[]>}  Promise for an array of kernelInfo objects
 */
export declare function getKernelInfos(directory: string): Promise<KernelInfo[]>


/**
 * find a kernel by name
 * @param  {string} kernelName the kernel to locate
 * @return {Promise<KernelResources>} a promise for the kernelResource object
 */
export declare function find(kernelName: string): Promise<KernelResources>

declare function extractKernelResources(kernelInfos: Array<KernelInfo>): Promise<KernelResourcesRecord>


/**
 * Get a record of kernelResources objects for the host environment
 * This matches the Jupyter notebook API for kernelspecs exactly
 * @return {Promise<KernelResourcesRecord>} Promise for a record of {KernelResources} objects that are indexable by their name
 */
export declare function findAll(): Promise<KernelResourcesRecord>
