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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const output_1 = __importDefault(require("./output"));
const utils_1 = require("../utils");
class WatchStore {
    constructor(kernel) {
        this.outputStore = new output_1.default();
        this.run = () => {
            const code = this.getCode();
            (0, utils_1.log)("watchview running:", code);
            if (code && code.length > 0) {
                this.kernel.executeWatch(code, (result) => {
                    this.outputStore.appendOutput(result);
                });
            }
        };
        this.setCode = (code) => {
            this.editor.setText(code);
        };
        this.getCode = () => {
            return this.editor.getText();
        };
        this.focus = () => {
            this.editor.element.focus();
        };
        this.kernel = kernel;
        this.editor = atom.workspace.buildTextEditor({
            softWrapped: true,
            lineNumberGutterVisible: false,
        });
        const grammar = this.kernel.grammar;
        if (grammar) {
            atom.grammars.assignLanguageMode(this.editor.getBuffer(), grammar.scopeName);
        }
        this.editor.moveToTop();
        this.editor.element.classList.add("watch-input");
    }
}
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], WatchStore.prototype, "run", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], WatchStore.prototype, "setCode", void 0);
exports.default = WatchStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RvcmUvd2F0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFDQSwrQkFBOEI7QUFDOUIsc0RBQW1DO0FBQ25DLG9DQUErQjtBQUUvQixNQUFxQixVQUFVO0lBTTdCLFlBQVksTUFBYztRQUgxQixnQkFBVyxHQUFHLElBQUksZ0JBQVcsRUFBRSxDQUFDO1FBcUJoQyxRQUFHLEdBQUcsR0FBRyxFQUFFO1lBQ1QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUEsV0FBRyxFQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWhDLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtvQkFDeEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxDQUFDO2FBQ0o7UUFDSCxDQUFDLENBQUM7UUFFRixZQUFPLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUM7UUFDRixZQUFPLEdBQUcsR0FBRyxFQUFFO1lBQ2IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQy9CLENBQUMsQ0FBQztRQUNGLFVBQUssR0FBRyxHQUFHLEVBQUU7WUFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixDQUFDLENBQUM7UUFwQ0EsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQztZQUMzQyxXQUFXLEVBQUUsSUFBSTtZQUNqQix1QkFBdUIsRUFBRSxLQUFLO1NBQy9CLENBQUMsQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ3BDLElBQUksT0FBTyxFQUFFO1lBQ1gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFDdkIsT0FBTyxDQUFDLFNBQVMsQ0FDbEIsQ0FBQztTQUNIO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ25ELENBQUM7Q0F1QkY7QUFyQkM7SUFBQyxhQUFNOzt1Q0FVTDtBQUNGO0lBQUMsYUFBTTs7MkNBR0w7QUFyQ0osNkJBNENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGV4dEVkaXRvciwgRGlzcG9zYWJsZSB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgeyBhY3Rpb24gfSBmcm9tIFwibW9ieFwiO1xuaW1wb3J0IE91dHB1dFN0b3JlIGZyb20gXCIuL291dHB1dFwiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4uL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSBLZXJuZWwgZnJvbSBcIi4uL2tlcm5lbFwiO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2F0Y2hTdG9yZSB7XG4gIGtlcm5lbDogS2VybmVsO1xuICBlZGl0b3I6IFRleHRFZGl0b3I7XG4gIG91dHB1dFN0b3JlID0gbmV3IE91dHB1dFN0b3JlKCk7XG4gIGF1dG9jb21wbGV0ZURpc3Bvc2FibGU6IERpc3Bvc2FibGUgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKGtlcm5lbDogS2VybmVsKSB7XG4gICAgdGhpcy5rZXJuZWwgPSBrZXJuZWw7XG4gICAgdGhpcy5lZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5idWlsZFRleHRFZGl0b3Ioe1xuICAgICAgc29mdFdyYXBwZWQ6IHRydWUsXG4gICAgICBsaW5lTnVtYmVyR3V0dGVyVmlzaWJsZTogZmFsc2UsXG4gICAgfSk7XG4gICAgY29uc3QgZ3JhbW1hciA9IHRoaXMua2VybmVsLmdyYW1tYXI7XG4gICAgaWYgKGdyYW1tYXIpIHtcbiAgICAgIGF0b20uZ3JhbW1hcnMuYXNzaWduTGFuZ3VhZ2VNb2RlKFxuICAgICAgICB0aGlzLmVkaXRvci5nZXRCdWZmZXIoKSxcbiAgICAgICAgZ3JhbW1hci5zY29wZU5hbWVcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuZWRpdG9yLm1vdmVUb1RvcCgpO1xuICAgIHRoaXMuZWRpdG9yLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIndhdGNoLWlucHV0XCIpO1xuICB9XG5cbiAgQGFjdGlvblxuICBydW4gPSAoKSA9PiB7XG4gICAgY29uc3QgY29kZSA9IHRoaXMuZ2V0Q29kZSgpO1xuICAgIGxvZyhcIndhdGNodmlldyBydW5uaW5nOlwiLCBjb2RlKTtcblxuICAgIGlmIChjb2RlICYmIGNvZGUubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5rZXJuZWwuZXhlY3V0ZVdhdGNoKGNvZGUsIChyZXN1bHQpID0+IHtcbiAgICAgICAgdGhpcy5vdXRwdXRTdG9yZS5hcHBlbmRPdXRwdXQocmVzdWx0KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgQGFjdGlvblxuICBzZXRDb2RlID0gKGNvZGU6IHN0cmluZykgPT4ge1xuICAgIHRoaXMuZWRpdG9yLnNldFRleHQoY29kZSk7XG4gIH07XG4gIGdldENvZGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yLmdldFRleHQoKTtcbiAgfTtcbiAgZm9jdXMgPSAoKSA9PiB7XG4gICAgdGhpcy5lZGl0b3IuZWxlbWVudC5mb2N1cygpO1xuICB9O1xufVxuIl19