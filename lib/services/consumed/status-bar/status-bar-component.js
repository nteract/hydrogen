/* @flow */

import React from "react";
import { observer } from "mobx-react";

import type { Store } from "../../../store";

type Props = {
  store: Store,
  onClick: Function
};

@observer
export class StatusBar extends React.Component<Props> {
  render() {
    const { kernel, configMapping } = this.props.store;
    if (!kernel || configMapping.get("Hydrogen.statusBarDisable")) return null;
    return (
      <a onClick={this.props.onClick}>
        {kernel.displayName} | {kernel.executionState}
      </a>
    );
  }
}
