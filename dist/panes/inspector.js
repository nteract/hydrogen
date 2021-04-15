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
        utils_1.reactFactory(react_1.default.createElement(inspector_1.default, { store: store }), this.element, null, this.disposer);
    }
    destroy() {
        this.disposer.dispose();
        this.element.remove();
    }
}
exports.default = InspectorPane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3BhbmVzL2luc3BlY3Rvci50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwrQkFBMkM7QUFDM0Msa0RBQTBCO0FBQzFCLG9DQUF1RDtBQUV2RCx3RUFBZ0Q7QUFDaEQsTUFBcUIsYUFBYTtJQUloQyxZQUFZLEtBQVk7UUFIeEIsWUFBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsYUFBUSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQVlyQyxhQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUM7UUFDdEMsV0FBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLHFCQUFhLENBQUM7UUFDN0IsdUJBQWtCLEdBQUcsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDO1FBQ3BDLHdCQUFtQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQVp0RCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3BELG9CQUFZLENBQ1YsOEJBQUMsbUJBQVMsSUFBQyxLQUFLLEVBQUUsS0FBSyxHQUFJLEVBQzNCLElBQUksQ0FBQyxPQUFPLEVBQ1osSUFBSSxFQUNKLElBQUksQ0FBQyxRQUFRLENBQ2QsQ0FBQztJQUNKLENBQUM7SUFPRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3hCLENBQUM7Q0FDRjtBQXZCRCxnQ0F1QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHJlYWN0RmFjdG9yeSwgSU5TUEVDVE9SX1VSSSB9IGZyb20gXCIuLi91dGlsc1wiO1xudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi9zdG9yZVwiKS5kZWZhdWx0O1xuaW1wb3J0IEluc3BlY3RvciBmcm9tIFwiLi4vY29tcG9uZW50cy9pbnNwZWN0b3JcIjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluc3BlY3RvclBhbmUge1xuICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGlzcG9zZXIgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JlOiBzdG9yZSkge1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaHlkcm9nZW5cIiwgXCJpbnNwZWN0b3JcIik7XG4gICAgcmVhY3RGYWN0b3J5KFxuICAgICAgPEluc3BlY3RvciBzdG9yZT17c3RvcmV9IC8+LFxuICAgICAgdGhpcy5lbGVtZW50LFxuICAgICAgbnVsbCxcbiAgICAgIHRoaXMuZGlzcG9zZXJcbiAgICApO1xuICB9XG5cbiAgZ2V0VGl0bGUgPSAoKSA9PiBcIkh5ZHJvZ2VuIEluc3BlY3RvclwiO1xuICBnZXRVUkkgPSAoKSA9PiBJTlNQRUNUT1JfVVJJO1xuICBnZXREZWZhdWx0TG9jYXRpb24gPSAoKSA9PiBcImJvdHRvbVwiO1xuICBnZXRBbGxvd2VkTG9jYXRpb25zID0gKCkgPT4gW1wiYm90dG9tXCIsIFwibGVmdFwiLCBcInJpZ2h0XCJdO1xuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZSgpO1xuICB9XG59XG4iXX0=