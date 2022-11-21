"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const watch_1 = __importDefault(require("./watch"));
const utils_1 = require("../../utils");
const Watches = (0, mobx_react_1.observer)(({ store: { kernel } }) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy93YXRjaC1zaWRlYmFyL2luZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQ0FBc0M7QUFDdEMsb0RBQTRCO0FBQzVCLHVDQUF3RDtBQUV4RCxNQUFNLE9BQU8sR0FBRyxJQUFBLHFCQUFRLEVBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFvQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNYLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsRUFBRTtZQUM5QyxPQUFPLDhCQUFDLG9CQUFZLE9BQUcsQ0FBQztTQUN6QjtRQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFXLENBQUMsQ0FBQztRQUNqQyxPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsT0FBTyxDQUNMLHVDQUFLLFNBQVMsRUFBQyx1QkFBdUI7UUFDbkMsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUMxQyw4QkFBQyxlQUFLLElBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUksQ0FDOUMsQ0FBQztRQUNGLHVDQUFLLFNBQVMsRUFBQyxXQUFXO1lBQ3hCLDBDQUNFLFNBQVMsRUFBQyxnQ0FBZ0MsRUFDMUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUSxnQkFHOUI7WUFDVCwwQ0FDRSxTQUFTLEVBQUMsa0NBQWtDLEVBQzVDLE9BQU8sRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsbUJBR2pDLENBQ0wsQ0FDRixDQUNQLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQztBQUNILGtCQUFlLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcbmltcG9ydCBXYXRjaCBmcm9tIFwiLi93YXRjaFwiO1xuaW1wb3J0IHsgV0FUQ0hFU19VUkksIEVtcHR5TWVzc2FnZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi8uLi9zdG9yZVwiKS5kZWZhdWx0O1xuY29uc3QgV2F0Y2hlcyA9IG9ic2VydmVyKCh7IHN0b3JlOiB7IGtlcm5lbCB9IH06IHsgc3RvcmU6IHN0b3JlIH0pID0+IHtcbiAgaWYgKCFrZXJuZWwpIHtcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4ub3V0cHV0QXJlYURvY2tcIikpIHtcbiAgICAgIHJldHVybiA8RW1wdHlNZXNzYWdlIC8+O1xuICAgIH1cblxuICAgIGF0b20ud29ya3NwYWNlLmhpZGUoV0FUQ0hFU19VUkkpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNpZGViYXIgd2F0Y2gtc2lkZWJhclwiPlxuICAgICAge2tlcm5lbC53YXRjaGVzU3RvcmUud2F0Y2hlcy5tYXAoKHdhdGNoKSA9PiAoXG4gICAgICAgIDxXYXRjaCBrZXk9e3dhdGNoLmVkaXRvci5pZH0gc3RvcmU9e3dhdGNofSAvPlxuICAgICAgKSl9XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ0bi1ncm91cFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGljb24gaWNvbi1wbHVzXCJcbiAgICAgICAgICBvbkNsaWNrPXtrZXJuZWwud2F0Y2hlc1N0b3JlLmFkZFdhdGNofVxuICAgICAgICA+XG4gICAgICAgICAgQWRkIHdhdGNoXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1lcnJvciBpY29uIGljb24tdHJhc2hjYW5cIlxuICAgICAgICAgIG9uQ2xpY2s9e2tlcm5lbC53YXRjaGVzU3RvcmUucmVtb3ZlV2F0Y2h9XG4gICAgICAgID5cbiAgICAgICAgICBSZW1vdmUgd2F0Y2hcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn0pO1xuZXhwb3J0IGRlZmF1bHQgV2F0Y2hlcztcbiJdfQ==