"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kernel_transport_1 = __importDefault(require("./kernel-transport"));
const input_view_1 = __importDefault(require("./input-view"));
const utils_1 = require("./utils");
class WSKernel extends kernel_transport_1.default {
    constructor(gatewayName, kernelSpec, grammar, session) {
        super(kernelSpec, grammar);
        this.session = session;
        this.gatewayName = gatewayName;
        this.session.statusChanged.connect(() => this.setExecutionState(this.session.status));
        this.setExecutionState(this.session.status);
    }
    interrupt() {
        this.session.kernel.interrupt();
    }
    async shutdown() {
        var _a, _b, _c;
        await ((_b = (_a = this.session) === null || _a === void 0 ? void 0 : _a.shutdown()) !== null && _b !== void 0 ? _b : (_c = this.session.kernel) === null || _c === void 0 ? void 0 : _c.shutdown());
    }
    restart(onRestarted) {
        const future = this.session.kernel.restart();
        future.then(() => {
            if (onRestarted) {
                onRestarted();
            }
        });
    }
    execute(code, onResults) {
        const future = this.session.kernel.requestExecute({
            code,
        });
        future.onIOPub = (message) => {
            utils_1.log("WSKernel: execute:", message);
            onResults(message, "iopub");
        };
        future.onReply = (message) => onResults(message, "shell");
        future.onStdin = (message) => onResults(message, "stdin");
    }
    complete(code, onResults) {
        this.session.kernel
            .requestComplete({
            code,
            cursor_pos: utils_1.js_idx_to_char_idx(code.length, code),
        })
            .then((message) => onResults(message, "shell"));
    }
    inspect(code, cursorPos, onResults) {
        this.session.kernel
            .requestInspect({
            code,
            cursor_pos: cursorPos,
            detail_level: 0,
        })
            .then((message) => onResults(message, "shell"));
    }
    inputReply(input) {
        this.session.kernel.sendInputReply({
            value: input,
        });
    }
    promptRename() {
        const view = new input_view_1.default({
            prompt: "Name your current session",
            defaultText: this.session.path,
            allowCancel: true,
        }, (input) => this.session.setPath(input));
        view.attach();
    }
    destroy() {
        utils_1.log("WSKernel: destroying jupyter-js-services Session");
        this.session.dispose();
        super.destroy();
    }
}
exports.default = WSKernel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3dzLWtlcm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLDBFQUFpRDtBQUVqRCw4REFBcUM7QUFDckMsbUNBQWtEO0FBS2xELE1BQXFCLFFBQVMsU0FBUSwwQkFBZTtJQUduRCxZQUNFLFdBQW1CLEVBQ25CLFVBQThCLEVBQzlCLE9BQWdCLEVBQ2hCLE9BQXlCO1FBRXpCLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUN0QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FDNUMsQ0FBQztRQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRCxTQUFTO1FBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFROztRQUVaLE1BQU0sQ0FBQyxNQUFBLE1BQUEsSUFBSSxDQUFDLE9BQU8sMENBQUUsUUFBUSxFQUFFLG1DQUFJLE1BQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLDBDQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVELE9BQU8sQ0FBQyxXQUE4RDtRQUNwRSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNmLElBQUksV0FBVyxFQUFFO2dCQUNmLFdBQVcsRUFBRSxDQUFDO2FBQ2Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQTBCO1FBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztZQUNoRCxJQUFJO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRTtZQUNwQyxXQUFHLENBQUMsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUM7UUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVuRSxNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsUUFBUSxDQUFDLElBQVksRUFBRSxTQUEwQjtRQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07YUFDaEIsZUFBZSxDQUFDO1lBQ2YsSUFBSTtZQUNKLFVBQVUsRUFBRSwwQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQztTQUNsRCxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsU0FBMEI7UUFDakUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO2FBQ2hCLGNBQWMsQ0FBQztZQUNkLElBQUk7WUFDSixVQUFVLEVBQUUsU0FBUztZQUNyQixZQUFZLEVBQUUsQ0FBQztTQUNoQixDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYTtRQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7WUFDakMsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsWUFBWTtRQUNWLE1BQU0sSUFBSSxHQUFHLElBQUksb0JBQVMsQ0FDeEI7WUFDRSxNQUFNLEVBQUUsMkJBQTJCO1lBQ25DLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUk7WUFDOUIsV0FBVyxFQUFFLElBQUk7U0FDbEIsRUFDRCxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQy9DLENBQUM7UUFDRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELE9BQU87UUFDTCxXQUFHLENBQUMsa0RBQWtELENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQixDQUFDO0NBQ0Y7QUE3RkQsMkJBNkZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XHJcbmltcG9ydCBLZXJuZWxUcmFuc3BvcnQgZnJvbSBcIi4va2VybmVsLXRyYW5zcG9ydFwiO1xyXG5pbXBvcnQgdHlwZSB7IFJlc3VsdHNDYWxsYmFjayB9IGZyb20gXCIuL2tlcm5lbC10cmFuc3BvcnRcIjtcclxuaW1wb3J0IElucHV0VmlldyBmcm9tIFwiLi9pbnB1dC12aWV3XCI7XHJcbmltcG9ydCB7IGxvZywganNfaWR4X3RvX2NoYXJfaWR4IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBTZXNzaW9uIH0gZnJvbSBcIkBqdXB5dGVybGFiL3NlcnZpY2VzXCI7XHJcbmltcG9ydCB0eXBlIHsgTWVzc2FnZSB9IGZyb20gXCIuL2h5ZHJvZ2VuXCI7XHJcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXU0tlcm5lbCBleHRlbmRzIEtlcm5lbFRyYW5zcG9ydCB7XHJcbiAgc2Vzc2lvbjogU2Vzc2lvbi5JU2Vzc2lvbjtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxyXG4gICAga2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhLFxyXG4gICAgZ3JhbW1hcjogR3JhbW1hcixcclxuICAgIHNlc3Npb246IFNlc3Npb24uSVNlc3Npb25cclxuICApIHtcclxuICAgIHN1cGVyKGtlcm5lbFNwZWMsIGdyYW1tYXIpO1xyXG4gICAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcclxuICAgIHRoaXMuZ2F0ZXdheU5hbWUgPSBnYXRld2F5TmFtZTtcclxuICAgIHRoaXMuc2Vzc2lvbi5zdGF0dXNDaGFuZ2VkLmNvbm5lY3QoKCkgPT5cclxuICAgICAgdGhpcy5zZXRFeGVjdXRpb25TdGF0ZSh0aGlzLnNlc3Npb24uc3RhdHVzKVxyXG4gICAgKTtcclxuICAgIHRoaXMuc2V0RXhlY3V0aW9uU3RhdGUodGhpcy5zZXNzaW9uLnN0YXR1cyk7IC8vIFNldCBpbml0aWFsIHN0YXR1cyBjb3JyZWN0bHlcclxuICB9XHJcblxyXG4gIGludGVycnVwdCgpIHtcclxuICAgIHRoaXMuc2Vzc2lvbi5rZXJuZWwuaW50ZXJydXB0KCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBzaHV0ZG93bigpIHtcclxuICAgIC8vIFRPRE8gJ3NodXRkb3duJyBkb2VzIG5vdCBleGlzdCBvbiB0eXBlICdJS2VybmVsQ29ubmVjdGlvbidcclxuICAgIGF3YWl0ICh0aGlzLnNlc3Npb24/LnNodXRkb3duKCkgPz8gdGhpcy5zZXNzaW9uLmtlcm5lbD8uc2h1dGRvd24oKSk7XHJcbiAgfVxyXG5cclxuICByZXN0YXJ0KG9uUmVzdGFydGVkOiAoKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkgfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcbiAgICBjb25zdCBmdXR1cmUgPSB0aGlzLnNlc3Npb24ua2VybmVsLnJlc3RhcnQoKTtcclxuICAgIGZ1dHVyZS50aGVuKCgpID0+IHtcclxuICAgICAgaWYgKG9uUmVzdGFydGVkKSB7XHJcbiAgICAgICAgb25SZXN0YXJ0ZWQoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBleGVjdXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcclxuICAgIGNvbnN0IGZ1dHVyZSA9IHRoaXMuc2Vzc2lvbi5rZXJuZWwucmVxdWVzdEV4ZWN1dGUoe1xyXG4gICAgICBjb2RlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgZnV0dXJlLm9uSU9QdWIgPSAobWVzc2FnZTogTWVzc2FnZSkgPT4ge1xyXG4gICAgICBsb2coXCJXU0tlcm5lbDogZXhlY3V0ZTpcIiwgbWVzc2FnZSk7XHJcbiAgICAgIG9uUmVzdWx0cyhtZXNzYWdlLCBcImlvcHViXCIpO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdXR1cmUub25SZXBseSA9IChtZXNzYWdlOiBNZXNzYWdlKSA9PiBvblJlc3VsdHMobWVzc2FnZSwgXCJzaGVsbFwiKTtcclxuXHJcbiAgICBmdXR1cmUub25TdGRpbiA9IChtZXNzYWdlOiBNZXNzYWdlKSA9PiBvblJlc3VsdHMobWVzc2FnZSwgXCJzdGRpblwiKTtcclxuICB9XHJcblxyXG4gIGNvbXBsZXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcclxuICAgIHRoaXMuc2Vzc2lvbi5rZXJuZWxcclxuICAgICAgLnJlcXVlc3RDb21wbGV0ZSh7XHJcbiAgICAgICAgY29kZSxcclxuICAgICAgICBjdXJzb3JfcG9zOiBqc19pZHhfdG9fY2hhcl9pZHgoY29kZS5sZW5ndGgsIGNvZGUpLFxyXG4gICAgICB9KVxyXG4gICAgICAudGhlbigobWVzc2FnZTogTWVzc2FnZSkgPT4gb25SZXN1bHRzKG1lc3NhZ2UsIFwic2hlbGxcIikpO1xyXG4gIH1cclxuXHJcbiAgaW5zcGVjdChjb2RlOiBzdHJpbmcsIGN1cnNvclBvczogbnVtYmVyLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xyXG4gICAgdGhpcy5zZXNzaW9uLmtlcm5lbFxyXG4gICAgICAucmVxdWVzdEluc3BlY3Qoe1xyXG4gICAgICAgIGNvZGUsXHJcbiAgICAgICAgY3Vyc29yX3BvczogY3Vyc29yUG9zLFxyXG4gICAgICAgIGRldGFpbF9sZXZlbDogMCxcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oKG1lc3NhZ2U6IE1lc3NhZ2UpID0+IG9uUmVzdWx0cyhtZXNzYWdlLCBcInNoZWxsXCIpKTtcclxuICB9XHJcblxyXG4gIGlucHV0UmVwbHkoaW5wdXQ6IHN0cmluZykge1xyXG4gICAgdGhpcy5zZXNzaW9uLmtlcm5lbC5zZW5kSW5wdXRSZXBseSh7XHJcbiAgICAgIHZhbHVlOiBpbnB1dCxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJvbXB0UmVuYW1lKCkge1xyXG4gICAgY29uc3QgdmlldyA9IG5ldyBJbnB1dFZpZXcoXHJcbiAgICAgIHtcclxuICAgICAgICBwcm9tcHQ6IFwiTmFtZSB5b3VyIGN1cnJlbnQgc2Vzc2lvblwiLFxyXG4gICAgICAgIGRlZmF1bHRUZXh0OiB0aGlzLnNlc3Npb24ucGF0aCxcclxuICAgICAgICBhbGxvd0NhbmNlbDogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgICAgKGlucHV0OiBzdHJpbmcpID0+IHRoaXMuc2Vzc2lvbi5zZXRQYXRoKGlucHV0KVxyXG4gICAgKTtcclxuICAgIHZpZXcuYXR0YWNoKCk7XHJcbiAgfVxyXG5cclxuICBkZXN0cm95KCkge1xyXG4gICAgbG9nKFwiV1NLZXJuZWw6IGRlc3Ryb3lpbmcganVweXRlci1qcy1zZXJ2aWNlcyBTZXNzaW9uXCIpO1xyXG4gICAgdGhpcy5zZXNzaW9uLmRpc3Bvc2UoKTtcclxuICAgIHN1cGVyLmRlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIl19