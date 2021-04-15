"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_select_list_1 = __importDefault(require("atom-select-list"));
const store_1 = __importDefault(require("./store"));
const tildify_1 = __importDefault(require("tildify"));
const utils_1 = require("./utils");
function getName(kernel) {
    const prefix = kernel.transport.gatewayName
        ? `${kernel.transport.gatewayName}: `
        : "";
    return `${prefix + kernel.displayName} - ${store_1.default
        .getFilesForKernel(kernel)
        .map(tildify_1.default)
        .join(", ")}`;
}
class ExistingKernelPicker {
    constructor() {
        this.selectListView = new atom_select_list_1.default({
            itemsClassList: ["mark-active"],
            items: [],
            filterKeyForItem: (kernel) => getName(kernel),
            elementForItem: (kernel) => {
                const element = document.createElement("li");
                element.textContent = getName(kernel);
                return element;
            },
            didConfirmSelection: (kernel) => {
                const { filePath, editor, grammar } = store_1.default;
                if (!filePath || !editor || !grammar) {
                    return this.cancel();
                }
                store_1.default.newKernel(kernel, filePath, editor, grammar);
                this.cancel();
            },
            didCancelSelection: () => this.cancel(),
            emptyMessage: "No running kernels for this language.",
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
        else if (store_1.default.filePath && store_1.default.grammar) {
            await this.selectListView.update({
                items: store_1.default.runningKernels.filter((kernel) => utils_1.kernelSpecProvidesGrammar(kernel.kernelSpec, store_1.default.grammar)),
            });
            const markers = store_1.default.markers;
            if (markers) {
                markers.clear();
            }
            this.attach();
        }
    }
}
exports.default = ExistingKernelPicker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhpc3Rpbmcta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9leGlzdGluZy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQThDO0FBQzlDLG9EQUE0QjtBQUU1QixzREFBOEI7QUFDOUIsbUNBR2lCO0FBSWpCLFNBQVMsT0FBTyxDQUFDLE1BQWM7SUFDN0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXO1FBQ3pDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxJQUFJO1FBQ3JDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDUCxPQUFPLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLE1BQU0sZUFBSztTQUM3QyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7U0FDekIsR0FBRyxDQUFDLGlCQUFPLENBQUM7U0FDWixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUNsQixDQUFDO0FBRUQsTUFBcUIsb0JBQW9CO0lBTXZDO1FBQ0UsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUM7WUFDdkMsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUFFO1lBQ1QsZ0JBQWdCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDN0MsY0FBYyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ3pCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QyxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDO1lBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDOUIsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsZUFBSyxDQUFDO2dCQUM1QyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNwQyxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDdEI7Z0JBQ0QsZUFBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3ZDLFlBQVksRUFBRSx1Q0FBdUM7U0FDdEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDdEI7UUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUVsQixJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUNqQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztTQUN0QztJQUNILENBQUM7SUFFRCxNQUFNO1FBQ0osbUNBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO2dCQUN4QyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWM7YUFDMUIsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNO1FBQ1YsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDZjthQUFNLElBQUksZUFBSyxDQUFDLFFBQVEsSUFBSSxlQUFLLENBQUMsT0FBTyxFQUFFO1lBQzFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7Z0JBQy9CLEtBQUssRUFBRSxlQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQzVDLGlDQUF5QixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsZUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUM1RDthQUNGLENBQUMsQ0FBQztZQUNILE1BQU0sT0FBTyxHQUFHLGVBQUssQ0FBQyxPQUFPLENBQUM7WUFDOUIsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2pCO1lBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7SUFDSCxDQUFDO0NBQ0Y7QUExRUQsdUNBMEVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFNlbGVjdExpc3RWaWV3IGZyb20gXCJhdG9tLXNlbGVjdC1saXN0XCI7XG5pbXBvcnQgc3RvcmUgZnJvbSBcIi4vc3RvcmVcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB0aWxkaWZ5IGZyb20gXCJ0aWxkaWZ5XCI7XG5pbXBvcnQge1xuICBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyLFxuICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4va2VybmVsXCI7XG5pbXBvcnQgdHlwZSB7IEtlcm5lbHNwZWNNZXRhZGF0YSB9IGZyb20gXCJAbnRlcmFjdC90eXBlc1wiO1xuXG5mdW5jdGlvbiBnZXROYW1lKGtlcm5lbDogS2VybmVsKSB7XG4gIGNvbnN0IHByZWZpeCA9IGtlcm5lbC50cmFuc3BvcnQuZ2F0ZXdheU5hbWVcbiAgICA/IGAke2tlcm5lbC50cmFuc3BvcnQuZ2F0ZXdheU5hbWV9OiBgXG4gICAgOiBcIlwiO1xuICByZXR1cm4gYCR7cHJlZml4ICsga2VybmVsLmRpc3BsYXlOYW1lfSAtICR7c3RvcmVcbiAgICAuZ2V0RmlsZXNGb3JLZXJuZWwoa2VybmVsKVxuICAgIC5tYXAodGlsZGlmeSlcbiAgICAuam9pbihcIiwgXCIpfWA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV4aXN0aW5nS2VybmVsUGlja2VyIHtcbiAga2VybmVsU3BlY3M6IEFycmF5PEtlcm5lbHNwZWNNZXRhZGF0YT47XG4gIHNlbGVjdExpc3RWaWV3OiBTZWxlY3RMaXN0VmlldztcbiAgcGFuZWw6IFBhbmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zZWxlY3RMaXN0VmlldyA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XG4gICAgICBpdGVtc0NsYXNzTGlzdDogW1wibWFyay1hY3RpdmVcIl0sXG4gICAgICBpdGVtczogW10sXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAoa2VybmVsKSA9PiBnZXROYW1lKGtlcm5lbCksXG4gICAgICBlbGVtZW50Rm9ySXRlbTogKGtlcm5lbCkgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gZ2V0TmFtZShrZXJuZWwpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgIH0sXG4gICAgICBkaWRDb25maXJtU2VsZWN0aW9uOiAoa2VybmVsKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgZmlsZVBhdGgsIGVkaXRvciwgZ3JhbW1hciB9ID0gc3RvcmU7XG4gICAgICAgIGlmICghZmlsZVBhdGggfHwgIWVkaXRvciB8fCAhZ3JhbW1hcikge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgICAgIHN0b3JlLm5ld0tlcm5lbChrZXJuZWwsIGZpbGVQYXRoLCBlZGl0b3IsIGdyYW1tYXIpO1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgfSxcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4gdGhpcy5jYW5jZWwoKSxcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBydW5uaW5nIGtlcm5lbHMgZm9yIHRoaXMgbGFuZ3VhZ2UuXCIsXG4gICAgfSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0TGlzdFZpZXcuZGVzdHJveSgpO1xuICB9XG5cbiAgY2FuY2VsKCkge1xuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcbiAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHRoaXMucGFuZWwgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50KSB7XG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGF0dGFjaCgpIHtcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcyk7XG4gICAgaWYgKHRoaXMucGFuZWwgPT0gbnVsbCkge1xuICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICBpdGVtOiB0aGlzLnNlbGVjdExpc3RWaWV3LFxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcuZm9jdXMoKTtcbiAgICB0aGlzLnNlbGVjdExpc3RWaWV3LnJlc2V0KCk7XG4gIH1cblxuICBhc3luYyB0b2dnbGUoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICB9IGVsc2UgaWYgKHN0b3JlLmZpbGVQYXRoICYmIHN0b3JlLmdyYW1tYXIpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcbiAgICAgICAgaXRlbXM6IHN0b3JlLnJ1bm5pbmdLZXJuZWxzLmZpbHRlcigoa2VybmVsKSA9PlxuICAgICAgICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoa2VybmVsLmtlcm5lbFNwZWMsIHN0b3JlLmdyYW1tYXIpXG4gICAgICAgICksXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG1hcmtlcnMgPSBzdG9yZS5tYXJrZXJzO1xuICAgICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgICAgbWFya2Vycy5jbGVhcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5hdHRhY2goKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==