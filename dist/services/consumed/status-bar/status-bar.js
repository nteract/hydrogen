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
        utils_1.reactFactory(react_1.default.createElement(status_bar_component_1.default, { store: store, onClick: onClick }), statusBarElement);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLWJhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9zZXJ2aWNlcy9jb25zdW1lZC9zdGF0dXMtYmFyL3N0YXR1cy1iYXIudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwrQkFBa0M7QUFFbEMsa0ZBQStDO0FBQy9DLDBFQUFnRDtBQUNoRCwwQ0FBOEM7QUFHOUMsTUFBYSxpQkFBaUI7SUFHNUIsWUFBWSxDQUNWLEtBQVksRUFDWixTQUF3QixFQUN4QixtQkFBaUQ7UUFFakQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDMUMsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixRQUFRLEVBQUUsR0FBRztTQUNkLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQztRQUVGLG9CQUFZLENBQ1YsOEJBQUMsOEJBQVMsSUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEdBQUksRUFDN0MsZ0JBQWdCLENBQ2pCLENBQUM7UUFDRixNQUFNLFVBQVUsR0FBRyxJQUFJLGlCQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDakUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELGtCQUFrQixDQUNoQixLQUFZLEVBQ1osbUJBQWlEO1FBRWpELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFekMsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNuQixjQUFjLEdBQUcsSUFBSSwwQkFBYyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1NBQ3RDO2FBQU07WUFDTCxjQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUM5QjtRQUVELGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxQixDQUFDO0NBQ0Y7QUEzQ0QsOENBMkNDO0FBQ0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7QUFDbEQsa0JBQWUsaUJBQWlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XHJcbmltcG9ydCB7IERpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgeyBTdGF0dXNCYXIgYXMgQXRvbVN0YXR1c0JhciB9IGZyb20gXCJhdG9tL3N0YXR1cy1iYXJcIjtcclxuaW1wb3J0IFN0YXR1c0JhciBmcm9tIFwiLi9zdGF0dXMtYmFyLWNvbXBvbmVudFwiO1xyXG5pbXBvcnQgU2lnbmFsTGlzdFZpZXcgZnJvbSBcIi4vc2lnbmFsLWxpc3Qtdmlld1wiO1xyXG5pbXBvcnQgeyByZWFjdEZhY3RvcnkgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gXCIuLi8uLi8uLi9zdG9yZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFN0YXR1c0JhckNvbnN1bWVyIHtcclxuICBzaWduYWxMaXN0VmlldzogU2lnbmFsTGlzdFZpZXc7XHJcblxyXG4gIGFkZFN0YXR1c0JhcihcclxuICAgIHN0b3JlOiBTdG9yZSxcclxuICAgIHN0YXR1c0JhcjogQXRvbVN0YXR1c0JhcixcclxuICAgIGhhbmRsZUtlcm5lbENvbW1hbmQ6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnlcclxuICApIHtcclxuICAgIGNvbnN0IHN0YXR1c0JhckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgc3RhdHVzQmFyRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIFwiaHlkcm9nZW5cIik7XHJcbiAgICBjb25zdCBzdGF0dXNCYXJUaWxlID0gc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcclxuICAgICAgaXRlbTogc3RhdHVzQmFyRWxlbWVudCxcclxuICAgICAgcHJpb3JpdHk6IDEwMCxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG9uQ2xpY2sgPSAoc3RvcmU6IFN0b3JlKSA9PiB7XHJcbiAgICAgIHRoaXMuc2hvd0tlcm5lbENvbW1hbmRzKHN0b3JlLCBoYW5kbGVLZXJuZWxDb21tYW5kKTtcclxuICAgIH07XHJcblxyXG4gICAgcmVhY3RGYWN0b3J5KFxyXG4gICAgICA8U3RhdHVzQmFyIHN0b3JlPXtzdG9yZX0gb25DbGljaz17b25DbGlja30gLz4sXHJcbiAgICAgIHN0YXR1c0JhckVsZW1lbnRcclxuICAgICk7XHJcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IERpc3Bvc2FibGUoKCkgPT4gc3RhdHVzQmFyVGlsZS5kZXN0cm95KCkpO1xyXG4gICAgc3RvcmUuc3Vic2NyaXB0aW9ucy5hZGQoZGlzcG9zYWJsZSk7XHJcbiAgICByZXR1cm4gZGlzcG9zYWJsZTtcclxuICB9XHJcblxyXG4gIHNob3dLZXJuZWxDb21tYW5kcyhcclxuICAgIHN0b3JlOiBTdG9yZSxcclxuICAgIGhhbmRsZUtlcm5lbENvbW1hbmQ6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnlcclxuICApIHtcclxuICAgIGxldCBzaWduYWxMaXN0VmlldyA9IHRoaXMuc2lnbmFsTGlzdFZpZXc7XHJcblxyXG4gICAgaWYgKCFzaWduYWxMaXN0Vmlldykge1xyXG4gICAgICBzaWduYWxMaXN0VmlldyA9IG5ldyBTaWduYWxMaXN0VmlldyhzdG9yZSwgaGFuZGxlS2VybmVsQ29tbWFuZCk7XHJcbiAgICAgIHRoaXMuc2lnbmFsTGlzdFZpZXcgPSBzaWduYWxMaXN0VmlldztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNpZ25hbExpc3RWaWV3LnN0b3JlID0gc3RvcmU7XHJcbiAgICB9XHJcblxyXG4gICAgc2lnbmFsTGlzdFZpZXcudG9nZ2xlKCk7XHJcbiAgfVxyXG59XHJcbmNvbnN0IHN0YXR1c0JhckNvbnN1bWVyID0gbmV3IFN0YXR1c0JhckNvbnN1bWVyKCk7XHJcbmV4cG9ydCBkZWZhdWx0IHN0YXR1c0JhckNvbnN1bWVyO1xyXG4iXX0=