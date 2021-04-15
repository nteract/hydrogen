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
        return (react_1.default.createElement(outputs_1.Output, { output: mobx_1.toJS(this.props.output) },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9jb21wb25lbnRzL3Jlc3VsdC12aWV3L2Rpc3BsYXkudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwrQkFBNEI7QUFDNUIsMkNBQXNDO0FBQ3RDLDhDQVEwQjtBQUMxQixzREFBOEI7QUFDOUIsNERBU2lDO0FBQ2pDLDBEQUFrQztBQUVyQixRQUFBLG1CQUFtQixHQUFHLENBQ2pDLDhCQUFDLG1CQUFTO0lBQ1IsOEJBQUMsc0JBQUssT0FBRztJQUNULDhCQUFDLHNCQUFLLE9BQUc7SUFDVCw4QkFBQyxzQkFBSyxPQUFHO0lBQ1QsOEJBQUMsc0JBQUssT0FBRztJQUNULDhCQUFDLGdCQUFNLE9BQUc7SUFDViw4QkFBQywwQkFBUyxPQUFHO0lBQ2IsOEJBQUMsMEJBQVMsT0FBRztJQUNiLDhCQUFDLDBCQUFTLE9BQUc7SUFDYiw4QkFBQywwQkFBUyxPQUFHO0lBQ2IsOEJBQUMsZUFBSyxDQUFDLElBQUksT0FBRztJQUNkLDhCQUFDLGVBQUssQ0FBQyxVQUFVLE9BQUc7SUFDcEIsOEJBQUMsZUFBSyxDQUFDLElBQUksT0FBRztJQUNkLDhCQUFDLGtCQUFRLE9BQUc7SUFDWiw4QkFBQyxlQUFLLENBQUMsS0FBSyxPQUFHO0lBQ2YsOEJBQUMsZUFBSyxDQUFDLEdBQUcsT0FBRztJQUNiLDhCQUFDLGVBQUssQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLFdBQVcsR0FBRztJQUNyQyw4QkFBQyxlQUFLLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQyxZQUFZLEdBQUc7SUFDdEMsOEJBQUMsZUFBSyxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMsV0FBVyxHQUFHO0lBQ3JDLDhCQUFDLGVBQUssQ0FBQyxLQUFLLE9BQUcsQ0FDTCxDQUNiLENBQUM7QUFDRixTQUFnQixnQkFBZ0IsQ0FBQyxJQUF5QjtJQUN4RCxNQUFNLFNBQVMsR0FBRyxlQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDbEMsMkJBQW1CLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFDbEMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUNuRCxDQUFDO0lBQ0YsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQ25FLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQzlCLENBQUM7SUFDRixPQUFPLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssWUFBWTtRQUMxRSxDQUFDLENBQUMsSUFBSTtRQUNOLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDWixDQUFDO0FBWEQsNENBV0M7QUFHRCxJQUFNLE9BQU8sR0FBYixNQUFNLE9BQVEsU0FBUSxlQUFLLENBQUMsU0FFMUI7SUFDQSxNQUFNO1FBQ0osT0FBTyxDQUNMLDhCQUFDLGdCQUFNLElBQUMsTUFBTSxFQUFFLFdBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUNyQyw4QkFBQyx1QkFBYSxJQUFDLFFBQVEsVUFBRSwyQkFBbUIsQ0FBaUI7WUFDN0QsOEJBQUMscUJBQVcsSUFBQyxRQUFRLFVBQUUsMkJBQW1CLENBQWU7WUFDekQsOEJBQUMsb0JBQVUsSUFBQyxRQUFRLFNBQUc7WUFDdkIsOEJBQUMsMkJBQWlCLElBQUMsUUFBUSxTQUFHLENBQ3ZCLENBQ1YsQ0FBQztJQUNKLENBQUM7Q0FDRixDQUFBO0FBYkssT0FBTztJQURaLHFCQUFRO0dBQ0gsT0FBTyxDQWFaO0FBRUQsa0JBQWUsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgdG9KUyB9IGZyb20gXCJtb2J4XCI7XG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQge1xuICBEaXNwbGF5RGF0YSxcbiAgRXhlY3V0ZVJlc3VsdCxcbiAgU3RyZWFtVGV4dCxcbiAgS2VybmVsT3V0cHV0RXJyb3IsXG4gIE91dHB1dCxcbiAgTWVkaWEsXG4gIFJpY2hNZWRpYSxcbn0gZnJvbSBcIkBudGVyYWN0L291dHB1dHNcIjtcbmltcG9ydCBQbG90bHkgZnJvbSBcIi4vcGxvdGx5XCI7XG5pbXBvcnQge1xuICBWZWdhTGl0ZTEsXG4gIFZlZ2FMaXRlMixcbiAgVmVnYUxpdGUzLFxuICBWZWdhTGl0ZTQsXG4gIFZlZ2EyLFxuICBWZWdhMyxcbiAgVmVnYTQsXG4gIFZlZ2E1LFxufSBmcm9tIFwiQG50ZXJhY3QvdHJhbnNmb3JtLXZlZ2FcIjtcbmltcG9ydCBNYXJrZG93biBmcm9tIFwiLi9tYXJrZG93blwiO1xuLy8gQWxsIHN1cHBvcnRlZCBtZWRpYSB0eXBlcyBmb3Igb3V0cHV0IGdvIGhlcmVcbmV4cG9ydCBjb25zdCBzdXBwb3J0ZWRNZWRpYVR5cGVzID0gKFxuICA8UmljaE1lZGlhPlxuICAgIDxWZWdhNSAvPlxuICAgIDxWZWdhNCAvPlxuICAgIDxWZWdhMyAvPlxuICAgIDxWZWdhMiAvPlxuICAgIDxQbG90bHkgLz5cbiAgICA8VmVnYUxpdGU0IC8+XG4gICAgPFZlZ2FMaXRlMyAvPlxuICAgIDxWZWdhTGl0ZTIgLz5cbiAgICA8VmVnYUxpdGUxIC8+XG4gICAgPE1lZGlhLkpzb24gLz5cbiAgICA8TWVkaWEuSmF2YVNjcmlwdCAvPlxuICAgIDxNZWRpYS5IVE1MIC8+XG4gICAgPE1hcmtkb3duIC8+XG4gICAgPE1lZGlhLkxhVGVYIC8+XG4gICAgPE1lZGlhLlNWRyAvPlxuICAgIDxNZWRpYS5JbWFnZSBtZWRpYVR5cGU9XCJpbWFnZS9naWZcIiAvPlxuICAgIDxNZWRpYS5JbWFnZSBtZWRpYVR5cGU9XCJpbWFnZS9qcGVnXCIgLz5cbiAgICA8TWVkaWEuSW1hZ2UgbWVkaWFUeXBlPVwiaW1hZ2UvcG5nXCIgLz5cbiAgICA8TWVkaWEuUGxhaW4gLz5cbiAgPC9SaWNoTWVkaWE+XG4pO1xuZXhwb3J0IGZ1bmN0aW9uIGlzVGV4dE91dHB1dE9ubHkoZGF0YTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICBjb25zdCBzdXBwb3J0ZWQgPSBSZWFjdC5DaGlsZHJlbi5tYXAoXG4gICAgc3VwcG9ydGVkTWVkaWFUeXBlcy5wcm9wcy5jaGlsZHJlbixcbiAgICAobWVkaWFDb21wb25lbnQpID0+IG1lZGlhQ29tcG9uZW50LnByb3BzLm1lZGlhVHlwZVxuICApO1xuICBjb25zdCBidW5kbGVNZWRpYVR5cGVzID0gWy4uLk9iamVjdC5rZXlzKGRhdGEpXS5maWx0ZXIoKG1lZGlhVHlwZSkgPT5cbiAgICBzdXBwb3J0ZWQuaW5jbHVkZXMobWVkaWFUeXBlKVxuICApO1xuICByZXR1cm4gYnVuZGxlTWVkaWFUeXBlcy5sZW5ndGggPT09IDEgJiYgYnVuZGxlTWVkaWFUeXBlc1swXSA9PT0gXCJ0ZXh0L3BsYWluXCJcbiAgICA/IHRydWVcbiAgICA6IGZhbHNlO1xufVxuXG5Ab2JzZXJ2ZXJcbmNsYXNzIERpc3BsYXkgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8e1xuICBvdXRwdXQ6IGFueTtcbn0+IHtcbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8T3V0cHV0IG91dHB1dD17dG9KUyh0aGlzLnByb3BzLm91dHB1dCl9PlxuICAgICAgICA8RXhlY3V0ZVJlc3VsdCBleHBhbmRlZD57c3VwcG9ydGVkTWVkaWFUeXBlc308L0V4ZWN1dGVSZXN1bHQ+XG4gICAgICAgIDxEaXNwbGF5RGF0YSBleHBhbmRlZD57c3VwcG9ydGVkTWVkaWFUeXBlc308L0Rpc3BsYXlEYXRhPlxuICAgICAgICA8U3RyZWFtVGV4dCBleHBhbmRlZCAvPlxuICAgICAgICA8S2VybmVsT3V0cHV0RXJyb3IgZXhwYW5kZWQgLz5cbiAgICAgIDwvT3V0cHV0PlxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRGlzcGxheTtcbiJdfQ==