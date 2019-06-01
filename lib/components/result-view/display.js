/* @flow */

import React from "react";
import {
  DisplayData,
  ExecuteResult,
  StreamText,
  KernelOutputError,
  Output
} from "@nteract/outputs";
import { MediaComponents } from "./transforms";

class Display extends React.PureComponent {
  render() {
    return (
      <Output {...this.props}>
        <ExecuteResult expanded>{MediaComponents()}</ExecuteResult>
        <DisplayData expanded>{MediaComponents()}</DisplayData>
        <StreamText expanded />
        <KernelOutputError expanded />
      </Output>
    );
  }
}
export default Display;
