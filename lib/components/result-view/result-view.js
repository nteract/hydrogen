/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";
import { action, observable, toJS } from "mobx";
import { Display } from "@nteract/display-area";
import { transforms, displayOrder } from "./transforms";
import Status from "./status";

import type OutputStore from "./../../store/output";
import type Kernel from "./../../kernel";

const SCROLL_HEIGHT = 600;

type Props = {
  store: OutputStore,
  kernel: ?Kernel,
  destroy: Function,
  showResult: boolean
};

@observer
class ResultViewComponent extends React.Component<Props> {
  el: ?HTMLElement;
  buttonTooltip = new CompositeDisposable();
  closeTooltip = new CompositeDisposable();
  @observable
  expanded: boolean = false;

  copyToClipboard = (text: string) => {
    atom.clipboard.write(text);
    atom.notifications.addSuccess("Copied to clipboard");
  };

  copyOnClick = () => {
    const selection = document.getSelection();
    if (selection) {
      const text = selection.toString();
      if (text) {
        this.copyToClipboard(text);
      }
    }
  };

  getAllText = (): string => {
    if (!this.el) return "";
    return this.el.innerText ? this.el.innerText : "";
  };

  handleClick = (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      this.openInEditor();
    } else {
      const text = this.getAllText();
      this.copyToClipboard(text);
    }
  };

  openInEditor = () => {
    atom.workspace.open().then(editor => editor.insertText(this.getAllText()));
  };

  addCopyTooltip = (element: ?HTMLElement, comp: atom$CompositeDisposable) => {
    if (!element || !comp.disposables || comp.disposables.size > 0) return;
    comp.add(
      atom.tooltips.add(element, {
        title: `Click to copy,
          ${
            process.platform === "darwin" ? "Cmd" : "Ctrl"
          }+Click to open in editor`
      })
    );
  };

  addCloseButtonTooltip = (
    element: ?HTMLElement,
    comp: atom$CompositeDisposable
  ) => {
    if (!element || !comp.disposables || comp.disposables.size > 0) return;
    comp.add(
      atom.tooltips.add(element, {
        title: this.props.store.executionCount
          ? `Close (Out[${this.props.store.executionCount}])`
          : "Close result"
      })
    );
  };

  addCopyButtonTooltip = (element: ?HTMLElement) => {
    this.addCopyTooltip(element, this.buttonTooltip);
  };

  onWheel = (element: HTMLElement) => {
    return (event: WheelEvent) => {
      const clientHeight = element.clientHeight;
      const scrollHeight = element.scrollHeight;
      const clientWidth = element.clientWidth;
      const scrollWidth = element.scrollWidth;
      const scrollTop = element.scrollTop;
      const scrollLeft = element.scrollLeft;
      const atTop = scrollTop !== 0 && event.deltaY < 0;
      const atLeft = scrollLeft !== 0 && event.deltaX < 0;
      const atBottom =
        scrollTop !== scrollHeight - clientHeight && event.deltaY > 0;
      const atRight =
        scrollLeft !== scrollWidth - clientWidth && event.deltaX > 0;

      if (clientHeight < scrollHeight && (atTop || atBottom)) {
        event.stopPropagation();
      } else if (clientWidth < scrollWidth && (atLeft || atRight)) {
        event.stopPropagation();
      }
    };
  };

  @action
  toggleExpand = () => {
    this.expanded = !this.expanded;
  };

  render() {
    const { outputs, status, isPlain, position } = this.props.store;

    const inlineStyle = {
      marginLeft: `${position.lineLength + position.charWidth}px`,
      marginTop: `-${position.lineHeight}px`,
      userSelect: "text"
    };

    if (outputs.length === 0 || this.props.showResult === false) {
      const kernel = this.props.kernel;
      return (
        <Status
          status={
            kernel && kernel.executionState !== "busy" && status === "running"
              ? "error"
              : status
          }
          style={inlineStyle}
        />
      );
    }

    return (
      <div
        className={isPlain ? "inline-container" : "multiline-container"}
        tabIndex={"-1"}
        style={
          isPlain
            ? inlineStyle
            : {
                maxWidth: `${position.editorWidth - 2 * position.charWidth}px`,
                margin: "0px",
                userSelect: "text"
              }
        }
      >
        <div
          className="hydrogen_cell_display native-key-bindings"
          onClick={this.copyOnClick}
          ref={ref => {
            if (!ref) return;
            this.el = ref;

            // As of this writing React's event handler doesn't properly handle
            // event.stopPropagation() for events outside the React context.
            if (!this.expanded && !isPlain && ref) {
              ref.addEventListener("wheel", this.onWheel(ref), {
                passive: true
              });
            }
          }}
          style={{
            maxHeight: this.expanded ? "100%" : `${SCROLL_HEIGHT}px`,
            overflowY: "auto"
          }}
        >
          <Display
            outputs={toJS(outputs)}
            displayOrder={displayOrder}
            transforms={transforms}
            theme="light"
            models={{}}
            expanded
          />
        </div>
        {isPlain ? null : (
          <div className="toolbar">
            <div
              className="icon icon-x"
              onClick={this.props.destroy}
              ref={ref => this.addCloseButtonTooltip(ref, this.closeTooltip)}
            />

            <div style={{ flex: 1, minHeight: "0.25em" }} />

            {this.getAllText().length > 0 ? (
              <div
                className="icon icon-clippy"
                onClick={this.handleClick}
                ref={this.addCopyButtonTooltip}
              />
            ) : null}

            {this.el && this.el.scrollHeight > SCROLL_HEIGHT ? (
              <div
                className={`icon icon-${this.expanded ? "fold" : "unfold"}`}
                onClick={this.toggleExpand}
              />
            ) : null}
          </div>
        )}
      </div>
    );
  }

  scrollToBottom() {
    if (
      !this.el ||
      this.expanded === true ||
      this.props.store.isPlain === true ||
      atom.config.get(`Hydrogen.autoScroll`) === false
    )
      return;
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

  componentWillUnmount() {
    this.buttonTooltip.dispose();
    this.closeTooltip.dispose();
  }
}

export default ResultViewComponent;
