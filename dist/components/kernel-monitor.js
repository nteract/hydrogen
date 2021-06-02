"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const KernelMonitor = mobx_react_1.observer(({ store }) => {
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
                    const body = utils_1.isUnsavedFilePath(filePath) ? (react_1.default.createElement("a", { onClick: openUnsavedEditor.bind(this, filePath), title: "Jump to file", key: `${filePath}jump` }, filePath)) : (react_1.default.createElement("a", { onClick: openEditor.bind(this, filePath), title: "Jump to file", key: `${filePath}jump` }, tildify_1.default(filePath)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1vbml0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY29tcG9uZW50cy9rZXJuZWwtbW9uaXRvci50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJEQUE2RDtBQUU3RCwyQ0FBc0M7QUFDdEMsc0RBQThCO0FBRzlCLG9DQUE2QztBQUc3QyxNQUFNLGNBQWMsR0FBRyxDQUFDLFVBQWMsRUFBRSxFQUFFO0lBQ3hDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFO1FBQ2xELE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLFdBQVcsRUFBRSxJQUFJO0tBQ2xCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUVGLE1BQU0sU0FBUyxHQUFHLENBQUMsTUFBYyxFQUFFLEVBQUU7SUFDbkMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3JCLENBQUMsQ0FBQztBQUVGLE1BQU0sUUFBUSxHQUFHLENBQUMsTUFBYyxFQUFFLEVBQUU7SUFDbEMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNuQixDQUFDLENBQUM7QUFFRixNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQWMsRUFBRSxFQUFFO0lBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDO0FBSUYsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRTtJQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQzdELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMs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SixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLFVBQVUsRUFBRSxVQUFVO2FBQ3ZCO1NBQ0Y7S0FDRixDQUFDO0lBQ0YsT0FBTyw4QkFBQyxxQkFBVSxJQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sR0FBSSxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDO0FBQ0gsYUFBYSxDQUFDLFdBQVcsR0FBRyxlQUFlLENBQUM7QUFDNUMsa0JBQWUsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xyXG5pbXBvcnQgUmVhY3RUYWJsZSwgeyBSZWFjdFRhYmxlRGVmYXVsdHMgfSBmcm9tIFwicmVhY3QtdGFibGVcIjtcclxuXHJcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcclxuaW1wb3J0IHRpbGRpZnkgZnJvbSBcInRpbGRpZnlcIjtcclxudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi9zdG9yZVwiKS5kZWZhdWx0O1xyXG5pbXBvcnQgS2VybmVsIGZyb20gXCIuLi9rZXJuZWxcIjtcclxuaW1wb3J0IHsgaXNVbnNhdmVkRmlsZVBhdGggfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcclxuXHJcbmNvbnN0IHNob3dLZXJuZWxTcGVjID0gKGtlcm5lbFNwZWM6IHt9KSA9PiB7XHJcbiAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJIeWRyb2dlbjogS2VybmVsIFNwZWNcIiwge1xyXG4gICAgZGV0YWlsOiBKU09OLnN0cmluZ2lmeShrZXJuZWxTcGVjLCBudWxsLCAyKSxcclxuICAgIGRpc21pc3NhYmxlOiB0cnVlLFxyXG4gIH0pO1xyXG59O1xyXG5cclxuY29uc3QgaW50ZXJydXB0ID0gKGtlcm5lbDogS2VybmVsKSA9PiB7XHJcbiAga2VybmVsLmludGVycnVwdCgpO1xyXG59O1xyXG5cclxuY29uc3Qgc2h1dGRvd24gPSAoa2VybmVsOiBLZXJuZWwpID0+IHtcclxuICBrZXJuZWwuc2h1dGRvd24oKTtcclxuICBrZXJuZWwuZGVzdHJveSgpO1xyXG59O1xyXG5cclxuY29uc3QgcmVzdGFydCA9IChrZXJuZWw6IEtlcm5lbCkgPT4ge1xyXG4gIGtlcm5lbC5yZXN0YXJ0KHVuZGVmaW5lZCk7XHJcbn07XHJcblxyXG4vLyBAVE9ETyBJZiBvdXIgc3RvcmUgaG9sZHMgZWRpdG9yIElEcyBpbnN0ZWFkIG9mIGZpbGUgcGF0aHMsIHRoZXNlIG1lc3N5IG1hdGNoaW5nIHN0dWZmIGJlbG93IHdvdWxkXHJcbi8vICAgICAgIGVhc2lseSBiZSByZXBsYWNlZCBieSBzaW1wbGVyIGNvZGUuIFNlZSBhbHNvIGNvbXBvbmVudHMva2VybmVsLW1vbml0b3IuanMgZm9yIHRoaXMgcHJvYmxlbS5cclxuY29uc3Qgb3BlblVuc2F2ZWRFZGl0b3IgPSAoZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZmluZCgoZWRpdG9yKSA9PiB7XHJcbiAgICBjb25zdCBtYXRjaCA9IGZpbGVQYXRoLm1hdGNoKC9cXGQrLyk7XHJcblxyXG4gICAgaWYgKCFtYXRjaCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFN0cmluZyhlZGl0b3IuaWQpID09PSBtYXRjaFswXTtcclxuICB9KTtcclxuICAvLyBUaGlzIHBhdGggd29uJ3QgaGFwcGVuIGFmdGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L2h5ZHJvZ2VuL3B1bGwvMTY2MiBzaW5jZSBldmVyeSBkZWxldGVkXHJcbiAgLy8gZWRpdG9ycyB3b3VsZCBiZSBkZWxldGVkIGZyb20gYHN0b3JlLmtlcm5lbE1hcHBpbmdgLiBKdXN0IGtlcHQgaGVyZSBmb3Igc2FmZXR5LlxyXG4gIGlmICghZWRpdG9yKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGF0b20ud29ya3NwYWNlLm9wZW4oZWRpdG9yLCB7XHJcbiAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZSxcclxuICB9KTtcclxufTtcclxuXHJcbmNvbnN0IG9wZW5FZGl0b3IgPSAoZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gIGF0b20ud29ya3NwYWNlXHJcbiAgICAub3BlbihmaWxlUGF0aCwge1xyXG4gICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZSxcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goKGVycikgPT4ge1xyXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJIeWRyb2dlblwiLCB7XHJcbiAgICAgICAgZGVzY3JpcHRpb246IGVycixcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbnR5cGUgS2VybmVsSW5mbyA9IHtcclxuICB2YWx1ZToge1xyXG4gICAgZGlzcGxheU5hbWU6IHN0cmluZztcclxuICAgIGtlcm5lbFNwZWM6IEtlcm5lbHNwZWNNZXRhZGF0YTtcclxuICB9O1xyXG59O1xyXG5cclxuY29uc3Qga2VybmVsSW5mb0NlbGwgPSAocHJvcHM6IEtlcm5lbEluZm8pID0+IHtcclxuICBjb25zdCB7IGRpc3BsYXlOYW1lLCBrZXJuZWxTcGVjIH0gPSBwcm9wcy52YWx1ZTtcclxuICByZXR1cm4gKFxyXG4gICAgPGFcclxuICAgICAgY2xhc3NOYW1lPVwiaWNvblwiXHJcbiAgICAgIG9uQ2xpY2s9e3Nob3dLZXJuZWxTcGVjLmJpbmQodGhpcywga2VybmVsU3BlYyl9XHJcbiAgICAgIHRpdGxlPVwiU2hvdyBrZXJuZWwgc3BlY1wiXHJcbiAgICAgIGtleT17YCR7ZGlzcGxheU5hbWV9a2VybmVsSW5mb2B9XHJcbiAgICA+XHJcbiAgICAgIHtkaXNwbGF5TmFtZX1cclxuICAgIDwvYT5cclxuICApO1xyXG59O1xyXG5cclxuLy8gU2V0IGRlZmF1bHQgcHJvcGVydGllcyBvZiBSZWFjdC1UYWJsZVxyXG5PYmplY3QuYXNzaWduKFJlYWN0VGFibGVEZWZhdWx0cywge1xyXG4gIGNsYXNzTmFtZTogXCJrZXJuZWwtbW9uaXRvclwiLFxyXG4gIHNob3dQYWdpbmF0aW9uOiBmYWxzZSxcclxufSk7XHJcbk9iamVjdC5hc3NpZ24oUmVhY3RUYWJsZURlZmF1bHRzLmNvbHVtbiwge1xyXG4gIGNsYXNzTmFtZTogXCJ0YWJsZS1jZWxsXCIsXHJcbiAgaGVhZGVyQ2xhc3NOYW1lOiBcInRhYmxlLWhlYWRlclwiLFxyXG4gIHN0eWxlOiB7XHJcbiAgICB0ZXh0QWxpZ246IFwiY2VudGVyXCIsXHJcbiAgfSxcclxufSk7XHJcbmNvbnN0IEtlcm5lbE1vbml0b3IgPSBvYnNlcnZlcigoeyBzdG9yZSB9OiB7IHN0b3JlOiBzdG9yZSB9KSA9PiB7XHJcbiAgaWYgKHN0b3JlLnJ1bm5pbmdLZXJuZWxzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPHVsIGNsYXNzTmFtZT1cImJhY2tncm91bmQtbWVzc2FnZSBjZW50ZXJlZFwiPlxyXG4gICAgICAgIDxsaT5ObyBydW5uaW5nIGtlcm5lbHM8L2xpPlxyXG4gICAgICA8L3VsPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRhdGEgPSBzdG9yZS5ydW5uaW5nS2VybmVscy5tYXAoKGtlcm5lbCwga2V5OiBudW1iZXIpID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGdhdGV3YXk6IGtlcm5lbC50cmFuc3BvcnQuZ2F0ZXdheU5hbWUgfHwgXCJMb2NhbFwiLFxyXG4gICAgICBrZXJuZWxJbmZvOiB7XHJcbiAgICAgICAgZGlzcGxheU5hbWU6IGtlcm5lbC5kaXNwbGF5TmFtZSxcclxuICAgICAgICBrZXJuZWxTcGVjOiBrZXJuZWwua2VybmVsU3BlYyxcclxuICAgICAgfSxcclxuICAgICAgc3RhdHVzOiBrZXJuZWwuZXhlY3V0aW9uU3RhdGUsXHJcbiAgICAgIGV4ZWN1dGlvbkNvdW50OiBrZXJuZWwuZXhlY3V0aW9uQ291bnQsXHJcbiAgICAgIGxhc3RFeGVjdXRpb25UaW1lOiBrZXJuZWwubGFzdEV4ZWN1dGlvblRpbWUsXHJcbiAgICAgIGtlcm5lbEtleToge1xyXG4gICAgICAgIGtlcm5lbCxcclxuICAgICAgICBrZXk6IFN0cmluZyhrZXkpLFxyXG4gICAgICB9LFxyXG4gICAgICBmaWxlczogc3RvcmUuZ2V0RmlsZXNGb3JLZXJuZWwoa2VybmVsKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGNvbHVtbnMgPSBbXHJcbiAgICB7XHJcbiAgICAgIEhlYWRlcjogXCJHYXRld2F5XCIsXHJcbiAgICAgIGFjY2Vzc29yOiBcImdhdGV3YXlcIixcclxuICAgICAgbWF4V2lkdGg6IDEyNSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIEhlYWRlcjogXCJLZXJuZWxcIixcclxuICAgICAgYWNjZXNzb3I6IFwia2VybmVsSW5mb1wiLFxyXG4gICAgICBDZWxsOiBrZXJuZWxJbmZvQ2VsbCxcclxuICAgICAgbWF4V2lkdGg6IDEyNSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIEhlYWRlcjogXCJTdGF0dXNcIixcclxuICAgICAgYWNjZXNzb3I6IFwic3RhdHVzXCIsXHJcbiAgICAgIG1heFdpZHRoOiAxMDAsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBIZWFkZXI6IFwiQ291bnRcIixcclxuICAgICAgYWNjZXNzb3I6IFwiZXhlY3V0aW9uQ291bnRcIixcclxuICAgICAgbWF4V2lkdGg6IDUwLFxyXG4gICAgICBzdHlsZToge1xyXG4gICAgICAgIHRleHRBbGlnbjogXCJyaWdodFwiLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgSGVhZGVyOiBcIkxhc3QgRXhlYyBUaW1lXCIsXHJcbiAgICAgIGFjY2Vzc29yOiBcImxhc3RFeGVjdXRpb25UaW1lXCIsXHJcbiAgICAgIG1heFdpZHRoOiAxMDAsXHJcbiAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgdGV4dEFsaWduOiBcInJpZ2h0XCIsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBIZWFkZXI6IFwiTWFuYWdlbWVudHNcIixcclxuICAgICAgYWNjZXNzb3I6IFwia2VybmVsS2V5XCIsXHJcbiAgICAgIENlbGw6IChwcm9wcykgPT4ge1xyXG4gICAgICAgIGNvbnN0IHsga2VybmVsLCBrZXkgfSA9IHByb3BzLnZhbHVlO1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICA8YVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uIGljb24temFwXCJcclxuICAgICAgICAgICAgb25DbGljaz17aW50ZXJydXB0LmJpbmQodGhpcywga2VybmVsKX1cclxuICAgICAgICAgICAgdGl0bGU9XCJJbnRlcnJ1cHQga2VybmVsXCJcclxuICAgICAgICAgICAga2V5PXtgJHtrZXl9aW50ZXJydXB0YH1cclxuICAgICAgICAgIC8+LFxyXG4gICAgICAgICAgPGFcclxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiaWNvbiBpY29uLXN5bmNcIlxyXG4gICAgICAgICAgICBvbkNsaWNrPXtyZXN0YXJ0LmJpbmQodGhpcywga2VybmVsKX1cclxuICAgICAgICAgICAgdGl0bGU9XCJSZXN0YXJ0IGtlcm5lbFwiXHJcbiAgICAgICAgICAgIGtleT17YCR7a2V5fXJlc3RhcnRgfVxyXG4gICAgICAgICAgLz4sXHJcbiAgICAgICAgICA8YVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uIGljb24tdHJhc2hjYW5cIlxyXG4gICAgICAgICAgICBvbkNsaWNrPXtzaHV0ZG93bi5iaW5kKHRoaXMsIGtlcm5lbCl9XHJcbiAgICAgICAgICAgIHRpdGxlPVwiU2h1dGRvd24ga2VybmVsXCJcclxuICAgICAgICAgICAga2V5PXtgJHtrZXl9c2h1dGRvd25gfVxyXG4gICAgICAgICAgLz4sXHJcbiAgICAgICAgXTtcclxuICAgICAgfSxcclxuICAgICAgd2lkdGg6IDE1MCxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIEhlYWRlcjogXCJGaWxlc1wiLFxyXG4gICAgICBhY2Nlc3NvcjogXCJmaWxlc1wiLFxyXG4gICAgICBDZWxsOiAocHJvcHMpID0+IHtcclxuICAgICAgICByZXR1cm4gcHJvcHMudmFsdWUubWFwKChmaWxlUGF0aCwgaW5kZXgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHNlcGFyYXRvciA9IGluZGV4ID09PSAwID8gXCJcIiA6IFwiICB8ICBcIjtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBpc1Vuc2F2ZWRGaWxlUGF0aChmaWxlUGF0aCkgPyAoXHJcbiAgICAgICAgICAgIDxhXHJcbiAgICAgICAgICAgICAgb25DbGljaz17b3BlblVuc2F2ZWRFZGl0b3IuYmluZCh0aGlzLCBmaWxlUGF0aCl9XHJcbiAgICAgICAgICAgICAgdGl0bGU9XCJKdW1wIHRvIGZpbGVcIlxyXG4gICAgICAgICAgICAgIGtleT17YCR7ZmlsZVBhdGh9anVtcGB9XHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICB7ZmlsZVBhdGh9XHJcbiAgICAgICAgICAgIDwvYT5cclxuICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgIDxhXHJcbiAgICAgICAgICAgICAgb25DbGljaz17b3BlbkVkaXRvci5iaW5kKHRoaXMsIGZpbGVQYXRoKX1cclxuICAgICAgICAgICAgICB0aXRsZT1cIkp1bXAgdG8gZmlsZVwiXHJcbiAgICAgICAgICAgICAga2V5PXtgJHtmaWxlUGF0aH1qdW1wYH1cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIHt0aWxkaWZ5KGZpbGVQYXRoKX1cclxuICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICBzdHlsZT17e1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogXCItd2Via2l0LWlubGluZS1ib3hcIixcclxuICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgIGtleT17ZmlsZVBhdGh9XHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICB7c2VwYXJhdG9yfVxyXG4gICAgICAgICAgICAgIHtib2R5fVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgdGV4dEFsaWduOiBcImNlbnRlclwiLFxyXG4gICAgICAgIHdoaXRlU3BhY2U6IFwicHJlLXdyYXBcIixcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgXTtcclxuICByZXR1cm4gPFJlYWN0VGFibGUgZGF0YT17ZGF0YX0gY29sdW1ucz17Y29sdW1uc30gLz47XHJcbn0pO1xyXG5LZXJuZWxNb25pdG9yLmRpc3BsYXlOYW1lID0gXCJLZXJuZWxNb25pdG9yXCI7XHJcbmV4cG9ydCBkZWZhdWx0IEtlcm5lbE1vbml0b3I7XHJcbiJdfQ==