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
                (0, utils_1.log)("Selected command:", item);
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
        (0, utils_1.setPreviouslyFocusedElement)(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmFsLWxpc3Qtdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9zZXJ2aWNlcy9jb25zdW1lZC9zdGF0dXMtYmFyL3NpZ25hbC1saXN0LXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSx3RUFBOEM7QUFDOUMsbUVBQTBDO0FBQzFDLDBDQUFrRTtBQUdsRSxNQUFNLGFBQWEsR0FBRztJQUNwQjtRQUNFLElBQUksRUFBRSxXQUFXO1FBQ2pCLEtBQUssRUFBRSxrQkFBa0I7S0FDMUI7SUFDRDtRQUNFLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGdCQUFnQjtLQUN4QjtJQUNEO1FBQ0UsSUFBSSxFQUFFLFdBQVc7UUFDakIsS0FBSyxFQUFFLGlCQUFpQjtLQUN6QjtDQUNGLENBQUM7QUFDRixNQUFNLGdCQUFnQixHQUFHO0lBQ3ZCO1FBQ0UsSUFBSSxFQUFFLG9CQUFvQjtRQUMxQixLQUFLLEVBQUUsZUFBZTtLQUN2QjtJQUNEO1FBQ0UsSUFBSSxFQUFFLGlCQUFpQjtRQUN2QixLQUFLLEVBQUUsbUJBQW1CO0tBQzNCO0NBQ0YsQ0FBQztBQU1GLE1BQXFCLGNBQWM7SUFPakMsWUFBWSxLQUFZLEVBQUUsbUJBQWlEO1FBQ3pFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztRQUMvQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksMEJBQWMsQ0FBQztZQUN2QyxjQUFjLEVBQUUsQ0FBQyxhQUFhLENBQUM7WUFDL0IsS0FBSyxFQUFFLEVBQXNCO1lBQzdCLGdCQUFnQixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDckQsY0FBYyxFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FB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Q3RDO0lBQ0gsQ0FBQztDQUNGO0FBekZELGlDQXlGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhbmVsIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBTZWxlY3RMaXN0VmlldyBmcm9tIFwiYXRvbS1zZWxlY3QtbGlzdFwiO1xuaW1wb3J0IFdTS2VybmVsIGZyb20gXCIuLi8uLi8uLi93cy1rZXJuZWxcIjtcbmltcG9ydCB7IGxvZywgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50IH0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSBcIi4uLy4uLy4uL3N0b3JlXCI7XG5cbmNvbnN0IGJhc2ljQ29tbWFuZHMgPSBbXG4gIHtcbiAgICBuYW1lOiBcIkludGVycnVwdFwiLFxuICAgIHZhbHVlOiBcImludGVycnVwdC1rZXJuZWxcIixcbiAgfSxcbiAge1xuICAgIG5hbWU6IFwiUmVzdGFydFwiLFxuICAgIHZhbHVlOiBcInJlc3RhcnQta2VybmVsXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlNodXQgRG93blwiLFxuICAgIHZhbHVlOiBcInNodXRkb3duLWtlcm5lbFwiLFxuICB9LFxuXTtcbmNvbnN0IHdzS2VybmVsQ29tbWFuZHMgPSBbXG4gIHtcbiAgICBuYW1lOiBcIlJlbmFtZSBzZXNzaW9uIGZvclwiLFxuICAgIHZhbHVlOiBcInJlbmFtZS1rZXJuZWxcIixcbiAgfSxcbiAge1xuICAgIG5hbWU6IFwiRGlzY29ubmVjdCBmcm9tXCIsXG4gICAgdmFsdWU6IFwiZGlzY29ubmVjdC1rZXJuZWxcIixcbiAgfSxcbl07XG5cbmludGVyZmFjZSBTZWxlY3RMaXN0SXRlbSB7XG4gIG5hbWU6IHN0cmluZztcbiAgY29tbWFuZDogc3RyaW5nO1xufVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2lnbmFsTGlzdFZpZXcge1xuICBwYW5lbDogUGFuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgc2VsZWN0TGlzdFZpZXc6IFNlbGVjdExpc3RWaWV3O1xuICBzdG9yZTogU3RvcmUgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBoYW5kbGVLZXJuZWxDb21tYW5kOiAoKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JlOiBTdG9yZSwgaGFuZGxlS2VybmVsQ29tbWFuZDogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkge1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLmhhbmRsZUtlcm5lbENvbW1hbmQgPSBoYW5kbGVLZXJuZWxDb21tYW5kO1xuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xuICAgICAgaXRlbXNDbGFzc0xpc3Q6IFtcIm1hcmstYWN0aXZlXCJdLFxuICAgICAgaXRlbXM6IFtdIGFzIFNlbGVjdExpc3RJdGVtW10sXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAoaXRlbTogU2VsZWN0TGlzdEl0ZW0pID0+IGl0ZW0ubmFtZSxcbiAgICAgIGVsZW1lbnRGb3JJdGVtOiAoaXRlbTogU2VsZWN0TGlzdEl0ZW0pID0+IHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGl0ZW0ubmFtZTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICB9LFxuICAgICAgZGlkQ29uZmlybVNlbGVjdGlvbjogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiB7XG4gICAgICAgIGxvZyhcIlNlbGVjdGVkIGNvbW1hbmQ6XCIsIGl0ZW0pO1xuICAgICAgICB0aGlzLm9uQ29uZmlybWVkKGl0ZW0pO1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgfSxcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4gdGhpcy5jYW5jZWwoKSxcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBydW5uaW5nIGtlcm5lbHMgZm9yIHRoaXMgZmlsZSB0eXBlLlwiLFxuICAgIH0pO1xuICB9XG5cbiAgb25Db25maXJtZWQoa2VybmVsQ29tbWFuZDogeyBjb21tYW5kOiBzdHJpbmcgfSkge1xuICAgIGlmICh0aGlzLmhhbmRsZUtlcm5lbENvbW1hbmQpIHtcbiAgICAgIHRoaXMuaGFuZGxlS2VybmVsQ29tbWFuZChrZXJuZWxDb21tYW5kLCB0aGlzLnN0b3JlKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyB0b2dnbGUoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc3RvcmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qga2VybmVsID0gdGhpcy5zdG9yZS5rZXJuZWw7XG4gICAgaWYgKCFrZXJuZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY29tbWFuZHMgPVxuICAgICAga2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFdTS2VybmVsXG4gICAgICAgID8gWy4uLmJhc2ljQ29tbWFuZHMsIC4uLndzS2VybmVsQ29tbWFuZHNdXG4gICAgICAgIDogYmFzaWNDb21tYW5kcztcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBjb21tYW5kcy5tYXAoKGNvbW1hbmQpID0+ICh7XG4gICAgICBuYW1lOiBgJHtjb21tYW5kLm5hbWV9ICR7a2VybmVsLmtlcm5lbFNwZWMuZGlzcGxheV9uYW1lfSBrZXJuZWxgLFxuICAgICAgY29tbWFuZDogY29tbWFuZC52YWx1ZSxcbiAgICB9KSk7XG4gICAgYXdhaXQgdGhpcy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgaXRlbXM6IGxpc3RJdGVtcyxcbiAgICB9KTtcbiAgICB0aGlzLmF0dGFjaCgpO1xuICB9XG5cbiAgYXR0YWNoKCkge1xuICAgIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCh0aGlzKTtcbiAgICBpZiAodGhpcy5wYW5lbCA9PSBudWxsKSB7XG4gICAgICB0aGlzLnBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XG4gICAgICAgIGl0ZW06IHRoaXMuc2VsZWN0TGlzdFZpZXcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3RMaXN0Vmlldy5mb2N1cygpO1xuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcucmVzZXQoKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RMaXN0Vmlldy5kZXN0cm95KCk7XG4gIH1cblxuICBjYW5jZWwoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5wYW5lbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IG51bGw7XG4gICAgfVxuICB9XG59XG4iXX0=