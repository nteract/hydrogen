/* @flow */

import React from "react";
import { observer } from "mobx-react";

import type Kernel from "./../kernel";

type Props = { store: { kernel: ?Kernel }, onClick: Function };

const StatusBar = observer(({ store: { kernel }, onClick }: Props) => {
  if (!kernel) return null;
  return (
    <a onClick={onClick}>
      {kernel.displayName} | {kernel.executionState}
    </a>
  );
});

export default StatusBar;
