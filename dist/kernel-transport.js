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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLXRyYW5zcG9ydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9rZXJuZWwtdHJhbnNwb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0EsK0JBQTBDO0FBQzFDLG1DQUE4QjtBQU85QixNQUFxQixlQUFlO0lBbUJsQyxZQUFZLFVBQThCLEVBQUUsT0FBZ0I7UUFqQjVELG1CQUFjLEdBQUcsU0FBUyxDQUFDO1FBRTNCLG1CQUFjLEdBQUcsQ0FBQyxDQUFDO1FBRW5CLHNCQUFpQixHQUFHLGNBQWMsQ0FBQztRQUVuQyxjQUFTLEdBQUc7WUFDVixNQUFNLEVBQUUsRUFBRTtTQUNYLENBQUM7UUFVQSxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDO0lBQzdDLENBQUM7SUFHRCxpQkFBaUIsQ0FBQyxLQUFhO1FBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFHRCxpQkFBaUIsQ0FBQyxLQUFhO1FBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFHRCxvQkFBb0IsQ0FBQyxVQUFrQjtRQUNyQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDO0lBQ3RDLENBQUM7SUFFRCxTQUFTO1FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxRQUFRO1FBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxPQUFPLENBQUMsV0FBOEQ7UUFDcEUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFNBQTBCO1FBQzlDLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsUUFBUSxDQUFDLElBQVksRUFBRSxTQUEwQjtRQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUFZLEVBQUUsU0FBaUIsRUFBRSxTQUEwQjtRQUNqRSxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFhO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsT0FBTztRQUNMLFdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRjtBQXRFQztJQURDLGlCQUFVOzt1REFDZ0I7QUFFM0I7SUFEQyxpQkFBVTs7dURBQ1E7QUFFbkI7SUFEQyxpQkFBVTs7MERBQ3dCO0FBRW5DO0lBREMsaUJBQVU7O2tEQUdUO0FBaUJGO0lBREMsYUFBTTs7Ozt3REFHTjtBQUdEO0lBREMsYUFBTTs7Ozt3REFHTjtBQUdEO0lBREMsYUFBTTs7OzsyREFHTjtBQXZDSCxrQ0F3RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBHcmFtbWFyIH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHsgb2JzZXJ2YWJsZSwgYWN0aW9uIH0gZnJvbSBcIm1vYnhcIjtcclxuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcclxuXHJcbmV4cG9ydCB0eXBlIFJlc3VsdHNDYWxsYmFjayA9IChcclxuICBtZXNzYWdlOiBhbnksXHJcbiAgY2hhbm5lbDogXCJzaGVsbFwiIHwgXCJpb3B1YlwiIHwgXCJzdGRpblwiXHJcbikgPT4gdm9pZDtcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgS2VybmVsVHJhbnNwb3J0IHtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIGV4ZWN1dGlvblN0YXRlID0gXCJsb2FkaW5nXCI7XHJcbiAgQG9ic2VydmFibGVcclxuICBleGVjdXRpb25Db3VudCA9IDA7XHJcbiAgQG9ic2VydmFibGVcclxuICBsYXN0RXhlY3V0aW9uVGltZSA9IFwiTm8gZXhlY3V0aW9uXCI7XHJcbiAgQG9ic2VydmFibGVcclxuICBpbnNwZWN0b3IgPSB7XHJcbiAgICBidW5kbGU6IHt9LFxyXG4gIH07XHJcbiAga2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhO1xyXG4gIGdyYW1tYXI6IEdyYW1tYXI7XHJcbiAgbGFuZ3VhZ2U6IHN0cmluZztcclxuICBkaXNwbGF5TmFtZTogc3RyaW5nO1xyXG4gIC8vIE9ubHkgYFdTS2VybmVsYCB3b3VsZCBoYXZlIGBnYXRld2F5TmFtZWAgcHJvcGVydHkgYW5kIHRodXMgbm90IGluaXRpYWxpemUgaXQgaGVyZSxcclxuICAvLyBzdGlsbCBgS2VybmVsVHJhbnNwb3J0YCBpcyBiZXR0ZXIgdG8gaGF2ZSBgZ2F0ZXdheU5hbWVgIHByb3BlcnR5IGZvciBjb2RlIHNpbXBsaWNpdHkgaW4gdGhlIG90aGVyIHBhcnRzIG9mIGNvZGVcclxuICBnYXRld2F5TmFtZTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3Ioa2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhLCBncmFtbWFyOiBHcmFtbWFyKSB7XHJcbiAgICB0aGlzLmtlcm5lbFNwZWMgPSBrZXJuZWxTcGVjO1xyXG4gICAgdGhpcy5ncmFtbWFyID0gZ3JhbW1hcjtcclxuICAgIHRoaXMubGFuZ3VhZ2UgPSBrZXJuZWxTcGVjLmxhbmd1YWdlLnRvTG93ZXJDYXNlKCk7XHJcbiAgICB0aGlzLmRpc3BsYXlOYW1lID0ga2VybmVsU3BlYy5kaXNwbGF5X25hbWU7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgc2V0RXhlY3V0aW9uU3RhdGUoc3RhdGU6IHN0cmluZykge1xyXG4gICAgdGhpcy5leGVjdXRpb25TdGF0ZSA9IHN0YXRlO1xyXG4gIH1cclxuXHJcbiAgQGFjdGlvblxyXG4gIHNldEV4ZWN1dGlvbkNvdW50KGNvdW50OiBudW1iZXIpIHtcclxuICAgIHRoaXMuZXhlY3V0aW9uQ291bnQgPSBjb3VudDtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBzZXRMYXN0RXhlY3V0aW9uVGltZSh0aW1lU3RyaW5nOiBzdHJpbmcpIHtcclxuICAgIHRoaXMubGFzdEV4ZWN1dGlvblRpbWUgPSB0aW1lU3RyaW5nO1xyXG4gIH1cclxuXHJcbiAgaW50ZXJydXB0KCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBpbnRlcnJ1cHQgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICB9XHJcblxyXG4gIHNodXRkb3duKCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBzaHV0ZG93biBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xyXG4gIH1cclxuXHJcbiAgcmVzdGFydChvblJlc3RhcnRlZDogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiByZXN0YXJ0IG1ldGhvZCBub3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgfVxyXG5cclxuICBleGVjdXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogZXhlY3V0ZSBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xyXG4gIH1cclxuXHJcbiAgY29tcGxldGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBjb21wbGV0ZSBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xyXG4gIH1cclxuXHJcbiAgaW5zcGVjdChjb2RlOiBzdHJpbmcsIGN1cnNvclBvczogbnVtYmVyLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiS2VybmVsVHJhbnNwb3J0OiBpbnNwZWN0IG1ldGhvZCBub3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgfVxyXG5cclxuICBpbnB1dFJlcGx5KGlucHV0OiBzdHJpbmcpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIktlcm5lbFRyYW5zcG9ydDogaW5wdXRSZXBseSBtZXRob2Qgbm90IGltcGxlbWVudGVkXCIpO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIGxvZyhcIktlcm5lbFRyYW5zcG9ydDogRGVzdHJveWluZyBiYXNlIGtlcm5lbFwiKTtcclxuICB9XHJcbn1cclxuIl19