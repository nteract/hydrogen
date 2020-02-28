/* @flow */

import React from "react";
import ReactTable from "react-table";
import { ReactTableDefaults } from "react-table";
import { observer } from "mobx-react";
import _ from "lodash";
import tildify from "tildify";

import typeof store from "../store";
import Kernel from "../kernel";
import { isUnsavedFilePath } from "../utils";

const showKernelSpec = (kernelSpec: {}) => {
  atom.notifications.addInfo("Hydrogen: Kernel Spec", {
    detail: JSON.stringify(kernelSpec, null, 2),
    dismissable: true
  });
};
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

// @TODO If our store holds editor IDs instead of file paths, these messy matching stuff below would
//       easily be replaced by simpler code. See also components/kernel-monitor.js for this problem.
const openUnsavedEditor = (filePath: string) => {
  const editor = atom.workspace.getTextEditors().find(editor => {
    const match = filePath.match(/\d+/);
    if (!match) {
      return false;
    }
    return String(editor.id) === match[0];
  });
  // This path won't happen after https://github.com/nteract/hydrogen/pull/1662 since every deleted
  // editors would be deleted from `store.kernelMapping`. Just kept here for safety.
  if (!editor) return;
  atom.workspace.open(editor, {
    searchAllPanes: true
  });
};
const openEditor = (filePath: string) => {
  atom.workspace
    .open(filePath, {
      searchAllPanes: true
    })
    .catch(err => {
      atom.notifications.addError("Hydrogen", {
        description: err
      });
    });
};

type KernelInfo = {
  value: {
    displayName: string,
    kernelSpec: Kernelspec
  }
};
const kernelInfoCell = (props: KernelInfo) => {
  const { displayName, kernelSpec } = props.value;
  return (
    <a
      className="icon"
      onClick={showKernelSpec.bind(this, kernelSpec)}
      title="Show kernel spec"
      key={displayName + "kernelInfo"}
    >
      {displayName}
    </a>
  );
};

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

  const data = _.map(store.runningKernels, (kernel, key: number) => {
    return {
      gateway: kernel.transport.gatewayName || "Local",
      kernelInfo: {
        displayName: kernel.displayName,
        kernelSpec: kernel.kernelSpec
      },
      status: kernel.executionState,
      executionCount: kernel.executionCount,
      lastExecutionTime: kernel.lastExecutionTime,
      kernelKey: { kernel: kernel, key: String(key) },
      files: store.getFilesForKernel(kernel)
    };
  });
  const columns = [
    {
      Header: "Gateway",
      accessor: "gateway",
      maxWidth: 125
    },
    {
      Header: "Kernel",
      accessor: "kernelInfo",
      Cell: kernelInfoCell,
      maxWidth: 125
    },
    {
      Header: "Status",
      accessor: "status",
      maxWidth: 100
    },
    {
      Header: "Count",
      accessor: "executionCount",
      maxWidth: 50,
      style: { textAlign: "right" }
    },
    {
      Header: "Last Exec Time",
      accessor: "lastExecutionTime",
      maxWidth: 100,
      style: { textAlign: "right" }
    },
    {
      Header: "Managements",
      accessor: "kernelKey",
      Cell: props => {
        const { kernel, key } = props.value;
        return [
          <a
            className="icon icon-zap"
            onClick={interrupt.bind(this, kernel)}
            title="Interrupt kernel"
            key={key + "interrupt"}
          />,
          <a
            className="icon icon-sync"
            onClick={restart.bind(this, kernel)}
            title="Restart kernel"
            key={key + "restart"}
          />,
          <a
            className="icon icon-trashcan"
            onClick={shutdown.bind(this, kernel)}
            title="Shutdown kernel"
            key={key + "shutdown"}
          />
        ];
      },
      width: 150
    },
    {
      Header: "Files",
      accessor: "files",
      Cell: props => {
        return props.value.map((filePath, index) => {
          const separator = index === 0 ? "" : "  |  ";
          const body = isUnsavedFilePath(filePath) ? (
            <a
              onClick={openUnsavedEditor.bind(this, filePath)}
              title="Jump to file"
              key={filePath + "jump"}
            >
              {filePath}
            </a>
          ) : (
            <a
              onClick={openEditor.bind(this, filePath)}
              title="Jump to file"
              key={filePath + "jump"}
            >
              {tildify(filePath)}
            </a>
          );
          return (
            <div style={{ display: "-webkit-inline-box" }} key={filePath}>
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

KernelMonitor.displayName = "KernelMonitor";
export default KernelMonitor;
