/* @flow */

import React from "react";
import { observer } from "mobx-react";

import typeof store from "./../store";

@observer
class StatusBar extends React.Component<{ store: store, onClick: Function }> {
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

export default StatusBar;
