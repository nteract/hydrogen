/* @flow */

import React from "react";
import { observer } from "mobx-react";

type Props = { status: string, style: Object };

const Status = observer(({ status, style }: Props) => {
  switch (status) {
    case "running":
      return (
        <div className="inline-container spinner" style={style}>
          <div className="rect1" />
          <div className="rect2" />
          <div className="rect3" />
          <div className="rect4" />
          <div className="rect5" />
        </div>
      );
    case "ok":
      return <div className="inline-container icon icon-check" style={style} />;
    case "empty":
      return <div className="inline-container icon icon-zap" style={style} />;
    default:
      return <div className="inline-container icon icon-x" style={style} />;
  }
});

export default Status;
