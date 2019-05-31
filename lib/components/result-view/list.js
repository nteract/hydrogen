/* @flow */

import React from "react";
import { observer } from "mobx-react";
import { toJS } from "mobx";
import {
  DisplayData,
  ExecuteResult,
  StreamText,
  KernelOutputError,
  Output
} from "@nteract/outputs";
import { MediaComponents } from "./transforms";

type Props = { outputs: Array<Object> };

@observer
class ScrollList extends React.Component<Props> {
  el: ?HTMLElement;

  scrollToBottom() {
    if (!this.el) return;
    const scrollHeight = this.el.scrollHeight;
    const height = this.el.clientHeight;
    const maxScrollTop = scrollHeight - height;
    this.el.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  render() {
    if (this.props.outputs.length === 0) return null;
    return (
      <div
        className="scroll-list multiline-container native-key-bindings"
        tabIndex="-1"
        style={{
          fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit"
        }}
        ref={el => {
          this.el = el;
        }}
      >
        {toJS(this.props.outputs).map((output, index) => (
          <Output output={output} key={index}>
            <ExecuteResult expanded>{MediaComponents}</ExecuteResult>
            <DisplayData expanded>{MediaComponents}</DisplayData>
            <StreamText expanded />
            <KernelOutputError expanded />
          </Output>
        ))}
      </div>
    );
  }
}

export default ScrollList;
