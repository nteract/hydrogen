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
exports.isSingleLine = exports.reduceOutputs = void 0;
const mobx_1 = require("mobx");
const escape_carriage_1 = require("escape-carriage");
const display_1 = require("../components/result-view/display");
const outputTypes = ["execute_result", "display_data", "stream", "error"];
function reduceOutputs(outputs, output) {
    const last = outputs.length - 1;
    if (outputs.length > 0 &&
        output.output_type === "stream" &&
        outputs[last].output_type === "stream") {
        function appendText(previous, next) {
            previous.text = (0, escape_carriage_1.escapeCarriageReturnSafe)(previous.text + next.text);
        }
        if (outputs[last].name === output.name) {
            appendText(outputs[last], output);
            return outputs;
        }
        if (outputs.length > 1 && outputs[last - 1].name === output.name) {
            appendText(outputs[last - 1], output);
            return outputs;
        }
    }
    outputs.push(output);
    return outputs;
}
exports.reduceOutputs = reduceOutputs;
function isSingleLine(text, availableSpace) {
    return ((!text || !text.includes("\n") || text.indexOf("\n") === text.length - 1) &&
        availableSpace > (0, escape_carriage_1.escapeCarriageReturn)(text).length);
}
exports.isSingleLine = isSingleLine;
class OutputStore {
    constructor() {
        this.outputs = [];
        this.status = "running";
        this.executionCount = null;
        this.index = -1;
        this.position = {
            lineHeight: 0,
            lineLength: 0,
            editorWidth: 0,
            charWidth: 0,
        };
        this.setIndex = (index) => {
            if (index < 0) {
                this.index = 0;
            }
            else if (index < this.outputs.length) {
                this.index = index;
            }
            else {
                this.index = this.outputs.length - 1;
            }
        };
        this.incrementIndex = () => {
            this.index =
                this.index < this.outputs.length - 1
                    ? this.index + 1
                    : this.outputs.length - 1;
        };
        this.decrementIndex = () => {
            this.index = this.index > 0 ? this.index - 1 : 0;
        };
        this.clear = () => {
            this.outputs = [];
            this.index = -1;
        };
    }
    get isPlain() {
        if (this.outputs.length !== 1) {
            return false;
        }
        const availableSpace = Math.floor((this.position.editorWidth - this.position.lineLength) /
            this.position.charWidth);
        if (availableSpace <= 0) {
            return false;
        }
        const output = this.outputs[0];
        switch (output.output_type) {
            case "execute_result":
            case "display_data": {
                const bundle = output.data;
                return (0, display_1.isTextOutputOnly)(bundle)
                    ? isSingleLine(bundle["text/plain"], availableSpace)
                    : false;
            }
            case "stream": {
                return isSingleLine(output.text, availableSpace);
            }
            default: {
                return false;
            }
        }
    }
    appendOutput(message) {
        if (message.stream === "execution_count") {
            this.executionCount = message.data;
        }
        else if (message.stream === "status") {
            this.status = message.data;
        }
        else if (outputTypes.includes(message.output_type)) {
            reduceOutputs(this.outputs, message);
            this.setIndex(this.outputs.length - 1);
        }
    }
    updatePosition(position) {
        Object.assign(this.position, position);
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", Array)
], OutputStore.prototype, "outputs", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", String)
], OutputStore.prototype, "status", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Number)
], OutputStore.prototype, "executionCount", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Number)
], OutputStore.prototype, "index", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], OutputStore.prototype, "position", void 0);
__decorate([
    mobx_1.computed,
    __metadata("design:type", Boolean),
    __metadata("design:paramtypes", [])
], OutputStore.prototype, "isPlain", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OutputStore.prototype, "appendOutput", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OutputStore.prototype, "updatePosition", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], OutputStore.prototype, "setIndex", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], OutputStore.prototype, "incrementIndex", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], OutputStore.prototype, "decrementIndex", void 0);
__decorate([
    mobx_1.action,
    __metadata("design:type", Object)
], OutputStore.prototype, "clear", void 0);
exports.default = OutputStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3N0b3JlL291dHB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwrQkFBb0Q7QUFDcEQscURBR3lCO0FBQ3pCLCtEQUFxRTtBQUNyRSxNQUFNLFdBQVcsR0FBRyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFZMUUsU0FBZ0IsYUFBYSxDQUMzQixPQUFtQyxFQUNuQyxNQUEyQjtJQUUzQixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUVoQyxJQUNFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztRQUNsQixNQUFNLENBQUMsV0FBVyxLQUFLLFFBQVE7UUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsS0FBSyxRQUFRLEVBQ3RDO1FBQ0EsU0FBUyxVQUFVLENBQ2pCLFFBQTZCLEVBQzdCLElBQXlCO1lBRXpCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBQSwwQ0FBd0IsRUFBQyxRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDdEMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNsQyxPQUFPLE9BQU8sQ0FBQztTQUNoQjtRQUVELElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRTtZQUNoRSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FB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Q0YsS0FBSzs0Q0FBMkI7QUFDekM7SUFBQyxpQkFBVTs7MkNBQ2dCO0FBQzNCO0lBQUMsaUJBQVU7O21EQUNzQztBQUNqRDtJQUFDLGlCQUFVOzswQ0FDUTtBQUNuQjtJQUFDLGlCQUFVOzs2Q0FNVDtBQUVGO0lBQUMsZUFBUTs7OzBDQStCUjtBQUVEO0lBQUMsYUFBTTs7OzsrQ0FVTjtBQUVEO0lBQUMsYUFBTTs7OztpREFPTjtBQUVEO0lBQUMsYUFBTTs7NkNBU0w7QUFDRjtJQUFDLGFBQU07O21EQU1MO0FBQ0Y7SUFBQyxhQUFNOzttREFHTDtBQUNGO0lBQUMsYUFBTTs7MENBSUw7QUFoR0osOEJBaUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9uLCBjb21wdXRlZCwgb2JzZXJ2YWJsZSB9IGZyb20gXCJtb2J4XCI7XG5pbXBvcnQge1xuICBlc2NhcGVDYXJyaWFnZVJldHVybixcbiAgZXNjYXBlQ2FycmlhZ2VSZXR1cm5TYWZlLFxufSBmcm9tIFwiZXNjYXBlLWNhcnJpYWdlXCI7XG5pbXBvcnQgeyBpc1RleHRPdXRwdXRPbmx5IH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvcmVzdWx0LXZpZXcvZGlzcGxheVwiO1xuY29uc3Qgb3V0cHV0VHlwZXMgPSBbXCJleGVjdXRlX3Jlc3VsdFwiLCBcImRpc3BsYXlfZGF0YVwiLCBcInN0cmVhbVwiLCBcImVycm9yXCJdO1xuXG4vKipcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L2h5ZHJvZ2VuL2lzc3Vlcy80NjYjaXNzdWVjb21tZW50LTI3NDgyMjkzNyBBblxuICogb3V0cHV0IGNhbiBiZSBhIHN0cmVhbSBvZiBkYXRhIHRoYXQgZG9lcyBub3QgYXJyaXZlIGF0IGEgc2luZ2xlIHRpbWUuIFRoaXNcbiAqIGZ1bmN0aW9uIGhhbmRsZXMgdGhlIGRpZmZlcmVudCB0eXBlcyBvZiBvdXRwdXRzIGFuZCBhY2N1bXVsYXRlcyB0aGUgZGF0YSBpbnRvXG4gKiBhIHJlZHVjZWQgb3V0cHV0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0W119IG91dHB1dHMgLSBLZXJuZWwgb3V0cHV0IG1lc3NhZ2VzXG4gKiBAcGFyYW0ge09iamVjdH0gb3V0cHV0IC0gT3V0cHV0dGVkIHRvIGJlIHJlZHVjZWQgaW50byBsaXN0IG9mIG91dHB1dHNcbiAqIEByZXR1cm5zIHtPYmplY3RbXX0gVXBkYXRlZC1vdXRwdXRzIC0gT3V0cHV0cyArIE91dHB1dFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlT3V0cHV0cyhcbiAgb3V0cHV0czogQXJyYXk8UmVjb3JkPHN0cmluZywgYW55Pj4sXG4gIG91dHB1dDogUmVjb3JkPHN0cmluZywgYW55PlxuKTogQXJyYXk8UmVjb3JkPHN0cmluZywgYW55Pj4ge1xuICBjb25zdCBsYXN0ID0gb3V0cHV0cy5sZW5ndGggLSAxO1xuXG4gIGlmIChcbiAgICBvdXRwdXRzLmxlbmd0aCA+IDAgJiZcbiAgICBvdXRwdXQub3V0cHV0X3R5cGUgPT09IFwic3RyZWFtXCIgJiZcbiAgICBvdXRwdXRzW2xhc3RdLm91dHB1dF90eXBlID09PSBcInN0cmVhbVwiXG4gICkge1xuICAgIGZ1bmN0aW9uIGFwcGVuZFRleHQoXG4gICAgICBwcmV2aW91czogUmVjb3JkPHN0cmluZywgYW55PixcbiAgICAgIG5leHQ6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgICApIHtcbiAgICAgIHByZXZpb3VzLnRleHQgPSBlc2NhcGVDYXJyaWFnZVJldHVyblNhZmUocHJldmlvdXMudGV4dCArIG5leHQudGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKG91dHB1dHNbbGFzdF0ubmFtZSA9PT0gb3V0cHV0Lm5hbWUpIHtcbiAgICAgIGFwcGVuZFRleHQob3V0cHV0c1tsYXN0XSwgb3V0cHV0KTtcbiAgICAgIHJldHVybiBvdXRwdXRzO1xuICAgIH1cblxuICAgIGlmIChvdXRwdXRzLmxlbmd0aCA+IDEgJiYgb3V0cHV0c1tsYXN0IC0gMV0ubmFtZSA9PT0gb3V0cHV0Lm5hbWUpIHtcbiAgICAgIGFwcGVuZFRleHQob3V0cHV0c1tsYXN0IC0gMV0sIG91dHB1dCk7XG4gICAgICByZXR1cm4gb3V0cHV0cztcbiAgICB9XG4gIH1cblxuICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgcmV0dXJuIG91dHB1dHM7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNTaW5nbGVMaW5lKFxuICB0ZXh0OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLFxuICBhdmFpbGFibGVTcGFjZTogbnVtYmVyXG4pIHtcbiAgLy8gSWYgaXQgdHVybnMgb3V0IGVzY2FwZUNhcnJpYWdlUmV0dXJuIGlzIGEgYm90dGxlbmVjaywgd2Ugc2hvdWxkIHJlbW92ZSBpdC5cbiAgcmV0dXJuIChcbiAgICAoIXRleHQgfHwgIXRleHQuaW5jbHVkZXMoXCJcXG5cIikgfHwgdGV4dC5pbmRleE9mKFwiXFxuXCIpID09PSB0ZXh0Lmxlbmd0aCAtIDEpICYmXG4gICAgYXZhaWxhYmxlU3BhY2UgPiBlc2NhcGVDYXJyaWFnZVJldHVybih0ZXh0KS5sZW5ndGhcbiAgKTtcbn1cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dHB1dFN0b3JlIHtcbiAgQG9ic2VydmFibGVcbiAgb3V0cHV0czogQXJyYXk8UmVjb3JkPHN0cmluZywgYW55Pj4gPSBbXTtcbiAgQG9ic2VydmFibGVcbiAgc3RhdHVzOiBzdHJpbmcgPSBcInJ1bm5pbmdcIjtcbiAgQG9ic2VydmFibGVcbiAgZXhlY3V0aW9uQ291bnQ6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xuICBAb2JzZXJ2YWJsZVxuICBpbmRleDogbnVtYmVyID0gLTE7XG4gIEBvYnNlcnZhYmxlXG4gIHBvc2l0aW9uID0ge1xuICAgIGxpbmVIZWlnaHQ6IDAsXG4gICAgbGluZUxlbmd0aDogMCxcbiAgICBlZGl0b3JXaWR0aDogMCxcbiAgICBjaGFyV2lkdGg6IDAsXG4gIH07XG5cbiAgQGNvbXB1dGVkXG4gIGdldCBpc1BsYWluKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLm91dHB1dHMubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGF2YWlsYWJsZVNwYWNlID0gTWF0aC5mbG9vcihcbiAgICAgICh0aGlzLnBvc2l0aW9uLmVkaXRvcldpZHRoIC0gdGhpcy5wb3NpdGlvbi5saW5lTGVuZ3RoKSAvXG4gICAgICAgIHRoaXMucG9zaXRpb24uY2hhcldpZHRoXG4gICAgKTtcbiAgICBpZiAoYXZhaWxhYmxlU3BhY2UgPD0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm91dHB1dHNbMF07XG5cbiAgICBzd2l0Y2ggKG91dHB1dC5vdXRwdXRfdHlwZSkge1xuICAgICAgY2FzZSBcImV4ZWN1dGVfcmVzdWx0XCI6XG4gICAgICBjYXNlIFwiZGlzcGxheV9kYXRhXCI6IHtcbiAgICAgICAgY29uc3QgYnVuZGxlID0gb3V0cHV0LmRhdGE7XG4gICAgICAgIHJldHVybiBpc1RleHRPdXRwdXRPbmx5KGJ1bmRsZSlcbiAgICAgICAgICA/IGlzU2luZ2xlTGluZShidW5kbGVbXCJ0ZXh0L3BsYWluXCJdLCBhdmFpbGFibGVTcGFjZSlcbiAgICAgICAgICA6IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjYXNlIFwic3RyZWFtXCI6IHtcbiAgICAgICAgcmV0dXJuIGlzU2luZ2xlTGluZShvdXRwdXQudGV4dCwgYXZhaWxhYmxlU3BhY2UpO1xuICAgICAgfVxuXG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBAYWN0aW9uXG4gIGFwcGVuZE91dHB1dChtZXNzYWdlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgaWYgKG1lc3NhZ2Uuc3RyZWFtID09PSBcImV4ZWN1dGlvbl9jb3VudFwiKSB7XG4gICAgICB0aGlzLmV4ZWN1dGlvbkNvdW50ID0gbWVzc2FnZS5kYXRhO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdHJlYW0gPT09IFwic3RhdHVzXCIpIHtcbiAgICAgIHRoaXMuc3RhdHVzID0gbWVzc2FnZS5kYXRhO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0VHlwZXMuaW5jbHVkZXMobWVzc2FnZS5vdXRwdXRfdHlwZSkpIHtcbiAgICAgIHJlZHVjZU91dHB1dHModGhpcy5vdXRwdXRzLCBtZXNzYWdlKTtcbiAgICAgIHRoaXMuc2V0SW5kZXgodGhpcy5vdXRwdXRzLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxuXG4gIEBhY3Rpb25cbiAgdXBkYXRlUG9zaXRpb24ocG9zaXRpb246IHtcbiAgICBsaW5lSGVpZ2h0PzogbnVtYmVyO1xuICAgIGxpbmVMZW5ndGg/OiBudW1iZXI7XG4gICAgZWRpdG9yV2lkdGg/OiBudW1iZXI7XG4gIH0pIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMucG9zaXRpb24sIHBvc2l0aW9uKTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgc2V0SW5kZXggPSAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIH0gZWxzZSBpZiAoaW5kZXggPCB0aGlzLm91dHB1dHMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaW5kZXggPSB0aGlzLm91dHB1dHMubGVuZ3RoIC0gMTtcbiAgICB9XG4gIH07XG4gIEBhY3Rpb25cbiAgaW5jcmVtZW50SW5kZXggPSAoKSA9PiB7XG4gICAgdGhpcy5pbmRleCA9XG4gICAgICB0aGlzLmluZGV4IDwgdGhpcy5vdXRwdXRzLmxlbmd0aCAtIDFcbiAgICAgICAgPyB0aGlzLmluZGV4ICsgMVxuICAgICAgICA6IHRoaXMub3V0cHV0cy5sZW5ndGggLSAxO1xuICB9O1xuICBAYWN0aW9uXG4gIGRlY3JlbWVudEluZGV4ID0gKCkgPT4ge1xuICAgIHRoaXMuaW5kZXggPSB0aGlzLmluZGV4ID4gMCA/IHRoaXMuaW5kZXggLSAxIDogMDtcbiAgfTtcbiAgQGFjdGlvblxuICBjbGVhciA9ICgpID0+IHtcbiAgICB0aGlzLm91dHB1dHMgPSBbXTtcbiAgICB0aGlzLmluZGV4ID0gLTE7XG4gIH07XG59XG4iXX0=