"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const watch_1 = __importDefault(require("./watch"));
const utils_1 = require("../../utils");
const Watches = mobx_react_1.observer(({ store: { kernel } }) => {
    if (!kernel) {
        if (atom.config.get("Hydrogen.outputAreaDock")) {
            return react_1.default.createElement(utils_1.EmptyMessage, null);
        }
        atom.workspace.hide(utils_1.WATCHES_URI);
        return null;
    }
    return (react_1.default.createElement("div", { className: "sidebar watch-sidebar" },
        kernel.watchesStore.watches.map((watch) => (react_1.default.createElement(watch_1.default, { key: watch.editor.id, store: watch }))),
        react_1.default.createElement("div", { className: "btn-group" },
            react_1.default.createElement("button", { className: "btn btn-primary icon icon-plus", onClick: kernel.watchesStore.addWatch }, "Add watch"),
            react_1.default.createElement("button", { className: "btn btn-error icon icon-trashcan", onClick: kernel.watchesStore.removeWatch }, "Remove watch"))));
});
exports.default = Watches;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy93YXRjaC1zaWRlYmFyL2luZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLGtEQUEwQjtBQUMxQiwyQ0FBc0M7QUFDdEMsb0RBQTRCO0FBQzVCLHVDQUF3RDtBQUd4RCxNQUFNLE9BQU8sR0FBRyxxQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBb0IsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLEVBQUU7WUFDOUMsT0FBTyw4QkFBQyxvQkFBWSxPQUFHLENBQUM7U0FDekI7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBVyxDQUFDLENBQUM7UUFDakMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sQ0FDTCx1Q0FBSyxTQUFTLEVBQUMsdUJBQXVCO1FBQ25DLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FDMUMsOEJBQUMsZUFBSyxJQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFJLENBQzlDLENBQUM7UUFDRix1Q0FBSyxTQUFTLEVBQUMsV0FBVztZQUN4QiwwQ0FDRSxTQUFTLEVBQUMsZ0NBQWdDLEVBQzFDLE9BQU8sRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsZ0JBRzlCO1lBQ1QsMENBQ0UsU0FBUyxFQUFDLGtDQUFrQyxFQUM1QyxPQUFPLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLG1CQUdqQyxDQUNMLENBQ0YsQ0FDUCxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUM7QUFDSCxrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcbmltcG9ydCBXYXRjaCBmcm9tIFwiLi93YXRjaFwiO1xuaW1wb3J0IHsgV0FUQ0hFU19VUkksIEVtcHR5TWVzc2FnZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgS2VybmVsIGZyb20gXCIuLi8uLi9rZXJuZWxcIjtcbnR5cGUgc3RvcmUgPSB0eXBlb2YgaW1wb3J0KFwiLi4vLi4vc3RvcmVcIikuZGVmYXVsdDtcbmNvbnN0IFdhdGNoZXMgPSBvYnNlcnZlcigoeyBzdG9yZTogeyBrZXJuZWwgfSB9OiB7IHN0b3JlOiBzdG9yZSB9KSA9PiB7XG4gIGlmICgha2VybmVsKSB7XG4gICAgaWYgKGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLm91dHB1dEFyZWFEb2NrXCIpKSB7XG4gICAgICByZXR1cm4gPEVtcHR5TWVzc2FnZSAvPjtcbiAgICB9XG5cbiAgICBhdG9tLndvcmtzcGFjZS5oaWRlKFdBVENIRVNfVVJJKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzaWRlYmFyIHdhdGNoLXNpZGViYXJcIj5cbiAgICAgIHtrZXJuZWwud2F0Y2hlc1N0b3JlLndhdGNoZXMubWFwKCh3YXRjaCkgPT4gKFxuICAgICAgICA8V2F0Y2gga2V5PXt3YXRjaC5lZGl0b3IuaWR9IHN0b3JlPXt3YXRjaH0gLz5cbiAgICAgICkpfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJidG4tZ3JvdXBcIj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSBpY29uIGljb24tcGx1c1wiXG4gICAgICAgICAgb25DbGljaz17a2VybmVsLndhdGNoZXNTdG9yZS5hZGRXYXRjaH1cbiAgICAgICAgPlxuICAgICAgICAgIEFkZCB3YXRjaFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4tZXJyb3IgaWNvbiBpY29uLXRyYXNoY2FuXCJcbiAgICAgICAgICBvbkNsaWNrPXtrZXJuZWwud2F0Y2hlc1N0b3JlLnJlbW92ZVdhdGNofVxuICAgICAgICA+XG4gICAgICAgICAgUmVtb3ZlIHdhdGNoXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59KTtcbmV4cG9ydCBkZWZhdWx0IFdhdGNoZXM7XG4iXX0=