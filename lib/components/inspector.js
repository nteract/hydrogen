/* @flow */

import React from "react";
import { observer } from "mobx-react";
import { richestMimetype, transforms } from "@nteract/transforms";
import * as Immutable from "immutable";

import { INSPECTOR_URI } from "./../utils";

const displayOrder = new Immutable.List([
  "text/html",
  "text/markdown",
  "text/plain"
]);

import type Kernel from "./../kernel";

type Props = { store: { kernel: ?Kernel } };

function hide() {
  atom.workspace.hide(INSPECTOR_URI);
  return null;
}

const Inspector = observer(({ store: { kernel } }: Props) => {
  if (!kernel) return hide();

  const bundle = kernel.inspector.bundle;
  const mimetype = richestMimetype(bundle, displayOrder, transforms);

  if (!mimetype) return hide();
  // $FlowFixMe React element `Transform`. Expected React component instead of Transform
  const Transform = transforms.get(mimetype);
  return <Transform data={bundle.get(mimetype)} />;
});

export default Inspector;
