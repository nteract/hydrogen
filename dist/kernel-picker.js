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
                (0, utils_1.log)("Selected kernel:", item);
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
        (0, utils_1.setPreviouslyFocusedElement)(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQXdFO0FBQ3hFLG1DQUEyRDtBQUczRCxNQUFxQixZQUFZO0lBTy9CLFlBQVksV0FBc0M7UUFDaEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUM7WUFDdkMsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUEwQjtZQUNqQyxnQkFBZ0IsRUFBRSxDQUFDLElBQXdCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZO1lBQ2pFLGNBQWMsRUFBRSxDQUFDLElBQXdCLEVBQUUsRUFBRTtnQkFDM0MsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0MsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUN4QyxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDO1lBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxJQUF3QixFQUFFLEVBQUU7Z0JBQ2hELElBQUEsV0FBRyxFQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3hCO2dCQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBQ0Qsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN2QyxZQUFZLEVBQUUsa0JBQWtCO1NBQ2pDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxNQUFNO1FBQ0osSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3RCO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFFbEIsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUU7WUFDakMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUM7U0FDdEM7SUFDSCxDQUFDO0lBRUQsTUFBTTtRQUNKLElBQUEsbUNBQTJCLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO2dCQUN4QyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWM7YUFDMUIsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNO1FBQ1YsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDZjthQUFNO1lBQ0wsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztnQkFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXO2FBQ0EsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUNGO0FBdEVELCtCQXNFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhbmVsIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBTZWxlY3RMaXN0VmlldywgeyBTZWxlY3RMaXN0UHJvcGVydGllcyB9IGZyb20gXCJhdG9tLXNlbGVjdC1saXN0XCI7XG5pbXBvcnQgeyBsb2csIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IEtlcm5lbHNwZWNNZXRhZGF0YSB9IGZyb20gXCJAbnRlcmFjdC90eXBlc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBLZXJuZWxQaWNrZXIge1xuICBrZXJuZWxTcGVjczogQXJyYXk8S2VybmVsc3BlY01ldGFkYXRhPjtcbiAgb25Db25maXJtZWQ6ICgoa2VybmVsU3BlY3M6IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT4gdm9pZCkgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzZWxlY3RMaXN0VmlldzogU2VsZWN0TGlzdFZpZXc7XG4gIHBhbmVsOiBQYW5lbCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKGtlcm5lbFNwZWNzOiBBcnJheTxLZXJuZWxzcGVjTWV0YWRhdGE+KSB7XG4gICAgdGhpcy5rZXJuZWxTcGVjcyA9IGtlcm5lbFNwZWNzO1xuICAgIHRoaXMub25Db25maXJtZWQgPSBudWxsO1xuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xuICAgICAgaXRlbXNDbGFzc0xpc3Q6IFtcIm1hcmstYWN0aXZlXCJdLFxuICAgICAgaXRlbXM6IFtdIGFzIEtlcm5lbHNwZWNNZXRhZGF0YVtdLFxuICAgICAgZmlsdGVyS2V5Rm9ySXRlbTogKGl0ZW06IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT4gaXRlbS5kaXNwbGF5X25hbWUsXG4gICAgICBlbGVtZW50Rm9ySXRlbTogKGl0ZW06IEtlcm5lbHNwZWNNZXRhZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gaXRlbS5kaXNwbGF5X25hbWU7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfSxcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246IChpdGVtOiBLZXJuZWxzcGVjTWV0YWRhdGEpID0+IHtcbiAgICAgICAgbG9nKFwiU2VsZWN0ZWQga2VybmVsOlwiLCBpdGVtKTtcbiAgICAgICAgaWYgKHRoaXMub25Db25maXJtZWQpIHtcbiAgICAgICAgICB0aGlzLm9uQ29uZmlybWVkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgICB9LFxuICAgICAgZGlkQ2FuY2VsU2VsZWN0aW9uOiAoKSA9PiB0aGlzLmNhbmNlbCgpLFxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIGtlcm5lbHMgZm91bmRcIixcbiAgICB9KTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RMaXN0Vmlldy5kZXN0cm95KCk7XG4gIH1cblxuICBjYW5jZWwoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5wYW5lbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXR0YWNoKCkge1xuICAgIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCh0aGlzKTtcbiAgICBpZiAodGhpcy5wYW5lbCA9PSBudWxsKSB7XG4gICAgICB0aGlzLnBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XG4gICAgICAgIGl0ZW06IHRoaXMuc2VsZWN0TGlzdFZpZXcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3RMaXN0Vmlldy5mb2N1cygpO1xuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcucmVzZXQoKTtcbiAgfVxuXG4gIGFzeW5jIHRvZ2dsZSgpIHtcbiAgICBpZiAodGhpcy5wYW5lbCAhPSBudWxsKSB7XG4gICAgICB0aGlzLmNhbmNlbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCB0aGlzLnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XG4gICAgICAgIGl0ZW1zOiB0aGlzLmtlcm5lbFNwZWNzLFxuICAgICAgfSBhcyBTZWxlY3RMaXN0UHJvcGVydGllcyk7XG4gICAgICB0aGlzLmF0dGFjaCgpO1xuICAgIH1cbiAgfVxufVxuIl19