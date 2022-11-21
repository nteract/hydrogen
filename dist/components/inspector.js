"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const mobx_react_1 = require("mobx-react");
const outputs_1 = require("@nteract/outputs");
const utils_1 = require("../utils");
const markdown_1 = __importDefault(require("./result-view/markdown"));
function hide() {
    atom.workspace.hide(utils_1.INSPECTOR_URI);
    return null;
}
const Inspector = (0, mobx_react_1.observer)(({ store: { kernel } }) => {
    if (!kernel) {
        return hide();
    }
    const bundle = kernel.inspector.bundle;
    if (!bundle["text/html"] &&
        !bundle["text/markdown"] &&
        !bundle["text/plain"]) {
        return hide();
    }
    return (react_1.default.createElement("div", { className: "native-key-bindings", tabIndex: -1, style: {
            fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit",
        } },
        react_1.default.createElement(outputs_1.RichMedia, { data: bundle },
            react_1.default.createElement(outputs_1.Media.HTML, null),
            react_1.default.createElement(markdown_1.default, null),
            react_1.default.createElement(outputs_1.Media.Plain, null))));
});
exports.default = Inspector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NvbXBvbmVudHMvaW5zcGVjdG9yLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQ0FBc0M7QUFDdEMsOENBQW9EO0FBQ3BELG9DQUF5QztBQUV6QyxzRUFBOEM7QUFPOUMsU0FBUyxJQUFJO0lBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQWEsQ0FBQyxDQUFDO0lBQ25DLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sU0FBUyxHQUFHLElBQUEscUJBQVEsRUFBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQVMsRUFBRSxFQUFFO0lBQzFELElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxPQUFPLElBQUksRUFBRSxDQUFDO0tBQ2Y7SUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztJQUV2QyxJQUNFLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUNwQixDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7UUFDeEIsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQ3JCO1FBQ0EsT0FBTyxJQUFJLEVBQUUsQ0FBQztLQUNmO0lBRUQsT0FBTyxDQUNMLHVDQUNFLFNBQVMsRUFBQyxxQkFBcUIsRUFDL0IsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUNaLEtBQUssRUFBRTtZQUNMLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLFNBQVM7U0FDdEU7UUFFRCw4QkFBQyxtQkFBUyxJQUFDLElBQUksRUFBRSxNQUFNO1lBQ3JCLDhCQUFDLGVBQUssQ0FBQyxJQUFJLE9BQUc7WUFDZCw4QkFBQyxrQkFBUSxPQUFHO1lBQ1osOEJBQUMsZUFBSyxDQUFDLEtBQUssT0FBRyxDQUNMLENBQ1IsQ0FDUCxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUM7QUFDSCxrQkFBZSxTQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBvYnNlcnZlciB9IGZyb20gXCJtb2J4LXJlYWN0XCI7XG5pbXBvcnQgeyBSaWNoTWVkaWEsIE1lZGlhIH0gZnJvbSBcIkBudGVyYWN0L291dHB1dHNcIjtcbmltcG9ydCB7IElOU1BFQ1RPUl9VUkkgfSBmcm9tIFwiLi4vdXRpbHNcIjtcbmltcG9ydCB0eXBlIEtlcm5lbCBmcm9tIFwiLi4va2VybmVsXCI7XG5pbXBvcnQgTWFya2Rvd24gZnJvbSBcIi4vcmVzdWx0LXZpZXcvbWFya2Rvd25cIjtcbnR5cGUgUHJvcHMgPSB7XG4gIHN0b3JlOiB7XG4gICAga2VybmVsOiBLZXJuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xuICB9O1xufTtcblxuZnVuY3Rpb24gaGlkZSgpIHtcbiAgYXRvbS53b3Jrc3BhY2UuaGlkZShJTlNQRUNUT1JfVVJJKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmNvbnN0IEluc3BlY3RvciA9IG9ic2VydmVyKCh7IHN0b3JlOiB7IGtlcm5lbCB9IH06IFByb3BzKSA9PiB7XG4gIGlmICgha2VybmVsKSB7XG4gICAgcmV0dXJuIGhpZGUoKTtcbiAgfVxuICBjb25zdCBidW5kbGUgPSBrZXJuZWwuaW5zcGVjdG9yLmJ1bmRsZTtcblxuICBpZiAoXG4gICAgIWJ1bmRsZVtcInRleHQvaHRtbFwiXSAmJlxuICAgICFidW5kbGVbXCJ0ZXh0L21hcmtkb3duXCJdICYmXG4gICAgIWJ1bmRsZVtcInRleHQvcGxhaW5cIl1cbiAgKSB7XG4gICAgcmV0dXJuIGhpZGUoKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgY2xhc3NOYW1lPVwibmF0aXZlLWtleS1iaW5kaW5nc1wiXG4gICAgICB0YWJJbmRleD17LTF9XG4gICAgICBzdHlsZT17e1xuICAgICAgICBmb250U2l6ZTogYXRvbS5jb25maWcuZ2V0KGBIeWRyb2dlbi5vdXRwdXRBcmVhRm9udFNpemVgKSB8fCBcImluaGVyaXRcIixcbiAgICAgIH19XG4gICAgPlxuICAgICAgPFJpY2hNZWRpYSBkYXRhPXtidW5kbGV9PlxuICAgICAgICA8TWVkaWEuSFRNTCAvPlxuICAgICAgICA8TWFya2Rvd24gLz5cbiAgICAgICAgPE1lZGlhLlBsYWluIC8+XG4gICAgICA8L1JpY2hNZWRpYT5cbiAgICA8L2Rpdj5cbiAgKTtcbn0pO1xuZXhwb3J0IGRlZmF1bHQgSW5zcGVjdG9yO1xuIl19