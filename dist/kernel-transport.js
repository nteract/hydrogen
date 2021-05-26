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
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const utils_1 = require("./utils");
class KernelTransport {
    constructor(kernelSpec, grammar) {
        this.executionState = "loading";
        this.executionCount = 0;
        this.lastExecutionTime = "No execution";
        this.inspector = {
            bundle: {},
        };
        this.kernelSpec = kernelSpec;
        this.grammar = grammar;
        this.language = kernelSpec.language.toLowerCase();
        this.displayName = kernelSpec.display_name;
    }
    setExecutionState(state) {
        this.executionState = state;
    }
    setExecutionCount(count) {
        this.executionCount = count;
    }
    setLastExecutionTime(timeString) {
        this.lastExecutionTime = timeString;
    }
    interrupt() {
        throw new Error("KernelTransport: interrupt method not implemented");
    }
    shutdown() {
        throw new Error("KernelTransport: shutdown method not implemented");
    }
    restart(onRestarted) {
        throw new Error("KernelTransport: restart method not implemented");
    }
    execute(code, onResults) {
        throw new Error("KernelTransport: execute method not implemented");
    }
    complete(code, onResults) {
        throw new Error("KernelTransport: complete method not implemented");
    }
    inspect(code, cursorPos, onResults) {
        throw new Error("KernelTransport: inspect method not implemented");
    }
    inputReply(input) {
        throw new Error("KernelTransport: inputReply method not implemented");
    }
    destroy() {
        utils_1.log("KernelTransport: Destroying base kernel");
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], KernelTransport.prototype, "executionState", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], KernelTransport.prototype, "executionCount", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], KernelTransport.prototype, "lastExecutionTime", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], KernelTransport.prototype, "inspector", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KernelTransport.prototype, "setExecutionState", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], KernelTransport.prototype, "setExecutionCount", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KernelTransport.prototype, "setLastExecutionTime", null);
exports.default = KernelTransport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLXRyYW5zcG9ydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9rZXJuZWwtdHJhbnNwb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0EsK0JBQTBDO0FBQzFDLG1DQUE4QjtBQVE5QixNQUFxQixlQUFlO0lBbUJsQyxZQUNFLFVBQWtELEVBQ2xELE9BQWdCO1FBbkJsQixtQkFBYyxHQUFHLFNBQVMsQ0FBQztRQUUzQixtQkFBYyxHQUFHLENBQUMsQ0FBQztRQUVuQixzQkFBaUIsR0FBRyxjQUFjLENBQUM7UUFFbkMsY0FBUyxHQUFHO1lBQ1YsTUFBTSxFQUFFLEVBQUU7U0FDWCxDQUFDO1FBYUEsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2xELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztJQUM3QyxDQUFDO0lBR0QsaUJBQWlCLENBQUMsS0FBYTtRQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBR0QsaUJBQWlCLENBQUMsS0FBYTtRQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBR0Qsb0JBQW9CLENBQUMsVUFBa0I7UUFDckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztJQUN0QyxDQUFDO0lBRUQsU0FBUztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsbURBQW1ELENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQsUUFBUTtRQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsT0FBTyxDQUFDLFdBQThEO1FBQ3BFLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQVksRUFBRSxTQUEwQjtRQUM5QyxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZLEVBQUUsU0FBMEI7UUFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsU0FBMEI7UUFDakUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYTtRQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELE9BQU87UUFDTCxXQUFHLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUNqRCxDQUFDO0NBQ0Y7QUF6RUM7SUFEQyxpQkFBVTs7dURBQ2dCO0FBRTNCO0lBREMsaUJBQVU7O3VEQUNRO0FBRW5CO0lBREMsaUJBQVU7OzBEQUN3QjtBQUVuQztJQURDLGlCQUFVOztrREFHVDtBQW9CRjtJQURDLGFBQU07Ozs7d0RBR047QUFHRDtJQURDLGFBQU07Ozs7d0RBR047QUFHRDtJQURDLGFBQU07Ozs7MkRBR047QUExQ0gsa0NBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgeyBvYnNlcnZhYmxlLCBhY3Rpb24gfSBmcm9tIFwibW9ieFwiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEtlcm5lbCB9IGZyb20gXCJAanVweXRlcmxhYi9zZXJ2aWNlc1wiO1xuXG5leHBvcnQgdHlwZSBSZXN1bHRzQ2FsbGJhY2sgPSAoXG4gIG1lc3NhZ2U6IGFueSxcbiAgY2hhbm5lbDogXCJzaGVsbFwiIHwgXCJpb3B1YlwiIHwgXCJzdGRpblwiXG4pID0+IHZvaWQ7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBLZXJuZWxUcmFuc3BvcnQge1xuICBAb2JzZXJ2YWJsZVxuICBleGVjdXRpb25TdGF0ZSA9IFwibG9hZGluZ1wiO1xuICBAb2JzZXJ2YWJsZVxuICBleGVjdXRpb25Db3VudCA9IDA7XG4gIEBvYnNlcnZhYmxlXG4gIGxhc3RFeGVjdXRpb25UaW1lID0gXCJObyBleGVjdXRpb25cIjtcbiAgQG9ic2VydmFibGVcbiAgaW5zcGVjdG9yID0ge1xuICAgIGJ1bmRsZToge30sXG4gIH07XG4gIGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsIHwgS2VybmVsc3BlY01ldGFkYXRhO1xuICBncmFtbWFyOiBHcmFtbWFyO1xuICBsYW5ndWFnZTogc3RyaW5nO1xuICBkaXNwbGF5TmFtZTogc3RyaW5nO1xuICAvLyBPbmx5IGBXU0tlcm5lbGAgd291bGQgaGF2ZSBgZ2F0ZXdheU5hbWVgIHByb3BlcnR5IGFuZCB0aHVzIG5vdCBpbml0aWFsaXplIGl0IGhlcmUsXG4gIC8vIHN0aWxsIGBLZXJuZWxUcmFuc3BvcnRgIGlzIGJldHRlciB0byBoYXZlIGBnYXRld2F5TmFtZWAgcHJvcGVydHkgZm9yIGNvZGUgc2ltcGxpY2l0eSBpbiB0aGUgb3RoZXIgcGFydHMgb2YgY29kZVxuICBnYXRld2F5TmFtZTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBrZXJuZWxTcGVjOiBLZXJuZWwuSVNwZWNNb2RlbCB8IEtlcm5lbHNwZWNNZXRhZGF0YSxcbiAgICBncmFtbWFyOiBHcmFtbWFyXG4gICkge1xuICAgIHRoaXMua2VybmVsU3BlYyA9IGtlcm5lbFNwZWM7XG4gICAgdGhpcy5ncmFtbWFyID0gZ3JhbW1hcjtcbiAgICB0aGlzLmxhbmd1YWdlID0ga2VybmVsU3BlYy5sYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMuZGlzcGxheU5hbWUgPSBrZXJuZWxTcGVjLmRpc3BsYXlfbmFtZTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgc2V0RXhlY3V0aW9uU3RhdGUoc3RhdGU6IHN0cmluZykge1xuICAgIHRoaXMuZXhlY3V0aW9uU3RhdGUgPSBzdGF0ZTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgc2V0RXhlY3V0aW9uQ291bnQoY291bnQ6IG51bWJlcikge1xuICAgIHRoaXMuZXhlY3V0aW9uQ291bnQgPSBjb3VudDtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgc2V0TGFzdEV4ZWN1dGlvblRpbWUodGltZVN0cmluZzogc3RyaW5nKSB7XG4gICAgdGhpcy5sYXN0RXhlY3V0aW9uVGltZSA9IHRpbWVTdHJpbmc7XG4gIH1cblxuICBpbnRlcnJ1cHQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBpbnRlcnJ1cHQgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIHNodXRkb3duKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogc2h1dGRvd24gbWV0aG9kIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIHJlc3RhcnQob25SZXN0YXJ0ZWQ6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJLZXJuZWxUcmFuc3BvcnQ6IHJlc3RhcnQgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGV4ZWN1dGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogZXhlY3V0ZSBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgY29tcGxldGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogY29tcGxldGUgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGluc3BlY3QoY29kZTogc3RyaW5nLCBjdXJzb3JQb3M6IG51bWJlciwgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJLZXJuZWxUcmFuc3BvcnQ6IGluc3BlY3QgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGlucHV0UmVwbHkoaW5wdXQ6IHN0cmluZykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogaW5wdXRSZXBseSBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBsb2coXCJLZXJuZWxUcmFuc3BvcnQ6IERlc3Ryb3lpbmcgYmFzZSBrZXJuZWxcIik7XG4gIH1cbn1cbiJdfQ==