declare const _default: {
    consumed: {
        statusBar: import("./consumed/status-bar/status-bar").StatusBarConsumer;
        autocomplete: import("./consumed/autocomplete").AutocompleteWatchEditor;
    };
    provided: {
        autocomplete: typeof import("./provided/autocomplete");
    };
};
export default _default;
