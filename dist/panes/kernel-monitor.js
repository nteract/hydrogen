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
        (0, utils_1.reactFactory)(react_1.default.createElement(kernel_monitor_1.default, { store: store }), this.element, null, this.disposer);
    }
    destroy() {
        this.disposer.dispose();
        this.element.remove();
    }
}
exports.default = KernelMonitorPane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1vbml0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcGFuZXMva2VybmVsLW1vbml0b3IudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsK0JBQTJDO0FBQzNDLGtEQUEwQjtBQUMxQixvQ0FBNEQ7QUFFNUQsa0ZBQXlEO0FBQ3pELE1BQXFCLGlCQUFpQjtJQUlwQyxZQUFZLEtBQVk7UUFIeEIsWUFBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsYUFBUSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQVlyQyxhQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMseUJBQXlCLENBQUM7UUFDM0MsV0FBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLDBCQUFrQixDQUFDO1FBQ2xDLHVCQUFrQixHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQztRQUNwQyx3QkFBbUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFadEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLElBQUEsb0JBQVksRUFDViw4QkFBQyx3QkFBYSxJQUFDLEtBQUssRUFBRSxLQUFLLEdBQUksRUFDL0IsSUFBSSxDQUFDLE9BQU8sRUFDWixJQUFJLEVBQ0osSUFBSSxDQUFDLFFBQVEsQ0FDZCxDQUFDO0lBQ0osQ0FBQztJQU9ELE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBdkJELG9DQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgcmVhY3RGYWN0b3J5LCBLRVJORUxfTU9OSVRPUl9VUkkgfSBmcm9tIFwiLi4vdXRpbHNcIjtcbnR5cGUgc3RvcmUgPSB0eXBlb2YgaW1wb3J0KFwiLi4vc3RvcmVcIikuZGVmYXVsdDtcbmltcG9ydCBLZXJuZWxNb25pdG9yIGZyb20gXCIuLi9jb21wb25lbnRzL2tlcm5lbC1tb25pdG9yXCI7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBLZXJuZWxNb25pdG9yUGFuZSB7XG4gIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkaXNwb3NlciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmU6IHN0b3JlKSB7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoeWRyb2dlblwiKTtcbiAgICByZWFjdEZhY3RvcnkoXG4gICAgICA8S2VybmVsTW9uaXRvciBzdG9yZT17c3RvcmV9IC8+LFxuICAgICAgdGhpcy5lbGVtZW50LFxuICAgICAgbnVsbCxcbiAgICAgIHRoaXMuZGlzcG9zZXJcbiAgICApO1xuICB9XG5cbiAgZ2V0VGl0bGUgPSAoKSA9PiBcIkh5ZHJvZ2VuIEtlcm5lbCBNb25pdG9yXCI7XG4gIGdldFVSSSA9ICgpID0+IEtFUk5FTF9NT05JVE9SX1VSSTtcbiAgZ2V0RGVmYXVsdExvY2F0aW9uID0gKCkgPT4gXCJib3R0b21cIjtcbiAgZ2V0QWxsb3dlZExvY2F0aW9ucyA9ICgpID0+IFtcImJvdHRvbVwiLCBcImxlZnRcIiwgXCJyaWdodFwiXTtcblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuZGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmUoKTtcbiAgfVxufVxuIl19