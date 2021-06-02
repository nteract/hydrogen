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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9zdG9yZS93YXRjaGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQXVEO0FBQ3ZELCtCQUEwQztBQUMxQyx3RUFBOEM7QUFDOUMsb0RBQWlDO0FBQ2pDLHFGQUFxRTtBQUNyRSxvQ0FBdUQ7QUFRdkQsTUFBcUIsWUFBWTtJQU8vQixZQUFZLE1BQWM7UUFKMUIsWUFBTyxHQUFzQixFQUFFLENBQUM7UUFrQmhDLGdCQUFXLEdBQUcsR0FBRyxFQUFFO1lBQ2pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFeEQsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLGVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QixJQUFJLHNCQUFvQixDQUFDLFVBQVUsRUFBRTtvQkFDbkMsc0JBQW9CLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUMxRDtnQkFDRCxPQUFPLEtBQUssQ0FBQzthQUNkO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQyxDQUFDO1FBRUYsYUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNkLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3QixDQUFDLENBQUM7UUFFRix1QkFBa0IsR0FBRyxDQUFDLE1BQWtCLEVBQUUsRUFBRTtZQUMxQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNYLE9BQU87YUFDUjtZQUNELE1B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QUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDO1FBL0ZBLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXZDLElBQUksc0JBQW9CLENBQUMsVUFBVSxFQUFFO1lBQ25DLE1BQU0sVUFBVSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztZQUM3QyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsVUFBVSxDQUFDO1lBQzFDLHNCQUFvQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUMzQztRQUVELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBdUZELE9BQU87UUFDTCxJQUFJLHNCQUFvQixDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsdUJBQXVCLEVBQUU7WUFDbkUsc0JBQW9CLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQzVEO0lBQ0gsQ0FBQztDQUNGO0FBM0dDO0lBREMsaUJBQVU7OEJBQ0YsS0FBSzs2Q0FBa0I7QUFrQmhDO0lBREMsYUFBTTs7aURBY0w7QUFFRjtJQURDLGFBQU07OzhDQUdMO0FBRUY7SUFEQyxhQUFNOzt3REFjTDtBQUVGO0lBREMsYUFBTTs7aURBNkNMO0FBRUY7SUFEQyxhQUFNOzt5Q0FHTDtBQXZHSiwrQkE4R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RWRpdG9yLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHsgYWN0aW9uLCBvYnNlcnZhYmxlIH0gZnJvbSBcIm1vYnhcIjtcclxuaW1wb3J0IFNlbGVjdExpc3RWaWV3IGZyb20gXCJhdG9tLXNlbGVjdC1saXN0XCI7XHJcbmltcG9ydCBXYXRjaFN0b3JlIGZyb20gXCIuL3dhdGNoXCI7XHJcbmltcG9ydCBBdXRvY29tcGxldGVDb25zdW1lciBmcm9tIFwiLi4vc2VydmljZXMvY29uc3VtZWQvYXV0b2NvbXBsZXRlXCI7XHJcbmltcG9ydCB7IHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4uL2tlcm5lbFwiO1xyXG5cclxuaW50ZXJmYWNlIFNlbGVjdExpc3RJdGVtIHtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgdmFsdWU6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2F0Y2hlc1N0b3JlIHtcclxuICBrZXJuZWw6IEtlcm5lbDtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIHdhdGNoZXM6IEFycmF5PFdhdGNoU3RvcmU+ID0gW107XHJcbiAgYXV0b2NvbXBsZXRlRGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGUgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihrZXJuZWw6IEtlcm5lbCkge1xyXG4gICAgdGhpcy5rZXJuZWwgPSBrZXJuZWw7XHJcbiAgICB0aGlzLmtlcm5lbC5hZGRXYXRjaENhbGxiYWNrKHRoaXMucnVuKTtcclxuXHJcbiAgICBpZiAoQXV0b2NvbXBsZXRlQ29uc3VtZXIuaXNFbmFiZWxlZCkge1xyXG4gICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgdGhpcy5hdXRvY29tcGxldGVEaXNwb3NhYmxlcyA9IGRpc3Bvc2FibGU7XHJcbiAgICAgIEF1dG9jb21wbGV0ZUNvbnN1bWVyLnJlZ2lzdGVyKGRpc3Bvc2FibGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYWRkV2F0Y2goKTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBjcmVhdGVXYXRjaCA9ICgpID0+IHtcclxuICAgIGNvbnN0IGxhc3RXYXRjaCA9IHRoaXMud2F0Y2hlc1t0aGlzLndhdGNoZXMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgaWYgKCFsYXN0V2F0Y2ggfHwgbGFzdFdhdGNoLmdldENvZGUoKS50cmltKCkgIT09IFwiXCIpIHtcclxuICAgICAgY29uc3Qgd2F0Y2ggPSBuZXcgV2F0Y2hTdG9yZSh0aGlzLmtlcm5lbCk7XHJcbiAgICAgIHRoaXMud2F0Y2hlcy5wdXNoKHdhdGNoKTtcclxuICAgICAgaWYgKEF1dG9jb21wbGV0ZUNvbnN1bWVyLmlzRW5hYmVsZWQpIHtcclxuICAgICAgICBBdXRvY29tcGxldGVDb25zdW1lci5hZGRBdXRvY29tcGxldGVUb1dhdGNoKHRoaXMsIHdhdGNoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gd2F0Y2g7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGxhc3RXYXRjaDtcclxuICB9O1xyXG4gIEBhY3Rpb25cclxuICBhZGRXYXRjaCA9ICgpID0+IHtcclxuICAgIHRoaXMuY3JlYXRlV2F0Y2goKS5mb2N1cygpO1xyXG4gIH07XHJcbiAgQGFjdGlvblxyXG4gIGFkZFdhdGNoRnJvbUVkaXRvciA9IChlZGl0b3I6IFRleHRFZGl0b3IpID0+IHtcclxuICAgIGlmICghZWRpdG9yKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHdhdGNoVGV4dCA9IGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKTtcclxuXHJcbiAgICBpZiAoIXdhdGNoVGV4dCkge1xyXG4gICAgICB0aGlzLmFkZFdhdGNoKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCB3YXRjaCA9IHRoaXMuY3JlYXRlV2F0Y2goKTtcclxuICAgICAgd2F0Y2guc2V0Q29kZSh3YXRjaFRleHQpO1xyXG4gICAgICB3YXRjaC5ydW4oKTtcclxuICAgIH1cclxuICB9O1xyXG4gIEBhY3Rpb25cclxuICByZW1vdmVXYXRjaCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHdhdGNoZXMgPSB0aGlzLndhdGNoZXNcclxuICAgICAgLm1hcCgodiwgaykgPT4gKHtcclxuICAgICAgICBuYW1lOiB2LmdldENvZGUoKSxcclxuICAgICAgICB2YWx1ZTogayxcclxuICAgICAgfSkpXHJcbiAgICAgIC5maWx0ZXIoKG9iaikgPT4gb2JqLnZhbHVlICE9PSAwIHx8IG9iai5uYW1lICE9PSBcIlwiKTtcclxuICAgIGNvbnN0IHdhdGNoZXNQaWNrZXIgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xyXG4gICAgICBpdGVtczogd2F0Y2hlcyBhcyBTZWxlY3RMaXN0SXRlbVtdLFxyXG4gICAgICBlbGVtZW50Rm9ySXRlbTogKHdhdGNoOiBTZWxlY3RMaXN0SXRlbSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IHdhdGNoLm5hbWUgfHwgXCI8ZW1wdHk+XCI7XHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgIH0sXHJcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246ICh3YXRjaDogU2VsZWN0TGlzdEl0ZW0pID0+IHtcclxuICAgICAgICBjb25zdCBzZWxlY3RlZFdhdGNoID0gdGhpcy53YXRjaGVzW3dhdGNoLnZhbHVlXTtcclxuICAgICAgICAvLyBUaGlzIGlzIGZvciBjbGVhbnVwIHRvIGltcHJvdmUgcGVyZm9ybWFuY2VcclxuICAgICAgICBpZiAoQXV0b2NvbXBsZXRlQ29uc3VtZXIuaXNFbmFiZWxlZCkge1xyXG4gICAgICAgICAgQXV0b2NvbXBsZXRlQ29uc3VtZXIucmVtb3ZlQXV0b2NvbXBsZXRlRnJvbVdhdGNoKHRoaXMsIHNlbGVjdGVkV2F0Y2gpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndhdGNoZXMuc3BsaWNlKHdhdGNoLnZhbHVlLCAxKTtcclxuICAgICAgICBtb2RhbFBhbmVsLmRlc3Ryb3koKTtcclxuICAgICAgICB3YXRjaGVzUGlja2VyLmRlc3Ryb3koKTtcclxuICAgICAgICBpZiAodGhpcy53YXRjaGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgdGhpcy5hZGRXYXRjaCgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcclxuICAgICAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAod2F0Y2g6IFNlbGVjdExpc3RJdGVtKSA9PiB3YXRjaC5uYW1lLFxyXG4gICAgICBkaWRDYW5jZWxTZWxlY3Rpb246ICgpID0+IHtcclxuICAgICAgICBtb2RhbFBhbmVsLmRlc3Ryb3koKTtcclxuICAgICAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcclxuICAgICAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdhdGNoZXNQaWNrZXIuZGVzdHJveSgpO1xyXG4gICAgICB9LFxyXG4gICAgICBlbXB0eU1lc3NhZ2U6IFwiVGhlcmUgYXJlIG5vIHdhdGNoZXMgdG8gcmVtb3ZlIVwiLFxyXG4gICAgfSk7XHJcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcyk7XHJcbiAgICBjb25zdCBtb2RhbFBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XHJcbiAgICAgIGl0ZW06IHdhdGNoZXNQaWNrZXIsXHJcbiAgICB9KTtcclxuICAgIHdhdGNoZXNQaWNrZXIuZm9jdXMoKTtcclxuICB9O1xyXG4gIEBhY3Rpb25cclxuICBydW4gPSAoKSA9PiB7XHJcbiAgICB0aGlzLndhdGNoZXMuZm9yRWFjaCgod2F0Y2gpID0+IHdhdGNoLnJ1bigpKTtcclxuICB9O1xyXG5cclxuICBkZXN0cm95KCkge1xyXG4gICAgaWYgKEF1dG9jb21wbGV0ZUNvbnN1bWVyLmlzRW5hYmVsZWQgJiYgdGhpcy5hdXRvY29tcGxldGVEaXNwb3NhYmxlcykge1xyXG4gICAgICBBdXRvY29tcGxldGVDb25zdW1lci5kaXNwb3NlKHRoaXMuYXV0b2NvbXBsZXRlRGlzcG9zYWJsZXMpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=