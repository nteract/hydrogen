/* @flow */

import React from "react";
import { observer } from "mobx-react";
import ResizableBox from "react-resizable-box";
import { richestMimetype, transforms } from "@nteract/transforms";
import { List as ImmutableList } from "immutable";

const displayOrder = new ImmutableList([
  "text/html",
  "text/markdown",
  "text/plain"
]);

import type Kernel from "./../../kernel";

type Props = { store: { kernel: Kernel }, panel: atom$Panel };

const InspectorComponent = observer(({ store: { kernel }, panel }: Props) => {
  if (!kernel || !kernel.inspector.visible) {
    // The panel has a border even if it's nothing is rendered, therefore we need hide it too.
    panel.hide();
    return null;
  }
  panel.show();

  const bundle = kernel.inspector.bundle;
  const mimetype = richestMimetype(bundle, displayOrder, transforms);
  // $FlowFixMe React element `Transform`. Expected React component instead of Transform
  const Transform = transforms.get(mimetype);
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
            style={{ cursor: "pointer" }}
          />
        </div>
      </div>
      <div className="hydrogen-panel-body">
        <Transform data={bundle.get(mimetype)} />
      </div>
    </ResizableBox>
  );
});

export default InspectorComponent;
