/* @flow */

import React from "react";
import { observer } from "mobx-react";

import type { IObservableValue } from "mobx";
type Props = { status: IObservableValue<string> };

const Status = observer(({ status }: Props) => {
  switch (status.get()) {
    case "running":
      return (
        <div className="spinner">
          <div className="rect1" />
          <div className="rect2" />
          <div className="rect3" />
          <div className="rect4" />
          <div className="rect5" />
        </div>
      );
    case "ok":
      return <div className="bubble-status-container icon icon-check" />;
    default:
      return <div className="bubble-status-container icon icon-x" />;
  }
});

export default Status;
