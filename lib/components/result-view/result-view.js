/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import * as Immutable from "immutable";
import { observer } from "mobx-react";
import { richestMimetype } from "@nteract/transforms";
import { Display } from "@nteract/display-area";

import { transforms, displayOrder } from "./transforms";
import Status from "./status";

import type { IObservableArray, IObservableValue } from "mobx";
import type { ImmutableOutput } from "@nteract/commutable/lib/types";

type Outputs = IObservableArray<ImmutableOutput>;
type Position = { lineHeight: number, lineLength: number, editorWidth: number };

const isStatus = (outputs: Outputs, showStatus: boolean) => {
  return showStatus && outputs.length === 0;
};

const isSingeLine = (text: string, position: Position) => {
  // TODO Maybe escape carriage here to enable inline progress bars
  return (
    text.length < position.editorWidth - position.lineLength &&
    (text.indexOf("\n") === text.length - 1 || text.indexOf("\n") === -1)
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

@observer class ResultViewComponent extends React.PureComponent {
  props: Props;
  el: ?HTMLElement;
  tooltips = new CompositeDisposable();
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

  render() {
    const { outputs, status, destroy, showStatus, multiline } = this.props;
    const { position: { lineLength, lineHeight, editorWidth } } = this.props;

    const inlineStyle = {
      "margin-left": `${lineLength + 1}ch`,
      "margin-top": `-${lineHeight}px`
    };

    if (isStatus(outputs, showStatus))
      return <Status status={status} style={inlineStyle} />;

    const plain = isPlain(outputs, this.props.position, multiline);

    return (
      <div
        className={plain ? "inline-container" : "multiline-container"}
        onClick={plain ? this.copyToClipboard : false}
        style={
          plain
            ? inlineStyle
            : { "max-width": `${editorWidth - 1}ch`, margin: "0px" }
        }
        ref={el => {
          this.el = el;
          plain ? this.addCopyTooltip(el) : this.tooltips.dispose();
        }}
      >
        <Display
          outputs={Immutable.List(outputs.peek())}
          displayOrder={displayOrder}
          transforms={transforms}
          theme="light"
          models={Immutable.Map()}
        />
        {plain
          ? null
          : <div className="toolbar">
              <div
                className="toolbar-button close-button icon icon-x"
                onClick={destroy}
              />
              <div style={{ flex: 1 }} />
              <div
                className="toolbar-button icon icon-clippy"
                onClick={this.copyToClipboard}
                ref={this.addCopyTooltip}
              />
              <div
                className="toolbar-button icon icon-file-symlink-file"
                onClick={this.openInEditor}
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
