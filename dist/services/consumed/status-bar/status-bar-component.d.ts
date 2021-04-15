import React from "react";
import type { Store } from "../../../store";
declare type Props = {
    store: Store;
    onClick: (...args: Array<any>) => any;
};
declare class StatusBar extends React.Component<Props> {
    render(): JSX.Element;
}
export default StatusBar;
