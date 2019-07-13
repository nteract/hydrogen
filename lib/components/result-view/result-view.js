/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";
import { action, observable } from "mobx";
import Display from "./display";
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
  containerTooltip = new CompositeDisposable();
  buttonTooltip = new CompositeDisposable();
  closeTooltip = new CompositeDisposable();
  @observable
  expanded: boolean = false;

  getAllText = () => {
    if (!this.el) return "";
    return this.el.innerText ? this.el.innerText : "";
  };

  handleClick = (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      this.openInEditor();
    } else {
      this.copyToClipboard();
    }
  };

  checkForSelection = (event: MouseEvent) => {
    const selection = document.getSelection();
    if (selection && selection.toString()) {
      return;
    } else {
      this.handleClick(event);
    }
  };

  copyToClipboard = () => {
    atom.clipboard.write(this.getAllText());
    atom.notifications.addSuccess("Copied to clipboard");
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
        className={
          (isPlain ? "inline-container" : "multiline-container") +
          " native-key-bindings"
        }
        tabIndex={"-1"}
        onClick={isPlain ? this.checkForSelection : undefined}
        style={
          isPlain
            ? inlineStyle
            : {
                maxWidth: `${position.editorWidth - 2 * position.charWidth}px`,
                margin: "0px",
                userSelect: "text"
              }
        }
        hydrogen-wrapoutput={atom.config.get(`Hydrogen.wrapOutput`).toString()}
      >
        <div
          className="hydrogen_cell_display"
          ref={ref => {
            if (!ref) return;
            this.el = ref;

            isPlain
              ? this.addCopyTooltip(ref, this.containerTooltip)
              : this.containerTooltip.dispose();

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
          {outputs.map((output, index) => (
            <Display output={output} key={index} />
          ))}
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
    this.containerTooltip.dispose();
    this.buttonTooltip.dispose();
    this.closeTooltip.dispose();
  }
}

export default ResultViewComponent;
