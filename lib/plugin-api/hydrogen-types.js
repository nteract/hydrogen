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

export interface HydrogenKernelMiddlewareStack {
  +interrupt: () => void;
  +shutdown: () => void;
  +restart: (onRestarted: ?Function) => void;
  +execute: (
    code: string,
    callWatches: boolean,
    onResults: HydrogenResultsCallback
  ) => void;
  +complete: (code: string, onResults: HydrogenResultsCallback) => void;
  +inspect: (
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}

export interface HydrogenKernelMiddleware {
  +interrupt?: (next: HydrogenKernelMiddlewareStack) => void;
  +shutdown?: (next: HydrogenKernelMiddlewareStack) => void;
  +restart?: (
    next: HydrogenKernelMiddlewareStack,
    onRestarted: ?Function
  ) => void;
  +execute?: (
    next: HydrogenKernelMiddlewareStack,
    code: string,
    callWatches: boolean,
    onResults: HydrogenResultsCallback
  ) => void;
  +complete?: (
    next: HydrogenKernelMiddlewareStack,
    code: string,
    onResults: HydrogenResultsCallback
  ) => void;
  +inspect?: (
    next: HydrogenKernelMiddlewareStack,
    code: string,
    cursorPos: number,
    onResults: HydrogenResultsCallback
  ) => void;
}
