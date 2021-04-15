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
            utils_1.log("watchview running:", code);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RvcmUvd2F0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFDQSwrQkFBOEI7QUFDOUIsc0RBQW1DO0FBQ25DLG9DQUErQjtBQUUvQixNQUFxQixVQUFVO0lBTTdCLFlBQVksTUFBYztRQUgxQixnQkFBVyxHQUFHLElBQUksZ0JBQVcsRUFBRSxDQUFDO1FBcUJoQyxRQUFHLEdBQUcsR0FBRyxFQUFFO1lBQ1QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLFdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVoQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN4QyxDQUFDLENBQUMsQ0FBQzthQUNKO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsWUFBTyxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDO1FBQ0YsWUFBTyxHQUFHLEdBQUcsRUFBRTtZQUNiLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixDQUFDLENBQUM7UUFDRixVQUFLLEdBQUcsR0FBRyxFQUFFO1lBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDOUIsQ0FBQyxDQUFDO1FBcENBLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7WUFDM0MsV0FBVyxFQUFFLElBQUk7WUFDakIsdUJBQXVCLEVBQUUsS0FBSztTQUMvQixDQUFDLENBQUM7UUFDSCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUNwQyxJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQ3ZCLE9BQU8sQ0FBQyxTQUFTLENBQ2xCLENBQUM7U0FDSDtRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBdUJGO0FBcEJDO0lBREMsYUFBTTs7dUNBVUw7QUFFRjtJQURDLGFBQU07OzJDQUdMO0FBckNKLDZCQTRDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRleHRFZGl0b3IsIERpc3Bvc2FibGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgYWN0aW9uIH0gZnJvbSBcIm1vYnhcIjtcbmltcG9ydCBPdXRwdXRTdG9yZSBmcm9tIFwiLi9vdXRwdXRcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgS2VybmVsIGZyb20gXCIuLi9rZXJuZWxcIjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhdGNoU3RvcmUge1xuICBrZXJuZWw6IEtlcm5lbDtcbiAgZWRpdG9yOiBUZXh0RWRpdG9yO1xuICBvdXRwdXRTdG9yZSA9IG5ldyBPdXRwdXRTdG9yZSgpO1xuICBhdXRvY29tcGxldGVEaXNwb3NhYmxlOiBEaXNwb3NhYmxlIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihrZXJuZWw6IEtlcm5lbCkge1xuICAgIHRoaXMua2VybmVsID0ga2VybmVsO1xuICAgIHRoaXMuZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuYnVpbGRUZXh0RWRpdG9yKHtcbiAgICAgIHNvZnRXcmFwcGVkOiB0cnVlLFxuICAgICAgbGluZU51bWJlckd1dHRlclZpc2libGU6IGZhbHNlLFxuICAgIH0pO1xuICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLmtlcm5lbC5ncmFtbWFyO1xuICAgIGlmIChncmFtbWFyKSB7XG4gICAgICBhdG9tLmdyYW1tYXJzLmFzc2lnbkxhbmd1YWdlTW9kZShcbiAgICAgICAgdGhpcy5lZGl0b3IuZ2V0QnVmZmVyKCksXG4gICAgICAgIGdyYW1tYXIuc2NvcGVOYW1lXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLmVkaXRvci5tb3ZlVG9Ub3AoKTtcbiAgICB0aGlzLmVkaXRvci5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJ3YXRjaC1pbnB1dFwiKTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgcnVuID0gKCkgPT4ge1xuICAgIGNvbnN0IGNvZGUgPSB0aGlzLmdldENvZGUoKTtcbiAgICBsb2coXCJ3YXRjaHZpZXcgcnVubmluZzpcIiwgY29kZSk7XG5cbiAgICBpZiAoY29kZSAmJiBjb2RlLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMua2VybmVsLmV4ZWN1dGVXYXRjaChjb2RlLCAocmVzdWx0KSA9PiB7XG4gICAgICAgIHRoaXMub3V0cHV0U3RvcmUuYXBwZW5kT3V0cHV0KHJlc3VsdCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIEBhY3Rpb25cbiAgc2V0Q29kZSA9IChjb2RlOiBzdHJpbmcpID0+IHtcbiAgICB0aGlzLmVkaXRvci5zZXRUZXh0KGNvZGUpO1xuICB9O1xuICBnZXRDb2RlID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLmVkaXRvci5nZXRUZXh0KCk7XG4gIH07XG4gIGZvY3VzID0gKCkgPT4ge1xuICAgIHRoaXMuZWRpdG9yLmVsZW1lbnQuZm9jdXMoKTtcbiAgfTtcbn1cbiJdfQ==