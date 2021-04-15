import { CompositeDisposable } from "atom";
declare type store = typeof import("../store").default;
export default class KernelMonitorPane {
    element: HTMLDivElement;
    disposer: CompositeDisposable;
    constructor(store: store);
    getTitle: () => string;
    getURI: () => string;
    getDefaultLocation: () => string;
    getAllowedLocations: () => string[];
    destroy(): void;
}
export {};
