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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhpc3Rpbmcta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9leGlzdGluZy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQXdFO0FBQ3hFLG9EQUE0QjtBQUM1QixzREFBOEI7QUFDOUIsbUNBR2lCO0FBSWpCLFNBQVMsT0FBTyxDQUFDLE1BQWM7SUFDN0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXO1FBQ3pDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxJQUFJO1FBQ3JDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDUCxPQUFPLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLE1BQU0sZUFBSztTQUM3QyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7U0FDekIsR0FBRyxDQUFDLGlCQUFPLENBQUM7U0FDWixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUNsQixDQUFDO0FBRUQsTUFBcUIsb0JBQW9CO0lBTXZDO1FBQ0UsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUM7WUFDdkMsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUFjO1lBQ3JCLGdCQUFnQixFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ3JELGNBQWMsRUFBRSxDQUFDLE1BQWMsRUFBRSxFQUFFO2dCQUNqQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEMsT0FBTyxPQUFPLENBQUM7WUFDakIsQ0FBQztZQUNELG1CQUFtQixFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUU7Z0JBQ3RDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLGVBQUssQ0FBQztnQkFDNUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDcEMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7aUJBQ3RCO2dCQUNELGVBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBQ0Qsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN2QyxZQUFZLEVBQUUsdUNBQXVDO1NBQ3RELENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxNQUFNO1FBQ0osSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3RCO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFFbEIsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUU7WUFDakMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUM7U0FDdEM7SUFDSCxDQUFDO0lBRUQsTUFBTTtRQUNKLG1DQUEyQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDdEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQztnQkFDeEMsSUFBSSxFQUFFLElBQUksQ0FBQyxjQUFjO2FBQzFCLENBQUMsQ0FBQztTQUNKO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFRCxLQUFLLENBQUMsTUFBTTtRQUNWLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDdEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7YUFBTSxJQUFJLGVBQUssQ0FBQyxRQUFRLElBQUksZUFBSyxDQUFDLE9BQU8sRUFBRTtZQUMxQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO2dCQUMvQixLQUFLLEVBQUUsZUFBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUM1QyxpQ0FBeUIsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLGVBQUssQ0FBQyxPQUFPLENBQUMsQ0FDNUQ7YUFDc0IsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sT0FBTyxHQUFHLGVBQUssQ0FBQyxPQUFPLENBQUM7WUFDOUIsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2pCO1lBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7SUFDSCxDQUFDO0NBQ0Y7QUExRUQsdUNBMEVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgU2VsZWN0TGlzdFZpZXcsIHsgU2VsZWN0TGlzdFByb3BlcnRpZXMgfSBmcm9tIFwiYXRvbS1zZWxlY3QtbGlzdFwiO1xyXG5pbXBvcnQgc3RvcmUgZnJvbSBcIi4vc3RvcmVcIjtcclxuaW1wb3J0IHRpbGRpZnkgZnJvbSBcInRpbGRpZnlcIjtcclxuaW1wb3J0IHtcclxuICBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyLFxyXG4gIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCxcclxufSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4va2VybmVsXCI7XHJcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XHJcblxyXG5mdW5jdGlvbiBnZXROYW1lKGtlcm5lbDogS2VybmVsKSB7XHJcbiAgY29uc3QgcHJlZml4ID0ga2VybmVsLnRyYW5zcG9ydC5nYXRld2F5TmFtZVxyXG4gICAgPyBgJHtrZXJuZWwudHJhbnNwb3J0LmdhdGV3YXlOYW1lfTogYFxyXG4gICAgOiBcIlwiO1xyXG4gIHJldHVybiBgJHtwcmVmaXggKyBrZXJuZWwuZGlzcGxheU5hbWV9IC0gJHtzdG9yZVxyXG4gICAgLmdldEZpbGVzRm9yS2VybmVsKGtlcm5lbClcclxuICAgIC5tYXAodGlsZGlmeSlcclxuICAgIC5qb2luKFwiLCBcIil9YDtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXhpc3RpbmdLZXJuZWxQaWNrZXIge1xyXG4gIGtlcm5lbFNwZWNzOiBBcnJheTxLZXJuZWxzcGVjTWV0YWRhdGE+O1xyXG4gIHNlbGVjdExpc3RWaWV3OiBTZWxlY3RMaXN0VmlldztcclxuICBwYW5lbDogUGFuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xyXG4gICAgICBpdGVtc0NsYXNzTGlzdDogW1wibWFyay1hY3RpdmVcIl0sXHJcbiAgICAgIGl0ZW1zOiBbXSBhcyBLZXJuZWxbXSxcclxuICAgICAgZmlsdGVyS2V5Rm9ySXRlbTogKGtlcm5lbDogS2VybmVsKSA9PiBnZXROYW1lKGtlcm5lbCksXHJcbiAgICAgIGVsZW1lbnRGb3JJdGVtOiAoa2VybmVsOiBLZXJuZWwpID0+IHtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBnZXROYW1lKGtlcm5lbCk7XHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgIH0sXHJcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246IChrZXJuZWw6IEtlcm5lbCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHsgZmlsZVBhdGgsIGVkaXRvciwgZ3JhbW1hciB9ID0gc3RvcmU7XHJcbiAgICAgICAgaWYgKCFmaWxlUGF0aCB8fCAhZWRpdG9yIHx8ICFncmFtbWFyKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RvcmUubmV3S2VybmVsKGtlcm5lbCwgZmlsZVBhdGgsIGVkaXRvciwgZ3JhbW1hcik7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgfSxcclxuICAgICAgZGlkQ2FuY2VsU2VsZWN0aW9uOiAoKSA9PiB0aGlzLmNhbmNlbCgpLFxyXG4gICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8gcnVubmluZyBrZXJuZWxzIGZvciB0aGlzIGxhbmd1YWdlLlwiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIHJldHVybiB0aGlzLnNlbGVjdExpc3RWaWV3LmRlc3Ryb3koKTtcclxuICB9XHJcblxyXG4gIGNhbmNlbCgpIHtcclxuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wYW5lbCA9IG51bGw7XHJcblxyXG4gICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50KSB7XHJcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XHJcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGF0dGFjaCgpIHtcclxuICAgIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCh0aGlzKTtcclxuICAgIGlmICh0aGlzLnBhbmVsID09IG51bGwpIHtcclxuICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xyXG4gICAgICAgIGl0ZW06IHRoaXMuc2VsZWN0TGlzdFZpZXcsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RMaXN0Vmlldy5mb2N1cygpO1xyXG4gICAgdGhpcy5zZWxlY3RMaXN0Vmlldy5yZXNldCgpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdG9nZ2xlKCkge1xyXG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgfSBlbHNlIGlmIChzdG9yZS5maWxlUGF0aCAmJiBzdG9yZS5ncmFtbWFyKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgICBpdGVtczogc3RvcmUucnVubmluZ0tlcm5lbHMuZmlsdGVyKChrZXJuZWwpID0+XHJcbiAgICAgICAgICBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyKGtlcm5lbC5rZXJuZWxTcGVjLCBzdG9yZS5ncmFtbWFyKVxyXG4gICAgICAgICksXHJcbiAgICAgIH0gYXMgU2VsZWN0TGlzdFByb3BlcnRpZXMpO1xyXG4gICAgICBjb25zdCBtYXJrZXJzID0gc3RvcmUubWFya2VycztcclxuICAgICAgaWYgKG1hcmtlcnMpIHtcclxuICAgICAgICBtYXJrZXJzLmNsZWFyKCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5hdHRhY2goKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19