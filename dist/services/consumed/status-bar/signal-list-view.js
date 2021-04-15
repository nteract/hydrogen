"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_select_list_1 = __importDefault(require("atom-select-list"));
const ws_kernel_1 = __importDefault(require("../../../ws-kernel"));
const utils_1 = require("../../../utils");
const basicCommands = [
    {
        name: "Interrupt",
        value: "interrupt-kernel",
    },
    {
        name: "Restart",
        value: "restart-kernel",
    },
    {
        name: "Shut Down",
        value: "shutdown-kernel",
    },
];
const wsKernelCommands = [
    {
        name: "Rename session for",
        value: "rename-kernel",
    },
    {
        name: "Disconnect from",
        value: "disconnect-kernel",
    },
];
class SignalListView {
    constructor(store, handleKernelCommand) {
        this.store = store;
        this.handleKernelCommand = handleKernelCommand;
        this.selectListView = new atom_select_list_1.default({
            itemsClassList: ["mark-active"],
            items: [],
            filterKeyForItem: (item) => item.name,
            elementForItem: (item) => {
                const element = document.createElement("li");
                element.textContent = item.name;
                return element;
            },
            didConfirmSelection: (item) => {
                utils_1.log("Selected command:", item);
                this.onConfirmed(item);
                this.cancel();
            },
            didCancelSelection: () => this.cancel(),
            emptyMessage: "No running kernels for this file type.",
        });
    }
    onConfirmed(kernelCommand) {
        if (this.handleKernelCommand) {
            this.handleKernelCommand(kernelCommand, this.store);
        }
    }
    async toggle() {
        if (this.panel != null) {
            this.cancel();
        }
        if (!this.store) {
            return;
        }
        const kernel = this.store.kernel;
        if (!kernel) {
            return;
        }
        const commands = kernel.transport instanceof ws_kernel_1.default
            ? [...basicCommands, ...wsKernelCommands]
            : basicCommands;
        const listItems = commands.map((command) => ({
            name: `${command.name} ${kernel.kernelSpec.display_name} kernel`,
            command: command.value,
        }));
        await this.selectListView.update({
            items: listItems,
        });
        this.attach();
    }
    attach() {
        utils_1.setPreviouslyFocusedElement(this);
        if (this.panel == null) {
            this.panel = atom.workspace.addModalPanel({
                item: this.selectListView,
            });
        }
        this.selectListView.focus();
        this.selectListView.reset();
    }
    destroy() {
        this.cancel();
        return this.selectListView.destroy();
    }
    cancel() {
        if (this.panel != null) {
            this.panel.destroy();
        }
        this.panel = null;
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }
}
exports.default = SignalListView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmFsLWxpc3Qtdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9zZXJ2aWNlcy9jb25zdW1lZC9zdGF0dXMtYmFyL3NpZ25hbC1saXN0LXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSx3RUFBOEM7QUFDOUMsbUVBQTBDO0FBQzFDLDBDQUFrRTtBQUdsRSxNQUFNLGFBQWEsR0FBRztJQUNwQjtRQUNFLElBQUksRUFBRSxXQUFXO1FBQ2pCLEtBQUssRUFBRSxrQkFBa0I7S0FDMUI7SUFDRDtRQUNFLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGdCQUFnQjtLQUN4QjtJQUNEO1FBQ0UsSUFBSSxFQUFFLFdBQVc7UUFDakIsS0FBSyxFQUFFLGlCQUFpQjtLQUN6QjtDQUNGLENBQUM7QUFDRixNQUFNLGdCQUFnQixHQUFHO0lBQ3ZCO1FBQ0UsSUFBSSxFQUFFLG9CQUFvQjtRQUMxQixLQUFLLEVBQUUsZUFBZTtLQUN2QjtJQUNEO1FBQ0UsSUFBSSxFQUFFLGlCQUFpQjtRQUN2QixLQUFLLEVBQUUsbUJBQW1CO0tBQzNCO0NBQ0YsQ0FBQztBQUNGLE1BQXFCLGNBQWM7SUFPakMsWUFBWSxLQUFZLEVBQUUsbUJBQWlEO1FBQ3pFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztRQUMvQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksMEJBQWMsQ0FBQztZQUN2QyxjQUFjLEVBQUUsQ0FBQyxhQUFhLENBQUM7WUFDL0IsS0FBSyxFQUFFLEVBQUU7WUFDVCxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDckMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3ZCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENB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QUNGO0FBekZELGlDQXlGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhbmVsIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBTZWxlY3RMaXN0VmlldyBmcm9tIFwiYXRvbS1zZWxlY3QtbGlzdFwiO1xuaW1wb3J0IFdTS2VybmVsIGZyb20gXCIuLi8uLi8uLi93cy1rZXJuZWxcIjtcbmltcG9ydCB7IGxvZywgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50IH0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSBcIi4uLy4uLy4uL3N0b3JlXCI7XG5cbmNvbnN0IGJhc2ljQ29tbWFuZHMgPSBbXG4gIHtcbiAgICBuYW1lOiBcIkludGVycnVwdFwiLFxuICAgIHZhbHVlOiBcImludGVycnVwdC1rZXJuZWxcIixcbiAgfSxcbiAge1xuICAgIG5hbWU6IFwiUmVzdGFydFwiLFxuICAgIHZhbHVlOiBcInJlc3RhcnQta2VybmVsXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlNodXQgRG93blwiLFxuICAgIHZhbHVlOiBcInNodXRkb3duLWtlcm5lbFwiLFxuICB9LFxuXTtcbmNvbnN0IHdzS2VybmVsQ29tbWFuZHMgPSBbXG4gIHtcbiAgICBuYW1lOiBcIlJlbmFtZSBzZXNzaW9uIGZvclwiLFxuICAgIHZhbHVlOiBcInJlbmFtZS1rZXJuZWxcIixcbiAgfSxcbiAge1xuICAgIG5hbWU6IFwiRGlzY29ubmVjdCBmcm9tXCIsXG4gICAgdmFsdWU6IFwiZGlzY29ubmVjdC1rZXJuZWxcIixcbiAgfSxcbl07XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaWduYWxMaXN0VmlldyB7XG4gIHBhbmVsOiBQYW5lbCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzZWxlY3RMaXN0VmlldzogU2VsZWN0TGlzdFZpZXc7XG4gIHN0b3JlOiBTdG9yZSB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIGhhbmRsZUtlcm5lbENvbW1hbmQ6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmU6IFN0b3JlLCBoYW5kbGVLZXJuZWxDb21tYW5kOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB7XG4gICAgdGhpcy5zdG9yZSA9IHN0b3JlO1xuICAgIHRoaXMuaGFuZGxlS2VybmVsQ29tbWFuZCA9IGhhbmRsZUtlcm5lbENvbW1hbmQ7XG4gICAgdGhpcy5zZWxlY3RMaXN0VmlldyA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XG4gICAgICBpdGVtc0NsYXNzTGlzdDogW1wibWFyay1hY3RpdmVcIl0sXG4gICAgICBpdGVtczogW10sXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAoaXRlbSkgPT4gaXRlbS5uYW1lLFxuICAgICAgZWxlbWVudEZvckl0ZW06IChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBpdGVtLm5hbWU7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfSxcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246IChpdGVtKSA9PiB7XG4gICAgICAgIGxvZyhcIlNlbGVjdGVkIGNvbW1hbmQ6XCIsIGl0ZW0pO1xuICAgICAgICB0aGlzLm9uQ29uZmlybWVkKGl0ZW0pO1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgfSxcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4gdGhpcy5jYW5jZWwoKSxcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBydW5uaW5nIGtlcm5lbHMgZm9yIHRoaXMgZmlsZSB0eXBlLlwiLFxuICAgIH0pO1xuICB9XG5cbiAgb25Db25maXJtZWQoa2VybmVsQ29tbWFuZDogeyBjb21tYW5kOiBzdHJpbmcgfSkge1xuICAgIGlmICh0aGlzLmhhbmRsZUtlcm5lbENvbW1hbmQpIHtcbiAgICAgIHRoaXMuaGFuZGxlS2VybmVsQ29tbWFuZChrZXJuZWxDb21tYW5kLCB0aGlzLnN0b3JlKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyB0b2dnbGUoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc3RvcmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qga2VybmVsID0gdGhpcy5zdG9yZS5rZXJuZWw7XG4gICAgaWYgKCFrZXJuZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY29tbWFuZHMgPVxuICAgICAga2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFdTS2VybmVsXG4gICAgICAgID8gWy4uLmJhc2ljQ29tbWFuZHMsIC4uLndzS2VybmVsQ29tbWFuZHNdXG4gICAgICAgIDogYmFzaWNDb21tYW5kcztcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBjb21tYW5kcy5tYXAoKGNvbW1hbmQpID0+ICh7XG4gICAgICBuYW1lOiBgJHtjb21tYW5kLm5hbWV9ICR7a2VybmVsLmtlcm5lbFNwZWMuZGlzcGxheV9uYW1lfSBrZXJuZWxgLFxuICAgICAgY29tbWFuZDogY29tbWFuZC52YWx1ZSxcbiAgICB9KSk7XG4gICAgYXdhaXQgdGhpcy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgaXRlbXM6IGxpc3RJdGVtcyxcbiAgICB9KTtcbiAgICB0aGlzLmF0dGFjaCgpO1xuICB9XG5cbiAgYXR0YWNoKCkge1xuICAgIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCh0aGlzKTtcbiAgICBpZiAodGhpcy5wYW5lbCA9PSBudWxsKSB7XG4gICAgICB0aGlzLnBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XG4gICAgICAgIGl0ZW06IHRoaXMuc2VsZWN0TGlzdFZpZXcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3RMaXN0Vmlldy5mb2N1cygpO1xuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcucmVzZXQoKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RMaXN0Vmlldy5kZXN0cm95KCk7XG4gIH1cblxuICBjYW5jZWwoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5wYW5lbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IG51bGw7XG4gICAgfVxuICB9XG59XG4iXX0=