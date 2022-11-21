"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const utils_1 = require("../../../utils");
let StatusBar = class StatusBar extends react_1.default.Component {
    render() {
        const { kernel, markers, configMapping } = this.props.store;
        if (!kernel || configMapping.get("Hydrogen.statusBarDisable")) {
            return null;
        }
        const view = configMapping.get("Hydrogen.statusBarKernelInfo") ? (kernel.executionCount === 0 ||
            kernel.lastExecutionTime === utils_1.NO_EXECTIME_STRING ? (react_1.default.createElement("a", { onClick: () => this.props.onClick({
                kernel,
                markers,
            }) },
            kernel.displayName,
            " | ",
            kernel.executionState,
            " |",
            " ",
            kernel.executionCount)) : (react_1.default.createElement("a", { onClick: () => this.props.onClick({
                kernel,
                markers,
            }) },
            kernel.displayName,
            " | ",
            kernel.executionState,
            " |",
            " ",
            kernel.executionCount,
            " | ",
            kernel.lastExecutionTime))) : (react_1.default.createElement("a", { onClick: () => this.props.onClick({
                kernel,
                markers,
            }) },
            kernel.displayName,
            " | ",
            kernel.executionState));
        return view;
    }
};
StatusBar = __decorate([
    mobx_react_1.observer
], StatusBar);
exports.default = StatusBar;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLWJhci1jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9saWIvc2VydmljZXMvY29uc3VtZWQvc3RhdHVzLWJhci9zdGF0dXMtYmFyLWNvbXBvbmVudC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQXNDO0FBRXRDLDBDQUFvRDtBQU9wRCxJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVUsU0FBUSxlQUFLLENBQUMsU0FBZ0I7SUFDNUMsTUFBTTtRQUNKLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQzVELElBQUksQ0FBQyxNQUFNLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxFQUFFO1lBQzdELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQy9ELE1BQU0sQ0FBQyxjQUFjLEtBQUssQ0FBQztZQUMzQixNQUFNLENBQUMsaUJBQWlCLEtBQUssMEJBQWtCLENBQUMsQ0FBQyxDQUFDLENBQ2hELHFDQUNFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FDWixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDakIsTUFBTTtnQkFDTixPQUFPO2FBQ1IsQ0FBQztZQUdILE1BQU0sQ0FBQyxXQUFXOztZQUFLLE1BQU0sQ0FBQyxjQUFjOztZQUFJLEdBQUc7WUFDbkQsTUFBTSxDQUFDLGNBQWMsQ0FDcEIsQ0FDTCxDQUFDLENBQUMsQ0FBQyxDQUNGLHFDQUNFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FDWixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDakIsTUFBTTtnQkFDTixPQUFPO2FBQ1IsQ0FBQztZQUdILE1BQU0sQ0FBQyxXQUFXOztZQUFLLE1BQU0sQ0FBQyxjQUFjOztZQUFJLEdBQUc7WUFDbkQsTUFBTSxDQUFDLGNBQWM7O1lBQUssTUFBTSxDQUFDLGlCQUFpQixDQUNqRCxDQUNMLENBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FDRixxQ0FDRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQ1osSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7Z0JBQ2pCLE1BQU07Z0JBQ04sT0FBTzthQUNSLENBQUM7WUFHSCxNQUFNLENBQUMsV0FBVzs7WUFBSyxNQUFNLENBQUMsY0FBYyxDQUMzQyxDQUNMLENBQUM7UUFDRixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRixDQUFBO0FBL0NLLFNBQVM7SUFEZCxxQkFBUTtHQUNILFNBQVMsQ0ErQ2Q7QUFDRCxrQkFBZSxTQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSBcIi4uLy4uLy4uL3N0b3JlXCI7XG5pbXBvcnQgeyBOT19FWEVDVElNRV9TVFJJTkcgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHNcIjtcbnR5cGUgUHJvcHMgPSB7XG4gIHN0b3JlOiBTdG9yZTtcbiAgb25DbGljazogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueTtcbn07XG5cbkBvYnNlcnZlclxuY2xhc3MgU3RhdHVzQmFyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzPiB7XG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IGtlcm5lbCwgbWFya2VycywgY29uZmlnTWFwcGluZyB9ID0gdGhpcy5wcm9wcy5zdG9yZTtcbiAgICBpZiAoIWtlcm5lbCB8fCBjb25maWdNYXBwaW5nLmdldChcIkh5ZHJvZ2VuLnN0YXR1c0JhckRpc2FibGVcIikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCB2aWV3ID0gY29uZmlnTWFwcGluZy5nZXQoXCJIeWRyb2dlbi5zdGF0dXNCYXJLZXJuZWxJbmZvXCIpID8gKCAvLyBicmFuY2ggb24gaWYgZXhlYyB0aW1lIGlzIG5vdCBhdmFpbGFibGUgb3Igbm8gZXhlY3V0aW9uIGhhcyBoYXBwZW5lZFxuICAgICAga2VybmVsLmV4ZWN1dGlvbkNvdW50ID09PSAwIHx8XG4gICAgICBrZXJuZWwubGFzdEV4ZWN1dGlvblRpbWUgPT09IE5PX0VYRUNUSU1FX1NUUklORyA/IChcbiAgICAgICAgPGFcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKHtcbiAgICAgICAgICAgICAga2VybmVsLFxuICAgICAgICAgICAgICBtYXJrZXJzLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgID5cbiAgICAgICAgICB7a2VybmVsLmRpc3BsYXlOYW1lfSB8IHtrZXJuZWwuZXhlY3V0aW9uU3RhdGV9IHx7XCIgXCJ9XG4gICAgICAgICAge2tlcm5lbC5leGVjdXRpb25Db3VudH1cbiAgICAgICAgPC9hPlxuICAgICAgKSA6IChcbiAgICAgICAgPGFcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKHtcbiAgICAgICAgICAgICAga2VybmVsLFxuICAgICAgICAgICAgICBtYXJrZXJzLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgID5cbiAgICAgICAgICB7a2VybmVsLmRpc3BsYXlOYW1lfSB8IHtrZXJuZWwuZXhlY3V0aW9uU3RhdGV9IHx7XCIgXCJ9XG4gICAgICAgICAge2tlcm5lbC5leGVjdXRpb25Db3VudH0gfCB7a2VybmVsLmxhc3RFeGVjdXRpb25UaW1lfVxuICAgICAgICA8L2E+XG4gICAgICApXG4gICAgKSA6IChcbiAgICAgIDxhXG4gICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKHtcbiAgICAgICAgICAgIGtlcm5lbCxcbiAgICAgICAgICAgIG1hcmtlcnMsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgPlxuICAgICAgICB7a2VybmVsLmRpc3BsYXlOYW1lfSB8IHtrZXJuZWwuZXhlY3V0aW9uU3RhdGV9XG4gICAgICA8L2E+XG4gICAgKTtcbiAgICByZXR1cm4gdmlldztcbiAgfVxufVxuZXhwb3J0IGRlZmF1bHQgU3RhdHVzQmFyO1xuIl19