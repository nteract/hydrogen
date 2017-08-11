/* @flow */

import { CompositeDisposable } from "atom";
import React from "react";
import { observer } from "mobx-react";
import { action, observable, toJS, computed } from "mobx";
import Display, {
  DEFAULT_SCROLL_HEIGHT
} from "@nteract/display-area/lib/display";
import { transforms, displayOrder } from "./transforms";
import Status from "./status";

import type { IObservableValue } from "mobx";
import type OutputStore from "./../../store/output";
import type Kernel from "./../../kernel";

type Props = {
  store: OutputStore,
  kernel: ?Kernel,
  destroy: Function,
  showResult: boolean
};

@observer
class ResultViewComponent extends React.Component {
  props: Props;
  el: ?HTMLElement;
  containerTooltip = new CompositeDisposable();
  buttonTooltip = new CompositeDisposable();
  expanded: IObservableValue<boolean> = observable(false);
  ctrlHovering: IObservableValue<boolean> = observable(false);

  getAllText = () => {
    if (!this.el) return "";
    return this.el.innerText ? this.el.innerText.trim() : "";
  };

  handleClick = (event: MouseEvent) => {
    if (this.ctrlHovering.get()) {
      this.openInEditor();
    } else {
      this.copyToClipboard();
    }
  };

  @action
  handleButtonMouseOver = (event: MouseEvent) => {
    this.ctrlHovering.set(event.ctrlKey || event.metaKey);
  };

  @action
  handleButtonMouseLeave = (event: MouseEvent) => {
    this.ctrlHovering.set(false);
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

    // the title argument to tooltips.add is a function that returns the title
    comp.add(
      atom.tooltips.add(element, {
        title: () => {
          const titleText = this.ctrlHovering.get()
            ? "Copy output into new editor"
            : "Copy to clipboard";

          const executionCount = this.props.store.executionCount;
          return executionCount
            ? `${titleText}(Out[${executionCount}])`
            : titleText;
        }
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
      const scrollTop = element.scrollTop;
      const atTop = scrollTop !== 0 && event.deltaY < 0;
      const atBottom =
        scrollTop !== scrollHeight - clientHeight && event.deltaY > 0;

      if (clientHeight < scrollHeight && (atTop || atBottom)) {
        event.stopPropagation();
      }
    };
  };

  @action
  toggleExpand = () => {
    this.expanded.set(!this.expanded.get());
  };

  render() {
    const { outputs, status, isPlain, position } = this.props.store;

    const inlineStyle = {
      marginLeft: `${position.lineLength + 1}ch`,
      marginTop: `-${position.lineHeight}px`
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
        onClick={isPlain ? this.copyToClipboard : false}
        style={
          isPlain
            ? inlineStyle
            : { maxWidth: `${position.editorWidth}ch`, margin: "0px" }
        }
      >
        <Display
          ref={ref => {
            if (!ref || !ref.el) return;
            this.el = ref.el;

            isPlain
              ? this.addCopyTooltip(ref.el, this.containerTooltip)
              : this.containerTooltip.dispose();

            // React's event handler doesn't properly handle event.stopPropagation() for
            // events outside the React context. Using proxy.el saves us a extra div.
            // We only need this in the text editor, therefore we check showStatus.
            if (!this.expanded.get() && !isPlain) {
              ref.el.addEventListener("wheel", this.onWheel(ref.el), {
                passive: true
              });
            }
          }}
          outputs={toJS(outputs)}
          displayOrder={displayOrder}
          transforms={transforms}
          theme="light"
          models={{}}
          expanded={this.expanded.get()}
        />
        {isPlain
          ? null
          : <div className="toolbar">
              <div className="icon icon-x" onClick={this.props.destroy} />
              <div style={{ flex: 1, minHeight: "0.25em" }} />
              <div
                className={`icon ${this.ctrlHovering.get()
                  ? "icon-file-symlink-file"
                  : "icon-clippy"}`}
                onClick={this.handleClick}
                onMouseLeave={this.handleButtonMouseLeave}
                onMouseOver={this.handleButtonMouseOver}
                ref={this.addCopyButtonTooltip}
              />
              {this.el && this.el.scrollHeight > DEFAULT_SCROLL_HEIGHT
                ? <div
                    className={`icon icon-${this.expanded.get()
                      ? "fold"
                      : "unfold"}`}
                    onClick={this.toggleExpand}
                  />
                : null}
            </div>}
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
  }
}

export default ResultViewComponent;
