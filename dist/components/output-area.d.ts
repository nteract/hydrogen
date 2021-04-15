import React from "react";
declare type store = typeof import("../store").default;
declare class OutputArea extends React.Component<{
    store: store;
}> {
    showHistory: boolean;
    setHistory: () => void;
    setScrollList: () => void;
    getOutputText(output: Record<string, any>): string | null | undefined;
    handleClick: () => void;
    render(): JSX.Element;
}
export default OutputArea;
