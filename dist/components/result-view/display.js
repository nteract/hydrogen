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
exports.isTextOutputOnly = exports.supportedMediaTypes = void 0;
const react_1 = __importDefault(require("react"));
const mobx_1 = require("mobx");
const mobx_react_1 = require("mobx-react");
const outputs_1 = require("@nteract/outputs");
const plotly_1 = __importDefault(require("./plotly"));
const transform_vega_1 = require("@nteract/transform-vega");
const markdown_1 = __importDefault(require("./markdown"));
exports.supportedMediaTypes = (react_1.default.createElement(outputs_1.RichMedia, null,
    react_1.default.createElement(transform_vega_1.Vega5, null),
    react_1.default.createElement(transform_vega_1.Vega4, null),
    react_1.default.createElement(transform_vega_1.Vega3, null),
    react_1.default.createElement(transform_vega_1.Vega2, null),
    react_1.default.createElement(plotly_1.default, null),
    react_1.default.createElement(transform_vega_1.VegaLite4, null),
    react_1.default.createElement(transform_vega_1.VegaLite3, null),
    react_1.default.createElement(transform_vega_1.VegaLite2, null),
    react_1.default.createElement(transform_vega_1.VegaLite1, null),
    react_1.default.createElement(outputs_1.Media.Json, null),
    react_1.default.createElement(outputs_1.Media.JavaScript, null),
    react_1.default.createElement(outputs_1.Media.HTML, null),
    react_1.default.createElement(markdown_1.default, null),
    react_1.default.createElement(outputs_1.Media.LaTeX, null),
    react_1.default.createElement(outputs_1.Media.SVG, null),
    react_1.default.createElement(outputs_1.Media.Image, { mediaType: "image/gif" }),
    react_1.default.createElement(outputs_1.Media.Image, { mediaType: "image/jpeg" }),
    react_1.default.createElement(outputs_1.Media.Image, { mediaType: "image/png" }),
    react_1.default.createElement(outputs_1.Media.Plain, null)));
