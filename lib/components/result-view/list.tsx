import React from "react";
import { observer } from "mobx-react";
import Display from "./display";
type Props = {
  outputs: Array<Record<string, any>>;
};

@observer
class ScrollList extends React.Component<Props> {
  el: HTMLElement | null | undefined;

  scrollToBottom() {
    if (!this.el) {
      return;
    }
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
    if (this.props.outputs.length === 0) {
      return null;
    }
    return (
      <div
        className="scroll-list multiline-container native-key-bindings"
        tabIndex={-1}
        style={{
          fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit",
        }}
        ref={(el) => {
          this.el = el;
        }}
        hydrogen-wrapoutput={atom.config.get(`Hydrogen.wrapOutput`).toString()}
      >
        {this.props.outputs.map((output, index) => (
          <div className="scroll-list-item">
            <Display output={output} key={index} />
          </div>
        ))}
      </div>
    );
  }
}

export default ScrollList;
