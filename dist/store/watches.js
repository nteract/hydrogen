"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const mobx_1 = require("mobx");
const atom_select_list_1 = __importDefault(require("atom-select-list"));
const watch_1 = __importDefault(require("./watch"));
const autocomplete_1 = __importDefault(require("../services/consumed/autocomplete"));
const utils_1 = require("../utils");
class WatchesStore {
    constructor(kernel) {
        this.watches = [];
        this.createWatch = () => {
            const lastWatch = this.watches[this.watches.length - 1];
            if (!lastWatch || lastWatch.getCode().trim() !== "") {
                const watch = new watch_1.default(this.kernel);
                this.watches.push(watch);
                if (autocomplete_1.default.isEnabeled) {
                    autocomplete_1.default.addAutocompleteToWatch(this, watch);
                }
                return watch;
            }
            return lastWatch;
        };
        this.addWatch = () => {
            this.createWatch().focus();
        };
        this.addWatchFromEditor = (editor) => {
            if (!editor) {
                return;
            }
            const watchText = editor.getSelectedText();
            if (!watchText) {
                this.addWatch();
            }
            else {
                const watch = this.createWatch();
                watch.setCode(watchText);
                watch.run();
            }
        };
        this.removeWatch = () => {
            const watches = this.watches
                .map((v, k) => ({
                name: v.getCode(),
                value: k,
            }))
                .filter((obj) => obj.value !== 0 || obj.name !== "");
            const watchesPicker = new atom_select_list_1.default({
                items: watches,
                elementForItem: (watch) => {
                    const element = document.createElement("li");
                    element.textContent = watch.name || "<empty>";
                    return element;
                },
                didConfirmSelection: (watch) => {
                    const selectedWatch = this.watches[watch.value];
                    if (autocomplete_1.default.isEnabeled) {
                        autocomplete_1.default.removeAutocompleteFromWatch(this, selectedWatch);
                    }
                    this.watches.splice(watch.value, 1);
                    modalPanel.destroy();
                    watchesPicker.destroy();
                    if (this.watches.length === 0) {
                        this.addWatch();
                    }
                    else if (this.previouslyFocusedElement) {
                        this.previouslyFocusedElement.focus();
                    }
                },
                filterKeyForItem: (watch) => watch.name,
                didCancelSelection: () => {
                    modalPanel.destroy();
                    if (this.previouslyFocusedElement) {
                        this.previouslyFocusedElement.focus();
                    }
                    watchesPicker.destroy();
                },
                emptyMessage: "There are no watches to remove!",
            });
            (0, utils_1.setPreviouslyFocusedElement)(this);
            const modalPanel = atom.workspace.addModalPanel({
                item: watchesPicker,
            });
            watchesPicker.focus();
        };
        this.run = () => {
            this.watches.forEach((watch) => watch.run());
        };
        this.kernel = kernel;
        this.kernel.addWatchCallback(this.run);
        if (autocomplete_1.default.isEnabeled) {
            const disposable = new atom_1.CompositeDisposable();
            this.autocompleteDisposables = disposable;
            autocomplete_1.default.register(disposable);
        }
        this.addWatch();
    }
    destroy() {
        if (autocomplete_1.default.isEnabeled && this.autocompleteDisposables) {
            autocomplete_1.default.dispose(this.autocompleteDisposables);
        }
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", Array)
], WatchesStore.prototype, "watches", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], WatchesStore.prototype, "createWatch", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], WatchesStore.prototype, "addWatch", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], WatchesStore.prototype, "addWatchFromEditor", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], WatchesStore.prototype, "removeWatch", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], WatchesStore.prototype, "run", void 0);
exports.default = WatchesStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9zdG9yZS93YXRjaGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQXVEO0FBQ3ZELCtCQUEwQztBQUMxQyx3RUFBOEM7QUFDOUMsb0RBQWlDO0FBQ2pDLHFGQUFxRTtBQUNyRSxvQ0FBdUQ7QUFRdkQsTUFBcUIsWUFBWTtJQU8vQixZQUFZLE1BQWM7UUFKMUIsWUFBTyxHQUFzQixFQUFFLENBQUM7UUFrQmhDLGdCQUFXLEdBQUcsR0FBRyxFQUFFO1lBQ2pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFeEQsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLGVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QixJQUFJLHNCQUFvQixDQUFDLFVBQVUsRUFBRTtvQkFDbkMsc0JBQW9CLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUMxRDtnQkFDRCxPQUFPLEtBQUssQ0FBQzthQUNkO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQyxDQUFDO1FBRUYsYUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNkLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3QixDQUFDLENBQUM7UUFFRix1QkFBa0IsR0FBRyxDQUFDLE1BQWtCLEVBQUUsRUFBRTtZQUMxQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNYLE9BQU87YUFDUjtZQUNELE1B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QUNULElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUMvQyxDQUFDLENBQUM7UUEvRkEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFdkMsSUFBSSxzQkFBb0IsQ0FBQyxVQUFVLEVBQUU7WUFDbkMsTUFBTSxVQUFVLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxVQUFVLENBQUM7WUFDMUMsc0JBQW9CLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzNDO1FBRUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUF1RkQsT0FBTztRQUNMLElBQUksc0JBQW9CLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtZQUNuRSxzQkFBb0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7U0FDNUQ7SUFDSCxDQUFDO0NBQ0Y7QUE1R0M7SUFBQyxpQkFBVTs4QkFDRixLQUFLOzZDQUFrQjtBQWlCaEM7SUFBQyxhQUFNOztpREFjTDtBQUNGO0lBQUMsYUFBTTs7OENBR0w7QUFDRjtJQUFDLGFBQU07O3dEQWNMO0FBQ0Y7SUFBQyxhQUFNOztpREE2Q0w7QUFDRjtJQUFDLGFBQU07O3lDQUdMO0FBdkdKLCtCQThHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRleHRFZGl0b3IsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgYWN0aW9uLCBvYnNlcnZhYmxlIH0gZnJvbSBcIm1vYnhcIjtcbmltcG9ydCBTZWxlY3RMaXN0VmlldyBmcm9tIFwiYXRvbS1zZWxlY3QtbGlzdFwiO1xuaW1wb3J0IFdhdGNoU3RvcmUgZnJvbSBcIi4vd2F0Y2hcIjtcbmltcG9ydCBBdXRvY29tcGxldGVDb25zdW1lciBmcm9tIFwiLi4vc2VydmljZXMvY29uc3VtZWQvYXV0b2NvbXBsZXRlXCI7XG5pbXBvcnQgeyBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgfSBmcm9tIFwiLi4vdXRpbHNcIjtcbmltcG9ydCB0eXBlIEtlcm5lbCBmcm9tIFwiLi4va2VybmVsXCI7XG5cbmludGVyZmFjZSBTZWxlY3RMaXN0SXRlbSB7XG4gIG5hbWU6IHN0cmluZztcbiAgdmFsdWU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2F0Y2hlc1N0b3JlIHtcbiAga2VybmVsOiBLZXJuZWw7XG4gIEBvYnNlcnZhYmxlXG4gIHdhdGNoZXM6IEFycmF5PFdhdGNoU3RvcmU+ID0gW107XG4gIGF1dG9jb21wbGV0ZURpc3Bvc2FibGVzOiBDb21wb3NpdGVEaXNwb3NhYmxlIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Ioa2VybmVsOiBLZXJuZWwpIHtcbiAgICB0aGlzLmtlcm5lbCA9IGtlcm5lbDtcbiAgICB0aGlzLmtlcm5lbC5hZGRXYXRjaENhbGxiYWNrKHRoaXMucnVuKTtcblxuICAgIGlmIChBdXRvY29tcGxldGVDb25zdW1lci5pc0VuYWJlbGVkKSB7XG4gICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgIHRoaXMuYXV0b2NvbXBsZXRlRGlzcG9zYWJsZXMgPSBkaXNwb3NhYmxlO1xuICAgICAgQXV0b2NvbXBsZXRlQ29uc3VtZXIucmVnaXN0ZXIoZGlzcG9zYWJsZSk7XG4gICAgfVxuXG4gICAgdGhpcy5hZGRXYXRjaCgpO1xuICB9XG5cbiAgQGFjdGlvblxuICBjcmVhdGVXYXRjaCA9ICgpID0+IHtcbiAgICBjb25zdCBsYXN0V2F0Y2ggPSB0aGlzLndhdGNoZXNbdGhpcy53YXRjaGVzLmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKCFsYXN0V2F0Y2ggfHwgbGFzdFdhdGNoLmdldENvZGUoKS50cmltKCkgIT09IFwiXCIpIHtcbiAgICAgIGNvbnN0IHdhdGNoID0gbmV3IFdhdGNoU3RvcmUodGhpcy5rZXJuZWwpO1xuICAgICAgdGhpcy53YXRjaGVzLnB1c2god2F0Y2gpO1xuICAgICAgaWYgKEF1dG9jb21wbGV0ZUNvbnN1bWVyLmlzRW5hYmVsZWQpIHtcbiAgICAgICAgQXV0b2NvbXBsZXRlQ29uc3VtZXIuYWRkQXV0b2NvbXBsZXRlVG9XYXRjaCh0aGlzLCB3YXRjaCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2F0Y2g7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxhc3RXYXRjaDtcbiAgfTtcbiAgQGFjdGlvblxuICBhZGRXYXRjaCA9ICgpID0+IHtcbiAgICB0aGlzLmNyZWF0ZVdhdGNoKCkuZm9jdXMoKTtcbiAgfTtcbiAgQGFjdGlvblxuICBhZGRXYXRjaEZyb21FZGl0b3IgPSAoZWRpdG9yOiBUZXh0RWRpdG9yKSA9PiB7XG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgd2F0Y2hUZXh0ID0gZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpO1xuXG4gICAgaWYgKCF3YXRjaFRleHQpIHtcbiAgICAgIHRoaXMuYWRkV2F0Y2goKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgd2F0Y2ggPSB0aGlzLmNyZWF0ZVdhdGNoKCk7XG4gICAgICB3YXRjaC5zZXRDb2RlKHdhdGNoVGV4dCk7XG4gICAgICB3YXRjaC5ydW4oKTtcbiAgICB9XG4gIH07XG4gIEBhY3Rpb25cbiAgcmVtb3ZlV2F0Y2ggPSAoKSA9PiB7XG4gICAgY29uc3Qgd2F0Y2hlcyA9IHRoaXMud2F0Y2hlc1xuICAgICAgLm1hcCgodiwgaykgPT4gKHtcbiAgICAgICAgbmFtZTogdi5nZXRDb2RlKCksXG4gICAgICAgIHZhbHVlOiBrLFxuICAgICAgfSkpXG4gICAgICAuZmlsdGVyKChvYmopID0+IG9iai52YWx1ZSAhPT0gMCB8fCBvYmoubmFtZSAhPT0gXCJcIik7XG4gICAgY29uc3Qgd2F0Y2hlc1BpY2tlciA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XG4gICAgICBpdGVtczogd2F0Y2hlcyBhcyBTZWxlY3RMaXN0SXRlbVtdLFxuICAgICAgZWxlbWVudEZvckl0ZW06ICh3YXRjaDogU2VsZWN0TGlzdEl0ZW0pID0+IHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IHdhdGNoLm5hbWUgfHwgXCI8ZW1wdHk+XCI7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfSxcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246ICh3YXRjaDogU2VsZWN0TGlzdEl0ZW0pID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRXYXRjaCA9IHRoaXMud2F0Y2hlc1t3YXRjaC52YWx1ZV07XG4gICAgICAgIC8vIFRoaXMgaXMgZm9yIGNsZWFudXAgdG8gaW1wcm92ZSBwZXJmb3JtYW5jZVxuICAgICAgICBpZiAoQXV0b2NvbXBsZXRlQ29uc3VtZXIuaXNFbmFiZWxlZCkge1xuICAgICAgICAgIEF1dG9jb21wbGV0ZUNvbnN1bWVyLnJlbW92ZUF1dG9jb21wbGV0ZUZyb21XYXRjaCh0aGlzLCBzZWxlY3RlZFdhdGNoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndhdGNoZXMuc3BsaWNlKHdhdGNoLnZhbHVlLCAxKTtcbiAgICAgICAgbW9kYWxQYW5lbC5kZXN0cm95KCk7XG4gICAgICAgIHdhdGNoZXNQaWNrZXIuZGVzdHJveSgpO1xuICAgICAgICBpZiAodGhpcy53YXRjaGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuYWRkV2F0Y2goKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCkge1xuICAgICAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAod2F0Y2g6IFNlbGVjdExpc3RJdGVtKSA9PiB3YXRjaC5uYW1lLFxuICAgICAgZGlkQ2FuY2VsU2VsZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIG1vZGFsUGFuZWwuZGVzdHJveSgpO1xuICAgICAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIHdhdGNoZXNQaWNrZXIuZGVzdHJveSgpO1xuICAgICAgfSxcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJUaGVyZSBhcmUgbm8gd2F0Y2hlcyB0byByZW1vdmUhXCIsXG4gICAgfSk7XG4gICAgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50KHRoaXMpO1xuICAgIGNvbnN0IG1vZGFsUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgIGl0ZW06IHdhdGNoZXNQaWNrZXIsXG4gICAgfSk7XG4gICAgd2F0Y2hlc1BpY2tlci5mb2N1cygpO1xuICB9O1xuICBAYWN0aW9uXG4gIHJ1biA9ICgpID0+IHtcbiAgICB0aGlzLndhdGNoZXMuZm9yRWFjaCgod2F0Y2gpID0+IHdhdGNoLnJ1bigpKTtcbiAgfTtcblxuICBkZXN0cm95KCkge1xuICAgIGlmIChBdXRvY29tcGxldGVDb25zdW1lci5pc0VuYWJlbGVkICYmIHRoaXMuYXV0b2NvbXBsZXRlRGlzcG9zYWJsZXMpIHtcbiAgICAgIEF1dG9jb21wbGV0ZUNvbnN1bWVyLmRpc3Bvc2UodGhpcy5hdXRvY29tcGxldGVEaXNwb3NhYmxlcyk7XG4gICAgfVxuICB9XG59XG4iXX0=