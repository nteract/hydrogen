"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_select_list_1 = __importDefault(require("atom-select-list"));
const utils_1 = require("./utils");
class KernelPicker {
    constructor(kernelSpecs) {
        this.kernelSpecs = kernelSpecs;
        this.onConfirmed = null;
        this.selectListView = new atom_select_list_1.default({
            itemsClassList: ["mark-active"],
            items: [],
            filterKeyForItem: (item) => item.display_name,
            elementForItem: (item) => {
                const element = document.createElement("li");
                element.textContent = item.display_name;
                return element;
            },
            didConfirmSelection: (item) => {
                utils_1.log("Selected kernel:", item);
                if (this.onConfirmed) {
                    this.onConfirmed(item);
                }
                this.cancel();
            },
            didCancelSelection: () => this.cancel(),
            emptyMessage: "No kernels found",
        });
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
    async toggle() {
        if (this.panel != null) {
            this.cancel();
        }
        else {
            await this.selectListView.update({
                items: this.kernelSpecs,
            });
            this.attach();
        }
    }
}
exports.default = KernelPicker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQXdFO0FBQ3hFLG1DQUEyRDtBQUczRCxNQUFxQixZQUFZO0lBTy9CLFlBQVksV0FBc0M7UUFDaEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUM7WUFDdkMsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUEwQjtZQUNqQyxnQkFBZ0IsRUFBRSxDQUFDLElBQXdCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZO1lBQ2pFLGNBQWMsRUFBRSxDQUFDLElBQXdCLEVBQUUsRUFBRTtnQkFDM0MsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0MsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUN4QyxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDO1lBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxJQUF3QixFQUFFLEVBQUU7Z0JBQ2hELFdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4QjtnQkFDRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEIsQ0FBQztZQUNELGtCQUFrQixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDdkMsWUFBWSxFQUFFLGtCQUFrQjtTQUNqQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsT0FBTztRQUNMLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRUQsTUFBTTtRQUNKLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUN0QjtRQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBRWxCLElBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFO1lBQ2pDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1NBQ3RDO0lBQ0gsQ0FBQztJQUVELE1BQU07UUFDSixtQ0FBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7Z0JBQ3hDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBYzthQUMxQixDQUFDLENBQUM7U0FDSjtRQUNELElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO2FBQU07WUFDTCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO2dCQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVc7YUFDQSxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7SUFDSCxDQUFDO0NBQ0Y7QUF0RUQsK0JBc0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgU2VsZWN0TGlzdFZpZXcsIHsgU2VsZWN0TGlzdFByb3BlcnRpZXMgfSBmcm9tIFwiYXRvbS1zZWxlY3QtbGlzdFwiO1xyXG5pbXBvcnQgeyBsb2csIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBLZXJuZWxQaWNrZXIge1xyXG4gIGtlcm5lbFNwZWNzOiBBcnJheTxLZXJuZWxzcGVjTWV0YWRhdGE+O1xyXG4gIG9uQ29uZmlybWVkOiAoKGtlcm5lbFNwZWNzOiBLZXJuZWxzcGVjTWV0YWRhdGEpID0+IHZvaWQpIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBzZWxlY3RMaXN0VmlldzogU2VsZWN0TGlzdFZpZXc7XHJcbiAgcGFuZWw6IFBhbmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3Ioa2VybmVsU3BlY3M6IEFycmF5PEtlcm5lbHNwZWNNZXRhZGF0YT4pIHtcclxuICAgIHRoaXMua2VybmVsU3BlY3MgPSBrZXJuZWxTcGVjcztcclxuICAgIHRoaXMub25Db25maXJtZWQgPSBudWxsO1xyXG4gICAgdGhpcy5zZWxlY3RMaXN0VmlldyA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XHJcbiAgICAgIGl0ZW1zQ2xhc3NMaXN0OiBbXCJtYXJrLWFjdGl2ZVwiXSxcclxuICAgICAgaXRlbXM6IFtdIGFzIEtlcm5lbHNwZWNNZXRhZGF0YVtdLFxyXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAoaXRlbTogS2VybmVsc3BlY01ldGFkYXRhKSA9PiBpdGVtLmRpc3BsYXlfbmFtZSxcclxuICAgICAgZWxlbWVudEZvckl0ZW06IChpdGVtOiBLZXJuZWxzcGVjTWV0YWRhdGEpID0+IHtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBpdGVtLmRpc3BsYXlfbmFtZTtcclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgfSxcclxuICAgICAgZGlkQ29uZmlybVNlbGVjdGlvbjogKGl0ZW06IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT4ge1xyXG4gICAgICAgIGxvZyhcIlNlbGVjdGVkIGtlcm5lbDpcIiwgaXRlbSk7XHJcbiAgICAgICAgaWYgKHRoaXMub25Db25maXJtZWQpIHtcclxuICAgICAgICAgIHRoaXMub25Db25maXJtZWQoaXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4gdGhpcy5jYW5jZWwoKSxcclxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIGtlcm5lbHMgZm91bmRcIixcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RMaXN0Vmlldy5kZXN0cm95KCk7XHJcbiAgfVxyXG5cclxuICBjYW5jZWwoKSB7XHJcbiAgICBpZiAodGhpcy5wYW5lbCAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucGFuZWwgPSBudWxsO1xyXG5cclxuICAgIGlmICh0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCkge1xyXG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xyXG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhdHRhY2goKSB7XHJcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcyk7XHJcbiAgICBpZiAodGhpcy5wYW5lbCA9PSBudWxsKSB7XHJcbiAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcclxuICAgICAgICBpdGVtOiB0aGlzLnNlbGVjdExpc3RWaWV3LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcuZm9jdXMoKTtcclxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcucmVzZXQoKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHRvZ2dsZSgpIHtcclxuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGF3YWl0IHRoaXMuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgICBpdGVtczogdGhpcy5rZXJuZWxTcGVjcyxcclxuICAgICAgfSBhcyBTZWxlY3RMaXN0UHJvcGVydGllcyk7XHJcbiAgICAgIHRoaXMuYXR0YWNoKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==