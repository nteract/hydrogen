/* @flow */

import React from 'react';
import { observer } from 'mobx-react';

const StatusBar = observer(({ store: { kernel }, onClick }) => {
  if (!kernel) return null;
  return <a onClick={onClick}>{kernel.displayName} | {kernel.executionState}</a>;
});

export default StatusBar;
