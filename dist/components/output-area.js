"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mathjax_1 = require("@nteract/mathjax");
const mathjax_electron_1 = require("mathjax-electron");
const mobx_1 = require("mobx");
const mobx_react_1 = require("mobx-react");
const anser_1 = __importDefault(require("anser"));
const history_1 = __importDefault(require("./result-view/history"));
const list_1 = __importDefault(require("./result-view/list"));
const utils_1 = require("../utils");
let OutputArea = class OutputArea extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.showHistory = true;
        this.setHistory = () => {
            this.showHistory = true;
        };
        this.setScrollList = () => {
            this.showHistory = false;
        };
        this.handleClick = () => {
            const kernel = this.props.store.kernel;
            if (!kernel || !kernel.outputStore) {
                return;
            }
            const output = kernel.outputStore.outputs[kernel.outputStore.index];
            const copyOutput = this.getOutputText(output);
            if (copyOutput) {
                atom.clipboard.write(anser_1.default.ansiToText(copyOutput));
                atom.notifications.addSuccess("Copied to clipboard");
            }
            else {
                atom.notifications.addWarning("Nothing to copy");
            }
        };
    }
    getOutputText(output) {
        switch (output.output_type) {
            case "stream":
                return output.text;
            case "execute_result":
                return output.data["text/plain"];
            case "error":
                return output.traceback.toJS().join("\n");
        }
    }
    render() {
        const kernel = this.props.store.kernel;
        if (!kernel) {
            if (atom.config.get("Hydrogen.outputAreaDock")) {
                return react_1.default.createElement(utils_1.EmptyMessage, null);
            }
            atom.workspace.hide(utils_1.OUTPUT_AREA_URI);
            return null;
        }
        return (react_1.default.createElement(mathjax_1.Provider, { src: mathjax_electron_1.mathJaxPath },
            react_1.default.createElement("div", { className: "sidebar output-area" },
                kernel.outputStore.outputs.length > 0 ? (react_1.default.createElement("div", { className: "block" },
                    react_1.default.createElement("div", { className: "btn-group" },
                        react_1.default.createElement("button", { className: `btn icon icon-clock${this.showHistory ? " selected" : ""}`, onClick: this.setHistory }),
                        react_1.default.createElement("button", { className: `btn icon icon-three-bars${!this.showHistory ? " selected" : ""}`, onClick: this.setScrollList })),
                    react_1.default.createElement("div", { style: {
                            float: "right",
                        } },
                        this.showHistory ? (react_1.default.createElement("button", { className: "btn icon icon-clippy", onClick: this.handleClick }, "Copy")) : null,
                        react_1.default.createElement("button", { className: "btn icon icon-trashcan", onClick: kernel.outputStore.clear }, "Clear")))) : (react_1.default.createElement(utils_1.EmptyMessage, null)),
                this.showHistory ? (react_1.default.createElement(history_1.default, { store: kernel.outputStore })) : (react_1.default.createElement(list_1.default, { outputs: kernel.outputStore.outputs })))));
    }
};
__decorate([
    mobx_1.observable,
    __metadata("design:type", Boolean)
], OutputArea.prototype, "showHistory", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], OutputArea.prototype, "setHistory", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], OutputArea.prototype, "setScrollList", void 0);
OutputArea = __decorate([
    mobx_react_1.observer
], OutputArea);
exports.default = OutputArea;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LWFyZWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY29tcG9uZW50cy9vdXRwdXQtYXJlYS50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsOENBQTRDO0FBQzVDLHVEQUErQztBQUMvQywrQkFBMEM7QUFDMUMsMkNBQXNDO0FBQ3RDLGtEQUEwQjtBQUMxQixvRUFBNEM7QUFDNUMsOERBQTRDO0FBQzVDLG9DQUF5RDtBQUl6RCxJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFXLFNBQVEsZUFBSyxDQUFDLFNBRTdCO0lBRkY7O1FBSUUsZ0JBQVcsR0FBWSxJQUFJLENBQUM7UUFFNUIsZUFBVSxHQUFHLEdBQUcsRUFBRTtZQUNoQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUMxQixDQUFDLENBQUM7UUFFRixrQkFBYSxHQUFHLEdBQUcsRUFBRTtZQUNuQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUMzQixDQUFDLENBQUM7UUFlRixnQkFBVyxHQUFHLEdBQUcsRUFBRTtZQUNqQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDdkMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7Z0JBQ2xDLE9BQU87YUFDUjtZQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUU5QyxJQUFJLFVBQVUsRUFBRTtnQkFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELElB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dXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IFByb3ZpZGVyIH0gZnJvbSBcIkBudGVyYWN0L21hdGhqYXhcIjtcbmltcG9ydCB7IG1hdGhKYXhQYXRoIH0gZnJvbSBcIm1hdGhqYXgtZWxlY3Ryb25cIjtcbmltcG9ydCB7IGFjdGlvbiwgb2JzZXJ2YWJsZSB9IGZyb20gXCJtb2J4XCI7XG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQgQW5zZXIgZnJvbSBcImFuc2VyXCI7XG5pbXBvcnQgSGlzdG9yeSBmcm9tIFwiLi9yZXN1bHQtdmlldy9oaXN0b3J5XCI7XG5pbXBvcnQgU2Nyb2xsTGlzdCBmcm9tIFwiLi9yZXN1bHQtdmlldy9saXN0XCI7XG5pbXBvcnQgeyBPVVRQVVRfQVJFQV9VUkksIEVtcHR5TWVzc2FnZSB9IGZyb20gXCIuLi91dGlsc1wiO1xudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuLi9zdG9yZVwiKS5kZWZhdWx0O1xuXG5Ab2JzZXJ2ZXJcbmNsYXNzIE91dHB1dEFyZWEgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8e1xuICBzdG9yZTogc3RvcmU7XG59PiB7XG4gIEBvYnNlcnZhYmxlXG4gIHNob3dIaXN0b3J5OiBib29sZWFuID0gdHJ1ZTtcbiAgQGFjdGlvblxuICBzZXRIaXN0b3J5ID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0hpc3RvcnkgPSB0cnVlO1xuICB9O1xuICBAYWN0aW9uXG4gIHNldFNjcm9sbExpc3QgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93SGlzdG9yeSA9IGZhbHNlO1xuICB9O1xuXG4gIGdldE91dHB1dFRleHQob3V0cHV0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgc3dpdGNoIChvdXRwdXQub3V0cHV0X3R5cGUpIHtcbiAgICAgIGNhc2UgXCJzdHJlYW1cIjpcbiAgICAgICAgcmV0dXJuIG91dHB1dC50ZXh0O1xuXG4gICAgICBjYXNlIFwiZXhlY3V0ZV9yZXN1bHRcIjpcbiAgICAgICAgcmV0dXJuIG91dHB1dC5kYXRhW1widGV4dC9wbGFpblwiXTtcblxuICAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICAgIHJldHVybiBvdXRwdXQudHJhY2ViYWNrLnRvSlMoKS5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUNsaWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IGtlcm5lbCA9IHRoaXMucHJvcHMuc3RvcmUua2VybmVsO1xuICAgIGlmICgha2VybmVsIHx8ICFrZXJuZWwub3V0cHV0U3RvcmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb3V0cHV0ID0ga2VybmVsLm91dHB1dFN0b3JlLm91dHB1dHNba2VybmVsLm91dHB1dFN0b3JlLmluZGV4XTtcbiAgICBjb25zdCBjb3B5T3V0cHV0ID0gdGhpcy5nZXRPdXRwdXRUZXh0KG91dHB1dCk7XG5cbiAgICBpZiAoY29weU91dHB1dCkge1xuICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoQW5zZXIuYW5zaVRvVGV4dChjb3B5T3V0cHV0KSk7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyhcIkNvcGllZCB0byBjbGlwYm9hcmRcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiTm90aGluZyB0byBjb3B5XCIpO1xuICAgIH1cbiAgfTtcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3Qga2VybmVsID0gdGhpcy5wcm9wcy5zdG9yZS5rZXJuZWw7XG5cbiAgICBpZiAoIWtlcm5lbCkge1xuICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLm91dHB1dEFyZWFEb2NrXCIpKSB7XG4gICAgICAgIHJldHVybiA8RW1wdHlNZXNzYWdlIC8+O1xuICAgICAgfVxuXG4gICAgICBhdG9tLndvcmtzcGFjZS5oaWRlKE9VVFBVVF9BUkVBX1VSSSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgPFByb3ZpZGVyIHNyYz17bWF0aEpheFBhdGh9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNpZGViYXIgb3V0cHV0LWFyZWFcIj5cbiAgICAgICAgICB7a2VybmVsLm91dHB1dFN0b3JlLm91dHB1dHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmxvY2tcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidG4tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BidG4gaWNvbiBpY29uLWNsb2NrJHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGlzdG9yeSA/IFwiIHNlbGVjdGVkXCIgOiBcIlwiXG4gICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuc2V0SGlzdG9yeX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGJ0biBpY29uIGljb24tdGhyZWUtYmFycyR7XG4gICAgICAgICAgICAgICAgICAgICF0aGlzLnNob3dIaXN0b3J5ID8gXCIgc2VsZWN0ZWRcIiA6IFwiXCJcbiAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5zZXRTY3JvbGxMaXN0fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGZsb2F0OiBcInJpZ2h0XCIsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt0aGlzLnNob3dIaXN0b3J5ID8gKFxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJidG4gaWNvbiBpY29uLWNsaXBweVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIENvcHlcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBpY29uIGljb24tdHJhc2hjYW5cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17a2VybmVsLm91dHB1dFN0b3JlLmNsZWFyfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIENsZWFyXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxFbXB0eU1lc3NhZ2UgLz5cbiAgICAgICAgICApfVxuICAgICAgICAgIHt0aGlzLnNob3dIaXN0b3J5ID8gKFxuICAgICAgICAgICAgPEhpc3Rvcnkgc3RvcmU9e2tlcm5lbC5vdXRwdXRTdG9yZX0gLz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPFNjcm9sbExpc3Qgb3V0cHV0cz17a2VybmVsLm91dHB1dFN0b3JlLm91dHB1dHN9IC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L1Byb3ZpZGVyPlxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT3V0cHV0QXJlYTtcbiJdfQ==