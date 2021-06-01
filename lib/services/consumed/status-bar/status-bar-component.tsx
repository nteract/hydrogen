import React from "react";
import { observer } from "mobx-react";
import type { Store } from "../../../store";
import { NO_EXECTIME_STRING } from "../../../utils";
type Props = {
  store: Store;
  onClick: (...args: Array<any>) => any;
};

@observer
class StatusBar extends React.Component<Props> {
  render() {
    const { kernel, markers, configMapping } = this.props.store;
    if (!kernel || configMapping.get("Hydrogen.statusBarDisable")) {
      return null;
    }
    const view = configMapping.get("Hydrogen.statusBarKernelInfo") ? ( // branch on if exec time is not available or no execution has happened
      kernel.executionCount === 0 ||
      kernel.lastExecutionTime === NO_EXECTIME_STRING ? (
        <a
          onClick={() =>
            this.props.onClick({
              kernel,
              markers,
            })
          }
        >
          {kernel.displayName} | {kernel.executionState} |{" "}
          {kernel.executionCount}
        </a>
      ) : (
        <a
          onClick={() =>
            this.props.onClick({
              kernel,
              markers,
            })
          }
        >
          {kernel.displayName} | {kernel.executionState} |{" "}
          {kernel.executionCount} | {kernel.lastExecutionTime}
        </a>
      )
    ) : (
      <a
        onClick={() =>
          this.props.onClick({
            kernel,
            markers,
          })
        }
      >
        {kernel.displayName} | {kernel.executionState}
      </a>
    );
    return view;
  }
}
export default StatusBar;
