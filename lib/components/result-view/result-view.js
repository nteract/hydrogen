/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import * as Immutable from "immutable";
import { observer } from "mobx-react";
import { action, observable } from "mobx";
import { Display } from "@nteract/display-area";

import { transforms, displayOrder } from "./transforms";
import Status from "./status";

import type { IObservableValue } from "mobx";
import type OutputStore from "./../../store/output";
type Props = { store: OutputStore, destroy: Function };

@observer class ResultViewComponent extends React.Component {
  props: Props;
  el: ?HTMLElement;
  tooltips = new CompositeDisposable();
  expanded: IObservableValue<boolean> = observable(false);

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
        title: this.props.store.executionCount
          ? `Copy to clipboard (Out[${this.props.store.executionCount}])`
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
    const { outputs, status, isPlain, position } = this.props.store;

    const inlineStyle = {
      marginLeft: `${position.lineLength + 1}ch`,
      marginTop: `-${position.lineHeight}px`
    };

    if (outputs.length === 0) {
      return <Status status={status} style={inlineStyle} />;
    }

    return (
      <div
        className={isPlain ? "inline-container" : "multiline-container"}
        onClick={isPlain ? this.copyToClipboard : false}
        style={
          isPlain
            ? inlineStyle
            : { maxWidth: `${position.editorWidth}ch`, margin: "0px" }
        }
        ref={el => {
          this.el = el;
          isPlain ? this.addCopyTooltip(el) : this.tooltips.dispose();
        }}
      >
        <Display
          ref={ref => {
            // React's event handler doesn't properly handle event.stopPropagation() for
            // events outside the React context. Using proxy.el saves us a extra div.
            // We only need this in the text editor, therefore we check showStatus.
            if (!this.expanded.get() && ref && ref.el && !isPlain) {
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
        {isPlain
          ? null
          : <div className="toolbar">
              <div className="icon icon-x" onClick={this.props.destroy} />
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
