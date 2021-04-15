"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const react_1 = __importDefault(require("react"));
const utils_1 = require("../utils");
const kernel_monitor_1 = __importDefault(require("../components/kernel-monitor"));
class KernelMonitorPane {
    constructor(store) {
        this.element = document.createElement("div");
        this.disposer = new atom_1.CompositeDisposable();
        this.getTitle = () => "Hydrogen Kernel Monitor";
        this.getURI = () => utils_1.KERNEL_MONITOR_URI;
        this.getDefaultLocation = () => "bottom";
        this.getAllowedLocations = () => ["bottom", "left", "right"];
        this.element.classList.add("hydrogen");
        utils_1.reactFactory(react_1.default.createElement(kernel_monitor_1.default, { store: store }), this.element, null, this.disposer);
    }
    destroy() {
        this.disposer.dispose();
        this.element.remove();
    }
}
exports.default = KernelMonitorPane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1vbml0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcGFuZXMva2VybmVsLW1vbml0b3IudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsK0JBQTJDO0FBQzNDLGtEQUEwQjtBQUMxQixvQ0FBNEQ7QUFFNUQsa0ZBQXlEO0FBQ3pELE1BQXFCLGlCQUFpQjtJQUlwQyxZQUFZLEtBQVk7UUFIeEIsWUFBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsYUFBUSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQVlyQyxhQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMseUJBQXlCLENBQUM7UUFDM0MsV0FBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLDBCQUFrQixDQUFDO1FBQ2xDLHVCQUFrQixHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQztRQUNwQyx3QkFBbUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFadEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLG9CQUFZLENBQ1YsOEJBQUMsd0JBQWEsSUFBQyxLQUFLLEVBQUUsS0FBSyxHQUFJLEVBQy9CLElBQUksQ0FBQyxPQUFPLEVBQ1osSUFBSSxFQUNKLElBQUksQ0FBQyxRQUFRLENBQ2QsQ0FBQztJQUNKLENBQUM7SUFPRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3hCLENBQUM7Q0FDRjtBQXZCRCxvQ0F1QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHJlYWN0RmFjdG9yeSwgS0VSTkVMX01PTklUT1JfVVJJIH0gZnJvbSBcIi4uL3V0aWxzXCI7XG50eXBlIHN0b3JlID0gdHlwZW9mIGltcG9ydChcIi4uL3N0b3JlXCIpLmRlZmF1bHQ7XG5pbXBvcnQgS2VybmVsTW9uaXRvciBmcm9tIFwiLi4vY29tcG9uZW50cy9rZXJuZWwtbW9uaXRvclwiO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgS2VybmVsTW9uaXRvclBhbmUge1xuICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGlzcG9zZXIgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JlOiBzdG9yZSkge1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaHlkcm9nZW5cIik7XG4gICAgcmVhY3RGYWN0b3J5KFxuICAgICAgPEtlcm5lbE1vbml0b3Igc3RvcmU9e3N0b3JlfSAvPixcbiAgICAgIHRoaXMuZWxlbWVudCxcbiAgICAgIG51bGwsXG4gICAgICB0aGlzLmRpc3Bvc2VyXG4gICAgKTtcbiAgfVxuXG4gIGdldFRpdGxlID0gKCkgPT4gXCJIeWRyb2dlbiBLZXJuZWwgTW9uaXRvclwiO1xuICBnZXRVUkkgPSAoKSA9PiBLRVJORUxfTU9OSVRPUl9VUkk7XG4gIGdldERlZmF1bHRMb2NhdGlvbiA9ICgpID0+IFwiYm90dG9tXCI7XG4gIGdldEFsbG93ZWRMb2NhdGlvbnMgPSAoKSA9PiBbXCJib3R0b21cIiwgXCJsZWZ0XCIsIFwicmlnaHRcIl07XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlKCk7XG4gIH1cbn1cbiJdfQ==