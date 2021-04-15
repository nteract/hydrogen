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
    const [code, cursorPos] = code_manager_1.getCodeToInspect(editor);
    if (!code || cursorPos === 0) {
        atom.notifications.addInfo("No code to introspect!");
        return;
    }
    kernel.inspect(code, cursorPos, (result) => {
        utils_1.log("Inspector: Result:", result);
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
        utils_1.openOrShowDock(utils_1.OUTPUT_AREA_URI);
    }
}
exports.toggleOutputMode = toggleOutputMode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsbUNBTWlCO0FBQ2pCLGlEQUFrRDtBQUNsRCxzRUFBNkM7QUFFN0MsU0FBZ0IsZUFBZSxDQUFDLEtBQVk7SUFDMUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7SUFFakMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2pELE9BQU87S0FDUjtJQUVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsK0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFbkQsSUFBSSxDQUFDLElBQUksSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFO1FBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDckQsT0FBTztLQUNSO0lBRUQsTUFBTSxDQUFDLE9BQU8sQ0FDWixJQUFJLEVBQ0osU0FBUyxFQUNULENBQUMsTUFBcUQsRUFBRSxFQUFFO1FBQ3hELFdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBYSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztZQUMxRCxPQUFPO1NBQ1I7UUFFRCxNQUFNLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQ0YsQ0FBQztBQUNKLENBQUM7QUE5QkQsMENBOEJDO0FBQ0QsU0FBZ0IsZ0JBQWdCO0lBRTlCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTO1NBQzlCLFlBQVksRUFBRTtTQUNkLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxZQUFZLHFCQUFVLENBQWUsQ0FBQztJQUVwRSxJQUFJLFVBQVUsRUFBRTtRQUNkLE9BQU8sVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzdCO1NBQU07UUFDTCxzQkFBYyxDQUFDLHVCQUFlLENBQUMsQ0FBQztLQUNqQztBQUNILENBQUM7QUFYRCw0Q0FXQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIGxvZyxcbiAgcmVhY3RGYWN0b3J5LFxuICBJTlNQRUNUT1JfVVJJLFxuICBPVVRQVVRfQVJFQV9VUkksXG4gIG9wZW5PclNob3dEb2NrLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgZ2V0Q29kZVRvSW5zcGVjdCB9IGZyb20gXCIuL2NvZGUtbWFuYWdlclwiO1xuaW1wb3J0IE91dHB1dFBhbmUgZnJvbSBcIi4vcGFuZXMvb3V0cHV0LWFyZWFcIjtcbnR5cGUgc3RvcmUgPSB0eXBlb2YgaW1wb3J0KFwiLi9zdG9yZVwiKS5kZWZhdWx0O1xuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUluc3BlY3RvcihzdG9yZTogc3RvcmUpIHtcbiAgY29uc3QgeyBlZGl0b3IsIGtlcm5lbCB9ID0gc3RvcmU7XG5cbiAgaWYgKCFlZGl0b3IgfHwgIWtlcm5lbCkge1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiTm8ga2VybmVsIHJ1bm5pbmchXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IFtjb2RlLCBjdXJzb3JQb3NdID0gZ2V0Q29kZVRvSW5zcGVjdChlZGl0b3IpO1xuXG4gIGlmICghY29kZSB8fCBjdXJzb3JQb3MgPT09IDApIHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIk5vIGNvZGUgdG8gaW50cm9zcGVjdCFcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAga2VybmVsLmluc3BlY3QoXG4gICAgY29kZSxcbiAgICBjdXJzb3JQb3MsXG4gICAgKHJlc3VsdDogeyBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+OyBmb3VuZDogYm9vbGVhbiB9KSA9PiB7XG4gICAgICBsb2coXCJJbnNwZWN0b3I6IFJlc3VsdDpcIiwgcmVzdWx0KTtcblxuICAgICAgaWYgKCFyZXN1bHQuZm91bmQpIHtcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuaGlkZShJTlNQRUNUT1JfVVJJKTtcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJObyBpbnRyb3NwZWN0aW9uIGF2YWlsYWJsZSFcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAga2VybmVsLnNldEluc3BlY3RvclJlc3VsdChyZXN1bHQuZGF0YSwgZWRpdG9yKTtcbiAgICB9XG4gICk7XG59XG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlT3V0cHV0TW9kZSgpOiB2b2lkIHtcbiAgLy8gVGhlcmUgc2hvdWxkIG5ldmVyIGJlIG1vcmUgdGhhbiBvbmUgaW5zdGFuY2Ugb2YgT3V0cHV0QXJlYVxuICBjb25zdCBvdXRwdXRBcmVhID0gYXRvbS53b3Jrc3BhY2VcbiAgICAuZ2V0UGFuZUl0ZW1zKClcbiAgICAuZmluZCgocGFuZUl0ZW0pID0+IHBhbmVJdGVtIGluc3RhbmNlb2YgT3V0cHV0UGFuZSkgYXMgT3V0cHV0UGFuZTtcblxuICBpZiAob3V0cHV0QXJlYSkge1xuICAgIHJldHVybiBvdXRwdXRBcmVhLmRlc3Ryb3koKTtcbiAgfSBlbHNlIHtcbiAgICBvcGVuT3JTaG93RG9jayhPVVRQVVRfQVJFQV9VUkkpO1xuICB9XG59XG4iXX0=