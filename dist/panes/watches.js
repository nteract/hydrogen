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
        (0, utils_1.reactFactory)(react_1.default.createElement(watch_sidebar_1.default, { store: store }), this.element, null, this.disposer);
    }
    destroy() {
        this.disposer.dispose();
        this.element.remove();
    }
}
exports.default = WatchesPane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9wYW5lcy93YXRjaGVzLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLCtCQUEyQztBQUMzQyxrREFBMEI7QUFDMUIsb0NBQXFEO0FBRXJELGdGQUFrRDtBQUNsRCxNQUFxQixXQUFXO0lBSTlCLFlBQVksS0FBWTtRQUh4QixZQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxhQUFRLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBT3JDLGFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNsQyxXQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsbUJBQVcsQ0FBQztRQUMzQix1QkFBa0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDbkMsd0JBQW1CLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFQNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLElBQUEsb0JBQVksRUFBQyw4QkFBQyx1QkFBTyxJQUFDLEtBQUssRUFBRSxLQUFLLEdBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQU9ELE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBbEJELDhCQWtCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgcmVhY3RGYWN0b3J5LCBXQVRDSEVTX1VSSSB9IGZyb20gXCIuLi91dGlsc1wiO1xudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi9zdG9yZVwiKS5kZWZhdWx0O1xuaW1wb3J0IFdhdGNoZXMgZnJvbSBcIi4uL2NvbXBvbmVudHMvd2F0Y2gtc2lkZWJhclwiO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2F0Y2hlc1BhbmUge1xuICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGlzcG9zZXIgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JlOiBzdG9yZSkge1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaHlkcm9nZW5cIik7XG4gICAgcmVhY3RGYWN0b3J5KDxXYXRjaGVzIHN0b3JlPXtzdG9yZX0gLz4sIHRoaXMuZWxlbWVudCwgbnVsbCwgdGhpcy5kaXNwb3Nlcik7XG4gIH1cblxuICBnZXRUaXRsZSA9ICgpID0+IFwiSHlkcm9nZW4gV2F0Y2hcIjtcbiAgZ2V0VVJJID0gKCkgPT4gV0FUQ0hFU19VUkk7XG4gIGdldERlZmF1bHRMb2NhdGlvbiA9ICgpID0+IFwicmlnaHRcIjtcbiAgZ2V0QWxsb3dlZExvY2F0aW9ucyA9ICgpID0+IFtcImxlZnRcIiwgXCJyaWdodFwiXTtcblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuZGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmUoKTtcbiAgfVxufVxuIl19