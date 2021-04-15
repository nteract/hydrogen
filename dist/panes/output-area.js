"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const react_1 = __importDefault(require("react"));
const utils_1 = require("../utils");
const output_area_1 = __importDefault(require("../components/output-area"));
class OutputPane {
    constructor(store) {
        this.element = document.createElement("div");
        this.disposer = new atom_1.CompositeDisposable();
        this.getTitle = () => "Hydrogen Output Area";
        this.getURI = () => utils_1.OUTPUT_AREA_URI;
        this.getDefaultLocation = () => "right";
        this.getAllowedLocations = () => ["left", "right", "bottom"];
        this.element.classList.add("hydrogen");
        this.disposer.add(new atom_1.Disposable(() => {
            if (store.kernel) {
                store.kernel.outputStore.clear();
            }
        }));
        utils_1.reactFactory(react_1.default.createElement(output_area_1.default, { store: store }), this.element, null, this.disposer);
    }
    destroy() {
        this.disposer.dispose();
        const pane = atom.workspace.paneForURI(utils_1.OUTPUT_AREA_URI);
        if (!pane) {
            return;
        }
        pane.destroyItem(this);
    }
}
exports.default = OutputPane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LWFyZWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcGFuZXMvb3V0cHV0LWFyZWEudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsK0JBQXVEO0FBQ3ZELGtEQUEwQjtBQUMxQixvQ0FBeUQ7QUFFekQsNEVBQW1EO0FBQ25ELE1BQXFCLFVBQVU7SUFJN0IsWUFBWSxLQUFZO1FBSHhCLFlBQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLGFBQVEsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUM7UUFtQnJDLGFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztRQUN4QyxXQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsdUJBQWUsQ0FBQztRQUMvQix1QkFBa0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDbkMsd0JBQW1CLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBbkJ0RCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ2YsSUFBSSxpQkFBVSxDQUFDLEdBQUcsRUFBRTtZQUNsQixJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2xDO1FBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNGLG9CQUFZLENBQ1YsOEJBQUMscUJBQVUsSUFBQyxLQUFLLEVBQUUsS0FBSyxHQUFJLEVBQzVCLElBQUksQ0FBQyxPQUFPLEVBQ1osSUFBSSxFQUNKLElBQUksQ0FBQyxRQUFRLENBQ2QsQ0FBQztJQUNKLENBQUM7SUFPRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUl4QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyx1QkFBZSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekIsQ0FBQztDQUNGO0FBckNELDZCQXFDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgcmVhY3RGYWN0b3J5LCBPVVRQVVRfQVJFQV9VUkkgfSBmcm9tIFwiLi4vdXRpbHNcIjtcbnR5cGUgc3RvcmUgPSB0eXBlb2YgaW1wb3J0KFwiLi4vc3RvcmVcIikuZGVmYXVsdDtcbmltcG9ydCBPdXRwdXRBcmVhIGZyb20gXCIuLi9jb21wb25lbnRzL291dHB1dC1hcmVhXCI7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPdXRwdXRQYW5lIHtcbiAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRpc3Bvc2VyID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICBjb25zdHJ1Y3RvcihzdG9yZTogc3RvcmUpIHtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImh5ZHJvZ2VuXCIpO1xuICAgIHRoaXMuZGlzcG9zZXIuYWRkKFxuICAgICAgbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgICBpZiAoc3RvcmUua2VybmVsKSB7XG4gICAgICAgICAgc3RvcmUua2VybmVsLm91dHB1dFN0b3JlLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgICByZWFjdEZhY3RvcnkoXG4gICAgICA8T3V0cHV0QXJlYSBzdG9yZT17c3RvcmV9IC8+LFxuICAgICAgdGhpcy5lbGVtZW50LFxuICAgICAgbnVsbCxcbiAgICAgIHRoaXMuZGlzcG9zZXJcbiAgICApO1xuICB9XG5cbiAgZ2V0VGl0bGUgPSAoKSA9PiBcIkh5ZHJvZ2VuIE91dHB1dCBBcmVhXCI7XG4gIGdldFVSSSA9ICgpID0+IE9VVFBVVF9BUkVBX1VSSTtcbiAgZ2V0RGVmYXVsdExvY2F0aW9uID0gKCkgPT4gXCJyaWdodFwiO1xuICBnZXRBbGxvd2VkTG9jYXRpb25zID0gKCkgPT4gW1wibGVmdFwiLCBcInJpZ2h0XCIsIFwiYm90dG9tXCJdO1xuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgLy8gV2hlbiBhIHVzZXIgbWFudWFsbHkgY2xpY2tzIHRoZSBjbG9zZSBpY29uLCB0aGUgcGFuZSBob2xkaW5nIHRoZSBPdXRwdXRBcmVhXG4gICAgLy8gaXMgZGVzdHJveWVkIGFsb25nIHdpdGggdGhlIE91dHB1dEFyZWEgaXRlbS4gV2UgbWltaWMgdGhpcyBoZXJlIHNvIHRoYXQgd2UgY2FuIGNhbGxcbiAgICAvLyAgb3V0cHV0QXJlYS5kZXN0cm95KCkgYW5kIGZ1bGx5IGNsZWFuIHVwIHRoZSBPdXRwdXRBcmVhIHdpdGhvdXQgdXNlciBjbGlja2luZ1xuICAgIGNvbnN0IHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJKE9VVFBVVF9BUkVBX1VSSSk7XG4gICAgaWYgKCFwYW5lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHBhbmUuZGVzdHJveUl0ZW0odGhpcyk7XG4gIH1cbn1cbiJdfQ==