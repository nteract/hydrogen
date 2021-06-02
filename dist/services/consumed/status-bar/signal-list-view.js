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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmFsLWxpc3Qtdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9zZXJ2aWNlcy9jb25zdW1lZC9zdGF0dXMtYmFyL3NpZ25hbC1saXN0LXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSx3RUFBOEM7QUFDOUMsbUVBQTBDO0FBQzFDLDBDQUFrRTtBQUdsRSxNQUFNLGFBQWEsR0FBRztJQUNwQjtRQUNFLElBQUksRUFBRSxXQUFXO1FBQ2pCLEtBQUssRUFBRSxrQkFBa0I7S0FDMUI7SUFDRDtRQUNFLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGdCQUFnQjtLQUN4QjtJQUNEO1FBQ0UsSUFBSSxFQUFFLFdBQVc7UUFDakIsS0FBSyxFQUFFLGlCQUFpQjtLQUN6QjtDQUNGLENBQUM7QUFDRixNQUFNLGdCQUFnQixHQUFHO0lBQ3ZCO1FBQ0UsSUFBSSxFQUFFLG9CQUFvQjtRQUMxQixLQUFLLEVBQUUsZUFBZTtLQUN2QjtJQUNEO1FBQ0UsSUFBSSxFQUFFLGlCQUFpQjtRQUN2QixLQUFLLEVBQUUsbUJBQW1CO0tBQzNCO0NBQ0YsQ0FBQztBQU1GLE1BQXFCLGNBQWM7SUFPakMsWUFBWSxLQUFZLEVBQUUsbUJBQWlEO1FBQ3pFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztRQUMvQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksMEJBQWMsQ0FBQztZQUN2QyxjQUFjLEVBQUUsQ0FBQyxhQUFhLENBQUM7WUFDL0IsS0FBSyxFQUFFLEVBQXNCO1lBQzdCLGdCQUFnQixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDckQsY0FBYyxFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FB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QUFDO0NBQ0Y7QUF6RkQsaUNBeUZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgU2VsZWN0TGlzdFZpZXcgZnJvbSBcImF0b20tc2VsZWN0LWxpc3RcIjtcclxuaW1wb3J0IFdTS2VybmVsIGZyb20gXCIuLi8uLi8uLi93cy1rZXJuZWxcIjtcclxuaW1wb3J0IHsgbG9nLCBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gXCIuLi8uLi8uLi9zdG9yZVwiO1xyXG5cclxuY29uc3QgYmFzaWNDb21tYW5kcyA9IFtcclxuICB7XHJcbiAgICBuYW1lOiBcIkludGVycnVwdFwiLFxyXG4gICAgdmFsdWU6IFwiaW50ZXJydXB0LWtlcm5lbFwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJSZXN0YXJ0XCIsXHJcbiAgICB2YWx1ZTogXCJyZXN0YXJ0LWtlcm5lbFwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJTaHV0IERvd25cIixcclxuICAgIHZhbHVlOiBcInNodXRkb3duLWtlcm5lbFwiLFxyXG4gIH0sXHJcbl07XHJcbmNvbnN0IHdzS2VybmVsQ29tbWFuZHMgPSBbXHJcbiAge1xyXG4gICAgbmFtZTogXCJSZW5hbWUgc2Vzc2lvbiBmb3JcIixcclxuICAgIHZhbHVlOiBcInJlbmFtZS1rZXJuZWxcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiRGlzY29ubmVjdCBmcm9tXCIsXHJcbiAgICB2YWx1ZTogXCJkaXNjb25uZWN0LWtlcm5lbFwiLFxyXG4gIH0sXHJcbl07XHJcblxyXG5pbnRlcmZhY2UgU2VsZWN0TGlzdEl0ZW0ge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBjb21tYW5kOiBzdHJpbmc7XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2lnbmFsTGlzdFZpZXcge1xyXG4gIHBhbmVsOiBQYW5lbCB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgc2VsZWN0TGlzdFZpZXc6IFNlbGVjdExpc3RWaWV3O1xyXG4gIHN0b3JlOiBTdG9yZSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgaGFuZGxlS2VybmVsQ29tbWFuZDogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3Ioc3RvcmU6IFN0b3JlLCBoYW5kbGVLZXJuZWxDb21tYW5kOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB7XHJcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XHJcbiAgICB0aGlzLmhhbmRsZUtlcm5lbENvbW1hbmQgPSBoYW5kbGVLZXJuZWxDb21tYW5kO1xyXG4gICAgdGhpcy5zZWxlY3RMaXN0VmlldyA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XHJcbiAgICAgIGl0ZW1zQ2xhc3NMaXN0OiBbXCJtYXJrLWFjdGl2ZVwiXSxcclxuICAgICAgaXRlbXM6IFtdIGFzIFNlbGVjdExpc3RJdGVtW10sXHJcbiAgICAgIGZpbHRlcktleUZvckl0ZW06IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4gaXRlbS5uYW1lLFxyXG4gICAgICBlbGVtZW50Rm9ySXRlbTogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gaXRlbS5uYW1lO1xyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgICB9LFxyXG4gICAgICBkaWRDb25maXJtU2VsZWN0aW9uOiAoaXRlbTogU2VsZWN0TGlzdEl0ZW0pID0+IHtcclxuICAgICAgICBsb2coXCJTZWxlY3RlZCBjb21tYW5kOlwiLCBpdGVtKTtcclxuICAgICAgICB0aGlzLm9uQ29uZmlybWVkKGl0ZW0pO1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4gdGhpcy5jYW5jZWwoKSxcclxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIHJ1bm5pbmcga2VybmVscyBmb3IgdGhpcyBmaWxlIHR5cGUuXCIsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uQ29uZmlybWVkKGtlcm5lbENvbW1hbmQ6IHsgY29tbWFuZDogc3RyaW5nIH0pIHtcclxuICAgIGlmICh0aGlzLmhhbmRsZUtlcm5lbENvbW1hbmQpIHtcclxuICAgICAgdGhpcy5oYW5kbGVLZXJuZWxDb21tYW5kKGtlcm5lbENvbW1hbmQsIHRoaXMuc3RvcmUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgdG9nZ2xlKCkge1xyXG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5zdG9yZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBrZXJuZWwgPSB0aGlzLnN0b3JlLmtlcm5lbDtcclxuICAgIGlmICgha2VybmVsKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGNvbW1hbmRzID1cclxuICAgICAga2VybmVsLnRyYW5zcG9ydCBpbnN0YW5jZW9mIFdTS2VybmVsXHJcbiAgICAgICAgPyBbLi4uYmFzaWNDb21tYW5kcywgLi4ud3NLZXJuZWxDb21tYW5kc11cclxuICAgICAgICA6IGJhc2ljQ29tbWFuZHM7XHJcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBjb21tYW5kcy5tYXAoKGNvbW1hbmQpID0+ICh7XHJcbiAgICAgIG5hbWU6IGAke2NvbW1hbmQubmFtZX0gJHtrZXJuZWwua2VybmVsU3BlYy5kaXNwbGF5X25hbWV9IGtlcm5lbGAsXHJcbiAgICAgIGNvbW1hbmQ6IGNvbW1hbmQudmFsdWUsXHJcbiAgICB9KSk7XHJcbiAgICBhd2FpdCB0aGlzLnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgIGl0ZW1zOiBsaXN0SXRlbXMsXHJcbiAgICB9KTtcclxuICAgIHRoaXMuYXR0YWNoKCk7XHJcbiAgfVxyXG5cclxuICBhdHRhY2goKSB7XHJcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcyk7XHJcbiAgICBpZiAodGhpcy5wYW5lbCA9PSBudWxsKSB7XHJcbiAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcclxuICAgICAgICBpdGVtOiB0aGlzLnNlbGVjdExpc3RWaWV3LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcuZm9jdXMoKTtcclxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcucmVzZXQoKTtcclxuICB9XHJcblxyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0TGlzdFZpZXcuZGVzdHJveSgpO1xyXG4gIH1cclxuXHJcbiAgY2FuY2VsKCkge1xyXG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnBhbmVsID0gbnVsbDtcclxuXHJcbiAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcclxuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQuZm9jdXMoKTtcclxuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=