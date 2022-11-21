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
        var _a;
        await ((_a = this.session.shutdown()) !== null && _a !== void 0 ? _a : this.session.kernel.shutdown());
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
            (0, utils_1.log)("WSKernel: execute:", message);
            onResults(message, "iopub");
        };
        future.onReply = (message) => onResults(message, "shell");
        future.onStdin = (message) => onResults(message, "stdin");
    }
    complete(code, onResults) {
        this.session.kernel
            .requestComplete({
            code,
            cursor_pos: (0, utils_1.js_idx_to_char_idx)(code.length, code),
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
        (0, utils_1.log)("WSKernel: destroying jupyter-js-services Session");
        this.session.dispose();
        super.destroy();
    }
}
exports.default = WSKernel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3dzLWtlcm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLDBFQUFpRDtBQUVqRCw4REFBcUM7QUFDckMsbUNBQWtEO0FBS2xELE1BQXFCLFFBQVMsU0FBUSwwQkFBZTtJQUduRCxZQUNFLFdBQW1CLEVBQ25CLFVBQWtELEVBQ2xELE9BQWdCLEVBQ2hCLE9BQXlCO1FBRXpCLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUN0QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FDNUMsQ0FBQztRQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRCxTQUFTO1FBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFROztRQUVaLE1BQU0sQ0FBQyxNQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLG1DQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVELE9BQU8sQ0FBQyxXQUEwQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNmLElBQUksV0FBVyxFQUFFO2dCQUNmLFdBQVcsRUFBRSxDQUFDO2FBQ2Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQTBCO1FBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztZQUNoRCxJQUFJO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRTtZQUNwQyxJQUFBLFdBQUcsRUFBQyxvQkFBb0IsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuQyxTQUFTLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQztRQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxPQUFnQixFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRW5FLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxPQUFnQixFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxRQUFRLENBQUMsSUFBWSxFQUFFLFNBQTBCO1FBQy9DLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTthQUNoQixlQUFlLENBQUM7WUFDZixJQUFJO1lBQ0osVUFBVSxFQUFFLElBQUEsMEJBQWtCLEVBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUM7U0FDbEQsQ0FBQzthQUNELElBQUksQ0FBQyxDQUFDLE9BQWdCLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQVksRUFBRSxTQUFpQixFQUFFLFNBQTBCO1FBQ2pFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTthQUNoQixjQUFjLENBQUM7WUFDZCxJQUFJO1lBQ0osVUFBVSxFQUFFLFNBQVM7WUFDckIsWUFBWSxFQUFFLENBQUM7U0FDaEIsQ0FBQzthQUNELElBQUksQ0FBQyxDQUFDLE9BQWdCLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWE7UUFDdEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO1lBQ2pDLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELFlBQVk7UUFDVixNQUFNLElBQUksR0FBRyxJQUFJLG9CQUFTLENBQ3hCO1lBQ0UsTUFBTSxFQUFFLDJCQUEyQjtZQUNuQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJO1lBQzlCLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLEVBQ0QsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUMvQyxDQUFDO1FBQ0YsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBQSxXQUFHLEVBQUMsa0RBQWtELENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQixDQUFDO0NBQ0Y7QUE3RkQsMkJBNkZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgS2VybmVsVHJhbnNwb3J0IGZyb20gXCIuL2tlcm5lbC10cmFuc3BvcnRcIjtcbmltcG9ydCB0eXBlIHsgUmVzdWx0c0NhbGxiYWNrIH0gZnJvbSBcIi4va2VybmVsLXRyYW5zcG9ydFwiO1xuaW1wb3J0IElucHV0VmlldyBmcm9tIFwiLi9pbnB1dC12aWV3XCI7XG5pbXBvcnQgeyBsb2csIGpzX2lkeF90b19jaGFyX2lkeCB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb24sIEtlcm5lbCB9IGZyb20gXCJAanVweXRlcmxhYi9zZXJ2aWNlc1wiO1xuaW1wb3J0IHR5cGUgeyBNZXNzYWdlIH0gZnJvbSBcIi4vaHlkcm9nZW5cIjtcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdTS2VybmVsIGV4dGVuZHMgS2VybmVsVHJhbnNwb3J0IHtcbiAgc2Vzc2lvbjogU2Vzc2lvbi5JU2Vzc2lvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxuICAgIGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsIHwgS2VybmVsc3BlY01ldGFkYXRhLFxuICAgIGdyYW1tYXI6IEdyYW1tYXIsXG4gICAgc2Vzc2lvbjogU2Vzc2lvbi5JU2Vzc2lvblxuICApIHtcbiAgICBzdXBlcihrZXJuZWxTcGVjLCBncmFtbWFyKTtcbiAgICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICAgIHRoaXMuZ2F0ZXdheU5hbWUgPSBnYXRld2F5TmFtZTtcbiAgICB0aGlzLnNlc3Npb24uc3RhdHVzQ2hhbmdlZC5jb25uZWN0KCgpID0+XG4gICAgICB0aGlzLnNldEV4ZWN1dGlvblN0YXRlKHRoaXMuc2Vzc2lvbi5zdGF0dXMpXG4gICAgKTtcbiAgICB0aGlzLnNldEV4ZWN1dGlvblN0YXRlKHRoaXMuc2Vzc2lvbi5zdGF0dXMpOyAvLyBTZXQgaW5pdGlhbCBzdGF0dXMgY29ycmVjdGx5XG4gIH1cblxuICBpbnRlcnJ1cHQoKSB7XG4gICAgdGhpcy5zZXNzaW9uLmtlcm5lbC5pbnRlcnJ1cHQoKTtcbiAgfVxuXG4gIGFzeW5jIHNodXRkb3duKCkge1xuICAgIC8vIFRPRE8gJ3NodXRkb3duJyBkb2VzIG5vdCBleGlzdCBvbiB0eXBlICdJS2VybmVsQ29ubmVjdGlvbidcbiAgICBhd2FpdCAodGhpcy5zZXNzaW9uLnNodXRkb3duKCkgPz8gdGhpcy5zZXNzaW9uLmtlcm5lbC5zaHV0ZG93bigpKTtcbiAgfVxuXG4gIHJlc3RhcnQob25SZXN0YXJ0ZWQ6ICgpID0+IHZvaWQgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgZnV0dXJlID0gdGhpcy5zZXNzaW9uLmtlcm5lbC5yZXN0YXJ0KCk7XG4gICAgZnV0dXJlLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKG9uUmVzdGFydGVkKSB7XG4gICAgICAgIG9uUmVzdGFydGVkKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBleGVjdXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcbiAgICBjb25zdCBmdXR1cmUgPSB0aGlzLnNlc3Npb24ua2VybmVsLnJlcXVlc3RFeGVjdXRlKHtcbiAgICAgIGNvZGUsXG4gICAgfSk7XG5cbiAgICBmdXR1cmUub25JT1B1YiA9IChtZXNzYWdlOiBNZXNzYWdlKSA9PiB7XG4gICAgICBsb2coXCJXU0tlcm5lbDogZXhlY3V0ZTpcIiwgbWVzc2FnZSk7XG4gICAgICBvblJlc3VsdHMobWVzc2FnZSwgXCJpb3B1YlwiKTtcbiAgICB9O1xuXG4gICAgZnV0dXJlLm9uUmVwbHkgPSAobWVzc2FnZTogTWVzc2FnZSkgPT4gb25SZXN1bHRzKG1lc3NhZ2UsIFwic2hlbGxcIik7XG5cbiAgICBmdXR1cmUub25TdGRpbiA9IChtZXNzYWdlOiBNZXNzYWdlKSA9PiBvblJlc3VsdHMobWVzc2FnZSwgXCJzdGRpblwiKTtcbiAgfVxuXG4gIGNvbXBsZXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcbiAgICB0aGlzLnNlc3Npb24ua2VybmVsXG4gICAgICAucmVxdWVzdENvbXBsZXRlKHtcbiAgICAgICAgY29kZSxcbiAgICAgICAgY3Vyc29yX3BvczoganNfaWR4X3RvX2NoYXJfaWR4KGNvZGUubGVuZ3RoLCBjb2RlKSxcbiAgICAgIH0pXG4gICAgICAudGhlbigobWVzc2FnZTogTWVzc2FnZSkgPT4gb25SZXN1bHRzKG1lc3NhZ2UsIFwic2hlbGxcIikpO1xuICB9XG5cbiAgaW5zcGVjdChjb2RlOiBzdHJpbmcsIGN1cnNvclBvczogbnVtYmVyLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xuICAgIHRoaXMuc2Vzc2lvbi5rZXJuZWxcbiAgICAgIC5yZXF1ZXN0SW5zcGVjdCh7XG4gICAgICAgIGNvZGUsXG4gICAgICAgIGN1cnNvcl9wb3M6IGN1cnNvclBvcyxcbiAgICAgICAgZGV0YWlsX2xldmVsOiAwLFxuICAgICAgfSlcbiAgICAgIC50aGVuKChtZXNzYWdlOiBNZXNzYWdlKSA9PiBvblJlc3VsdHMobWVzc2FnZSwgXCJzaGVsbFwiKSk7XG4gIH1cblxuICBpbnB1dFJlcGx5KGlucHV0OiBzdHJpbmcpIHtcbiAgICB0aGlzLnNlc3Npb24ua2VybmVsLnNlbmRJbnB1dFJlcGx5KHtcbiAgICAgIHZhbHVlOiBpbnB1dCxcbiAgICB9KTtcbiAgfVxuXG4gIHByb21wdFJlbmFtZSgpIHtcbiAgICBjb25zdCB2aWV3ID0gbmV3IElucHV0VmlldyhcbiAgICAgIHtcbiAgICAgICAgcHJvbXB0OiBcIk5hbWUgeW91ciBjdXJyZW50IHNlc3Npb25cIixcbiAgICAgICAgZGVmYXVsdFRleHQ6IHRoaXMuc2Vzc2lvbi5wYXRoLFxuICAgICAgICBhbGxvd0NhbmNlbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAoaW5wdXQ6IHN0cmluZykgPT4gdGhpcy5zZXNzaW9uLnNldFBhdGgoaW5wdXQpXG4gICAgKTtcbiAgICB2aWV3LmF0dGFjaCgpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBsb2coXCJXU0tlcm5lbDogZGVzdHJveWluZyBqdXB5dGVyLWpzLXNlcnZpY2VzIFNlc3Npb25cIik7XG4gICAgdGhpcy5zZXNzaW9uLmRpc3Bvc2UoKTtcbiAgICBzdXBlci5kZXN0cm95KCk7XG4gIH1cbn1cbiJdfQ==