"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const react_1 = __importDefault(require("react"));
const utils_1 = require("../utils");
const watch_sidebar_1 = __importDefault(require("../components/watch-sidebar"));
class WatchesPane {
    constructor(store) {
        this.element = document.createElement("div");
        this.disposer = new atom_1.CompositeDisposable();
        this.getTitle = () => "Hydrogen Watch";
        this.getURI = () => utils_1.WATCHES_URI;
        this.getDefaultLocation = () => "right";
        this.getAllowedLocations = () => ["left", "right"];
        this.element.classList.add("hydrogen");
        utils_1.reactFactory(react_1.default.createElement(watch_sidebar_1.default, { store: store }), this.element, null, this.disposer);
    }
    destroy() {
        this.disposer.dispose();
        this.element.remove();
    }
}
exports.default = WatchesPane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9wYW5lcy93YXRjaGVzLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLCtCQUEyQztBQUMzQyxrREFBMEI7QUFDMUIsb0NBQXFEO0FBRXJELGdGQUFrRDtBQUNsRCxNQUFxQixXQUFXO0lBSTlCLFlBQVksS0FBWTtRQUh4QixZQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxhQUFRLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBT3JDLGFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNsQyxXQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsbUJBQVcsQ0FBQztRQUMzQix1QkFBa0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDbkMsd0JBQW1CLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFQNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLG9CQUFZLENBQUMsOEJBQUMsdUJBQU8sSUFBQyxLQUFLLEVBQUUsS0FBSyxHQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFPRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3hCLENBQUM7Q0FDRjtBQWxCRCw4QkFrQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHJlYWN0RmFjdG9yeSwgV0FUQ0hFU19VUkkgfSBmcm9tIFwiLi4vdXRpbHNcIjtcbnR5cGUgc3RvcmUgPSB0eXBlb2YgaW1wb3J0KFwiLi4vc3RvcmVcIikuZGVmYXVsdDtcbmltcG9ydCBXYXRjaGVzIGZyb20gXCIuLi9jb21wb25lbnRzL3dhdGNoLXNpZGViYXJcIjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhdGNoZXNQYW5lIHtcbiAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRpc3Bvc2VyID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICBjb25zdHJ1Y3RvcihzdG9yZTogc3RvcmUpIHtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImh5ZHJvZ2VuXCIpO1xuICAgIHJlYWN0RmFjdG9yeSg8V2F0Y2hlcyBzdG9yZT17c3RvcmV9IC8+LCB0aGlzLmVsZW1lbnQsIG51bGwsIHRoaXMuZGlzcG9zZXIpO1xuICB9XG5cbiAgZ2V0VGl0bGUgPSAoKSA9PiBcIkh5ZHJvZ2VuIFdhdGNoXCI7XG4gIGdldFVSSSA9ICgpID0+IFdBVENIRVNfVVJJO1xuICBnZXREZWZhdWx0TG9jYXRpb24gPSAoKSA9PiBcInJpZ2h0XCI7XG4gIGdldEFsbG93ZWRMb2NhdGlvbnMgPSAoKSA9PiBbXCJsZWZ0XCIsIFwicmlnaHRcIl07XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlKCk7XG4gIH1cbn1cbiJdfQ==