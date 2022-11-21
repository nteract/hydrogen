"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleOutputMode = exports.toggleInspector = void 0;
const utils_1 = require("./utils");
const code_manager_1 = require("./code-manager");
const output_area_1 = __importDefault(require("./panes/output-area"));
function toggleInspector(store) {
    const { editor, kernel } = store;
    if (!editor || !kernel) {
        atom.notifications.addInfo("No kernel running!");
        return;
    }
    const [code, cursorPos] = (0, code_manager_1.getCodeToInspect)(editor);
    if (!code || cursorPos === 0) {
        atom.notifications.addInfo("No code to introspect!");
        return;
    }
    kernel.inspect(code, cursorPos, (result) => {
        (0, utils_1.log)("Inspector: Result:", result);
        if (!result.found) {
            atom.workspace.hide(utils_1.INSPECTOR_URI);
            atom.notifications.addInfo("No introspection available!");
            return;
        }
        kernel.setInspectorResult(result.data, editor);
    });
}
exports.toggleInspector = toggleInspector;
function toggleOutputMode() {
    const outputArea = atom.workspace
        .getPaneItems()
        .find((paneItem) => paneItem instanceof output_area_1.default);
    if (outputArea) {
        return outputArea.destroy();
    }
    else {
        (0, utils_1.openOrShowDock)(utils_1.OUTPUT_AREA_URI);
    }
}
exports.toggleOutputMode = toggleOutputMode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsbUNBQThFO0FBQzlFLGlEQUFrRDtBQUNsRCxzRUFBNkM7QUFFN0MsU0FBZ0IsZUFBZSxDQUFDLEtBQVk7SUFDMUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7SUFFakMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2pELE9BQU87S0FDUjtJQUVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsSUFBQSwrQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUVuRCxJQUFJLENBQUMsSUFBSSxJQUFJLFNBQVMsS0FBSyxDQUFDLEVBQUU7UUFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUNyRCxPQUFPO0tBQ1I7SUFFRCxNQUFNLENBQUMsT0FBTyxDQUNaLElBQUksRUFDSixTQUFTLEVBQ1QsQ0FBQyxNQUFxRCxFQUFFLEVBQUU7UUFDeEQsSUFBQSxXQUFHLEVBQUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7WUFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQWEsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDMUQsT0FBTztTQUNSO1FBRUQsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakQsQ0FBQyxDQUNGLENBQUM7QUFDSixDQUFDO0FBOUJELDBDQThCQztBQUNELFNBQWdCLGdCQUFnQjtJQUU5QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUztTQUM5QixZQUFZLEVBQUU7U0FDZCxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFFBQVEsWUFBWSxxQkFBVSxDQUFlLENBQUM7SUFFcEUsSUFBSSxVQUFVLEVBQUU7UUFDZCxPQUFPLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUM3QjtTQUFNO1FBQ0wsSUFBQSxzQkFBYyxFQUFDLHVCQUFlLENBQUMsQ0FBQztLQUNqQztBQUNILENBQUM7QUFYRCw0Q0FXQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZywgSU5TUEVDVE9SX1VSSSwgT1VUUFVUX0FSRUFfVVJJLCBvcGVuT3JTaG93RG9jayB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBnZXRDb2RlVG9JbnNwZWN0IH0gZnJvbSBcIi4vY29kZS1tYW5hZ2VyXCI7XG5pbXBvcnQgT3V0cHV0UGFuZSBmcm9tIFwiLi9wYW5lcy9vdXRwdXQtYXJlYVwiO1xudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuL3N0b3JlXCIpLmRlZmF1bHQ7XG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlSW5zcGVjdG9yKHN0b3JlOiBzdG9yZSkge1xuICBjb25zdCB7IGVkaXRvciwga2VybmVsIH0gPSBzdG9yZTtcblxuICBpZiAoIWVkaXRvciB8fCAha2VybmVsKSB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJObyBrZXJuZWwgcnVubmluZyFcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgW2NvZGUsIGN1cnNvclBvc10gPSBnZXRDb2RlVG9JbnNwZWN0KGVkaXRvcik7XG5cbiAgaWYgKCFjb2RlIHx8IGN1cnNvclBvcyA9PT0gMCkge1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiTm8gY29kZSB0byBpbnRyb3NwZWN0IVwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBrZXJuZWwuaW5zcGVjdChcbiAgICBjb2RlLFxuICAgIGN1cnNvclBvcyxcbiAgICAocmVzdWx0OiB7IGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47IGZvdW5kOiBib29sZWFuIH0pID0+IHtcbiAgICAgIGxvZyhcIkluc3BlY3RvcjogUmVzdWx0OlwiLCByZXN1bHQpO1xuXG4gICAgICBpZiAoIXJlc3VsdC5mb3VuZCkge1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5oaWRlKElOU1BFQ1RPUl9VUkkpO1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIk5vIGludHJvc3BlY3Rpb24gYXZhaWxhYmxlIVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBrZXJuZWwuc2V0SW5zcGVjdG9yUmVzdWx0KHJlc3VsdC5kYXRhLCBlZGl0b3IpO1xuICAgIH1cbiAgKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVPdXRwdXRNb2RlKCk6IHZvaWQge1xuICAvLyBUaGVyZSBzaG91bGQgbmV2ZXIgYmUgbW9yZSB0aGFuIG9uZSBpbnN0YW5jZSBvZiBPdXRwdXRBcmVhXG4gIGNvbnN0IG91dHB1dEFyZWEgPSBhdG9tLndvcmtzcGFjZVxuICAgIC5nZXRQYW5lSXRlbXMoKVxuICAgIC5maW5kKChwYW5lSXRlbSkgPT4gcGFuZUl0ZW0gaW5zdGFuY2VvZiBPdXRwdXRQYW5lKSBhcyBPdXRwdXRQYW5lO1xuXG4gIGlmIChvdXRwdXRBcmVhKSB7XG4gICAgcmV0dXJuIG91dHB1dEFyZWEuZGVzdHJveSgpO1xuICB9IGVsc2Uge1xuICAgIG9wZW5PclNob3dEb2NrKE9VVFBVVF9BUkVBX1VSSSk7XG4gIH1cbn1cbiJdfQ==