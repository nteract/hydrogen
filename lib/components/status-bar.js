'use babel';

import React from 'react';
import { observer } from 'mobx-react';

@observer
export default class StatusBar extends React.Component {
  render() {
    const kernel = this.props.store.currentKernel;
    if (!kernel) return null;
    return (
      <a onClick={this.props.onClick}>
        {kernel.displayName} | {kernel.executionState}
      </a>
    );
  }
}
