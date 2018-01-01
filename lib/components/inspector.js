/* @flow */

import React from "react";
import { observer } from "mobx-react";
import { richestMimetype, transforms } from "@nteract/transforms";

import { INSPECTOR_URI } from "./../utils";

const displayOrder = ["text/html", "text/markdown", "text/plain"];

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
  const Transform = transforms[mimetype];
  return (
    <div
      className="native-key-bindings"
      tabIndex="-1"
      style={{
        fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit"
      }}
    >
      {/* $FlowFixMe React element `Transform`. Expected React component instead of Transform*/}
      <Transform data={bundle[mimetype]} />
    </div>
  );
});

export default Inspector;
