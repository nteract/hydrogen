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
            previous.text = escape_carriage_1.escapeCarriageReturnSafe(previous.text + next.text);
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
    return ((!text ||
        text.indexOf("\n") === -1 ||
        text.indexOf("\n") === text.length - 1) &&
        availableSpace > escape_carriage_1.escapeCarriageReturn(text).length);
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
                return display_1.isTextOutputOnly(bundle)
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
        else if (outputTypes.indexOf(message.output_type) > -1) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3N0b3JlL291dHB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwrQkFBb0Q7QUFFcEQscURBR3lCO0FBRXpCLCtEQUFxRTtBQUNyRSxNQUFNLFdBQVcsR0FBRyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFZMUUsU0FBZ0IsYUFBYSxDQUMzQixPQUFtQyxFQUNuQyxNQUEyQjtJQUUzQixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUVoQyxJQUNFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztRQUNsQixNQUFNLENBQUMsV0FBVyxLQUFLLFFBQVE7UUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsS0FBSyxRQUFRLEVBQ3RDO1FBQ0EsU0FBUyxVQUFVLENBQ2pCLFFBQTZCLEVBQzdCLElBQXlCO1lBRXpCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsMENBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ3RDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEMsT0FBTyxPQUFPLENBQUM7U0FDaEI7UUFFRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDaEUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFD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QyxpQkFBVTs4QkFDRixLQUFLOzRDQUEyQjtBQUV6QztJQURDLGlCQUFVOzsyQ0FDZ0I7QUFFM0I7SUFEQyxpQkFBVTs7bURBQ3NDO0FBRWpEO0lBREMsaUJBQVU7OzBDQUNRO0FBRW5CO0lBREMsaUJBQVU7OzZDQU1UO0FBR0Y7SUFEQyxlQUFROzs7MENBK0JSO0FBR0Q7SUFEQyxhQUFNOzs7OytDQVVOO0FBR0Q7SUFEQyxhQUFNOzs7O2lEQU9OO0FBR0Q7SUFEQyxhQUFNOzs2Q0FTTDtBQUVGO0lBREMsYUFBTTs7bURBTUw7QUFFRjtJQURDLGFBQU07O21EQUdMO0FBRUY7SUFEQyxhQUFNOzswQ0FJTDtBQWhHSiw4QkFpR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY3Rpb24sIGNvbXB1dGVkLCBvYnNlcnZhYmxlIH0gZnJvbSBcIm1vYnhcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7XG4gIGVzY2FwZUNhcnJpYWdlUmV0dXJuLFxuICBlc2NhcGVDYXJyaWFnZVJldHVyblNhZmUsXG59IGZyb20gXCJlc2NhcGUtY2FycmlhZ2VcIjtcbmltcG9ydCB0eXBlIHsgSU9ic2VydmFibGVBcnJheSB9IGZyb20gXCJtb2J4XCI7XG5pbXBvcnQgeyBpc1RleHRPdXRwdXRPbmx5IH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvcmVzdWx0LXZpZXcvZGlzcGxheVwiO1xuY29uc3Qgb3V0cHV0VHlwZXMgPSBbXCJleGVjdXRlX3Jlc3VsdFwiLCBcImRpc3BsYXlfZGF0YVwiLCBcInN0cmVhbVwiLCBcImVycm9yXCJdO1xuXG4vKipcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L2h5ZHJvZ2VuL2lzc3Vlcy80NjYjaXNzdWVjb21tZW50LTI3NDgyMjkzNyBBblxuICogb3V0cHV0IGNhbiBiZSBhIHN0cmVhbSBvZiBkYXRhIHRoYXQgZG9lcyBub3QgYXJyaXZlIGF0IGEgc2luZ2xlIHRpbWUuIFRoaXNcbiAqIGZ1bmN0aW9uIGhhbmRsZXMgdGhlIGRpZmZlcmVudCB0eXBlcyBvZiBvdXRwdXRzIGFuZCBhY2N1bXVsYXRlcyB0aGUgZGF0YSBpbnRvXG4gKiBhIHJlZHVjZWQgb3V0cHV0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0W119IG91dHB1dHMgLSBLZXJuZWwgb3V0cHV0IG1lc3NhZ2VzXG4gKiBAcGFyYW0ge09iamVjdH0gb3V0cHV0IC0gT3V0cHV0dGVkIHRvIGJlIHJlZHVjZWQgaW50byBsaXN0IG9mIG91dHB1dHNcbiAqIEByZXR1cm5zIHtPYmplY3RbXX0gVXBkYXRlZC1vdXRwdXRzIC0gT3V0cHV0cyArIE91dHB1dFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlT3V0cHV0cyhcbiAgb3V0cHV0czogQXJyYXk8UmVjb3JkPHN0cmluZywgYW55Pj4sXG4gIG91dHB1dDogUmVjb3JkPHN0cmluZywgYW55PlxuKTogQXJyYXk8UmVjb3JkPHN0cmluZywgYW55Pj4ge1xuICBjb25zdCBsYXN0ID0gb3V0cHV0cy5sZW5ndGggLSAxO1xuXG4gIGlmIChcbiAgICBvdXRwdXRzLmxlbmd0aCA+IDAgJiZcbiAgICBvdXRwdXQub3V0cHV0X3R5cGUgPT09IFwic3RyZWFtXCIgJiZcbiAgICBvdXRwdXRzW2xhc3RdLm91dHB1dF90eXBlID09PSBcInN0cmVhbVwiXG4gICkge1xuICAgIGZ1bmN0aW9uIGFwcGVuZFRleHQoXG4gICAgICBwcmV2aW91czogUmVjb3JkPHN0cmluZywgYW55PixcbiAgICAgIG5leHQ6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgICApIHtcbiAgICAgIHByZXZpb3VzLnRleHQgPSBlc2NhcGVDYXJyaWFnZVJldHVyblNhZmUocHJldmlvdXMudGV4dCArIG5leHQudGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKG91dHB1dHNbbGFzdF0ubmFtZSA9PT0gb3V0cHV0Lm5hbWUpIHtcbiAgICAgIGFwcGVuZFRleHQob3V0cHV0c1tsYXN0XSwgb3V0cHV0KTtcbiAgICAgIHJldHVybiBvdXRwdXRzO1xuICAgIH1cblxuICAgIGlmIChvdXRwdXRzLmxlbmd0aCA+IDEgJiYgb3V0cHV0c1tsYXN0IC0gMV0ubmFtZSA9PT0gb3V0cHV0Lm5hbWUpIHtcbiAgICAgIGFwcGVuZFRleHQob3V0cHV0c1tsYXN0IC0gMV0sIG91dHB1dCk7XG4gICAgICByZXR1cm4gb3V0cHV0cztcbiAgICB9XG4gIH1cblxuICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgcmV0dXJuIG91dHB1dHM7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNTaW5nbGVMaW5lKFxuICB0ZXh0OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLFxuICBhdmFpbGFibGVTcGFjZTogbnVtYmVyXG4pIHtcbiAgLy8gSWYgaXQgdHVybnMgb3V0IGVzY2FwZUNhcnJpYWdlUmV0dXJuIGlzIGEgYm90dGxlbmVjaywgd2Ugc2hvdWxkIHJlbW92ZSBpdC5cbiAgcmV0dXJuIChcbiAgICAoIXRleHQgfHxcbiAgICAgIHRleHQuaW5kZXhPZihcIlxcblwiKSA9PT0gLTEgfHxcbiAgICAgIHRleHQuaW5kZXhPZihcIlxcblwiKSA9PT0gdGV4dC5sZW5ndGggLSAxKSAmJlxuICAgIGF2YWlsYWJsZVNwYWNlID4gZXNjYXBlQ2FycmlhZ2VSZXR1cm4odGV4dCkubGVuZ3RoXG4gICk7XG59XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPdXRwdXRTdG9yZSB7XG4gIEBvYnNlcnZhYmxlXG4gIG91dHB1dHM6IEFycmF5PFJlY29yZDxzdHJpbmcsIGFueT4+ID0gW107XG4gIEBvYnNlcnZhYmxlXG4gIHN0YXR1czogc3RyaW5nID0gXCJydW5uaW5nXCI7XG4gIEBvYnNlcnZhYmxlXG4gIGV4ZWN1dGlvbkNvdW50OiBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkID0gbnVsbDtcbiAgQG9ic2VydmFibGVcbiAgaW5kZXg6IG51bWJlciA9IC0xO1xuICBAb2JzZXJ2YWJsZVxuICBwb3NpdGlvbiA9IHtcbiAgICBsaW5lSGVpZ2h0OiAwLFxuICAgIGxpbmVMZW5ndGg6IDAsXG4gICAgZWRpdG9yV2lkdGg6IDAsXG4gICAgY2hhcldpZHRoOiAwLFxuICB9O1xuXG4gIEBjb21wdXRlZFxuICBnZXQgaXNQbGFpbigpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5vdXRwdXRzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBhdmFpbGFibGVTcGFjZSA9IE1hdGguZmxvb3IoXG4gICAgICAodGhpcy5wb3NpdGlvbi5lZGl0b3JXaWR0aCAtIHRoaXMucG9zaXRpb24ubGluZUxlbmd0aCkgL1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmNoYXJXaWR0aFxuICAgICk7XG4gICAgaWYgKGF2YWlsYWJsZVNwYWNlIDw9IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5vdXRwdXRzWzBdO1xuXG4gICAgc3dpdGNoIChvdXRwdXQub3V0cHV0X3R5cGUpIHtcbiAgICAgIGNhc2UgXCJleGVjdXRlX3Jlc3VsdFwiOlxuICAgICAgY2FzZSBcImRpc3BsYXlfZGF0YVwiOiB7XG4gICAgICAgIGNvbnN0IGJ1bmRsZSA9IG91dHB1dC5kYXRhO1xuICAgICAgICByZXR1cm4gaXNUZXh0T3V0cHV0T25seShidW5kbGUpXG4gICAgICAgICAgPyBpc1NpbmdsZUxpbmUoYnVuZGxlW1widGV4dC9wbGFpblwiXSwgYXZhaWxhYmxlU3BhY2UpXG4gICAgICAgICAgOiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY2FzZSBcInN0cmVhbVwiOiB7XG4gICAgICAgIHJldHVybiBpc1NpbmdsZUxpbmUob3V0cHV0LnRleHQsIGF2YWlsYWJsZVNwYWNlKTtcbiAgICAgIH1cblxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgQGFjdGlvblxuICBhcHBlbmRPdXRwdXQobWVzc2FnZTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgIGlmIChtZXNzYWdlLnN0cmVhbSA9PT0gXCJleGVjdXRpb25fY291bnRcIikge1xuICAgICAgdGhpcy5leGVjdXRpb25Db3VudCA9IG1lc3NhZ2UuZGF0YTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uuc3RyZWFtID09PSBcInN0YXR1c1wiKSB7XG4gICAgICB0aGlzLnN0YXR1cyA9IG1lc3NhZ2UuZGF0YTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dFR5cGVzLmluZGV4T2YobWVzc2FnZS5vdXRwdXRfdHlwZSkgPiAtMSkge1xuICAgICAgcmVkdWNlT3V0cHV0cyh0aGlzLm91dHB1dHMsIG1lc3NhZ2UpO1xuICAgICAgdGhpcy5zZXRJbmRleCh0aGlzLm91dHB1dHMubGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG5cbiAgQGFjdGlvblxuICB1cGRhdGVQb3NpdGlvbihwb3NpdGlvbjoge1xuICAgIGxpbmVIZWlnaHQ/OiBudW1iZXI7XG4gICAgbGluZUxlbmd0aD86IG51bWJlcjtcbiAgICBlZGl0b3JXaWR0aD86IG51bWJlcjtcbiAgfSkge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5wb3NpdGlvbiwgcG9zaXRpb24pO1xuICB9XG5cbiAgQGFjdGlvblxuICBzZXRJbmRleCA9IChpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgdGhpcy5pbmRleCA9IDA7XG4gICAgfSBlbHNlIGlmIChpbmRleCA8IHRoaXMub3V0cHV0cy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pbmRleCA9IHRoaXMub3V0cHV0cy5sZW5ndGggLSAxO1xuICAgIH1cbiAgfTtcbiAgQGFjdGlvblxuICBpbmNyZW1lbnRJbmRleCA9ICgpID0+IHtcbiAgICB0aGlzLmluZGV4ID1cbiAgICAgIHRoaXMuaW5kZXggPCB0aGlzLm91dHB1dHMubGVuZ3RoIC0gMVxuICAgICAgICA/IHRoaXMuaW5kZXggKyAxXG4gICAgICAgIDogdGhpcy5vdXRwdXRzLmxlbmd0aCAtIDE7XG4gIH07XG4gIEBhY3Rpb25cbiAgZGVjcmVtZW50SW5kZXggPSAoKSA9PiB7XG4gICAgdGhpcy5pbmRleCA9IHRoaXMuaW5kZXggPiAwID8gdGhpcy5pbmRleCAtIDEgOiAwO1xuICB9O1xuICBAYWN0aW9uXG4gIGNsZWFyID0gKCkgPT4ge1xuICAgIHRoaXMub3V0cHV0cyA9IFtdO1xuICAgIHRoaXMuaW5kZXggPSAtMTtcbiAgfTtcbn1cbiJdfQ==