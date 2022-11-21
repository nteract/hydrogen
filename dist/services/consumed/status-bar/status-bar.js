"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarConsumer = void 0;
const react_1 = __importDefault(require("react"));
const atom_1 = require("atom");
const status_bar_component_1 = __importDefault(require("./status-bar-component"));
const signal_list_view_1 = __importDefault(require("./signal-list-view"));
const utils_1 = require("../../../utils");
class StatusBarConsumer {
    addStatusBar(store, statusBar, handleKernelCommand) {
        const statusBarElement = document.createElement("div");
        statusBarElement.classList.add("inline-block", "hydrogen");
        const statusBarTile = statusBar.addLeftTile({
            item: statusBarElement,
            priority: 100,
        });
        const onClick = (store) => {
            this.showKernelCommands(store, handleKernelCommand);
        };
        (0, utils_1.reactFactory)(react_1.default.createElement(status_bar_component_1.default, { store: store, onClick: onClick }), statusBarElement);
        const disposable = new atom_1.Disposable(() => statusBarTile.destroy());
        store.subscriptions.add(disposable);
        return disposable;
    }
    showKernelCommands(store, handleKernelCommand) {
        let signalListView = this.signalListView;
        if (!signalListView) {
            signalListView = new signal_list_view_1.default(store, handleKernelCommand);
            this.signalListView = signalListView;
        }
        else {
            signalListView.store = store;
        }
        signalListView.toggle();
    }
}
exports.StatusBarConsumer = StatusBarConsumer;
const statusBarConsumer = new StatusBarConsumer();
exports.default = statusBarConsumer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLWJhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9zZXJ2aWNlcy9jb25zdW1lZC9zdGF0dXMtYmFyL3N0YXR1cy1iYXIudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwrQkFBa0M7QUFFbEMsa0ZBQStDO0FBQy9DLDBFQUFnRDtBQUNoRCwwQ0FBOEM7QUFHOUMsTUFBYSxpQkFBaUI7SUFHNUIsWUFBWSxDQUNWLEtBQVksRUFDWixTQUF3QixFQUN4QixtQkFBaUQ7UUFFakQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDMUMsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixRQUFRLEVBQUUsR0FBRztTQUNkLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQztRQUVGLElBQUEsb0JBQVksRUFDViw4QkFBQyw4QkFBUyxJQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sR0FBSSxFQUM3QyxnQkFBZ0IsQ0FDakIsQ0FBQztRQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksaUJBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNqRSxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwQyxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsa0JBQWtCLENBQ2hCLEtBQVksRUFDWixtQkFBaUQ7UUFFakQsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUV6QyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ25CLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7U0FDdEM7YUFBTTtZQUNMLGNBQWMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQzlCO1FBRUQsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzFCLENBQUM7Q0FDRjtBQTNDRCw4Q0EyQ0M7QUFDRCxNQUFNLGlCQUFpQixHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztBQUNsRCxrQkFBZSxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IERpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgU3RhdHVzQmFyIGFzIEF0b21TdGF0dXNCYXIgfSBmcm9tIFwiYXRvbS9zdGF0dXMtYmFyXCI7XG5pbXBvcnQgU3RhdHVzQmFyIGZyb20gXCIuL3N0YXR1cy1iYXItY29tcG9uZW50XCI7XG5pbXBvcnQgU2lnbmFsTGlzdFZpZXcgZnJvbSBcIi4vc2lnbmFsLWxpc3Qtdmlld1wiO1xuaW1wb3J0IHsgcmVhY3RGYWN0b3J5IH0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSBcIi4uLy4uLy4uL3N0b3JlXCI7XG5cbmV4cG9ydCBjbGFzcyBTdGF0dXNCYXJDb25zdW1lciB7XG4gIHNpZ25hbExpc3RWaWV3OiBTaWduYWxMaXN0VmlldztcblxuICBhZGRTdGF0dXNCYXIoXG4gICAgc3RvcmU6IFN0b3JlLFxuICAgIHN0YXR1c0JhcjogQXRvbVN0YXR1c0JhcixcbiAgICBoYW5kbGVLZXJuZWxDb21tYW5kOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55XG4gICkge1xuICAgIGNvbnN0IHN0YXR1c0JhckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHN0YXR1c0JhckVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiLCBcImh5ZHJvZ2VuXCIpO1xuICAgIGNvbnN0IHN0YXR1c0JhclRpbGUgPSBzdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgaXRlbTogc3RhdHVzQmFyRWxlbWVudCxcbiAgICAgIHByaW9yaXR5OiAxMDAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBvbkNsaWNrID0gKHN0b3JlOiBTdG9yZSkgPT4ge1xuICAgICAgdGhpcy5zaG93S2VybmVsQ29tbWFuZHMoc3RvcmUsIGhhbmRsZUtlcm5lbENvbW1hbmQpO1xuICAgIH07XG5cbiAgICByZWFjdEZhY3RvcnkoXG4gICAgICA8U3RhdHVzQmFyIHN0b3JlPXtzdG9yZX0gb25DbGljaz17b25DbGlja30gLz4sXG4gICAgICBzdGF0dXNCYXJFbGVtZW50XG4gICAgKTtcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IERpc3Bvc2FibGUoKCkgPT4gc3RhdHVzQmFyVGlsZS5kZXN0cm95KCkpO1xuICAgIHN0b3JlLnN1YnNjcmlwdGlvbnMuYWRkKGRpc3Bvc2FibGUpO1xuICAgIHJldHVybiBkaXNwb3NhYmxlO1xuICB9XG5cbiAgc2hvd0tlcm5lbENvbW1hbmRzKFxuICAgIHN0b3JlOiBTdG9yZSxcbiAgICBoYW5kbGVLZXJuZWxDb21tYW5kOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55XG4gICkge1xuICAgIGxldCBzaWduYWxMaXN0VmlldyA9IHRoaXMuc2lnbmFsTGlzdFZpZXc7XG5cbiAgICBpZiAoIXNpZ25hbExpc3RWaWV3KSB7XG4gICAgICBzaWduYWxMaXN0VmlldyA9IG5ldyBTaWduYWxMaXN0VmlldyhzdG9yZSwgaGFuZGxlS2VybmVsQ29tbWFuZCk7XG4gICAgICB0aGlzLnNpZ25hbExpc3RWaWV3ID0gc2lnbmFsTGlzdFZpZXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNpZ25hbExpc3RWaWV3LnN0b3JlID0gc3RvcmU7XG4gICAgfVxuXG4gICAgc2lnbmFsTGlzdFZpZXcudG9nZ2xlKCk7XG4gIH1cbn1cbmNvbnN0IHN0YXR1c0JhckNvbnN1bWVyID0gbmV3IFN0YXR1c0JhckNvbnN1bWVyKCk7XG5leHBvcnQgZGVmYXVsdCBzdGF0dXNCYXJDb25zdW1lcjtcbiJdfQ==