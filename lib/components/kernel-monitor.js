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

async function openFile(file: string) {
  await atom.workspace
    .open(file, {
      searchAllPanes: true
    })
    .catch(err => {
      atom.notifications.addError("Hydrogen", {
        description: err
      });
    });
}

type MonitorProps = { kernel: Kernel, files: string[] };
const Monitor = observer(({ kernel, files }: MonitorProps) => {
  const interrupt = () => {
    kernel.interrupt();
  };
  const shutdown = () => {
    kernel.shutdown();
    kernel.destroy();
  };
  const restart = () => {
    kernel.restart();
  };

  return (
    <div className="kernel-line">
      <div style={{ padding: "0px 5px", whiteSpace: "nowrap" }}>
        {kernel.displayName} | {kernel.executionState} | {kernel.executionCount}{" "}
        | {kernel.lastExecutionTime}
      </div>
      <div
        className="icon icon-playback-pause"
        onClick={interrupt}
        title="Interrupt kernel"
      />
      <div
        className="icon icon-playback-rewind"
        onClick={restart}
        title="Restart kernel"
      />
      <div
        className="icon icon-trashcan"
        onClick={shutdown}
        title="Shutdown kernel"
      />
      <div style={{ flex: 1 }} />
      {/* Empty div to align components below to the right side */}
      {files.map((file, index) => {
        const separator = index == 0 ? "" : "  |  ";
        const body = file.includes("Unsaved Editor") ? (
          file
        ) : (
          <a onClick={openFile.bind(this, file)} title="Jump to file">
            {tildify(file)}
          </a>
        );
        return (
          <div
            style={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "pre-wrap"
            }}
            key={file}
          >
            {separator}
            {body}
          </div>
        );
      })}
    </div>
  );
});

type Props = { store: store, kernels: Array<Kernel>, group: string };
const MonitorSection = observer(({ store, kernels, group }: Props) => (
  <div>
    <header>{group}</header>
    {kernels.map(kernel => {
      const files = store.getFilesForKernel(kernel);
      const key = kernel.displayName + files.join(".");
      return <Monitor kernel={kernel} files={files} key={key} />;
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
