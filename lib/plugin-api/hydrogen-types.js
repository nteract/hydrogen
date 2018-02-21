/* @flow */
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
  +interrupt: () => void;
  +shutdown: () => void;
  +restart: (onRestarted: ?Function) => void;
  +execute: (code: string, onResults: HydrogenResultsCallback) => void;
  +complete: (code: string, onResults: HydrogenResultsCallback) => void;
  +inspect: (
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}

export interface HydrogenKernelMiddleware {
  +interrupt?: (next: HydrogenKernelMiddlewareThunk) => void;
  +shutdown?: (next: HydrogenKernelMiddlewareThunk) => void;
  +restart?: (
    next: HydrogenKernelMiddlewareThunk,
    onRestarted: ?Function
  ) => void;
  +execute?: (
    next: HydrogenKernelMiddlewareThunk,
    code: string,
    onResults: HydrogenResultsCallback
  ) => void;
  +complete?: (
    next: HydrogenKernelMiddlewareThunk,
    code: string,
    onResults: HydrogenResultsCallback
  ) => void;
  +inspect?: (
    next: HydrogenKernelMiddlewareThunk,
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}
