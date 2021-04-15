"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const Status = mobx_react_1.observer(({ status, style }) => {
    switch (status) {
        case "running":
            return (react_1.default.createElement("div", { className: "inline-container spinner", style: style },
                react_1.default.createElement("div", { className: "rect1" }),
                react_1.default.createElement("div", { className: "rect2" }),
                react_1.default.createElement("div", { className: "rect3" }),
                react_1.default.createElement("div", { className: "rect4" }),
                react_1.default.createElement("div", { className: "rect5" })));
        case "ok":
            return react_1.default.createElement("div", { className: "inline-container icon icon-check", style: style });
        case "empty":
            return react_1.default.createElement("div", { className: "inline-container icon icon-zap", style: style });
        default:
            return react_1.default.createElement("div", { className: "inline-container icon icon-x", style: style });
    }
});
exports.default = Status;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2NvbXBvbmVudHMvcmVzdWx0LXZpZXcvc3RhdHVzLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQ0FBc0M7QUFLdEMsTUFBTSxNQUFNLEdBQUcscUJBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBUyxFQUFFLEVBQUU7SUFDbkQsUUFBUSxNQUFNLEVBQUU7UUFDZCxLQUFLLFNBQVM7WUFDWixPQUFPLENBQ0wsdUNBQUssU0FBUyxFQUFDLDBCQUEwQixFQUFDLEtBQUssRUFBRSxLQUFLO2dCQUNwRCx1Q0FBSyxTQUFTLEVBQUMsT0FBTyxHQUFHO2dCQUN6Qix1Q0FBSyxTQUFTLEVBQUMsT0FBTyxHQUFHO2dCQUN6Qix1Q0FBSyxTQUFTLEVBQUMsT0FBTyxHQUFHO2dCQUN6Qix1Q0FBSyxTQUFTLEVBQUMsT0FBTyxHQUFHO2dCQUN6Qix1Q0FBSyxTQUFTLEVBQUMsT0FBTyxHQUFHLENBQ3JCLENBQ1AsQ0FBQztRQUVKLEtBQUssSUFBSTtZQUNQLE9BQU8sdUNBQUssU0FBUyxFQUFDLGtDQUFrQyxFQUFDLEtBQUssRUFBRSxLQUFLLEdBQUksQ0FBQztRQUU1RSxLQUFLLE9BQU87WUFDVixPQUFPLHVDQUFLLFNBQVMsRUFBQyxnQ0FBZ0MsRUFBQyxLQUFLLEVBQUUsS0FBSyxHQUFJLENBQUM7UUFFMUU7WUFDRSxPQUFPLHVDQUFLLFNBQVMsRUFBQyw4QkFBOEIsRUFBQyxLQUFLLEVBQUUsS0FBSyxHQUFJLENBQUM7S0FDekU7QUFDSCxDQUFDLENBQUMsQ0FBQztBQUNILGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcbnR5cGUgUHJvcHMgPSB7XG4gIHN0YXR1czogc3RyaW5nO1xuICBzdHlsZTogUmVjb3JkPHN0cmluZywgYW55Pjtcbn07XG5jb25zdCBTdGF0dXMgPSBvYnNlcnZlcigoeyBzdGF0dXMsIHN0eWxlIH06IFByb3BzKSA9PiB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSBcInJ1bm5pbmdcIjpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW5saW5lLWNvbnRhaW5lciBzcGlubmVyXCIgc3R5bGU9e3N0eWxlfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCIgLz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCIgLz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCIgLz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCIgLz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCIgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuXG4gICAgY2FzZSBcIm9rXCI6XG4gICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJpbmxpbmUtY29udGFpbmVyIGljb24gaWNvbi1jaGVja1wiIHN0eWxlPXtzdHlsZX0gLz47XG5cbiAgICBjYXNlIFwiZW1wdHlcIjpcbiAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cImlubGluZS1jb250YWluZXIgaWNvbiBpY29uLXphcFwiIHN0eWxlPXtzdHlsZX0gLz47XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwiaW5saW5lLWNvbnRhaW5lciBpY29uIGljb24teFwiIHN0eWxlPXtzdHlsZX0gLz47XG4gIH1cbn0pO1xuZXhwb3J0IGRlZmF1bHQgU3RhdHVzO1xuIl19