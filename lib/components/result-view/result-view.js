/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import * as Immutable from "immutable";
import { observer } from "mobx-react";
import { action, observable } from "mobx";
import { richestMimetype } from "@nteract/transforms";
import { Display } from "@nteract/display-area";
import escapeCarriageReturn from "escape-carriage";

import { transforms, displayOrder } from "./transforms";
import Status from "./status";

import type { IObservableArray, IObservableValue } from "mobx";
import type { ImmutableOutput } from "@nteract/commutable/lib/types";

type Outputs = IObservableArray<ImmutableOutput>;
type Position = { lineHeight: number, lineLength: number, editorWidth: number };

const isSingeLine = (text: string, position: Position) => {
  // If it turns out escapeCarriageReturn is a bottleneck, we should remove it.
  const esc = escapeCarriageReturn(text);
  return (
    esc.length < position.editorWidth - position.lineLength &&
    (esc.indexOf("\n") === esc.length - 1 || esc.indexOf("\n") === -1)
  );
};

const isPlain = (outputs: Outputs, position: Position, multiline: boolean) => {
  if (multiline || outputs.length !== 1) return false;

  const output = outputs[0];
  switch (output.get("output_type")) {
    case "execute_result":
    case "display_data": {
      const bundle = output.get("data");
      const mimetype = richestMimetype(bundle, displayOrder, transforms);
      return mimetype === "text/plain"
        ? isSingeLine(bundle.get(mimetype), position)
        : false;
    }
    case "stream": {
      return isSingeLine(output.get("text"), position);
    }
    default: {
      return false;
    }
  }
};

type Props = {
  outputs: Outputs,
  status: IObservableValue<string>,
  executionCount: ?number,
  destroy: Function,
  position: Position,
  showStatus: boolean,
  multiline: boolean
};

@observer class ResultViewComponent extends React.Component {
  props: Props;
  el: ?HTMLElement;
  tooltips = new CompositeDisposable();
  expanded: IObservableValue<boolean> = observable(false);
  static defaultProps = {
    showStatus: true,
    multiline: false
  };

  getAllText = () => {
    if (!this.el) return "";
    return this.el.innerText ? this.el.innerText.trim() : "";
  };

  copyToClipboard = () => {
    atom.clipboard.write(this.getAllText());
    atom.notifications.addSuccess("Copied to clipboard");
  };

  openInEditor = () => {
    atom.workspace.open().then(editor => editor.insertText(this.getAllText()));
  };

  addCopyTooltip = (element: ?HTMLElement) => {
    if (!element) return;
    this.tooltips.add(
      atom.tooltips.add(element, {
        title: this.props.executionCount
          ? `Copy to clipboard (Out[${this.props.executionCount}])`
          : "Copy to clipboard"
      })
    );
  };

  onWheel = (element: HTMLElement) => {
    return (event: WheelEvent) => {
      const clientHeight = element.clientHeight;
      const scrollHeight = element.scrollHeight;
      const scrollTop = element.scrollTop;
      const atTop = scrollTop !== 0 && event.deltaY < 0;
      const atBottom =
        scrollTop !== scrollHeight - clientHeight && event.deltaY > 0;

      if (clientHeight < scrollHeight && (atTop || atBottom)) {
        event.stopPropagation();
      }
    };
  };

  @action toggleExpand = () => {
    this.expanded.set(!this.expanded.get());
  };

  render() {
    const { outputs, status, destroy, showStatus, multiline } = this.props;
    const { position: { lineLength, lineHeight, editorWidth } } = this.props;

    const inlineStyle = {
      marginLeft: `${lineLength + 1}ch`,
      marginTop: `-${lineHeight}px`
    };

    if (outputs.length === 0) {
      return showStatus ? <Status status={status} style={inlineStyle} /> : null;
    }

    const plain = isPlain(outputs, this.props.position, multiline);

    return (
      <div
        className={plain ? "inline-container" : "multiline-container"}
        onClick={plain ? this.copyToClipboard : false}
        style={
          plain ? inlineStyle : { maxWidth: `${editorWidth}ch`, margin: "0px" }
        }
        ref={el => {
          this.el = el;
          plain ? this.addCopyTooltip(el) : this.tooltips.dispose();
        }}
      >
        <Display
          ref={ref => {
            // React's event handler doesn't properly handle event.stopPropagation() for
            // events outside the React context. Using proxy.el saves us a extra div.
            // We only need this in the text editor, therefore we check showStatus.
            if (showStatus && !this.expanded.get() && ref && ref.el && !plain) {
              ref.el.addEventListener("wheel", this.onWheel(ref.el), {
                passive: true
              });
            }
          }}
          outputs={Immutable.List(outputs.peek())}
          displayOrder={displayOrder}
          transforms={transforms}
          theme="light"
          models={Immutable.Map()}
          expanded={this.expanded.get()}
        />
        {plain
          ? null
          : <div className="toolbar">
              <div className="icon icon-x" onClick={destroy} />
              <div style={{ flex: 1, minHeight: "0.25em" }} />
              <div
                className="icon icon-clippy"
                onClick={this.copyToClipboard}
                ref={this.addCopyTooltip}
              />
              <div
                className="icon icon-file-symlink-file"
                onClick={this.openInEditor}
              />
              <div
                className={`icon icon-${this.expanded.get() ? "fold" : "unfold"}`}
                onClick={this.toggleExpand}
              />
            </div>}
      </div>
    );
  }

  componentWillUnmount() {
    this.tooltips.dispose();
  }
}

export default ResultViewComponent;
