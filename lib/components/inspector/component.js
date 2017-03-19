'use babel';

import React from 'react';
import { observer } from 'mobx-react';
import ResizableBox from 'react-resizable-box';

const InspectorComponent = observer(({ store: { kernel }, panel }) => {
  if (!kernel || !kernel.inspector.visible) {
    // The panel has a border even if it's nothing is rendered, therefore we need hide it too.
    panel.hide();
    return null;
  }
  panel.show();
  return (
    <ResizableBox
      isResizable={{ top: true }}
      onResizeStop={(dir, size) => kernel.setInspectorHeight(size.height)}
      height={kernel.inspector.height}
      width="auto"
    >
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
        className="hydrogen-panel-body"
        dangerouslySetInnerHTML={{ __html: kernel.inspector.HTML }}
      />
    </ResizableBox>
  );
});

export default InspectorComponent;
