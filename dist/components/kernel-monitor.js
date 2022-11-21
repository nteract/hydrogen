"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_table_1 = __importStar(require("react-table"));
const mobx_react_1 = require("mobx-react");
const tildify_1 = __importDefault(require("tildify"));
const utils_1 = require("../utils");
const showKernelSpec = (kernelSpec) => {
    atom.notifications.addInfo("Hydrogen: Kernel Spec", {
        detail: JSON.stringify(kernelSpec, null, 2),
        dismissable: true,
    });
};
const interrupt = (kernel) => {
    kernel.interrupt();
};
const shutdown = (kernel) => {
    kernel.shutdown();
    kernel.destroy();
};
const restart = (kernel) => {
    kernel.restart(undefined);
};
const openUnsavedEditor = (filePath) => {
    const editor = atom.workspace.getTextEditors().find((editor) => {
        const match = filePath.match(/\d+/);
        if (!match) {
            return false;
        }
        return String(editor.id) === match[0];
    });
    if (!editor) {
        return;
    }
    atom.workspace.open(editor, {
        searchAllPanes: true,
    });
};
const openEditor = (filePath) => {
    atom.workspace
        .open(filePath, {
        searchAllPanes: true,
    })
        .catch((err) => {
        atom.notifications.addError("Hydrogen", {
            description: err,
        });
    });
};
const kernelInfoCell = (props) => {
    const { displayName, kernelSpec } = props.value;
    return (react_1.default.createElement("a", { className: "icon", onClick: showKernelSpec.bind(this, kernelSpec), title: "Show kernel spec", key: `${displayName}kernelInfo` }, displayName));
};
Object.assign(react_table_1.ReactTableDefaults, {
    className: "kernel-monitor",
    showPagination: false,
});
Object.assign(react_table_1.ReactTableDefaults.column, {
    className: "table-cell",
    headerClassName: "table-header",
    style: {
        textAlign: "center",
    },
});
const KernelMonitor = (0, mobx_react_1.observer)(({ store }) => {
    if (store.runningKernels.length === 0) {
        return (react_1.default.createElement("ul", { className: "background-message centered" },
            react_1.default.createElement("li", null, "No running kernels")));
    }
    const data = store.runningKernels.map((kernel, key) => {
        return {
            gateway: kernel.transport.gatewayName || "Local",
            kernelInfo: {
                displayName: kernel.displayName,
                kernelSpec: kernel.kernelSpec,
            },
            status: kernel.executionState,
            executionCount: kernel.executionCount,
            lastExecutionTime: kernel.lastExecutionTime,
            kernelKey: {
                kernel,
                key: String(key),
            },
            files: store.getFilesForKernel(kernel),
        };
    });
    const columns = [
        {
            Header: "Gateway",
            accessor: "gateway",
            maxWidth: 125,
        },
        {
            Header: "Kernel",
            accessor: "kernelInfo",
            Cell: kernelInfoCell,
            maxWidth: 125,
        },
        {
            Header: "Status",
            accessor: "status",
            maxWidth: 100,
        },
        {
            Header: "Count",
            accessor: "executionCount",
            maxWidth: 50,
            style: {
                textAlign: "right",
            },
        },
        {
            Header: "Last Exec Time",
            accessor: "lastExecutionTime",
            maxWidth: 100,
            style: {
                textAlign: "right",
            },
        },
        {
            Header: "Managements",
            accessor: "kernelKey",
            Cell: (props) => {
                const { kernel, key } = props.value;
                return [
                    react_1.default.createElement("a", { className: "icon icon-zap", onClick: interrupt.bind(this, kernel), title: "Interrupt kernel", key: `${key}interrupt` }),
                    react_1.default.createElement("a", { className: "icon icon-sync", onClick: restart.bind(this, kernel), title: "Restart kernel", key: `${key}restart` }),
                    react_1.default.createElement("a", { className: "icon icon-trashcan", onClick: shutdown.bind(this, kernel), title: "Shutdown kernel", key: `${key}shutdown` }),
                ];
            },
            width: 150,
        },
        {
            Header: "Files",
            accessor: "files",
            Cell: (props) => {
                return props.value.map((filePath, index) => {
                    const separator = index === 0 ? "" : "  |  ";
                    const body = (0, utils_1.isUnsavedFilePath)(filePath) ? (react_1.default.createElement("a", { onClick: openUnsavedEditor.bind(this, filePath), title: "Jump to file", key: `${filePath}jump` }, filePath)) : (react_1.default.createElement("a", { onClick: openEditor.bind(this, filePath), title: "Jump to file", key: `${filePath}jump` }, (0, tildify_1.default)(filePath)));
                    return (react_1.default.createElement("div", { style: {
                            display: "-webkit-inline-box",
                        }, key: filePath },
                        separator,
                        body));
                });
            },
            style: {
                textAlign: "center",
                whiteSpace: "pre-wrap",
            },
        },
    ];
    return react_1.default.createElement(react_table_1.default, { data: data, columns: columns });
});
KernelMonitor.displayName = "KernelMonitor";
exports.default = KernelMonitor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1vbml0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY29tcG9uZW50cy9rZXJuZWwtbW9uaXRvci50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwyREFBNkQ7QUFFN0QsMkNBQXNDO0FBQ3RDLHNEQUE4QjtBQUc5QixvQ0FBNkM7QUFHN0MsTUFBTSxjQUFjLEdBQUcsQ0FBQyxVQUFjLEVBQUUsRUFBRTtJQUN4QyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRTtRQUNsRCxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzQyxXQUFXLEVBQUUsSUFBSTtLQUNsQixDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFRixNQUFNLFNBQVMsR0FBRyxDQUFDLE1BQWMsRUFBRSxFQUFFO0lBQ25DLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNyQixDQUFDLENBQUM7QUFFRixNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQWMsRUFBRSxFQUFFO0lBQ2xDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNsQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbkIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtJQUNqQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQztBQUlGLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUU7SUFDN0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUM3RCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxD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Q0FDRCxDQUNQLENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQ0QsS0FBSyxFQUFFO2dCQUNMLFNBQVMsRUFBRSxRQUFRO2dCQUNuQixVQUFVLEVBQUUsVUFBVTthQUN2QjtTQUNGO0tBQ0YsQ0FBQztJQUNGLE9BQU8sOEJBQUMscUJBQVUsSUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEdBQUksQ0FBQztBQUN0RCxDQUFDLENBQUMsQ0FBQztBQUNILGFBQWEsQ0FBQyxXQUFXLEdBQUcsZUFBZSxDQUFDO0FBQzVDLGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBSZWFjdFRhYmxlLCB7IFJlYWN0VGFibGVEZWZhdWx0cyB9IGZyb20gXCJyZWFjdC10YWJsZVwiO1xuXG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQgdGlsZGlmeSBmcm9tIFwidGlsZGlmeVwiO1xudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi9zdG9yZVwiKS5kZWZhdWx0O1xuaW1wb3J0IEtlcm5lbCBmcm9tIFwiLi4va2VybmVsXCI7XG5pbXBvcnQgeyBpc1Vuc2F2ZWRGaWxlUGF0aCB9IGZyb20gXCIuLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcblxuY29uc3Qgc2hvd0tlcm5lbFNwZWMgPSAoa2VybmVsU3BlYzoge30pID0+IHtcbiAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJIeWRyb2dlbjogS2VybmVsIFNwZWNcIiwge1xuICAgIGRldGFpbDogSlNPTi5zdHJpbmdpZnkoa2VybmVsU3BlYywgbnVsbCwgMiksXG4gICAgZGlzbWlzc2FibGU6IHRydWUsXG4gIH0pO1xufTtcblxuY29uc3QgaW50ZXJydXB0ID0gKGtlcm5lbDogS2VybmVsKSA9PiB7XG4gIGtlcm5lbC5pbnRlcnJ1cHQoKTtcbn07XG5cbmNvbnN0IHNodXRkb3duID0gKGtlcm5lbDogS2VybmVsKSA9PiB7XG4gIGtlcm5lbC5zaHV0ZG93bigpO1xuICBrZXJuZWwuZGVzdHJveSgpO1xufTtcblxuY29uc3QgcmVzdGFydCA9IChrZXJuZWw6IEtlcm5lbCkgPT4ge1xuICBrZXJuZWwucmVzdGFydCh1bmRlZmluZWQpO1xufTtcblxuLy8gQFRPRE8gSWYgb3VyIHN0b3JlIGhvbGRzIGVkaXRvciBJRHMgaW5zdGVhZCBvZiBmaWxlIHBhdGhzLCB0aGVzZSBtZXNzeSBtYXRjaGluZyBzdHVmZiBiZWxvdyB3b3VsZFxuLy8gICAgICAgZWFzaWx5IGJlIHJlcGxhY2VkIGJ5IHNpbXBsZXIgY29kZS4gU2VlIGFsc28gY29tcG9uZW50cy9rZXJuZWwtbW9uaXRvci5qcyBmb3IgdGhpcyBwcm9ibGVtLlxuY29uc3Qgb3BlblVuc2F2ZWRFZGl0b3IgPSAoZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpLmZpbmQoKGVkaXRvcikgPT4ge1xuICAgIGNvbnN0IG1hdGNoID0gZmlsZVBhdGgubWF0Y2goL1xcZCsvKTtcblxuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gU3RyaW5nKGVkaXRvci5pZCkgPT09IG1hdGNoWzBdO1xuICB9KTtcbiAgLy8gVGhpcyBwYXRoIHdvbid0IGhhcHBlbiBhZnRlciBodHRwczovL2dpdGh1Yi5jb20vbnRlcmFjdC9oeWRyb2dlbi9wdWxsLzE2NjIgc2luY2UgZXZlcnkgZGVsZXRlZFxuICAvLyBlZGl0b3JzIHdvdWxkIGJlIGRlbGV0ZWQgZnJvbSBgc3RvcmUua2VybmVsTWFwcGluZ2AuIEp1c3Qga2VwdCBoZXJlIGZvciBzYWZldHkuXG4gIGlmICghZWRpdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGF0b20ud29ya3NwYWNlLm9wZW4oZWRpdG9yLCB7XG4gICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXG4gIH0pO1xufTtcblxuY29uc3Qgb3BlbkVkaXRvciA9IChmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gIGF0b20ud29ya3NwYWNlXG4gICAgLm9wZW4oZmlsZVBhdGgsIHtcbiAgICAgIHNlYXJjaEFsbFBhbmVzOiB0cnVlLFxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkh5ZHJvZ2VuXCIsIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGVycixcbiAgICAgIH0pO1xuICAgIH0pO1xufTtcblxudHlwZSBLZXJuZWxJbmZvID0ge1xuICB2YWx1ZToge1xuICAgIGRpc3BsYXlOYW1lOiBzdHJpbmc7XG4gICAga2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhO1xuICB9O1xufTtcblxuY29uc3Qga2VybmVsSW5mb0NlbGwgPSAocHJvcHM6IEtlcm5lbEluZm8pID0+IHtcbiAgY29uc3QgeyBkaXNwbGF5TmFtZSwga2VybmVsU3BlYyB9ID0gcHJvcHMudmFsdWU7XG4gIHJldHVybiAoXG4gICAgPGFcbiAgICAgIGNsYXNzTmFtZT1cImljb25cIlxuICAgICAgb25DbGljaz17c2hvd0tlcm5lbFNwZWMuYmluZCh0aGlzLCBrZXJuZWxTcGVjKX1cbiAgICAgIHRpdGxlPVwiU2hvdyBrZXJuZWwgc3BlY1wiXG4gICAgICBrZXk9e2Ake2Rpc3BsYXlOYW1lfWtlcm5lbEluZm9gfVxuICAgID5cbiAgICAgIHtkaXNwbGF5TmFtZX1cbiAgICA8L2E+XG4gICk7XG59O1xuXG4vLyBTZXQgZGVmYXVsdCBwcm9wZXJ0aWVzIG9mIFJlYWN0LVRhYmxlXG5PYmplY3QuYXNzaWduKFJlYWN0VGFibGVEZWZhdWx0cywge1xuICBjbGFzc05hbWU6IFwia2VybmVsLW1vbml0b3JcIixcbiAgc2hvd1BhZ2luYXRpb246IGZhbHNlLFxufSk7XG5PYmplY3QuYXNzaWduKFJlYWN0VGFibGVEZWZhdWx0cy5jb2x1bW4sIHtcbiAgY2xhc3NOYW1lOiBcInRhYmxlLWNlbGxcIixcbiAgaGVhZGVyQ2xhc3NOYW1lOiBcInRhYmxlLWhlYWRlclwiLFxuICBzdHlsZToge1xuICAgIHRleHRBbGlnbjogXCJjZW50ZXJcIixcbiAgfSxcbn0pO1xuY29uc3QgS2VybmVsTW9uaXRvciA9IG9ic2VydmVyKCh7IHN0b3JlIH06IHsgc3RvcmU6IHN0b3JlIH0pID0+IHtcbiAgaWYgKHN0b3JlLnJ1bm5pbmdLZXJuZWxzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8dWwgY2xhc3NOYW1lPVwiYmFja2dyb3VuZC1tZXNzYWdlIGNlbnRlcmVkXCI+XG4gICAgICAgIDxsaT5ObyBydW5uaW5nIGtlcm5lbHM8L2xpPlxuICAgICAgPC91bD5cbiAgICApO1xuICB9XG5cbiAgY29uc3QgZGF0YSA9IHN0b3JlLnJ1bm5pbmdLZXJuZWxzLm1hcCgoa2VybmVsLCBrZXk6IG51bWJlcikgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBnYXRld2F5OiBrZXJuZWwudHJhbnNwb3J0LmdhdGV3YXlOYW1lIHx8IFwiTG9jYWxcIixcbiAgICAgIGtlcm5lbEluZm86IHtcbiAgICAgICAgZGlzcGxheU5hbWU6IGtlcm5lbC5kaXNwbGF5TmFtZSxcbiAgICAgICAga2VybmVsU3BlYzoga2VybmVsLmtlcm5lbFNwZWMsXG4gICAgICB9LFxuICAgICAgc3RhdHVzOiBrZXJuZWwuZXhlY3V0aW9uU3RhdGUsXG4gICAgICBleGVjdXRpb25Db3VudDoga2VybmVsLmV4ZWN1dGlvbkNvdW50LFxuICAgICAgbGFzdEV4ZWN1dGlvblRpbWU6IGtlcm5lbC5sYXN0RXhlY3V0aW9uVGltZSxcbiAgICAgIGtlcm5lbEtleToge1xuICAgICAgICBrZXJuZWwsXG4gICAgICAgIGtleTogU3RyaW5nKGtleSksXG4gICAgICB9LFxuICAgICAgZmlsZXM6IHN0b3JlLmdldEZpbGVzRm9yS2VybmVsKGtlcm5lbCksXG4gICAgfTtcbiAgfSk7XG5cbiAgY29uc3QgY29sdW1ucyA9IFtcbiAgICB7XG4gICAgICBIZWFkZXI6IFwiR2F0ZXdheVwiLFxuICAgICAgYWNjZXNzb3I6IFwiZ2F0ZXdheVwiLFxuICAgICAgbWF4V2lkdGg6IDEyNSxcbiAgICB9LFxuICAgIHtcbiAgICAgIEhlYWRlcjogXCJLZXJuZWxcIixcbiAgICAgIGFjY2Vzc29yOiBcImtlcm5lbEluZm9cIixcbiAgICAgIENlbGw6IGtlcm5lbEluZm9DZWxsLFxuICAgICAgbWF4V2lkdGg6IDEyNSxcbiAgICB9LFxuICAgIHtcbiAgICAgIEhlYWRlcjogXCJTdGF0dXNcIixcbiAgICAgIGFjY2Vzc29yOiBcInN0YXR1c1wiLFxuICAgICAgbWF4V2lkdGg6IDEwMCxcbiAgICB9LFxuICAgIHtcbiAgICAgIEhlYWRlcjogXCJDb3VudFwiLFxuICAgICAgYWNjZXNzb3I6IFwiZXhlY3V0aW9uQ291bnRcIixcbiAgICAgIG1heFdpZHRoOiA1MCxcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIHRleHRBbGlnbjogXCJyaWdodFwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIEhlYWRlcjogXCJMYXN0IEV4ZWMgVGltZVwiLFxuICAgICAgYWNjZXNzb3I6IFwibGFzdEV4ZWN1dGlvblRpbWVcIixcbiAgICAgIG1heFdpZHRoOiAxMDAsXG4gICAgICBzdHlsZToge1xuICAgICAgICB0ZXh0QWxpZ246IFwicmlnaHRcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBIZWFkZXI6IFwiTWFuYWdlbWVudHNcIixcbiAgICAgIGFjY2Vzc29yOiBcImtlcm5lbEtleVwiLFxuICAgICAgQ2VsbDogKHByb3BzKSA9PiB7XG4gICAgICAgIGNvbnN0IHsga2VybmVsLCBrZXkgfSA9IHByb3BzLnZhbHVlO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uIGljb24temFwXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9e2ludGVycnVwdC5iaW5kKHRoaXMsIGtlcm5lbCl9XG4gICAgICAgICAgICB0aXRsZT1cIkludGVycnVwdCBrZXJuZWxcIlxuICAgICAgICAgICAga2V5PXtgJHtrZXl9aW50ZXJydXB0YH1cbiAgICAgICAgICAvPixcbiAgICAgICAgICA8YVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiaWNvbiBpY29uLXN5bmNcIlxuICAgICAgICAgICAgb25DbGljaz17cmVzdGFydC5iaW5kKHRoaXMsIGtlcm5lbCl9XG4gICAgICAgICAgICB0aXRsZT1cIlJlc3RhcnQga2VybmVsXCJcbiAgICAgICAgICAgIGtleT17YCR7a2V5fXJlc3RhcnRgfVxuICAgICAgICAgIC8+LFxuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uIGljb24tdHJhc2hjYW5cIlxuICAgICAgICAgICAgb25DbGljaz17c2h1dGRvd24uYmluZCh0aGlzLCBrZXJuZWwpfVxuICAgICAgICAgICAgdGl0bGU9XCJTaHV0ZG93biBrZXJuZWxcIlxuICAgICAgICAgICAga2V5PXtgJHtrZXl9c2h1dGRvd25gfVxuICAgICAgICAgIC8+LFxuICAgICAgICBdO1xuICAgICAgfSxcbiAgICAgIHdpZHRoOiAxNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICBIZWFkZXI6IFwiRmlsZXNcIixcbiAgICAgIGFjY2Vzc29yOiBcImZpbGVzXCIsXG4gICAgICBDZWxsOiAocHJvcHMpID0+IHtcbiAgICAgICAgcmV0dXJuIHByb3BzLnZhbHVlLm1hcCgoZmlsZVBhdGgsIGluZGV4KSA9PiB7XG4gICAgICAgICAgY29uc3Qgc2VwYXJhdG9yID0gaW5kZXggPT09IDAgPyBcIlwiIDogXCIgIHwgIFwiO1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBpc1Vuc2F2ZWRGaWxlUGF0aChmaWxlUGF0aCkgPyAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBvbkNsaWNrPXtvcGVuVW5zYXZlZEVkaXRvci5iaW5kKHRoaXMsIGZpbGVQYXRoKX1cbiAgICAgICAgICAgICAgdGl0bGU9XCJKdW1wIHRvIGZpbGVcIlxuICAgICAgICAgICAgICBrZXk9e2Ake2ZpbGVQYXRofWp1bXBgfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7ZmlsZVBhdGh9XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e29wZW5FZGl0b3IuYmluZCh0aGlzLCBmaWxlUGF0aCl9XG4gICAgICAgICAgICAgIHRpdGxlPVwiSnVtcCB0byBmaWxlXCJcbiAgICAgICAgICAgICAga2V5PXtgJHtmaWxlUGF0aH1qdW1wYH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3RpbGRpZnkoZmlsZVBhdGgpfVxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBcIi13ZWJraXQtaW5saW5lLWJveFwiLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBrZXk9e2ZpbGVQYXRofVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7c2VwYXJhdG9yfVxuICAgICAgICAgICAgICB7Ym9keX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIHRleHRBbGlnbjogXCJjZW50ZXJcIixcbiAgICAgICAgd2hpdGVTcGFjZTogXCJwcmUtd3JhcFwiLFxuICAgICAgfSxcbiAgICB9LFxuICBdO1xuICByZXR1cm4gPFJlYWN0VGFibGUgZGF0YT17ZGF0YX0gY29sdW1ucz17Y29sdW1uc30gLz47XG59KTtcbktlcm5lbE1vbml0b3IuZGlzcGxheU5hbWUgPSBcIktlcm5lbE1vbml0b3JcIjtcbmV4cG9ydCBkZWZhdWx0IEtlcm5lbE1vbml0b3I7XG4iXX0=