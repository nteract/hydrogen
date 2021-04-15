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
const lodash_1 = __importDefault(require("lodash"));
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
    const data = lodash_1.default.map(store.runningKernels, (kernel, key) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1vbml0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY29tcG9uZW50cy9rZXJuZWwtbW9uaXRvci50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJEQUE2RDtBQUU3RCwyQ0FBc0M7QUFDdEMsb0RBQXVCO0FBQ3ZCLHNEQUE4QjtBQUc5QixvQ0FBNkM7QUFHN0MsTUFBTSxjQUFjLEdBQUcsQ0FBQyxVQUFjLEVBQUUsRUFBRTtJQUN4QyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRTtRQUNsRCxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzQyxXQUFXLEVBQUUsSUFBSTtLQUNsQixDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFRixNQUFNLFNBQVMsR0FBRyxDQUFDLE1BQWMsRUFBRSxFQUFFO0lBQ25DLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNyQixDQUFDLENBQUM7QUFFRixNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQWMsRUFBRSxFQUFFO0lBQ2xDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNsQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbkIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtJQUNqQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQztBQUlGLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUU7SUFDN0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUM3RCxNQUFNLEtBQUssR0FBRyxRQUFRLENB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SUFBSSxDQUNELENBQ1AsQ0FBQztnQkFDSixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLFVBQVUsRUFBRSxVQUFVO2FBQ3ZCO1NBQ0Y7S0FDRixDQUFDO0lBQ0YsT0FBTyw4QkFBQyxxQkFBVSxJQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sR0FBSSxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDO0FBQ0gsYUFBYSxDQUFDLFdBQVcsR0FBRyxlQUFlLENBQUM7QUFDNUMsa0JBQWUsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFJlYWN0VGFibGUsIHsgUmVhY3RUYWJsZURlZmF1bHRzIH0gZnJvbSBcInJlYWN0LXRhYmxlXCI7XG5cbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB0aWxkaWZ5IGZyb20gXCJ0aWxkaWZ5XCI7XG50eXBlIHN0b3JlID0gdHlwZW9mIGltcG9ydChcIi4uL3N0b3JlXCIpLmRlZmF1bHQ7XG5pbXBvcnQgS2VybmVsIGZyb20gXCIuLi9rZXJuZWxcIjtcbmltcG9ydCB7IGlzVW5zYXZlZEZpbGVQYXRoIH0gZnJvbSBcIi4uL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IEtlcm5lbHNwZWNNZXRhZGF0YSB9IGZyb20gXCJAbnRlcmFjdC90eXBlc1wiO1xuXG5jb25zdCBzaG93S2VybmVsU3BlYyA9IChrZXJuZWxTcGVjOiB7fSkgPT4ge1xuICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIkh5ZHJvZ2VuOiBLZXJuZWwgU3BlY1wiLCB7XG4gICAgZGV0YWlsOiBKU09OLnN0cmluZ2lmeShrZXJuZWxTcGVjLCBudWxsLCAyKSxcbiAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgfSk7XG59O1xuXG5jb25zdCBpbnRlcnJ1cHQgPSAoa2VybmVsOiBLZXJuZWwpID0+IHtcbiAga2VybmVsLmludGVycnVwdCgpO1xufTtcblxuY29uc3Qgc2h1dGRvd24gPSAoa2VybmVsOiBLZXJuZWwpID0+IHtcbiAga2VybmVsLnNodXRkb3duKCk7XG4gIGtlcm5lbC5kZXN0cm95KCk7XG59O1xuXG5jb25zdCByZXN0YXJ0ID0gKGtlcm5lbDogS2VybmVsKSA9PiB7XG4gIGtlcm5lbC5yZXN0YXJ0KHVuZGVmaW5lZCk7XG59O1xuXG4vLyBAVE9ETyBJZiBvdXIgc3RvcmUgaG9sZHMgZWRpdG9yIElEcyBpbnN0ZWFkIG9mIGZpbGUgcGF0aHMsIHRoZXNlIG1lc3N5IG1hdGNoaW5nIHN0dWZmIGJlbG93IHdvdWxkXG4vLyAgICAgICBlYXNpbHkgYmUgcmVwbGFjZWQgYnkgc2ltcGxlciBjb2RlLiBTZWUgYWxzbyBjb21wb25lbnRzL2tlcm5lbC1tb25pdG9yLmpzIGZvciB0aGlzIHByb2JsZW0uXG5jb25zdCBvcGVuVW5zYXZlZEVkaXRvciA9IChmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZmluZCgoZWRpdG9yKSA9PiB7XG4gICAgY29uc3QgbWF0Y2ggPSBmaWxlUGF0aC5tYXRjaCgvXFxkKy8pO1xuXG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBTdHJpbmcoZWRpdG9yLmlkKSA9PT0gbWF0Y2hbMF07XG4gIH0pO1xuICAvLyBUaGlzIHBhdGggd29uJ3QgaGFwcGVuIGFmdGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L2h5ZHJvZ2VuL3B1bGwvMTY2MiBzaW5jZSBldmVyeSBkZWxldGVkXG4gIC8vIGVkaXRvcnMgd291bGQgYmUgZGVsZXRlZCBmcm9tIGBzdG9yZS5rZXJuZWxNYXBwaW5nYC4gSnVzdCBrZXB0IGhlcmUgZm9yIHNhZmV0eS5cbiAgaWYgKCFlZGl0b3IpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgYXRvbS53b3Jrc3BhY2Uub3BlbihlZGl0b3IsIHtcbiAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZSxcbiAgfSk7XG59O1xuXG5jb25zdCBvcGVuRWRpdG9yID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgYXRvbS53b3Jrc3BhY2VcbiAgICAub3BlbihmaWxlUGF0aCwge1xuICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiSHlkcm9nZW5cIiwge1xuICAgICAgICBkZXNjcmlwdGlvbjogZXJyLFxuICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG50eXBlIEtlcm5lbEluZm8gPSB7XG4gIHZhbHVlOiB7XG4gICAgZGlzcGxheU5hbWU6IHN0cmluZztcbiAgICBrZXJuZWxTcGVjOiBLZXJuZWxzcGVjTWV0YWRhdGE7XG4gIH07XG59O1xuXG5jb25zdCBrZXJuZWxJbmZvQ2VsbCA9IChwcm9wczogS2VybmVsSW5mbykgPT4ge1xuICBjb25zdCB7IGRpc3BsYXlOYW1lLCBrZXJuZWxTcGVjIH0gPSBwcm9wcy52YWx1ZTtcbiAgcmV0dXJuIChcbiAgICA8YVxuICAgICAgY2xhc3NOYW1lPVwiaWNvblwiXG4gICAgICBvbkNsaWNrPXtzaG93S2VybmVsU3BlYy5iaW5kKHRoaXMsIGtlcm5lbFNwZWMpfVxuICAgICAgdGl0bGU9XCJTaG93IGtlcm5lbCBzcGVjXCJcbiAgICAgIGtleT17YCR7ZGlzcGxheU5hbWV9a2VybmVsSW5mb2B9XG4gICAgPlxuICAgICAge2Rpc3BsYXlOYW1lfVxuICAgIDwvYT5cbiAgKTtcbn07XG5cbi8vIFNldCBkZWZhdWx0IHByb3BlcnRpZXMgb2YgUmVhY3QtVGFibGVcbk9iamVjdC5hc3NpZ24oUmVhY3RUYWJsZURlZmF1bHRzLCB7XG4gIGNsYXNzTmFtZTogXCJrZXJuZWwtbW9uaXRvclwiLFxuICBzaG93UGFnaW5hdGlvbjogZmFsc2UsXG59KTtcbk9iamVjdC5hc3NpZ24oUmVhY3RUYWJsZURlZmF1bHRzLmNvbHVtbiwge1xuICBjbGFzc05hbWU6IFwidGFibGUtY2VsbFwiLFxuICBoZWFkZXJDbGFzc05hbWU6IFwidGFibGUtaGVhZGVyXCIsXG4gIHN0eWxlOiB7XG4gICAgdGV4dEFsaWduOiBcImNlbnRlclwiLFxuICB9LFxufSk7XG5jb25zdCBLZXJuZWxNb25pdG9yID0gb2JzZXJ2ZXIoKHsgc3RvcmUgfTogeyBzdG9yZTogc3RvcmUgfSkgPT4ge1xuICBpZiAoc3RvcmUucnVubmluZ0tlcm5lbHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDx1bCBjbGFzc05hbWU9XCJiYWNrZ3JvdW5kLW1lc3NhZ2UgY2VudGVyZWRcIj5cbiAgICAgICAgPGxpPk5vIHJ1bm5pbmcga2VybmVsczwvbGk+XG4gICAgICA8L3VsPlxuICAgICk7XG4gIH1cblxuICBjb25zdCBkYXRhID0gXy5tYXAoc3RvcmUucnVubmluZ0tlcm5lbHMsIChrZXJuZWwsIGtleTogbnVtYmVyKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdhdGV3YXk6IGtlcm5lbC50cmFuc3BvcnQuZ2F0ZXdheU5hbWUgfHwgXCJMb2NhbFwiLFxuICAgICAga2VybmVsSW5mbzoge1xuICAgICAgICBkaXNwbGF5TmFtZToga2VybmVsLmRpc3BsYXlOYW1lLFxuICAgICAgICBrZXJuZWxTcGVjOiBrZXJuZWwua2VybmVsU3BlYyxcbiAgICAgIH0sXG4gICAgICBzdGF0dXM6IGtlcm5lbC5leGVjdXRpb25TdGF0ZSxcbiAgICAgIGV4ZWN1dGlvbkNvdW50OiBrZXJuZWwuZXhlY3V0aW9uQ291bnQsXG4gICAgICBsYXN0RXhlY3V0aW9uVGltZToga2VybmVsLmxhc3RFeGVjdXRpb25UaW1lLFxuICAgICAga2VybmVsS2V5OiB7XG4gICAgICAgIGtlcm5lbCxcbiAgICAgICAga2V5OiBTdHJpbmcoa2V5KSxcbiAgICAgIH0sXG4gICAgICBmaWxlczogc3RvcmUuZ2V0RmlsZXNGb3JLZXJuZWwoa2VybmVsKSxcbiAgICB9O1xuICB9KTtcblxuICBjb25zdCBjb2x1bW5zID0gW1xuICAgIHtcbiAgICAgIEhlYWRlcjogXCJHYXRld2F5XCIsXG4gICAgICBhY2Nlc3NvcjogXCJnYXRld2F5XCIsXG4gICAgICBtYXhXaWR0aDogMTI1LFxuICAgIH0sXG4gICAge1xuICAgICAgSGVhZGVyOiBcIktlcm5lbFwiLFxuICAgICAgYWNjZXNzb3I6IFwia2VybmVsSW5mb1wiLFxuICAgICAgQ2VsbDoga2VybmVsSW5mb0NlbGwsXG4gICAgICBtYXhXaWR0aDogMTI1LFxuICAgIH0sXG4gICAge1xuICAgICAgSGVhZGVyOiBcIlN0YXR1c1wiLFxuICAgICAgYWNjZXNzb3I6IFwic3RhdHVzXCIsXG4gICAgICBtYXhXaWR0aDogMTAwLFxuICAgIH0sXG4gICAge1xuICAgICAgSGVhZGVyOiBcIkNvdW50XCIsXG4gICAgICBhY2Nlc3NvcjogXCJleGVjdXRpb25Db3VudFwiLFxuICAgICAgbWF4V2lkdGg6IDUwLFxuICAgICAgc3R5bGU6IHtcbiAgICAgICAgdGV4dEFsaWduOiBcInJpZ2h0XCIsXG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgSGVhZGVyOiBcIkxhc3QgRXhlYyBUaW1lXCIsXG4gICAgICBhY2Nlc3NvcjogXCJsYXN0RXhlY3V0aW9uVGltZVwiLFxuICAgICAgbWF4V2lkdGg6IDEwMCxcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIHRleHRBbGlnbjogXCJyaWdodFwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIEhlYWRlcjogXCJNYW5hZ2VtZW50c1wiLFxuICAgICAgYWNjZXNzb3I6IFwia2VybmVsS2V5XCIsXG4gICAgICBDZWxsOiAocHJvcHMpID0+IHtcbiAgICAgICAgY29uc3QgeyBrZXJuZWwsIGtleSB9ID0gcHJvcHMudmFsdWU7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgPGFcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImljb24gaWNvbi16YXBcIlxuICAgICAgICAgICAgb25DbGljaz17aW50ZXJydXB0LmJpbmQodGhpcywga2VybmVsKX1cbiAgICAgICAgICAgIHRpdGxlPVwiSW50ZXJydXB0IGtlcm5lbFwiXG4gICAgICAgICAgICBrZXk9e2Ake2tleX1pbnRlcnJ1cHRgfVxuICAgICAgICAgIC8+LFxuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uIGljb24tc3luY1wiXG4gICAgICAgICAgICBvbkNsaWNrPXtyZXN0YXJ0LmJpbmQodGhpcywga2VybmVsKX1cbiAgICAgICAgICAgIHRpdGxlPVwiUmVzdGFydCBrZXJuZWxcIlxuICAgICAgICAgICAga2V5PXtgJHtrZXl9cmVzdGFydGB9XG4gICAgICAgICAgLz4sXG4gICAgICAgICAgPGFcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImljb24gaWNvbi10cmFzaGNhblwiXG4gICAgICAgICAgICBvbkNsaWNrPXtzaHV0ZG93bi5iaW5kKHRoaXMsIGtlcm5lbCl9XG4gICAgICAgICAgICB0aXRsZT1cIlNodXRkb3duIGtlcm5lbFwiXG4gICAgICAgICAgICBrZXk9e2Ake2tleX1zaHV0ZG93bmB9XG4gICAgICAgICAgLz4sXG4gICAgICAgIF07XG4gICAgICB9LFxuICAgICAgd2lkdGg6IDE1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgIEhlYWRlcjogXCJGaWxlc1wiLFxuICAgICAgYWNjZXNzb3I6IFwiZmlsZXNcIixcbiAgICAgIENlbGw6IChwcm9wcykgPT4ge1xuICAgICAgICByZXR1cm4gcHJvcHMudmFsdWUubWFwKChmaWxlUGF0aCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBjb25zdCBzZXBhcmF0b3IgPSBpbmRleCA9PT0gMCA/IFwiXCIgOiBcIiAgfCAgXCI7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGlzVW5zYXZlZEZpbGVQYXRoKGZpbGVQYXRoKSA/IChcbiAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e29wZW5VbnNhdmVkRWRpdG9yLmJpbmQodGhpcywgZmlsZVBhdGgpfVxuICAgICAgICAgICAgICB0aXRsZT1cIkp1bXAgdG8gZmlsZVwiXG4gICAgICAgICAgICAgIGtleT17YCR7ZmlsZVBhdGh9anVtcGB9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtmaWxlUGF0aH1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgb25DbGljaz17b3BlbkVkaXRvci5iaW5kKHRoaXMsIGZpbGVQYXRoKX1cbiAgICAgICAgICAgICAgdGl0bGU9XCJKdW1wIHRvIGZpbGVcIlxuICAgICAgICAgICAgICBrZXk9e2Ake2ZpbGVQYXRofWp1bXBgfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7dGlsZGlmeShmaWxlUGF0aCl9XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IFwiLXdlYmtpdC1pbmxpbmUtYm94XCIsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGtleT17ZmlsZVBhdGh9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtzZXBhcmF0b3J9XG4gICAgICAgICAgICAgIHtib2R5fVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgc3R5bGU6IHtcbiAgICAgICAgdGV4dEFsaWduOiBcImNlbnRlclwiLFxuICAgICAgICB3aGl0ZVNwYWNlOiBcInByZS13cmFwXCIsXG4gICAgICB9LFxuICAgIH0sXG4gIF07XG4gIHJldHVybiA8UmVhY3RUYWJsZSBkYXRhPXtkYXRhfSBjb2x1bW5zPXtjb2x1bW5zfSAvPjtcbn0pO1xuS2VybmVsTW9uaXRvci5kaXNwbGF5TmFtZSA9IFwiS2VybmVsTW9uaXRvclwiO1xuZXhwb3J0IGRlZmF1bHQgS2VybmVsTW9uaXRvcjtcbiJdfQ==