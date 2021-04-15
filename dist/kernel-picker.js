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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQThDO0FBRTlDLG1DQUEyRDtBQUczRCxNQUFxQixZQUFZO0lBTy9CLFlBQVksV0FBc0M7UUFDaEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUM7WUFDdkMsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUFFO1lBQ1QsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZO1lBQzdDLGNBQWMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN2QixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ3hDLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxtQkFBbUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUM1QixXQUFHLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtvQkFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDeEI7Z0JBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3ZDLFlBQVksRUFBRSxrQkFBa0I7U0FDakMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDdEI7UUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUVsQixJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUNqQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztTQUN0QztJQUNILENBQUM7SUFFRCxNQUFNO1FBQ0osbUNBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO2dCQUN4QyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWM7YUFDMUIsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNO1FBQ1YsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDZjthQUFNO1lBQ0wsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztnQkFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXO2FBQ3hCLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUNGO0FBdEVELCtCQXNFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhbmVsIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBTZWxlY3RMaXN0VmlldyBmcm9tIFwiYXRvbS1zZWxlY3QtbGlzdFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgbG9nLCBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgS2VybmVsUGlja2VyIHtcbiAga2VybmVsU3BlY3M6IEFycmF5PEtlcm5lbHNwZWNNZXRhZGF0YT47XG4gIG9uQ29uZmlybWVkOiAoKGtlcm5lbFNwZWNzOiBLZXJuZWxzcGVjTWV0YWRhdGEpID0+IHZvaWQpIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgc2VsZWN0TGlzdFZpZXc6IFNlbGVjdExpc3RWaWV3O1xuICBwYW5lbDogUGFuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihrZXJuZWxTcGVjczogQXJyYXk8S2VybmVsc3BlY01ldGFkYXRhPikge1xuICAgIHRoaXMua2VybmVsU3BlY3MgPSBrZXJuZWxTcGVjcztcbiAgICB0aGlzLm9uQ29uZmlybWVkID0gbnVsbDtcbiAgICB0aGlzLnNlbGVjdExpc3RWaWV3ID0gbmV3IFNlbGVjdExpc3RWaWV3KHtcbiAgICAgIGl0ZW1zQ2xhc3NMaXN0OiBbXCJtYXJrLWFjdGl2ZVwiXSxcbiAgICAgIGl0ZW1zOiBbXSxcbiAgICAgIGZpbHRlcktleUZvckl0ZW06IChpdGVtKSA9PiBpdGVtLmRpc3BsYXlfbmFtZSxcbiAgICAgIGVsZW1lbnRGb3JJdGVtOiAoaXRlbSkgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gaXRlbS5kaXNwbGF5X25hbWU7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfSxcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246IChpdGVtKSA9PiB7XG4gICAgICAgIGxvZyhcIlNlbGVjdGVkIGtlcm5lbDpcIiwgaXRlbSk7XG4gICAgICAgIGlmICh0aGlzLm9uQ29uZmlybWVkKSB7XG4gICAgICAgICAgdGhpcy5vbkNvbmZpcm1lZChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgfSxcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4gdGhpcy5jYW5jZWwoKSxcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBrZXJuZWxzIGZvdW5kXCIsXG4gICAgfSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0TGlzdFZpZXcuZGVzdHJveSgpO1xuICB9XG5cbiAgY2FuY2VsKCkge1xuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcbiAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHRoaXMucGFuZWwgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50KSB7XG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGF0dGFjaCgpIHtcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcyk7XG4gICAgaWYgKHRoaXMucGFuZWwgPT0gbnVsbCkge1xuICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICBpdGVtOiB0aGlzLnNlbGVjdExpc3RWaWV3LFxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcuZm9jdXMoKTtcbiAgICB0aGlzLnNlbGVjdExpc3RWaWV3LnJlc2V0KCk7XG4gIH1cblxuICBhc3luYyB0b2dnbGUoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgICBpdGVtczogdGhpcy5rZXJuZWxTcGVjcyxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hdHRhY2goKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==