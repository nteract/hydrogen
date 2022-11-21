"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const react_1 = __importDefault(require("react"));
const utils_1 = require("../utils");
const inspector_1 = __importDefault(require("../components/inspector"));
class InspectorPane {
    constructor(store) {
        this.element = document.createElement("div");
        this.disposer = new atom_1.CompositeDisposable();
        this.getTitle = () => "Hydrogen Inspector";
        this.getURI = () => utils_1.INSPECTOR_URI;
        this.getDefaultLocation = () => "bottom";
        this.getAllowedLocations = () => ["bottom", "left", "right"];
        this.element.classList.add("hydrogen", "inspector");
        (0, utils_1.reactFactory)(react_1.default.createElement(inspector_1.default, { store: store }), this.element, null, this.disposer);
    }
    destroy() {
        this.disposer.dispose();
        this.element.remove();
    }
}
exports.default = InspectorPane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3BhbmVzL2luc3BlY3Rvci50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwrQkFBMkM7QUFDM0Msa0RBQTBCO0FBQzFCLG9DQUF1RDtBQUV2RCx3RUFBZ0Q7QUFDaEQsTUFBcUIsYUFBYTtJQUloQyxZQUFZLEtBQVk7UUFIeEIsWUFBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsYUFBUSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQVlyQyxhQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUM7UUFDdEMsV0FBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLHFCQUFhLENBQUM7UUFDN0IsdUJBQWtCLEdBQUcsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDO1FBQ3BDLHdCQUFtQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQVp0RCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3BELElBQUEsb0JBQVksRUFDViw4QkFBQyxtQkFBUyxJQUFDLEtBQUssRUFBRSxLQUFLLEdBQUksRUFDM0IsSUFBSSxDQUFDLE9BQU8sRUFDWixJQUFJLEVBQ0osSUFBSSxDQUFDLFFBQVEsQ0FDZCxDQUFDO0lBQ0osQ0FBQztJQU9ELE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBdkJELGdDQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgcmVhY3RGYWN0b3J5LCBJTlNQRUNUT1JfVVJJIH0gZnJvbSBcIi4uL3V0aWxzXCI7XG50eXBlIHN0b3JlID0gdHlwZW9mIGltcG9ydChcIi4uL3N0b3JlXCIpLmRlZmF1bHQ7XG5pbXBvcnQgSW5zcGVjdG9yIGZyb20gXCIuLi9jb21wb25lbnRzL2luc3BlY3RvclwiO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5zcGVjdG9yUGFuZSB7XG4gIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkaXNwb3NlciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmU6IHN0b3JlKSB7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoeWRyb2dlblwiLCBcImluc3BlY3RvclwiKTtcbiAgICByZWFjdEZhY3RvcnkoXG4gICAgICA8SW5zcGVjdG9yIHN0b3JlPXtzdG9yZX0gLz4sXG4gICAgICB0aGlzLmVsZW1lbnQsXG4gICAgICBudWxsLFxuICAgICAgdGhpcy5kaXNwb3NlclxuICAgICk7XG4gIH1cblxuICBnZXRUaXRsZSA9ICgpID0+IFwiSHlkcm9nZW4gSW5zcGVjdG9yXCI7XG4gIGdldFVSSSA9ICgpID0+IElOU1BFQ1RPUl9VUkk7XG4gIGdldERlZmF1bHRMb2NhdGlvbiA9ICgpID0+IFwiYm90dG9tXCI7XG4gIGdldEFsbG93ZWRMb2NhdGlvbnMgPSAoKSA9PiBbXCJib3R0b21cIiwgXCJsZWZ0XCIsIFwicmlnaHRcIl07XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlKCk7XG4gIH1cbn1cbiJdfQ==