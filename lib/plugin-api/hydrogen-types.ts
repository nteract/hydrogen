// These type definitions live in their own file because Atom can't parse the
// syntax used here. Note that these types do not depend on anything internal
// to Hydrogen, which should allow the typechecker to notice if any internal
// changes are not accompanied by appropriate compatibility changes to the
// plugin wrappers.
export type HydrogenResultsCallback = (
  message: any,
  channel: "shell" | "iopub" | "stdin"
) => void;
// Like HydrogenKernelMiddleware, but doesn't require passing a `next` argument.
// Hydrogen is responsible for creating these and ensuring that they delegate to
// the next middleware in the chain (or to the kernel, if there is no more
// middleware to call)
export interface HydrogenKernelMiddlewareThunk {
  readonly interrupt: () => void;
  readonly shutdown: () => void;
  readonly restart: (
    onRestarted: ((...args: Array<any>) => any) | null | undefined
  ) => void;
  readonly execute: (code: string, onResults: HydrogenResultsCallback) => void;
  readonly complete: (code: string, onResults: HydrogenResultsCallback) => void;
  readonly inspect: (
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}
export interface HydrogenKernelMiddleware {
  readonly interrupt?: (next: HydrogenKernelMiddlewareThunk) => void;
  readonly shutdown?: (next: HydrogenKernelMiddlewareThunk) => void;
  readonly restart?: (
    next: HydrogenKernelMiddlewareThunk,
    onRestarted: ((...args: Array<any>) => any) | null | undefined
  ) => void;
  readonly execute?: (
    next: HydrogenKernelMiddlewareThunk,
    code: string,
    onResults: HydrogenResultsCallback
  ) => void;
  readonly complete?: (
    next: HydrogenKernelMiddlewareThunk,
    code: string,
    onResults: HydrogenResultsCallback
  ) => void;
  readonly inspect?: (
    next: HydrogenKernelMiddlewareThunk,
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}
