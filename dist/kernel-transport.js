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
        (0, utils_1.log)("KernelTransport: Destroying base kernel");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLXRyYW5zcG9ydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9rZXJuZWwtdHJhbnNwb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0EsK0JBQTBDO0FBQzFDLG1DQUE4QjtBQVE5QixNQUFxQixlQUFlO0lBbUJsQyxZQUNFLFVBQWtELEVBQ2xELE9BQWdCO1FBbkJsQixtQkFBYyxHQUFHLFNBQVMsQ0FBQztRQUUzQixtQkFBYyxHQUFHLENBQUMsQ0FBQztRQUVuQixzQkFBaUIsR0FBRyxjQUFjLENBQUM7UUFFbkMsY0FBUyxHQUFHO1lBQ1YsTUFBTSxFQUFFLEVBQUU7U0FDWCxDQUFDO1FBYUEsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2xELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztJQUM3QyxDQUFDO0lBR0QsaUJBQWlCLENBQUMsS0FBYTtRQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBR0QsaUJBQWlCLENBQUMsS0FBYTtRQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBR0Qsb0JBQW9CLENBQUMsVUFBa0I7UUFDckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztJQUN0QyxDQUFDO0lBRUQsU0FBUztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsbURBQW1ELENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQsUUFBUTtRQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsT0FBTyxDQUFDLFdBQThEO1FBQ3BFLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQVksRUFBRSxTQUEwQjtRQUM5QyxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZLEVBQUUsU0FBMEI7UUFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsU0FBMEI7UUFDakUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYTtRQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFBLFdBQUcsRUFBQyx5Q0FBeUMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRjtBQTFFQztJQUFDLGlCQUFVOzt1REFDZ0I7QUFDM0I7SUFBQyxpQkFBVTs7dURBQ1E7QUFDbkI7SUFBQyxpQkFBVTs7MERBQ3dCO0FBQ25DO0lBQUMsaUJBQVU7O2tEQUdUO0FBbUJGO0lBQUMsYUFBTTs7Ozt3REFHTjtBQUVEO0lBQUMsYUFBTTs7Ozt3REFHTjtBQUVEO0lBQUMsYUFBTTs7OzsyREFHTjtBQTFDSCxrQ0EyRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBHcmFtbWFyIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IG9ic2VydmFibGUsIGFjdGlvbiB9IGZyb20gXCJtb2J4XCI7XG5pbXBvcnQgeyBsb2cgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgS2VybmVsIH0gZnJvbSBcIkBqdXB5dGVybGFiL3NlcnZpY2VzXCI7XG5cbmV4cG9ydCB0eXBlIFJlc3VsdHNDYWxsYmFjayA9IChcbiAgbWVzc2FnZTogYW55LFxuICBjaGFubmVsOiBcInNoZWxsXCIgfCBcImlvcHViXCIgfCBcInN0ZGluXCJcbikgPT4gdm9pZDtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEtlcm5lbFRyYW5zcG9ydCB7XG4gIEBvYnNlcnZhYmxlXG4gIGV4ZWN1dGlvblN0YXRlID0gXCJsb2FkaW5nXCI7XG4gIEBvYnNlcnZhYmxlXG4gIGV4ZWN1dGlvbkNvdW50ID0gMDtcbiAgQG9ic2VydmFibGVcbiAgbGFzdEV4ZWN1dGlvblRpbWUgPSBcIk5vIGV4ZWN1dGlvblwiO1xuICBAb2JzZXJ2YWJsZVxuICBpbnNwZWN0b3IgPSB7XG4gICAgYnVuZGxlOiB7fSxcbiAgfTtcbiAga2VybmVsU3BlYzogS2VybmVsLklTcGVjTW9kZWwgfCBLZXJuZWxzcGVjTWV0YWRhdGE7XG4gIGdyYW1tYXI6IEdyYW1tYXI7XG4gIGxhbmd1YWdlOiBzdHJpbmc7XG4gIGRpc3BsYXlOYW1lOiBzdHJpbmc7XG4gIC8vIE9ubHkgYFdTS2VybmVsYCB3b3VsZCBoYXZlIGBnYXRld2F5TmFtZWAgcHJvcGVydHkgYW5kIHRodXMgbm90IGluaXRpYWxpemUgaXQgaGVyZSxcbiAgLy8gc3RpbGwgYEtlcm5lbFRyYW5zcG9ydGAgaXMgYmV0dGVyIHRvIGhhdmUgYGdhdGV3YXlOYW1lYCBwcm9wZXJ0eSBmb3IgY29kZSBzaW1wbGljaXR5IGluIHRoZSBvdGhlciBwYXJ0cyBvZiBjb2RlXG4gIGdhdGV3YXlOYW1lOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsIHwgS2VybmVsc3BlY01ldGFkYXRhLFxuICAgIGdyYW1tYXI6IEdyYW1tYXJcbiAgKSB7XG4gICAgdGhpcy5rZXJuZWxTcGVjID0ga2VybmVsU3BlYztcbiAgICB0aGlzLmdyYW1tYXIgPSBncmFtbWFyO1xuICAgIHRoaXMubGFuZ3VhZ2UgPSBrZXJuZWxTcGVjLmxhbmd1YWdlLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5kaXNwbGF5TmFtZSA9IGtlcm5lbFNwZWMuZGlzcGxheV9uYW1lO1xuICB9XG5cbiAgQGFjdGlvblxuICBzZXRFeGVjdXRpb25TdGF0ZShzdGF0ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5leGVjdXRpb25TdGF0ZSA9IHN0YXRlO1xuICB9XG5cbiAgQGFjdGlvblxuICBzZXRFeGVjdXRpb25Db3VudChjb3VudDogbnVtYmVyKSB7XG4gICAgdGhpcy5leGVjdXRpb25Db3VudCA9IGNvdW50O1xuICB9XG5cbiAgQGFjdGlvblxuICBzZXRMYXN0RXhlY3V0aW9uVGltZSh0aW1lU3RyaW5nOiBzdHJpbmcpIHtcbiAgICB0aGlzLmxhc3RFeGVjdXRpb25UaW1lID0gdGltZVN0cmluZztcbiAgfVxuXG4gIGludGVycnVwdCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJLZXJuZWxUcmFuc3BvcnQ6IGludGVycnVwdCBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgc2h1dGRvd24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBzaHV0ZG93biBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgcmVzdGFydChvblJlc3RhcnRlZDogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogcmVzdGFydCBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgZXhlY3V0ZShjb2RlOiBzdHJpbmcsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBleGVjdXRlIG1ldGhvZCBub3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cblxuICBjb21wbGV0ZShjb2RlOiBzdHJpbmcsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBjb21wbGV0ZSBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgaW5zcGVjdChjb2RlOiBzdHJpbmcsIGN1cnNvclBvczogbnVtYmVyLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogaW5zcGVjdCBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgaW5wdXRSZXBseShpbnB1dDogc3RyaW5nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBpbnB1dFJlcGx5IG1ldGhvZCBub3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGxvZyhcIktlcm5lbFRyYW5zcG9ydDogRGVzdHJveWluZyBiYXNlIGtlcm5lbFwiKTtcbiAgfVxufVxuIl19