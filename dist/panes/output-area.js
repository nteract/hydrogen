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
        (0, utils_1.reactFactory)(react_1.default.createElement(output_area_1.default, { store: store }), this.element, null, this.disposer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LWFyZWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcGFuZXMvb3V0cHV0LWFyZWEudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsK0JBQXVEO0FBQ3ZELGtEQUEwQjtBQUMxQixvQ0FBeUQ7QUFFekQsNEVBQW1EO0FBQ25ELE1BQXFCLFVBQVU7SUFJN0IsWUFBWSxLQUFZO1FBSHhCLFlBQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLGFBQVEsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUM7UUFtQnJDLGFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztRQUN4QyxXQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsdUJBQWUsQ0FBQztRQUMvQix1QkFBa0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDbkMsd0JBQW1CLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBbkJ0RCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ2YsSUFBSSxpQkFBVSxDQUFDLEdBQUcsRUFBRTtZQUNsQixJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2xDO1FBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNGLElBQUEsb0JBQVksRUFDViw4QkFBQyxxQkFBVSxJQUFDLEtBQUssRUFBRSxLQUFLLEdBQUksRUFDNUIsSUFBSSxDQUFDLE9BQU8sRUFDWixJQUFJLEVBQ0osSUFBSSxDQUFDLFFBQVEsQ0FDZCxDQUFDO0lBQ0osQ0FBQztJQU9ELE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBSXhCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLHVCQUFlLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsT0FBTztTQUNSO1FBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUFyQ0QsNkJBcUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyByZWFjdEZhY3RvcnksIE9VVFBVVF9BUkVBX1VSSSB9IGZyb20gXCIuLi91dGlsc1wiO1xudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi9zdG9yZVwiKS5kZWZhdWx0O1xuaW1wb3J0IE91dHB1dEFyZWEgZnJvbSBcIi4uL2NvbXBvbmVudHMvb3V0cHV0LWFyZWFcIjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dHB1dFBhbmUge1xuICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGlzcG9zZXIgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JlOiBzdG9yZSkge1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaHlkcm9nZW5cIik7XG4gICAgdGhpcy5kaXNwb3Nlci5hZGQoXG4gICAgICBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICAgIGlmIChzdG9yZS5rZXJuZWwpIHtcbiAgICAgICAgICBzdG9yZS5rZXJuZWwub3V0cHV0U3RvcmUuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICAgIHJlYWN0RmFjdG9yeShcbiAgICAgIDxPdXRwdXRBcmVhIHN0b3JlPXtzdG9yZX0gLz4sXG4gICAgICB0aGlzLmVsZW1lbnQsXG4gICAgICBudWxsLFxuICAgICAgdGhpcy5kaXNwb3NlclxuICAgICk7XG4gIH1cblxuICBnZXRUaXRsZSA9ICgpID0+IFwiSHlkcm9nZW4gT3V0cHV0IEFyZWFcIjtcbiAgZ2V0VVJJID0gKCkgPT4gT1VUUFVUX0FSRUFfVVJJO1xuICBnZXREZWZhdWx0TG9jYXRpb24gPSAoKSA9PiBcInJpZ2h0XCI7XG4gIGdldEFsbG93ZWRMb2NhdGlvbnMgPSAoKSA9PiBbXCJsZWZ0XCIsIFwicmlnaHRcIiwgXCJib3R0b21cIl07XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICAvLyBXaGVuIGEgdXNlciBtYW51YWxseSBjbGlja3MgdGhlIGNsb3NlIGljb24sIHRoZSBwYW5lIGhvbGRpbmcgdGhlIE91dHB1dEFyZWFcbiAgICAvLyBpcyBkZXN0cm95ZWQgYWxvbmcgd2l0aCB0aGUgT3V0cHV0QXJlYSBpdGVtLiBXZSBtaW1pYyB0aGlzIGhlcmUgc28gdGhhdCB3ZSBjYW4gY2FsbFxuICAgIC8vICBvdXRwdXRBcmVhLmRlc3Ryb3koKSBhbmQgZnVsbHkgY2xlYW4gdXAgdGhlIE91dHB1dEFyZWEgd2l0aG91dCB1c2VyIGNsaWNraW5nXG4gICAgY29uc3QgcGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JVUkkoT1VUUFVUX0FSRUFfVVJJKTtcbiAgICBpZiAoIXBhbmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcGFuZS5kZXN0cm95SXRlbSh0aGlzKTtcbiAgfVxufVxuIl19