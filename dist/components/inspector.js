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
const Inspector = mobx_react_1.observer(({ store: { kernel } }) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NvbXBvbmVudHMvaW5zcGVjdG9yLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQ0FBc0M7QUFDdEMsOENBQW9EO0FBQ3BELG9DQUF5QztBQUV6QyxzRUFBOEM7QUFPOUMsU0FBUyxJQUFJO0lBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQWEsQ0FBQyxDQUFDO0lBQ25DLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sU0FBUyxHQUFHLHFCQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFTLEVBQUUsRUFBRTtJQUMxRCxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1gsT0FBTyxJQUFJLEVBQUUsQ0FBQztLQUNmO0lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7SUFFdkMsSUFDRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDcEIsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDO1FBQ3hCLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUNyQjtRQUNBLE9BQU8sSUFBSSxFQUFFLENBQUM7S0FDZjtJQUVELE9BQU8sQ0FDTCx1Q0FDRSxTQUFTLEVBQUMscUJBQXFCLEVBQy9CLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFDWixLQUFLLEVBQUU7WUFDTCxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsSUFBSSxTQUFTO1NBQ3RFO1FBRUQsOEJBQUMsbUJBQVMsSUFBQyxJQUFJLEVBQUUsTUFBTTtZQUNyQiw4QkFBQyxlQUFLLENBQUMsSUFBSSxPQUFHO1lBQ2QsOEJBQUMsa0JBQVEsT0FBRztZQUNaLDhCQUFDLGVBQUssQ0FBQyxLQUFLLE9BQUcsQ0FDTCxDQUNSLENBQ1AsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0gsa0JBQWUsU0FBUyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgb2JzZXJ2ZXIgfSBmcm9tIFwibW9ieC1yZWFjdFwiO1xuaW1wb3J0IHsgUmljaE1lZGlhLCBNZWRpYSB9IGZyb20gXCJAbnRlcmFjdC9vdXRwdXRzXCI7XG5pbXBvcnQgeyBJTlNQRUNUT1JfVVJJIH0gZnJvbSBcIi4uL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4uL2tlcm5lbFwiO1xuaW1wb3J0IE1hcmtkb3duIGZyb20gXCIuL3Jlc3VsdC12aWV3L21hcmtkb3duXCI7XG50eXBlIFByb3BzID0ge1xuICBzdG9yZToge1xuICAgIGtlcm5lbDogS2VybmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGhpZGUoKSB7XG4gIGF0b20ud29ya3NwYWNlLmhpZGUoSU5TUEVDVE9SX1VSSSk7XG4gIHJldHVybiBudWxsO1xufVxuXG5jb25zdCBJbnNwZWN0b3IgPSBvYnNlcnZlcigoeyBzdG9yZTogeyBrZXJuZWwgfSB9OiBQcm9wcykgPT4ge1xuICBpZiAoIWtlcm5lbCkge1xuICAgIHJldHVybiBoaWRlKCk7XG4gIH1cbiAgY29uc3QgYnVuZGxlID0ga2VybmVsLmluc3BlY3Rvci5idW5kbGU7XG5cbiAgaWYgKFxuICAgICFidW5kbGVbXCJ0ZXh0L2h0bWxcIl0gJiZcbiAgICAhYnVuZGxlW1widGV4dC9tYXJrZG93blwiXSAmJlxuICAgICFidW5kbGVbXCJ0ZXh0L3BsYWluXCJdXG4gICkge1xuICAgIHJldHVybiBoaWRlKCk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIGNsYXNzTmFtZT1cIm5hdGl2ZS1rZXktYmluZGluZ3NcIlxuICAgICAgdGFiSW5kZXg9ey0xfVxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZm9udFNpemU6IGF0b20uY29uZmlnLmdldChgSHlkcm9nZW4ub3V0cHV0QXJlYUZvbnRTaXplYCkgfHwgXCJpbmhlcml0XCIsXG4gICAgICB9fVxuICAgID5cbiAgICAgIDxSaWNoTWVkaWEgZGF0YT17YnVuZGxlfT5cbiAgICAgICAgPE1lZGlhLkhUTUwgLz5cbiAgICAgICAgPE1hcmtkb3duIC8+XG4gICAgICAgIDxNZWRpYS5QbGFpbiAvPlxuICAgICAgPC9SaWNoTWVkaWE+XG4gICAgPC9kaXY+XG4gICk7XG59KTtcbmV4cG9ydCBkZWZhdWx0IEluc3BlY3RvcjtcbiJdfQ==