function isTextOutputOnly(data) {
    const supported = react_1.default.Children.map(exports.supportedMediaTypes.props.children, (mediaComponent) => mediaComponent.props.mediaType);
    const bundleMediaTypes = [...Object.keys(data)].filter((mediaType) => supported.includes(mediaType));
    return bundleMediaTypes.length === 1 && bundleMediaTypes[0] === "text/plain"
        ? true
        : false;
}
exports.isTextOutputOnly = isTextOutputOnly;
let Display = class Display extends react_1.default.Component {
    render() {
        return (react_1.default.createElement(outputs_1.Output, { output: (0, mobx_1.toJS)(this.props.output) },
            react_1.default.createElement(outputs_1.ExecuteResult, { expanded: true }, exports.supportedMediaTypes),
            react_1.default.createElement(outputs_1.DisplayData, { expanded: true }, exports.supportedMediaTypes),
            react_1.default.createElement(outputs_1.StreamText, { expanded: true }),
            react_1.default.createElement(outputs_1.KernelOutputError, { expanded: true })));
    }
};
Display = __decorate([
    mobx_react_1.observer
], Display);
exports.default = Display;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9jb21wb25lbnRzL3Jlc3VsdC12aWV3L2Rpc3BsYXkudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwrQkFBNEI7QUFDNUIsMkNBQXNDO0FBQ3RDLDhDQVEwQjtBQUMxQixzREFBOEI7QUFDOUIsNERBU2lDO0FBQ2pDLDBEQUFrQztBQUVyQixRQUFBLG1CQUFtQixHQUFHLENBQ2pDLDhCQUFDLG1CQUFTO0lBQ1IsOEJBQUMsc0JBQUssT0FBRztJQUNULDhCQUFDLHNCQUFLLE9BQUc7SUFDVCw4QkFBQyxzQkFBSyxPQUFHO0lBQ1QsOEJBQUMsc0JBQUssT0FBRztJQUNULDhCQUFDLGdCQUFNLE9BQUc7SUFDViw4QkFBQywwQkFBUyxPQUFHO0lBQ2IsOEJBQUMsMEJBQVMsT0FBRztJQUNiLDhCQUFDLDBCQUFTLE9BQUc7SUFDYiw4QkFBQywwQkFBUyxPQUFHO0lBQ2IsOEJBQUMsZUFBSyxDQUFDLElBQUksT0FBRztJQUNkLDhCQUFDLGVBQUssQ0FBQyxVQUFVLE9BQUc7SUFDcEIsOEJBQUMsZUFBSyxDQUFDLElBQUksT0FBRztJQUNkLDhCQUFDLGtCQUFRLE9BQUc7SUFDWiw4QkFBQyxlQUFLLENBQUMsS0FBSyxPQUFHO0lBQ2YsOEJBQUMsZUFBSyxDQUFDLEdBQUcsT0FBRztJQUNiLDhCQUFDLGVBQUssQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLFdBQVcsR0FBRztJQUNyQyw4QkFBQyxlQUFLLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQyxZQUFZLEdBQUc7SUFDdEMsOEJBQUMsZUFBSyxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMsV0FBVyxHQUFHO0lBQ3JDLDhCQUFDLGVBQUssQ0FBQyxLQUFLLE9BQUcsQ0FDTCxDQUNiLENBQUM7QUFDRixTQUFnQixnQkFBZ0IsQ0FBQyxJQUF5QjtJQUN4RCxNQUFNLFNBQVMsR0FBRyxlQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDbEMsMkJBQW1CLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFDbEMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUNuRCxDQUFDO0lBQ0YsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQ25FLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQzlCLENBQUM7SUFDRixPQUFPLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssWUFBWTtRQUMxRSxDQUFDLENBQUMsSUFBSTtRQUNOLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDWixDQUFDO0FBWEQsNENBV0M7QUFHRCxJQUFNLE9BQU8sR0FBYixNQUFNLE9BQVEsU0FBUSxlQUFLLENBQUMsU0FFMUI7SUFDQSxNQUFNO1FBQ0osT0FBTyxDQUNMLDhCQUFDLGdCQUFNLElBQUMsTUFBTSxFQUFFLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ3JDLDhCQUFDLHVCQUFhLElBQUMsUUFBUSxVQUFFLDJCQUFtQixDQUFpQjtZQUM3RCw4QkFBQyxxQkFBVyxJQUFDLFFBQVEsVUFBRSwyQkFBbUIsQ0FBZTtZQUN6RCw4QkFBQyxvQkFBVSxJQUFDLFFBQVEsU0FBRztZQUN2Qiw4QkFBQywyQkFBaUIsSUFBQyxRQUFRLFNBQUcsQ0FDdkIsQ0FDVixDQUFDO0lBQ0osQ0FBQztDQUNGLENBQUE7QUFiSyxPQUFPO0lBRFoscUJBQVE7R0FDSCxPQUFPLENBYVo7QUFFRCxrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyB0b0pTIH0gZnJvbSBcIm1vYnhcIjtcbmltcG9ydCB7IG9ic2VydmVyIH0gZnJvbSBcIm1vYngtcmVhY3RcIjtcbmltcG9ydCB7XG4gIERpc3BsYXlEYXRhLFxuICBFeGVjdXRlUmVzdWx0LFxuICBTdHJlYW1UZXh0LFxuICBLZXJuZWxPdXRwdXRFcnJvcixcbiAgT3V0cHV0LFxuICBNZWRpYSxcbiAgUmljaE1lZGlhLFxufSBmcm9tIFwiQG50ZXJhY3Qvb3V0cHV0c1wiO1xuaW1wb3J0IFBsb3RseSBmcm9tIFwiLi9wbG90bHlcIjtcbmltcG9ydCB7XG4gIFZlZ2FMaXRlMSxcbiAgVmVnYUxpdGUyLFxuICBWZWdhTGl0ZTMsXG4gIFZlZ2FMaXRlNCxcbiAgVmVnYTIsXG4gIFZlZ2EzLFxuICBWZWdhNCxcbiAgVmVnYTUsXG59IGZyb20gXCJAbnRlcmFjdC90cmFuc2Zvcm0tdmVnYVwiO1xuaW1wb3J0IE1hcmtkb3duIGZyb20gXCIuL21hcmtkb3duXCI7XG4vLyBBbGwgc3VwcG9ydGVkIG1lZGlhIHR5cGVzIGZvciBvdXRwdXQgZ28gaGVyZVxuZXhwb3J0IGNvbnN0IHN1cHBvcnRlZE1lZGlhVHlwZXMgPSAoXG4gIDxSaWNoTWVkaWE+XG4gICAgPFZlZ2E1IC8+XG4gICAgPFZlZ2E0IC8+XG4gICAgPFZlZ2EzIC8+XG4gICAgPFZlZ2EyIC8+XG4gICAgPFBsb3RseSAvPlxuICAgIDxWZWdhTGl0ZTQgLz5cbiAgICA8VmVnYUxpdGUzIC8+XG4gICAgPFZlZ2FMaXRlMiAvPlxuICAgIDxWZWdhTGl0ZTEgLz5cbiAgICA8TWVkaWEuSnNvbiAvPlxuICAgIDxNZWRpYS5KYXZhU2NyaXB0IC8+XG4gICAgPE1lZGlhLkhUTUwgLz5cbiAgICA8TWFya2Rvd24gLz5cbiAgICA8TWVkaWEuTGFUZVggLz5cbiAgICA8TWVkaWEuU1ZHIC8+XG4gICAgPE1lZGlhLkltYWdlIG1lZGlhVHlwZT1cImltYWdlL2dpZlwiIC8+XG4gICAgPE1lZGlhLkltYWdlIG1lZGlhVHlwZT1cImltYWdlL2pwZWdcIiAvPlxuICAgIDxNZWRpYS5JbWFnZSBtZWRpYVR5cGU9XCJpbWFnZS9wbmdcIiAvPlxuICAgIDxNZWRpYS5QbGFpbiAvPlxuICA8L1JpY2hNZWRpYT5cbik7XG5leHBvcnQgZnVuY3Rpb24gaXNUZXh0T3V0cHV0T25seShkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gIGNvbnN0IHN1cHBvcnRlZCA9IFJlYWN0LkNoaWxkcmVuLm1hcChcbiAgICBzdXBwb3J0ZWRNZWRpYVR5cGVzLnByb3BzLmNoaWxkcmVuLFxuICAgIChtZWRpYUNvbXBvbmVudCkgPT4gbWVkaWFDb21wb25lbnQucHJvcHMubWVkaWFUeXBlXG4gICk7XG4gIGNvbnN0IGJ1bmRsZU1lZGlhVHlwZXMgPSBbLi4uT2JqZWN0LmtleXMoZGF0YSldLmZpbHRlcigobWVkaWFUeXBlKSA9PlxuICAgIHN1cHBvcnRlZC5pbmNsdWRlcyhtZWRpYVR5cGUpXG4gICk7XG4gIHJldHVybiBidW5kbGVNZWRpYVR5cGVzLmxlbmd0aCA9PT0gMSAmJiBidW5kbGVNZWRpYVR5cGVzWzBdID09PSBcInRleHQvcGxhaW5cIlxuICAgID8gdHJ1ZVxuICAgIDogZmFsc2U7XG59XG5cbkBvYnNlcnZlclxuY2xhc3MgRGlzcGxheSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDx7XG4gIG91dHB1dDogYW55O1xufT4ge1xuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxPdXRwdXQgb3V0cHV0PXt0b0pTKHRoaXMucHJvcHMub3V0cHV0KX0+XG4gICAgICAgIDxFeGVjdXRlUmVzdWx0IGV4cGFuZGVkPntzdXBwb3J0ZWRNZWRpYVR5cGVzfTwvRXhlY3V0ZVJlc3VsdD5cbiAgICAgICAgPERpc3BsYXlEYXRhIGV4cGFuZGVkPntzdXBwb3J0ZWRNZWRpYVR5cGVzfTwvRGlzcGxheURhdGE+XG4gICAgICAgIDxTdHJlYW1UZXh0IGV4cGFuZGVkIC8+XG4gICAgICAgIDxLZXJuZWxPdXRwdXRFcnJvciBleHBhbmRlZCAvPlxuICAgICAgPC9PdXRwdXQ+XG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBEaXNwbGF5O1xuIl19