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

type Props = {};

class Display extends React.PureComponent<Props> {
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
