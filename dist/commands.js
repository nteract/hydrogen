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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsbUNBQThFO0FBQzlFLGlEQUFrRDtBQUNsRCxzRUFBNkM7QUFFN0MsU0FBZ0IsZUFBZSxDQUFDLEtBQVk7SUFDMUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7SUFFakMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2pELE9BQU87S0FDUjtJQUVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsK0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFbkQsSUFBSSxDQUFDLElBQUksSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFO1FBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDckQsT0FBTztLQUNSO0lBRUQsTUFBTSxDQUFDLE9BQU8sQ0FDWixJQUFJLEVBQ0osU0FBUyxFQUNULENBQUMsTUFBcUQsRUFBRSxFQUFFO1FBQ3hELFdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBYSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztZQUMxRCxPQUFPO1NBQ1I7UUFFRCxNQUFNLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQ0YsQ0FBQztBQUNKLENBQUM7QUE5QkQsMENBOEJDO0FBQ0QsU0FBZ0IsZ0JBQWdCO0lBRTlCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTO1NBQzlCLFlBQVksRUFBRTtTQUNkLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxZQUFZLHFCQUFVLENBQWUsQ0FBQztJQUVwRSxJQUFJLFVBQVUsRUFBRTtRQUNkLE9BQU8sVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzdCO1NBQU07UUFDTCxzQkFBYyxDQUFDLHVCQUFlLENBQUMsQ0FBQztLQUNqQztBQUNILENBQUM7QUFYRCw0Q0FXQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZywgSU5TUEVDVE9SX1VSSSwgT1VUUFVUX0FSRUFfVVJJLCBvcGVuT3JTaG93RG9jayB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7IGdldENvZGVUb0luc3BlY3QgfSBmcm9tIFwiLi9jb2RlLW1hbmFnZXJcIjtcclxuaW1wb3J0IE91dHB1dFBhbmUgZnJvbSBcIi4vcGFuZXMvb3V0cHV0LWFyZWFcIjtcclxudHlwZSBzdG9yZSA9IHR5cGVvZiBpbXBvcnQoXCIuL3N0b3JlXCIpLmRlZmF1bHQ7XHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVJbnNwZWN0b3Ioc3RvcmU6IHN0b3JlKSB7XHJcbiAgY29uc3QgeyBlZGl0b3IsIGtlcm5lbCB9ID0gc3RvcmU7XHJcblxyXG4gIGlmICghZWRpdG9yIHx8ICFrZXJuZWwpIHtcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiTm8ga2VybmVsIHJ1bm5pbmchXCIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgW2NvZGUsIGN1cnNvclBvc10gPSBnZXRDb2RlVG9JbnNwZWN0KGVkaXRvcik7XHJcblxyXG4gIGlmICghY29kZSB8fCBjdXJzb3JQb3MgPT09IDApIHtcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiTm8gY29kZSB0byBpbnRyb3NwZWN0IVwiKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGtlcm5lbC5pbnNwZWN0KFxyXG4gICAgY29kZSxcclxuICAgIGN1cnNvclBvcyxcclxuICAgIChyZXN1bHQ6IHsgZGF0YTogUmVjb3JkPHN0cmluZywgYW55PjsgZm91bmQ6IGJvb2xlYW4gfSkgPT4ge1xyXG4gICAgICBsb2coXCJJbnNwZWN0b3I6IFJlc3VsdDpcIiwgcmVzdWx0KTtcclxuXHJcbiAgICAgIGlmICghcmVzdWx0LmZvdW5kKSB7XHJcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuaGlkZShJTlNQRUNUT1JfVVJJKTtcclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIk5vIGludHJvc3BlY3Rpb24gYXZhaWxhYmxlIVwiKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGtlcm5lbC5zZXRJbnNwZWN0b3JSZXN1bHQocmVzdWx0LmRhdGEsIGVkaXRvcik7XHJcbiAgICB9XHJcbiAgKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlT3V0cHV0TW9kZSgpOiB2b2lkIHtcclxuICAvLyBUaGVyZSBzaG91bGQgbmV2ZXIgYmUgbW9yZSB0aGFuIG9uZSBpbnN0YW5jZSBvZiBPdXRwdXRBcmVhXHJcbiAgY29uc3Qgb3V0cHV0QXJlYSA9IGF0b20ud29ya3NwYWNlXHJcbiAgICAuZ2V0UGFuZUl0ZW1zKClcclxuICAgIC5maW5kKChwYW5lSXRlbSkgPT4gcGFuZUl0ZW0gaW5zdGFuY2VvZiBPdXRwdXRQYW5lKSBhcyBPdXRwdXRQYW5lO1xyXG5cclxuICBpZiAob3V0cHV0QXJlYSkge1xyXG4gICAgcmV0dXJuIG91dHB1dEFyZWEuZGVzdHJveSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBvcGVuT3JTaG93RG9jayhPVVRQVVRfQVJFQV9VUkkpO1xyXG4gIH1cclxufVxyXG4iXX0=