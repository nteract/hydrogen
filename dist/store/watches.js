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
            utils_1.setPreviouslyFocusedElement(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9zdG9yZS93YXRjaGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQXVEO0FBQ3ZELCtCQUEwQztBQUMxQyx3RUFBOEM7QUFDOUMsb0RBQWlDO0FBQ2pDLHFGQUFxRTtBQUNyRSxvQ0FBdUQ7QUFJdkQsTUFBcUIsWUFBWTtJQU8vQixZQUFZLE1BQWM7UUFKMUIsWUFBTyxHQUFzQixFQUFFLENBQUM7UUFrQmhDLGdCQUFXLEdBQUcsR0FBRyxFQUFFO1lBQ2pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFeEQsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLGVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QixJQUFJLHNCQUFvQixDQUFDLFVBQVUsRUFBRTtvQkFDbkMsc0JBQW9CLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUMxRDtnQkFDRCxPQUFPLEtBQUssQ0FBQzthQUNkO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQyxDQUFDO1FBRUYsYUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNkLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3QixDQUFDLENBQUM7UUFFRix1QkFBa0IsR0FBRyxDQUFDLE1BQWtCLEVBQUUsRUFBRTtZQUMxQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNYLE9BQU87YUFDUjtZQUNELE1B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QUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUMsQ0FBQztRQS9GQSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV2QyxJQUFJLHNCQUFvQixDQUFDLFVBQVUsRUFBRTtZQUNuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLHVCQUF1QixHQUFHLFVBQVUsQ0FBQztZQUMxQyxzQkFBb0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDM0M7UUFFRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQXVGRCxPQUFPO1FBQ0wsSUFBSSxzQkFBb0IsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLHVCQUF1QixFQUFFO1lBQ25FLHNCQUFvQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztTQUM1RDtJQUNILENBQUM7Q0FDRjtBQTNHQztJQURDLGlCQUFVOzhCQUNGLEtBQUs7NkNBQWtCO0FBa0JoQztJQURDLGFBQU07O2lEQWNMO0FBRUY7SUFEQyxhQUFNOzs4Q0FHTDtBQUVGO0lBREMsYUFBTTs7d0RBY0w7QUFFRjtJQURDLGFBQU07O2lEQTZDTDtBQUVGO0lBREMsYUFBTTs7eUNBR0w7QUF2R0osK0JBOEdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGV4dEVkaXRvciwgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgeyBhY3Rpb24sIG9ic2VydmFibGUgfSBmcm9tIFwibW9ieFwiO1xuaW1wb3J0IFNlbGVjdExpc3RWaWV3IGZyb20gXCJhdG9tLXNlbGVjdC1saXN0XCI7XG5pbXBvcnQgV2F0Y2hTdG9yZSBmcm9tIFwiLi93YXRjaFwiO1xuaW1wb3J0IEF1dG9jb21wbGV0ZUNvbnN1bWVyIGZyb20gXCIuLi9zZXJ2aWNlcy9jb25zdW1lZC9hdXRvY29tcGxldGVcIjtcbmltcG9ydCB7IHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCB9IGZyb20gXCIuLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgS2VybmVsIGZyb20gXCIuLi9rZXJuZWxcIjtcbnR5cGUgc3RvcmUgPSB0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5kZWZhdWx0O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXYXRjaGVzU3RvcmUge1xuICBrZXJuZWw6IEtlcm5lbDtcbiAgQG9ic2VydmFibGVcbiAgd2F0Y2hlczogQXJyYXk8V2F0Y2hTdG9yZT4gPSBbXTtcbiAgYXV0b2NvbXBsZXRlRGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGUgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihrZXJuZWw6IEtlcm5lbCkge1xuICAgIHRoaXMua2VybmVsID0ga2VybmVsO1xuICAgIHRoaXMua2VybmVsLmFkZFdhdGNoQ2FsbGJhY2sodGhpcy5ydW4pO1xuXG4gICAgaWYgKEF1dG9jb21wbGV0ZUNvbnN1bWVyLmlzRW5hYmVsZWQpIHtcbiAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgdGhpcy5hdXRvY29tcGxldGVEaXNwb3NhYmxlcyA9IGRpc3Bvc2FibGU7XG4gICAgICBBdXRvY29tcGxldGVDb25zdW1lci5yZWdpc3RlcihkaXNwb3NhYmxlKTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZFdhdGNoKCk7XG4gIH1cblxuICBAYWN0aW9uXG4gIGNyZWF0ZVdhdGNoID0gKCkgPT4ge1xuICAgIGNvbnN0IGxhc3RXYXRjaCA9IHRoaXMud2F0Y2hlc1t0aGlzLndhdGNoZXMubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAoIWxhc3RXYXRjaCB8fCBsYXN0V2F0Y2guZ2V0Q29kZSgpLnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgY29uc3Qgd2F0Y2ggPSBuZXcgV2F0Y2hTdG9yZSh0aGlzLmtlcm5lbCk7XG4gICAgICB0aGlzLndhdGNoZXMucHVzaCh3YXRjaCk7XG4gICAgICBpZiAoQXV0b2NvbXBsZXRlQ29uc3VtZXIuaXNFbmFiZWxlZCkge1xuICAgICAgICBBdXRvY29tcGxldGVDb25zdW1lci5hZGRBdXRvY29tcGxldGVUb1dhdGNoKHRoaXMsIHdhdGNoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3YXRjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gbGFzdFdhdGNoO1xuICB9O1xuICBAYWN0aW9uXG4gIGFkZFdhdGNoID0gKCkgPT4ge1xuICAgIHRoaXMuY3JlYXRlV2F0Y2goKS5mb2N1cygpO1xuICB9O1xuICBAYWN0aW9uXG4gIGFkZFdhdGNoRnJvbUVkaXRvciA9IChlZGl0b3I6IFRleHRFZGl0b3IpID0+IHtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3YXRjaFRleHQgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCk7XG5cbiAgICBpZiAoIXdhdGNoVGV4dCkge1xuICAgICAgdGhpcy5hZGRXYXRjaCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB3YXRjaCA9IHRoaXMuY3JlYXRlV2F0Y2goKTtcbiAgICAgIHdhdGNoLnNldENvZGUod2F0Y2hUZXh0KTtcbiAgICAgIHdhdGNoLnJ1bigpO1xuICAgIH1cbiAgfTtcbiAgQGFjdGlvblxuICByZW1vdmVXYXRjaCA9ICgpID0+IHtcbiAgICBjb25zdCB3YXRjaGVzID0gdGhpcy53YXRjaGVzXG4gICAgICAubWFwKCh2LCBrKSA9PiAoe1xuICAgICAgICBuYW1lOiB2LmdldENvZGUoKSxcbiAgICAgICAgdmFsdWU6IGssXG4gICAgICB9KSlcbiAgICAgIC5maWx0ZXIoKG9iaikgPT4gb2JqLnZhbHVlICE9PSAwIHx8IG9iai5uYW1lICE9PSBcIlwiKTtcbiAgICBjb25zdCB3YXRjaGVzUGlja2VyID0gbmV3IFNlbGVjdExpc3RWaWV3KHtcbiAgICAgIGl0ZW1zOiB3YXRjaGVzLFxuICAgICAgZWxlbWVudEZvckl0ZW06ICh3YXRjaCkgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gd2F0Y2gubmFtZSB8fCBcIjxlbXB0eT5cIjtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICB9LFxuICAgICAgZGlkQ29uZmlybVNlbGVjdGlvbjogKHdhdGNoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkV2F0Y2ggPSB0aGlzLndhdGNoZXNbd2F0Y2gudmFsdWVdO1xuICAgICAgICAvLyBUaGlzIGlzIGZvciBjbGVhbnVwIHRvIGltcHJvdmUgcGVyZm9ybWFuY2VcbiAgICAgICAgaWYgKEF1dG9jb21wbGV0ZUNvbnN1bWVyLmlzRW5hYmVsZWQpIHtcbiAgICAgICAgICBBdXRvY29tcGxldGVDb25zdW1lci5yZW1vdmVBdXRvY29tcGxldGVGcm9tV2F0Y2godGhpcywgc2VsZWN0ZWRXYXRjaCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53YXRjaGVzLnNwbGljZSh3YXRjaC52YWx1ZSwgMSk7XG4gICAgICAgIG1vZGFsUGFuZWwuZGVzdHJveSgpO1xuICAgICAgICB3YXRjaGVzUGlja2VyLmRlc3Ryb3koKTtcbiAgICAgICAgaWYgKHRoaXMud2F0Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLmFkZFdhdGNoKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmlsdGVyS2V5Rm9ySXRlbTogKHdhdGNoKSA9PiB3YXRjaC5uYW1lLFxuICAgICAgZGlkQ2FuY2VsU2VsZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIG1vZGFsUGFuZWwuZGVzdHJveSgpO1xuICAgICAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIHdhdGNoZXNQaWNrZXIuZGVzdHJveSgpO1xuICAgICAgfSxcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJUaGVyZSBhcmUgbm8gd2F0Y2hlcyB0byByZW1vdmUhXCIsXG4gICAgfSk7XG4gICAgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50KHRoaXMpO1xuICAgIGNvbnN0IG1vZGFsUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgIGl0ZW06IHdhdGNoZXNQaWNrZXIsXG4gICAgfSk7XG4gICAgd2F0Y2hlc1BpY2tlci5mb2N1cygpO1xuICB9O1xuICBAYWN0aW9uXG4gIHJ1biA9ICgpID0+IHtcbiAgICB0aGlzLndhdGNoZXMuZm9yRWFjaCgod2F0Y2gpID0+IHdhdGNoLnJ1bigpKTtcbiAgfTtcblxuICBkZXN0cm95KCkge1xuICAgIGlmIChBdXRvY29tcGxldGVDb25zdW1lci5pc0VuYWJlbGVkICYmIHRoaXMuYXV0b2NvbXBsZXRlRGlzcG9zYWJsZXMpIHtcbiAgICAgIEF1dG9jb21wbGV0ZUNvbnN1bWVyLmRpc3Bvc2UodGhpcy5hdXRvY29tcGxldGVEaXNwb3NhYmxlcyk7XG4gICAgfVxuICB9XG59XG4iXX0=