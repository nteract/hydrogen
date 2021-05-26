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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3dzLWtlcm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLDBFQUFpRDtBQUVqRCw4REFBcUM7QUFDckMsbUNBQWtEO0FBS2xELE1BQXFCLFFBQVMsU0FBUSwwQkFBZTtJQUduRCxZQUNFLFdBQW1CLEVBQ25CLFVBQWtELEVBQ2xELE9BQWdCLEVBQ2hCLE9BQXlCO1FBRXpCLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUN0QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FDNUMsQ0FBQztRQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRCxTQUFTO1FBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFROztRQUVaLE1BQU0sQ0FBQyxNQUFBLE1BQUEsSUFBSSxDQUFDLE9BQU8sMENBQUUsUUFBUSxFQUFFLG1DQUFJLE1BQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLDBDQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVELE9BQU8sQ0FBQyxXQUEwQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNmLElBQUksV0FBVyxFQUFFO2dCQUNmLFdBQVcsRUFBRSxDQUFDO2FBQ2Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQTBCO1FBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztZQUNoRCxJQUFJO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRTtZQUNwQyxXQUFHLENBQUMsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUM7UUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVuRSxNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsUUFBUSxDQUFDLElBQVksRUFBRSxTQUEwQjtRQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07YUFDaEIsZUFBZSxDQUFDO1lBQ2YsSUFBSTtZQUNKLFVBQVUsRUFBRSwwQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQztTQUNsRCxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsU0FBMEI7UUFDakUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO2FBQ2hCLGNBQWMsQ0FBQztZQUNkLElBQUk7WUFDSixVQUFVLEVBQUUsU0FBUztZQUNyQixZQUFZLEVBQUUsQ0FBQztTQUNoQixDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYTtRQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7WUFDakMsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsWUFBWTtRQUNWLE1BQU0sSUFBSSxHQUFHLElBQUksb0JBQVMsQ0FDeEI7WUFDRSxNQUFNLEVBQUUsMkJBQTJCO1lBQ25DLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUk7WUFDOUIsV0FBVyxFQUFFLElBQUk7U0FDbEIsRUFDRCxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQy9DLENBQUM7UUFDRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELE9BQU87UUFDTCxXQUFHLENBQUMsa0RBQWtELENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQixDQUFDO0NBQ0Y7QUE3RkQsMkJBNkZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgS2VybmVsVHJhbnNwb3J0IGZyb20gXCIuL2tlcm5lbC10cmFuc3BvcnRcIjtcbmltcG9ydCB0eXBlIHsgUmVzdWx0c0NhbGxiYWNrIH0gZnJvbSBcIi4va2VybmVsLXRyYW5zcG9ydFwiO1xuaW1wb3J0IElucHV0VmlldyBmcm9tIFwiLi9pbnB1dC12aWV3XCI7XG5pbXBvcnQgeyBsb2csIGpzX2lkeF90b19jaGFyX2lkeCB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb24sIEtlcm5lbCB9IGZyb20gXCJAanVweXRlcmxhYi9zZXJ2aWNlc1wiO1xuaW1wb3J0IHR5cGUgeyBNZXNzYWdlIH0gZnJvbSBcIi4vaHlkcm9nZW5cIjtcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdTS2VybmVsIGV4dGVuZHMgS2VybmVsVHJhbnNwb3J0IHtcbiAgc2Vzc2lvbjogU2Vzc2lvbi5JU2Vzc2lvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxuICAgIGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsIHwgS2VybmVsc3BlY01ldGFkYXRhLFxuICAgIGdyYW1tYXI6IEdyYW1tYXIsXG4gICAgc2Vzc2lvbjogU2Vzc2lvbi5JU2Vzc2lvblxuICApIHtcbiAgICBzdXBlcihrZXJuZWxTcGVjLCBncmFtbWFyKTtcbiAgICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICAgIHRoaXMuZ2F0ZXdheU5hbWUgPSBnYXRld2F5TmFtZTtcbiAgICB0aGlzLnNlc3Npb24uc3RhdHVzQ2hhbmdlZC5jb25uZWN0KCgpID0+XG4gICAgICB0aGlzLnNldEV4ZWN1dGlvblN0YXRlKHRoaXMuc2Vzc2lvbi5zdGF0dXMpXG4gICAgKTtcbiAgICB0aGlzLnNldEV4ZWN1dGlvblN0YXRlKHRoaXMuc2Vzc2lvbi5zdGF0dXMpOyAvLyBTZXQgaW5pdGlhbCBzdGF0dXMgY29ycmVjdGx5XG4gIH1cblxuICBpbnRlcnJ1cHQoKSB7XG4gICAgdGhpcy5zZXNzaW9uLmtlcm5lbC5pbnRlcnJ1cHQoKTtcbiAgfVxuXG4gIGFzeW5jIHNodXRkb3duKCkge1xuICAgIC8vIFRPRE8gJ3NodXRkb3duJyBkb2VzIG5vdCBleGlzdCBvbiB0eXBlICdJS2VybmVsQ29ubmVjdGlvbidcbiAgICBhd2FpdCAodGhpcy5zZXNzaW9uPy5zaHV0ZG93bigpID8/IHRoaXMuc2Vzc2lvbi5rZXJuZWw/LnNodXRkb3duKCkpO1xuICB9XG5cbiAgcmVzdGFydChvblJlc3RhcnRlZDogKCkgPT4gdm9pZCB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBmdXR1cmUgPSB0aGlzLnNlc3Npb24ua2VybmVsLnJlc3RhcnQoKTtcbiAgICBmdXR1cmUudGhlbigoKSA9PiB7XG4gICAgICBpZiAob25SZXN0YXJ0ZWQpIHtcbiAgICAgICAgb25SZXN0YXJ0ZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGV4ZWN1dGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xuICAgIGNvbnN0IGZ1dHVyZSA9IHRoaXMuc2Vzc2lvbi5rZXJuZWwucmVxdWVzdEV4ZWN1dGUoe1xuICAgICAgY29kZSxcbiAgICB9KTtcblxuICAgIGZ1dHVyZS5vbklPUHViID0gKG1lc3NhZ2U6IE1lc3NhZ2UpID0+IHtcbiAgICAgIGxvZyhcIldTS2VybmVsOiBleGVjdXRlOlwiLCBtZXNzYWdlKTtcbiAgICAgIG9uUmVzdWx0cyhtZXNzYWdlLCBcImlvcHViXCIpO1xuICAgIH07XG5cbiAgICBmdXR1cmUub25SZXBseSA9IChtZXNzYWdlOiBNZXNzYWdlKSA9PiBvblJlc3VsdHMobWVzc2FnZSwgXCJzaGVsbFwiKTtcblxuICAgIGZ1dHVyZS5vblN0ZGluID0gKG1lc3NhZ2U6IE1lc3NhZ2UpID0+IG9uUmVzdWx0cyhtZXNzYWdlLCBcInN0ZGluXCIpO1xuICB9XG5cbiAgY29tcGxldGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xuICAgIHRoaXMuc2Vzc2lvbi5rZXJuZWxcbiAgICAgIC5yZXF1ZXN0Q29tcGxldGUoe1xuICAgICAgICBjb2RlLFxuICAgICAgICBjdXJzb3JfcG9zOiBqc19pZHhfdG9fY2hhcl9pZHgoY29kZS5sZW5ndGgsIGNvZGUpLFxuICAgICAgfSlcbiAgICAgIC50aGVuKChtZXNzYWdlOiBNZXNzYWdlKSA9PiBvblJlc3VsdHMobWVzc2FnZSwgXCJzaGVsbFwiKSk7XG4gIH1cblxuICBpbnNwZWN0KGNvZGU6IHN0cmluZywgY3Vyc29yUG9zOiBudW1iZXIsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKSB7XG4gICAgdGhpcy5zZXNzaW9uLmtlcm5lbFxuICAgICAgLnJlcXVlc3RJbnNwZWN0KHtcbiAgICAgICAgY29kZSxcbiAgICAgICAgY3Vyc29yX3BvczogY3Vyc29yUG9zLFxuICAgICAgICBkZXRhaWxfbGV2ZWw6IDAsXG4gICAgICB9KVxuICAgICAgLnRoZW4oKG1lc3NhZ2U6IE1lc3NhZ2UpID0+IG9uUmVzdWx0cyhtZXNzYWdlLCBcInNoZWxsXCIpKTtcbiAgfVxuXG4gIGlucHV0UmVwbHkoaW5wdXQ6IHN0cmluZykge1xuICAgIHRoaXMuc2Vzc2lvbi5rZXJuZWwuc2VuZElucHV0UmVwbHkoe1xuICAgICAgdmFsdWU6IGlucHV0LFxuICAgIH0pO1xuICB9XG5cbiAgcHJvbXB0UmVuYW1lKCkge1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgSW5wdXRWaWV3KFxuICAgICAge1xuICAgICAgICBwcm9tcHQ6IFwiTmFtZSB5b3VyIGN1cnJlbnQgc2Vzc2lvblwiLFxuICAgICAgICBkZWZhdWx0VGV4dDogdGhpcy5zZXNzaW9uLnBhdGgsXG4gICAgICAgIGFsbG93Q2FuY2VsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIChpbnB1dDogc3RyaW5nKSA9PiB0aGlzLnNlc3Npb24uc2V0UGF0aChpbnB1dClcbiAgICApO1xuICAgIHZpZXcuYXR0YWNoKCk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGxvZyhcIldTS2VybmVsOiBkZXN0cm95aW5nIGp1cHl0ZXItanMtc2VydmljZXMgU2Vzc2lvblwiKTtcbiAgICB0aGlzLnNlc3Npb24uZGlzcG9zZSgpO1xuICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgfVxufVxuIl19