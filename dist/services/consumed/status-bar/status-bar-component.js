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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLWJhci1jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9saWIvc2VydmljZXMvY29uc3VtZWQvc3RhdHVzLWJhci9zdGF0dXMtYmFyLWNvbXBvbmVudC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQXNDO0FBRXRDLDBDQUFvRDtBQU9wRCxJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVUsU0FBUSxlQUFLLENBQUMsU0FBZ0I7SUFDNUMsTUFBTTtRQUNKLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQzVELElBQUksQ0FBQyxNQUFNLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxFQUFFO1lBQzdELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQy9ELE1BQU0sQ0FBQyxjQUFjLEtBQUssQ0FBQztZQUMzQixNQUFNLENBQUMsaUJBQWlCLEtBQUssMEJBQWtCLENBQUMsQ0FBQyxDQUFDLENBQ2hELHFDQUNFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FDWixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDakIsTUFBTTtnQkFDTixPQUFPO2FBQ1IsQ0FBQztZQUdILE1BQU0sQ0FBQyxXQUFXOztZQUFLLE1BQU0sQ0FBQyxjQUFjOztZQUFJLEdBQUc7WUFDbkQsTUFBTSxDQUFDLGNBQWMsQ0FDcEIsQ0FDTCxDQUFDLENBQUMsQ0FBQyxDQUNGLHFDQUNFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FDWixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDakIsTUFBTTtnQkFDTixPQUFPO2FBQ1IsQ0FBQztZQUdILE1BQU0sQ0FBQyxXQUFXOztZQUFLLE1BQU0sQ0FBQyxjQUFjOztZQUFJLEdBQUc7WUFDbkQsTUFBTSxDQUFDLGNBQWM7O1lBQUssTUFBTSxDQUFDLGlCQUFpQixDQUNqRCxDQUNMLENBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FDRixxQ0FDRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQ1osSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7Z0JBQ2pCLE1BQU07Z0JBQ04sT0FBTzthQUNSLENBQUM7WUFHSCxNQUFNLENBQUMsV0FBVzs7WUFBSyxNQUFNLENBQUMsY0FBYyxDQUMzQyxDQUNMLENBQUM7UUFDRixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRixDQUFBO0FBL0NLLFNBQVM7SUFEZCxxQkFBUTtHQUNILFNBQVMsQ0ErQ2Q7QUFDRCxrQkFBZSxTQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XHJcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcclxuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gXCIuLi8uLi8uLi9zdG9yZVwiO1xyXG5pbXBvcnQgeyBOT19FWEVDVElNRV9TVFJJTkcgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHNcIjtcclxudHlwZSBQcm9wcyA9IHtcclxuICBzdG9yZTogU3RvcmU7XHJcbiAgb25DbGljazogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueTtcclxufTtcclxuXHJcbkBvYnNlcnZlclxyXG5jbGFzcyBTdGF0dXNCYXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcclxuICByZW5kZXIoKSB7XHJcbiAgICBjb25zdCB7IGtlcm5lbCwgbWFya2VycywgY29uZmlnTWFwcGluZyB9ID0gdGhpcy5wcm9wcy5zdG9yZTtcclxuICAgIGlmICgha2VybmVsIHx8IGNvbmZpZ01hcHBpbmcuZ2V0KFwiSHlkcm9nZW4uc3RhdHVzQmFyRGlzYWJsZVwiKSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGNvbnN0IHZpZXcgPSBjb25maWdNYXBwaW5nLmdldChcIkh5ZHJvZ2VuLnN0YXR1c0Jhcktlcm5lbEluZm9cIikgPyAoIC8vIGJyYW5jaCBvbiBpZiBleGVjIHRpbWUgaXMgbm90IGF2YWlsYWJsZSBvciBubyBleGVjdXRpb24gaGFzIGhhcHBlbmVkXHJcbiAgICAgIGtlcm5lbC5leGVjdXRpb25Db3VudCA9PT0gMCB8fFxyXG4gICAgICBrZXJuZWwubGFzdEV4ZWN1dGlvblRpbWUgPT09IE5PX0VYRUNUSU1FX1NUUklORyA/IChcclxuICAgICAgICA8YVxyXG4gICAgICAgICAgb25DbGljaz17KCkgPT5cclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKHtcclxuICAgICAgICAgICAgICBrZXJuZWwsXHJcbiAgICAgICAgICAgICAgbWFya2VycyxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICA+XHJcbiAgICAgICAgICB7a2VybmVsLmRpc3BsYXlOYW1lfSB8IHtrZXJuZWwuZXhlY3V0aW9uU3RhdGV9IHx7XCIgXCJ9XHJcbiAgICAgICAgICB7a2VybmVsLmV4ZWN1dGlvbkNvdW50fVxyXG4gICAgICAgIDwvYT5cclxuICAgICAgKSA6IChcclxuICAgICAgICA8YVxyXG4gICAgICAgICAgb25DbGljaz17KCkgPT5cclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKHtcclxuICAgICAgICAgICAgICBrZXJuZWwsXHJcbiAgICAgICAgICAgICAgbWFya2VycyxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICA+XHJcbiAgICAgICAgICB7a2VybmVsLmRpc3BsYXlOYW1lfSB8IHtrZXJuZWwuZXhlY3V0aW9uU3RhdGV9IHx7XCIgXCJ9XHJcbiAgICAgICAgICB7a2VybmVsLmV4ZWN1dGlvbkNvdW50fSB8IHtrZXJuZWwubGFzdEV4ZWN1dGlvblRpbWV9XHJcbiAgICAgICAgPC9hPlxyXG4gICAgICApXHJcbiAgICApIDogKFxyXG4gICAgICA8YVxyXG4gICAgICAgIG9uQ2xpY2s9eygpID0+XHJcbiAgICAgICAgICB0aGlzLnByb3BzLm9uQ2xpY2soe1xyXG4gICAgICAgICAgICBrZXJuZWwsXHJcbiAgICAgICAgICAgIG1hcmtlcnMsXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgPlxyXG4gICAgICAgIHtrZXJuZWwuZGlzcGxheU5hbWV9IHwge2tlcm5lbC5leGVjdXRpb25TdGF0ZX1cclxuICAgICAgPC9hPlxyXG4gICAgKTtcclxuICAgIHJldHVybiB2aWV3O1xyXG4gIH1cclxufVxyXG5leHBvcnQgZGVmYXVsdCBTdGF0dXNCYXI7XHJcbiJdfQ==