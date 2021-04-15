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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLWJhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9zZXJ2aWNlcy9jb25zdW1lZC9zdGF0dXMtYmFyL3N0YXR1cy1iYXIudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwrQkFBa0M7QUFFbEMsa0ZBQStDO0FBQy9DLDBFQUFnRDtBQUNoRCwwQ0FBOEM7QUFJOUMsTUFBYSxpQkFBaUI7SUFHNUIsWUFBWSxDQUNWLEtBQVksRUFDWixTQUF3QixFQUN4QixtQkFBaUQ7UUFFakQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDMUMsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixRQUFRLEVBQUUsR0FBRztTQUNkLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQztRQUVGLG9CQUFZLENBQ1YsOEJBQUMsOEJBQVMsSUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEdBQUksRUFDN0MsZ0JBQWdCLENBQ2pCLENBQUM7UUFDRixNQUFNLFVBQVUsR0FBRyxJQUFJLGlCQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDakUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELGtCQUFrQixDQUNoQixLQUFZLEVBQ1osbUJBQWlEO1FBRWpELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFekMsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNuQixjQUFjLEdBQUcsSUFBSSwwQkFBYyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1NBQ3RDO2FBQU07WUFDTCxjQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUM5QjtRQUVELGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxQixDQUFDO0NBQ0Y7QUEzQ0QsOENBMkNDO0FBQ0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7QUFDbEQsa0JBQWUsaUJBQWlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IFN0YXR1c0JhciBhcyBBdG9tU3RhdHVzQmFyIH0gZnJvbSBcImF0b20vc3RhdHVzLWJhclwiO1xuaW1wb3J0IFN0YXR1c0JhciBmcm9tIFwiLi9zdGF0dXMtYmFyLWNvbXBvbmVudFwiO1xuaW1wb3J0IFNpZ25hbExpc3RWaWV3IGZyb20gXCIuL3NpZ25hbC1saXN0LXZpZXdcIjtcbmltcG9ydCB7IHJlYWN0RmFjdG9yeSB9IGZyb20gXCIuLi8uLi8uLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gXCIuLi8uLi8uLi9zdG9yZVwiO1xuaW1wb3J0IHR5cGUgS2VybmVsIGZyb20gXCIuLi8uLi8uLi9rZXJuZWxcIjtcbmltcG9ydCB0eXBlIE1hcmtlclN0b3JlIGZyb20gXCIuLi8uLi8uLi9zdG9yZS9tYXJrZXJzXCI7XG5leHBvcnQgY2xhc3MgU3RhdHVzQmFyQ29uc3VtZXIge1xuICBzaWduYWxMaXN0VmlldzogU2lnbmFsTGlzdFZpZXc7XG5cbiAgYWRkU3RhdHVzQmFyKFxuICAgIHN0b3JlOiBTdG9yZSxcbiAgICBzdGF0dXNCYXI6IEF0b21TdGF0dXNCYXIsXG4gICAgaGFuZGxlS2VybmVsQ29tbWFuZDogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueVxuICApIHtcbiAgICBjb25zdCBzdGF0dXNCYXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBzdGF0dXNCYXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJoeWRyb2dlblwiKTtcbiAgICBjb25zdCBzdGF0dXNCYXJUaWxlID0gc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgIGl0ZW06IHN0YXR1c0JhckVsZW1lbnQsXG4gICAgICBwcmlvcml0eTogMTAwLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb25DbGljayA9IChzdG9yZTogU3RvcmUpID0+IHtcbiAgICAgIHRoaXMuc2hvd0tlcm5lbENvbW1hbmRzKHN0b3JlLCBoYW5kbGVLZXJuZWxDb21tYW5kKTtcbiAgICB9O1xuXG4gICAgcmVhY3RGYWN0b3J5KFxuICAgICAgPFN0YXR1c0JhciBzdG9yZT17c3RvcmV9IG9uQ2xpY2s9e29uQ2xpY2t9IC8+LFxuICAgICAgc3RhdHVzQmFyRWxlbWVudFxuICAgICk7XG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBEaXNwb3NhYmxlKCgpID0+IHN0YXR1c0JhclRpbGUuZGVzdHJveSgpKTtcbiAgICBzdG9yZS5zdWJzY3JpcHRpb25zLmFkZChkaXNwb3NhYmxlKTtcbiAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgfVxuXG4gIHNob3dLZXJuZWxDb21tYW5kcyhcbiAgICBzdG9yZTogU3RvcmUsXG4gICAgaGFuZGxlS2VybmVsQ29tbWFuZDogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueVxuICApIHtcbiAgICBsZXQgc2lnbmFsTGlzdFZpZXcgPSB0aGlzLnNpZ25hbExpc3RWaWV3O1xuXG4gICAgaWYgKCFzaWduYWxMaXN0Vmlldykge1xuICAgICAgc2lnbmFsTGlzdFZpZXcgPSBuZXcgU2lnbmFsTGlzdFZpZXcoc3RvcmUsIGhhbmRsZUtlcm5lbENvbW1hbmQpO1xuICAgICAgdGhpcy5zaWduYWxMaXN0VmlldyA9IHNpZ25hbExpc3RWaWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICBzaWduYWxMaXN0Vmlldy5zdG9yZSA9IHN0b3JlO1xuICAgIH1cblxuICAgIHNpZ25hbExpc3RWaWV3LnRvZ2dsZSgpO1xuICB9XG59XG5jb25zdCBzdGF0dXNCYXJDb25zdW1lciA9IG5ldyBTdGF0dXNCYXJDb25zdW1lcigpO1xuZXhwb3J0IGRlZmF1bHQgc3RhdHVzQmFyQ29uc3VtZXI7XG4iXX0=