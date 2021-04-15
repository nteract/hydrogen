import { Disposable } from "atom";
import { StatusBar } from "atom/status-bar";
import HydrogenProvider from "./plugin-api/hydrogen-provider";
export declare const config: {
    autocomplete: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    autocompleteSuggestionPriority: {
        title: string;
        description: string;
        type: string;
        default: number;
        order: number;
    };
    showInspectorResultsInAutocomplete: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    importNotebookURI: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    importNotebookResults: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    statusBarDisable: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    statusBarKernelInfo: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    debug: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    autoScroll: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    centerOnMoveDown: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    wrapOutput: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    outputAreaDefault: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    outputAreaDock: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    outputAreaFontSize: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        minimum: number;
        default: number;
        order: number;
    };
    globalMode: {
        title: string;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    kernelNotifications: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: boolean;
        order: number;
    };
    startDir: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        enum: {
            value: string;
            description: string;
        }[];
        default: string;
        order: number;
    };
    languageMappings: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: string;
        order: number;
    };
    startupCode: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: string;
        order: number;
    };
    gateways: {
        title: string;
        includeTitle: boolean;
        description: string;
        type: string;
        default: string;
        order: number;
    };
};
export declare function activate(): void;
export declare function deactivate(): void;
export declare function provideHydrogen(): HydrogenProvider;
export declare function provideAutocompleteResults(): import("atom/autocomplete-plus").AutocompleteProvider;
export declare function consumeAutocompleteWatchEditor(watchEditor: (...args: Array<any>) => any): Disposable;
export declare function consumeStatusBar(statusBar: StatusBar): Disposable;
