import React from "react";
import { CompositeDisposable } from "atom";
import type WatchStore from "../../store/watch";
export default class Watch extends React.Component<{
    store: WatchStore;
}> {
    container: HTMLElement | null | undefined;
    subscriptions: CompositeDisposable;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
