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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLWJhci1jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9saWIvc2VydmljZXMvY29uc3VtZWQvc3RhdHVzLWJhci9zdGF0dXMtYmFyLWNvbXBvbmVudC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQXNDO0FBR3RDLDBDQUFvRDtBQU9wRCxJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVUsU0FBUSxlQUFLLENBQUMsU0FBZ0I7SUFDNUMsTUFBTTtRQUNKLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQzVELElBQUksQ0FBQyxNQUFNLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxFQUFFO1lBQzdELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQy9ELE1BQU0sQ0FBQyxjQUFjLEtBQUssQ0FBQztZQUMzQixNQUFNLENBQUMsaUJBQWlCLEtBQUssMEJBQWtCLENBQUMsQ0FBQyxDQUFDLENBQ2hELHFDQUNFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FDWixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDakIsTUFBTTtnQkFDTixPQUFPO2FBQ1IsQ0FBQztZQUdILE1BQU0sQ0FBQyxXQUFXOztZQUFLLE1BQU0sQ0FBQyxjQUFjOztZQUFJLEdBQUc7WUFDbkQsTUFBTSxDQUFDLGNBQWMsQ0FDcEIsQ0FDTCxDQUFDLENBQUMsQ0FBQyxDQUNGLHFDQUNFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FDWixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDakIsTUFBTTtnQkFDTixPQUFPO2FBQ1IsQ0FBQztZQUdILE1BQU0sQ0FBQyxXQUFXOztZQUFLLE1BQU0sQ0FBQyxjQUFjOztZQUFJLEdBQUc7WUFDbkQsTUFBTSxDQUFDLGNBQWM7O1lBQUssTUFBTSxDQUFDLGlCQUFpQixDQUNqRCxDQUNMLENBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FDRixxQ0FDRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQ1osSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7Z0JBQ2pCLE1BQU07Z0JBQ04sT0FBTzthQUNSLENBQUM7WUFHSCxNQUFNLENBQUMsV0FBVzs7WUFBSyxNQUFNLENBQUMsY0FBYyxDQUMzQyxDQUNMLENBQUM7UUFDRixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRixDQUFBO0FBL0NLLFNBQVM7SUFEZCxxQkFBUTtHQUNILFNBQVMsQ0ErQ2Q7QUFDRCxrQkFBZSxTQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4uLy4uLy4uL2tlcm5lbFwiO1xuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gXCIuLi8uLi8uLi9zdG9yZVwiO1xuaW1wb3J0IHsgTk9fRVhFQ1RJTUVfU1RSSU5HIH0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzXCI7XG50eXBlIFByb3BzID0ge1xuICBzdG9yZTogU3RvcmU7XG4gIG9uQ2xpY2s6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnk7XG59O1xuXG5Ab2JzZXJ2ZXJcbmNsYXNzIFN0YXR1c0JhciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBrZXJuZWwsIG1hcmtlcnMsIGNvbmZpZ01hcHBpbmcgfSA9IHRoaXMucHJvcHMuc3RvcmU7XG4gICAgaWYgKCFrZXJuZWwgfHwgY29uZmlnTWFwcGluZy5nZXQoXCJIeWRyb2dlbi5zdGF0dXNCYXJEaXNhYmxlXCIpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgdmlldyA9IGNvbmZpZ01hcHBpbmcuZ2V0KFwiSHlkcm9nZW4uc3RhdHVzQmFyS2VybmVsSW5mb1wiKSA/ICggLy8gYnJhbmNoIG9uIGlmIGV4ZWMgdGltZSBpcyBub3QgYXZhaWxhYmxlIG9yIG5vIGV4ZWN1dGlvbiBoYXMgaGFwcGVuZWRcbiAgICAgIGtlcm5lbC5leGVjdXRpb25Db3VudCA9PT0gMCB8fFxuICAgICAga2VybmVsLmxhc3RFeGVjdXRpb25UaW1lID09PSBOT19FWEVDVElNRV9TVFJJTkcgPyAoXG4gICAgICAgIDxhXG4gICAgICAgICAgb25DbGljaz17KCkgPT5cbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DbGljayh7XG4gICAgICAgICAgICAgIGtlcm5lbCxcbiAgICAgICAgICAgICAgbWFya2VycyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA+XG4gICAgICAgICAge2tlcm5lbC5kaXNwbGF5TmFtZX0gfCB7a2VybmVsLmV4ZWN1dGlvblN0YXRlfSB8e1wiIFwifVxuICAgICAgICAgIHtrZXJuZWwuZXhlY3V0aW9uQ291bnR9XG4gICAgICAgIDwvYT5cbiAgICAgICkgOiAoXG4gICAgICAgIDxhXG4gICAgICAgICAgb25DbGljaz17KCkgPT5cbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DbGljayh7XG4gICAgICAgICAgICAgIGtlcm5lbCxcbiAgICAgICAgICAgICAgbWFya2VycyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA+XG4gICAgICAgICAge2tlcm5lbC5kaXNwbGF5TmFtZX0gfCB7a2VybmVsLmV4ZWN1dGlvblN0YXRlfSB8e1wiIFwifVxuICAgICAgICAgIHtrZXJuZWwuZXhlY3V0aW9uQ291bnR9IHwge2tlcm5lbC5sYXN0RXhlY3V0aW9uVGltZX1cbiAgICAgICAgPC9hPlxuICAgICAgKVxuICAgICkgOiAoXG4gICAgICA8YVxuICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgIHRoaXMucHJvcHMub25DbGljayh7XG4gICAgICAgICAgICBrZXJuZWwsXG4gICAgICAgICAgICBtYXJrZXJzLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgID5cbiAgICAgICAge2tlcm5lbC5kaXNwbGF5TmFtZX0gfCB7a2VybmVsLmV4ZWN1dGlvblN0YXRlfVxuICAgICAgPC9hPlxuICAgICk7XG4gICAgcmV0dXJuIHZpZXc7XG4gIH1cbn1cbmV4cG9ydCBkZWZhdWx0IFN0YXR1c0JhcjtcbiJdfQ==