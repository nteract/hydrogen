import Kernel from "./kernel";
export type HydrogenCellType = "codecell" | "markdown";
export type Kernelspec = {
  env: Record<string, any>;
  argv: Array<string>;
  display_name: string;
  language: string;
};
// Be more specific
export type Message = {
  header: Record<string, any>;
  parent_header: Record<string, any>;
  content: Record<string, any>;
};
// We can't put it in store/index.js because Atom's babel version doesn't support this syntax
export type KernelObj = Record<string, Kernel>;
export type KernelMapping = Map<string, Kernel | KernelObj>;
