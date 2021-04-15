import { TextEditor, Panel } from "atom";
declare type opts = {
    prompt: string;
    defaultText?: string;
    allowCancel?: boolean;
    password?: boolean;
};
declare type cb = (s: string) => void;
export default class InputView {
    onConfirmed: cb;
    element: HTMLElement;
    miniEditor: TextEditor;
    panel: Panel | null | undefined;
    previouslyFocusedElement: HTMLElement | null | undefined;
    constructor({ prompt, defaultText, allowCancel, password }: opts, onConfirmed: cb);
    confirm(): void;
    close(): void;
    attach(): void;
}
export {};
