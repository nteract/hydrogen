import { CompositeDisposable } from "atom";
import React from "react";
import type OutputStore from "../../store/output";
import type Kernel from "../../kernel";
declare type Props = {
    store: OutputStore;
    kernel: Kernel | null | undefined;
    destroy: (...args: Array<any>) => any;
    showResult: boolean;
};
declare class ResultViewComponent extends React.Component<Props> {
    el: HTMLElement | null | undefined;
    containerTooltip: CompositeDisposable;
    buttonTooltip: CompositeDisposable;
    closeTooltip: CompositeDisposable;
    expanded: boolean;
    getAllText: () => string;
    handleClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    checkForSelection: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    copyToClipboard: () => void;
    openInEditor: () => void;
    addCopyTooltip: (element: HTMLElement | null | undefined, comp: CompositeDisposable) => void;
    addCloseButtonTooltip: (element: HTMLElement | null | undefined, comp: CompositeDisposable) => void;
    addCopyButtonTooltip: (element: HTMLElement | null | undefined) => void;
    onWheel: (element: HTMLElement) => (event: WheelEvent) => void;
    toggleExpand: () => void;
    render(): JSX.Element;
    scrollToBottom(): void;
    componentDidUpdate(): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
}
export default ResultViewComponent;
