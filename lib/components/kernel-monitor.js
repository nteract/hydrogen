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
    <div>
      <div>{kernel.displayName}</div>
      <div>{files}</div>
      <button className="btn icon icon-trashcan" onClick={destroy} />
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
      return <Monitor kernel={kernel} files={files} key={files} />;
    })}
  </div>
));

const KernelMonitor = observer(({ store }: { store: store }) => {
  const grouped = _.groupBy(
    store.runningKernels,
    kernel => kernel.gatewayName || "Local"
  );
  return (
    <div>
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
