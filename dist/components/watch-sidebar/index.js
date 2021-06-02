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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvY29tcG9uZW50cy93YXRjaC1zaWRlYmFyL2luZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQ0FBc0M7QUFDdEMsb0RBQTRCO0FBQzVCLHVDQUF3RDtBQUV4RCxNQUFNLE9BQU8sR0FBRyxxQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBb0IsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLEVBQUU7WUFDOUMsT0FBTyw4QkFBQyxvQkFBWSxPQUFHLENBQUM7U0FDekI7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBVyxDQUFDLENBQUM7UUFDakMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sQ0FDTCx1Q0FBSyxTQUFTLEVBQUMsdUJBQXVCO1FBQ25DLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FDMUMsOEJBQUMsZUFBSyxJQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFJLENBQzlDLENBQUM7UUFDRix1Q0FBSyxTQUFTLEVBQUMsV0FBVztZQUN4QiwwQ0FDRSxTQUFTLEVBQUMsZ0NBQWdDLEVBQzFDLE9BQU8sRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsZ0JBRzlCO1lBQ1QsMENBQ0UsU0FBUyxFQUFDLGtDQUFrQyxFQUM1QyxPQUFPLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLG1CQUdqQyxDQUNMLENBQ0YsQ0FDUCxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUM7QUFDSCxrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XHJcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcclxuaW1wb3J0IFdhdGNoIGZyb20gXCIuL3dhdGNoXCI7XHJcbmltcG9ydCB7IFdBVENIRVNfVVJJLCBFbXB0eU1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi8uLi9zdG9yZVwiKS5kZWZhdWx0O1xyXG5jb25zdCBXYXRjaGVzID0gb2JzZXJ2ZXIoKHsgc3RvcmU6IHsga2VybmVsIH0gfTogeyBzdG9yZTogc3RvcmUgfSkgPT4ge1xyXG4gIGlmICgha2VybmVsKSB7XHJcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwiSHlkcm9nZW4ub3V0cHV0QXJlYURvY2tcIikpIHtcclxuICAgICAgcmV0dXJuIDxFbXB0eU1lc3NhZ2UgLz47XHJcbiAgICB9XHJcblxyXG4gICAgYXRvbS53b3Jrc3BhY2UuaGlkZShXQVRDSEVTX1VSSSk7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNpZGViYXIgd2F0Y2gtc2lkZWJhclwiPlxyXG4gICAgICB7a2VybmVsLndhdGNoZXNTdG9yZS53YXRjaGVzLm1hcCgod2F0Y2gpID0+IChcclxuICAgICAgICA8V2F0Y2gga2V5PXt3YXRjaC5lZGl0b3IuaWR9IHN0b3JlPXt3YXRjaH0gLz5cclxuICAgICAgKSl9XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnRuLWdyb3VwXCI+XHJcbiAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGljb24gaWNvbi1wbHVzXCJcclxuICAgICAgICAgIG9uQ2xpY2s9e2tlcm5lbC53YXRjaGVzU3RvcmUuYWRkV2F0Y2h9XHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgQWRkIHdhdGNoXHJcbiAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1lcnJvciBpY29uIGljb24tdHJhc2hjYW5cIlxyXG4gICAgICAgICAgb25DbGljaz17a2VybmVsLndhdGNoZXNTdG9yZS5yZW1vdmVXYXRjaH1cclxuICAgICAgICA+XHJcbiAgICAgICAgICBSZW1vdmUgd2F0Y2hcclxuICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59KTtcclxuZXhwb3J0IGRlZmF1bHQgV2F0Y2hlcztcclxuIl19