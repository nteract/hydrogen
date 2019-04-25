/* @flow */

import React from "react";
import ReactTable from "react-table";
import { ReactTableDefaults } from "react-table";
import { observer } from "mobx-react";
import _ from "lodash";
import tildify from "tildify";

import { KERNEL_MONITOR_URI } from "./../utils";

import typeof store from "../store";
import Kernel from "../kernel";

const interrupt = (kernel: Kernel) => {
  kernel.interrupt();
};
const shutdown = (kernel: Kernel) => {
  kernel.shutdown();
  kernel.destroy();
};
const restart = (kernel: Kernel) => {
  kernel.restart();
};

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

// Set default properties of React-Table
Object.assign(ReactTableDefaults, {
  className: "kernel-monitor",
  showPagination: false
});
Object.assign(ReactTableDefaults.column, {
  className: "table-cell",
  headerClassName: "table-header",
  style: { textAlign: "center" }
});

const KernelMonitor = observer(({ store }: { store: store }) => {
  if (store.runningKernels.length === 0) {
    return (
      <ul className="background-message centered">
        <li>No running kernels</li>
      </ul>
    );
  }

  const data = _.map(store.runningKernels, kernel => {
    return {
      gateway: kernel.gatewayName || "Local",
      displayName: kernel.displayName,
      status: kernel.executionState,
      executionCount: kernel.executionCount,
      kernel: kernel,
      files: store.getFilesForKernel(kernel)
    };
  });
  const columns = [
    {
      Header: "Gateway",
      accessor: "gateway",
      maxWidth: 150
    },
    {
      Header: "Kernel",
      accessor: "displayName",
      maxWidth: 150
    },
    {
      Header: "Status",
      accessor: "status",
      maxWidth: 100
    },
    {
      Header: "Count",
      accessor: "executionCount",
      maxWidth: 75,
      style: { textAlign: "right" }
    },
    {
      Header: "Managements",
      accessor: "kernel",
      Cell: props => {
        const kernel = props.value;
        return [
          <a
            className="icon icon-playback-pause"
            onClick={interrupt.bind(this, kernel)}
            title="Interrupt kernel"
            key={kernel.displayName + "int"}
          />,
          <a
            className="icon icon-playback-rewind"
            onClick={restart.bind(this, kernel)}
            title="Restart kernel"
            key={kernel.displayName + "res"}
          />,
          <a
            className="icon icon-trashcan"
            onClick={shutdown.bind(this, kernel)}
            title="Shutdown kernel"
            key={kernel.displayName + "shut"}
          />
        ];
      },
      width: 150
    },
    {
      Header: "Files",
      accessor: "files",
      Cell: props => {
        return props.value.map((file, index) => {
          const separator = index === 0 ? "" : "  |  ";
          const body = file.includes("Unsaved Editor") ? (
            file
          ) : (
            <a
              onClick={openFile.bind(this, file)}
              title="Jump to file"
              key={file + "jump"}
            >
              {tildify(file)}
            </a>
          );
          return (
            <div
              className="test"
              style={{ display: "-webkit-inline-box" }}
              key={file}
            >
              {separator}
              {body}
            </div>
          );
        });
      },
      style: { textAlign: "center", whiteSpace: "pre-wrap" }
    }
  ];

  return <ReactTable data={data} columns={columns} />;
});

export default KernelMonitor;
