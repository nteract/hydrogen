/* @flow */

import React from "react";
import { observer } from "mobx-react";

import type Kernel from "./../kernel";
import typeof store from "./../store";

type Props = {
  store: { kernel: ?Kernel, configMapping: Map<string, mixed> },
  onClick: Function
};

const StatusBar = observer(
  ({ store: { kernel, configMapping }, onClick }: Props) => {
    if (!kernel || configMapping.get("Hydrogen.statusBarDisable")) return null;
    return (
      <a onClick={onClick}>
        {kernel.displayName} | {kernel.executionState}
      </a>
    );
  }
);

export default StatusBar;
