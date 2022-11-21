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
        else if (store_1.default.filePath && store_1.default.grammar) {
            await this.selectListView.update({
                items: store_1.default.runningKernels.filter((kernel) => (0, utils_1.kernelSpecProvidesGrammar)(kernel.kernelSpec, store_1.default.grammar)),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhpc3Rpbmcta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9leGlzdGluZy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQXdFO0FBQ3hFLG9EQUE0QjtBQUM1QixzREFBOEI7QUFDOUIsbUNBR2lCO0FBSWpCLFNBQVMsT0FBTyxDQUFDLE1BQWM7SUFDN0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXO1FBQ3pDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxJQUFJO1FBQ3JDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDUCxPQUFPLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLE1BQU0sZUFBSztTQUM3QyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7U0FDekIsR0FBRyxDQUFDLGlCQUFPLENBQUM7U0FDWixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUNsQixDQUFDO0FBRUQsTUFBcUIsb0JBQW9CO0lBTXZDO1FBQ0UsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUM7WUFDdkMsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUFjO1lBQ3JCLGdCQUFnQixFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ3JELGNBQWMsRUFBRSxDQUFDLE1BQWMsRUFBRSxFQUFFO2dCQUNqQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEMsT0FBTyxPQUFPLENBQUM7WUFDakIsQ0FBQztZQUNELG1CQUFtQixFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUU7Z0JBQ3RDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLGVBQUssQ0FBQztnQkFDNUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDcEMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7aUJBQ3RCO2dCQUNELGVBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBQ0Qsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN2QyxZQUFZLEVBQUUsdUNBQXVDO1NBQ3RELENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxNQUFNO1FBQ0osSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3RCO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFFbEIsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUU7WUFDakMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUM7U0FDdEM7SUFDSCxDQUFDO0lBRUQsTUFBTTtRQUNKLElBQUEsbUNBQTJCLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO2dCQUN4QyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWM7YUFDMUIsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNO1FBQ1YsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDZjthQUFNLElBQUksZUFBSyxDQUFDLFFBQVEsSUFBSSxlQUFLLENBQUMsT0FBTyxFQUFFO1lBQzFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7Z0JBQy9CLEtBQUssRUFBRSxlQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQzVDLElBQUEsaUNBQXlCLEVBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxlQUFLLENBQUMsT0FBTyxDQUFDLENBQzVEO2FBQ3NCLENBQUMsQ0FBQztZQUMzQixNQUFNLE9BQU8sR0FBRyxlQUFLLENBQUMsT0FBTyxDQUFDO1lBQzlCLElBQUksT0FBTyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNqQjtZQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUNGO0FBMUVELHVDQTBFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhbmVsIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBTZWxlY3RMaXN0VmlldywgeyBTZWxlY3RMaXN0UHJvcGVydGllcyB9IGZyb20gXCJhdG9tLXNlbGVjdC1saXN0XCI7XG5pbXBvcnQgc3RvcmUgZnJvbSBcIi4vc3RvcmVcIjtcbmltcG9ydCB0aWxkaWZ5IGZyb20gXCJ0aWxkaWZ5XCI7XG5pbXBvcnQge1xuICBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyLFxuICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4va2VybmVsXCI7XG5pbXBvcnQgdHlwZSB7IEtlcm5lbHNwZWNNZXRhZGF0YSB9IGZyb20gXCJAbnRlcmFjdC90eXBlc1wiO1xuXG5mdW5jdGlvbiBnZXROYW1lKGtlcm5lbDogS2VybmVsKSB7XG4gIGNvbnN0IHByZWZpeCA9IGtlcm5lbC50cmFuc3BvcnQuZ2F0ZXdheU5hbWVcbiAgICA/IGAke2tlcm5lbC50cmFuc3BvcnQuZ2F0ZXdheU5hbWV9OiBgXG4gICAgOiBcIlwiO1xuICByZXR1cm4gYCR7cHJlZml4ICsga2VybmVsLmRpc3BsYXlOYW1lfSAtICR7c3RvcmVcbiAgICAuZ2V0RmlsZXNGb3JLZXJuZWwoa2VybmVsKVxuICAgIC5tYXAodGlsZGlmeSlcbiAgICAuam9pbihcIiwgXCIpfWA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV4aXN0aW5nS2VybmVsUGlja2VyIHtcbiAga2VybmVsU3BlY3M6IEFycmF5PEtlcm5lbHNwZWNNZXRhZGF0YT47XG4gIHNlbGVjdExpc3RWaWV3OiBTZWxlY3RMaXN0VmlldztcbiAgcGFuZWw6IFBhbmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zZWxlY3RMaXN0VmlldyA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XG4gICAgICBpdGVtc0NsYXNzTGlzdDogW1wibWFyay1hY3RpdmVcIl0sXG4gICAgICBpdGVtczogW10gYXMgS2VybmVsW10sXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAoa2VybmVsOiBLZXJuZWwpID0+IGdldE5hbWUoa2VybmVsKSxcbiAgICAgIGVsZW1lbnRGb3JJdGVtOiAoa2VybmVsOiBLZXJuZWwpID0+IHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGdldE5hbWUoa2VybmVsKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICB9LFxuICAgICAgZGlkQ29uZmlybVNlbGVjdGlvbjogKGtlcm5lbDogS2VybmVsKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgZmlsZVBhdGgsIGVkaXRvciwgZ3JhbW1hciB9ID0gc3RvcmU7XG4gICAgICAgIGlmICghZmlsZVBhdGggfHwgIWVkaXRvciB8fCAhZ3JhbW1hcikge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgICAgIHN0b3JlLm5ld0tlcm5lbChrZXJuZWwsIGZpbGVQYXRoLCBlZGl0b3IsIGdyYW1tYXIpO1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgfSxcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4gdGhpcy5jYW5jZWwoKSxcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBydW5uaW5nIGtlcm5lbHMgZm9yIHRoaXMgbGFuZ3VhZ2UuXCIsXG4gICAgfSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0TGlzdFZpZXcuZGVzdHJveSgpO1xuICB9XG5cbiAgY2FuY2VsKCkge1xuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcbiAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHRoaXMucGFuZWwgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50KSB7XG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGF0dGFjaCgpIHtcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcyk7XG4gICAgaWYgKHRoaXMucGFuZWwgPT0gbnVsbCkge1xuICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICBpdGVtOiB0aGlzLnNlbGVjdExpc3RWaWV3LFxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcuZm9jdXMoKTtcbiAgICB0aGlzLnNlbGVjdExpc3RWaWV3LnJlc2V0KCk7XG4gIH1cblxuICBhc3luYyB0b2dnbGUoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICB9IGVsc2UgaWYgKHN0b3JlLmZpbGVQYXRoICYmIHN0b3JlLmdyYW1tYXIpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcbiAgICAgICAgaXRlbXM6IHN0b3JlLnJ1bm5pbmdLZXJuZWxzLmZpbHRlcigoa2VybmVsKSA9PlxuICAgICAgICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoa2VybmVsLmtlcm5lbFNwZWMsIHN0b3JlLmdyYW1tYXIpXG4gICAgICAgICksXG4gICAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcbiAgICAgIGNvbnN0IG1hcmtlcnMgPSBzdG9yZS5tYXJrZXJzO1xuICAgICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgICAgbWFya2Vycy5jbGVhcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5hdHRhY2goKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==