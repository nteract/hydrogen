import React from "react";
declare type Props = {
    outputs: Array<Record<string, any>>;
};
declare class ScrollList extends React.Component<Props> {
    el: HTMLElement | null | undefined;
    scrollToBottom(): void;
    componentDidUpdate(): void;
    componentDidMount(): void;
    render(): JSX.Element;
}
export default ScrollList;
