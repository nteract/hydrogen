'use babel';

import React from 'react';
import { observer } from 'mobx-react';

/* eslint-disable react/prop-types */
// TODO prop types or flow
@observer
export default class StatusBar extends React.Component {
  render() {
    const kernel = this.props.store.currentKernel;
    if (!kernel.displayName) return null;
    return (
      <a onClick={this.props.onClick}>
        {kernel.displayName} | {kernel.executionState}
      </a>
    );
  }
}
