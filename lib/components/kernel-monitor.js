/* @flow */

import React from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import _ from "lodash";
import tildify from "tildify";

import { KERNEL_MONITOR_URI } from "./../utils";

const displayOrder = ["text/html", "text/markdown", "text/plain"];

import typeof store from "../store";
import Kernel from "../kernel";

type MonitorProps = { kernel: Kernel, files: string };
const Monitor = observer(({ kernel, files }: MonitorProps) => {
  const destroy = () => {
    kernel.shutdown();
    kernel.destroy();
  };

  return (
    <div style={{ padding: "5px 10px", display: "flex" }}>
      <div style={{ flex: 1, whiteSpace: "nowrap" }}>{kernel.displayName}</div>
      <div
        style={{
          padding: "0 10px",
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap"
        }}
      >
        {files}
      </div>
      <div className="icon icon-trashcan" onClick={destroy} />
    </div>
  );
});

type Props = { store: store, kernels: Array<Kernel>, group: string };
const MonitorSection = observer(({ store, kernels, group }: Props) => (
  <div>
    <header>{group}</header>
    {kernels.map(kernel => {
      const files = store
        .getFilesForKernel(kernel)
        .map(tildify)
        .join(", ");
      return (
        <Monitor
          kernel={kernel}
          files={files}
          key={kernel.displayName + files}
        />
      );
    })}
  </div>
));

const KernelMonitor = observer(({ store }: { store: store }) => {
  if (store.runningKernels.length === 0) {
    return (
      <ul className="background-message centered">
        <li>No running kernels</li>
      </ul>
    );
  }
  const grouped = _.groupBy(
    store.runningKernels,
    kernel => kernel.gatewayName || "Local"
  );
  return (
    <div className="kernel-monitor">
      {_.map(grouped, (kernels, group) => (
        <MonitorSection
          store={store}
          kernels={kernels}
          group={group}
          key={group}
        />
      ))}
    </div>
  );
});

export default KernelMonitor;
