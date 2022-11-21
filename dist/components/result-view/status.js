"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const Status = (0, mobx_react_1.observer)(({ status, style }) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2NvbXBvbmVudHMvcmVzdWx0LXZpZXcvc3RhdHVzLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQ0FBc0M7QUFLdEMsTUFBTSxNQUFNLEdBQUcsSUFBQSxxQkFBUSxFQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFTLEVBQUUsRUFBRTtJQUNuRCxRQUFRLE1BQU0sRUFBRTtRQUNkLEtBQUssU0FBUztZQUNaLE9BQU8sQ0FDTCx1Q0FBSyxTQUFTLEVBQUMsMEJBQTBCLEVBQUMsS0FBSyxFQUFFLEtBQUs7Z0JBQ3BELHVDQUFLLFNBQVMsRUFBQyxPQUFPLEdBQUc7Z0JBQ3pCLHVDQUFLLFNBQVMsRUFBQyxPQUFPLEdBQUc7Z0JBQ3pCLHVDQUFLLFNBQVMsRUFBQyxPQUFPLEdBQUc7Z0JBQ3pCLHVDQUFLLFNBQVMsRUFBQyxPQUFPLEdBQUc7Z0JBQ3pCLHVDQUFLLFNBQVMsRUFBQyxPQUFPLEdBQUcsQ0FDckIsQ0FDUCxDQUFDO1FBRUosS0FBSyxJQUFJO1lBQ1AsT0FBTyx1Q0FBSyxTQUFTLEVBQUMsa0NBQWtDLEVBQUMsS0FBSyxFQUFFLEtBQUssR0FBSSxDQUFDO1FBRTVFLEtBQUssT0FBTztZQUNWLE9BQU8sdUNBQUssU0FBUyxFQUFDLGdDQUFnQyxFQUFDLEtBQUssRUFBRSxLQUFLLEdBQUksQ0FBQztRQUUxRTtZQUNFLE9BQU8sdUNBQUssU0FBUyxFQUFDLDhCQUE4QixFQUFDLEtBQUssRUFBRSxLQUFLLEdBQUksQ0FBQztLQUN6RTtBQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0gsa0JBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgb2JzZXJ2ZXIgfSBmcm9tIFwibW9ieC1yZWFjdFwiO1xudHlwZSBQcm9wcyA9IHtcbiAgc3RhdHVzOiBzdHJpbmc7XG4gIHN0eWxlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufTtcbmNvbnN0IFN0YXR1cyA9IG9ic2VydmVyKCh7IHN0YXR1cywgc3R5bGUgfTogUHJvcHMpID0+IHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlIFwicnVubmluZ1wiOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbmxpbmUtY29udGFpbmVyIHNwaW5uZXJcIiBzdHlsZT17c3R5bGV9PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDFcIiAvPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDJcIiAvPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDNcIiAvPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDRcIiAvPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDVcIiAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG5cbiAgICBjYXNlIFwib2tcIjpcbiAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cImlubGluZS1jb250YWluZXIgaWNvbiBpY29uLWNoZWNrXCIgc3R5bGU9e3N0eWxlfSAvPjtcblxuICAgIGNhc2UgXCJlbXB0eVwiOlxuICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwiaW5saW5lLWNvbnRhaW5lciBpY29uIGljb24temFwXCIgc3R5bGU9e3N0eWxlfSAvPjtcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJpbmxpbmUtY29udGFpbmVyIGljb24gaWNvbi14XCIgc3R5bGU9e3N0eWxlfSAvPjtcbiAgfVxufSk7XG5leHBvcnQgZGVmYXVsdCBTdGF0dXM7XG4iXX0=