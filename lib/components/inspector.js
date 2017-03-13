'use babel';

import React from 'react';
import { observer } from 'mobx-react';
import Interact from 'interact.js';

/* eslint-disable react/prop-types */
// TODO prop types or flow
@observer
export default class InspectorComponent extends React.Component {
  componentDidMount() {
    Interact(this.props.panel.getItem()).resizable({ edges: { top: true } })
      .on('resizemove', (event) => {
        this.body.style.height = `${this.body.clientHeight + event.deltaRect.height}px`;
        this.body.style['max-height'] = this.body.style.height;
      })
      .on('resizeend', () => {
        // If height is bigger than required, snap back to minimum  height
        this.body.style.height = '';
      });
  }

  render() {
    const kernel = this.props.store.kernel;
    if (!kernel || !kernel.inspector.visible) {
      // The panel has a border even if it's nothing is rendered, therefore we need hide it too.
      this.props.panel.hide();
      return null;
    }
    this.props.panel.show();
    return (
      <div className="hydrogen-panel">
        <div className="panel-heading">
          <div className="panel-title inline-block">Hydrogen Inspector</div>
          <div className="heading-buttoms inline-block pull-right">
            <div
              className="heading-close inline-block icon-x"
              onClick={() => kernel.setInspectorVisibility(false)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
        <div
          className="panel-body"
          dangerouslySetInnerHTML={{ __html: kernel.inspector.HTML }}
          ref={(node) => { this.body = node; }}
        />
      </div>
    );
  }
}
