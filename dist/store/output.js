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
    return ((!text || !text.includes("\n") || text.indexOf("\n") === text.length - 1) &&
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3N0b3JlL291dHB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwrQkFBb0Q7QUFDcEQscURBR3lCO0FBQ3pCLCtEQUFxRTtBQUNyRSxNQUFNLFdBQVcsR0FBRyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFZMUUsU0FBZ0IsYUFBYSxDQUMzQixPQUFtQyxFQUNuQyxNQUEyQjtJQUUzQixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUVoQyxJQUNFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztRQUNsQixNQUFNLENBQUMsV0FBVyxLQUFLLFFBQVE7UUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsS0FBSyxRQUFRLEVBQ3RDO1FBQ0EsU0FBUyxVQUFVLENBQ2pCLFFBQTZCLEVBQzdCLElBQXlCO1lBRXpCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsMENBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ3RDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEMsT0FBTyxPQUFPLENBQUM7U0FDaEI7UUFFRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDaEUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdEMsT0FBTyxPQUFPLENBQUM7U0FDaEI7S0FDRjtJQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckIsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQS9CRCxzQ0ErQkM7QUFDRCxTQUFnQixZQUFZLENBQzFCLElBQStCLEVBQy9CLGNBQXNCO0lBR3RCLE9BQU8sQ0FDTCxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3pFLGNBQWMsR0FBRyxzQ0FBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQ25ELENBQUM7QUFDSixDQUFDO0FBVEQsb0NBU0M7QUFDRCxNQUFxQixXQUFXO0lBQWhDO1FBRUUsWUFBTyxHQUErQixFQUFFLENBQUM7UUFFekMsV0FBTSxHQUFXLFNBQVMsQ0FBQztRQUUzQixtQkFBYyxHQUE4QixJQUFJLENBQUM7UUFFakQsVUFBSyxHQUFXLENBQUMsQ0FBQyxDQUFDO1FBRW5CLGFBQVEsR0FBRztZQUNULFVBQVUsRUFBRSxDQUFDO1lBQ2IsVUFBVSxFQUFFLENBQUM7WUFDYixXQUFXLEVBQUUsQ0FBQztZQUNkLFNBQVMsRUFBRSxDQUFDO1NBQ2IsQ0FBQztRQXlERixhQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRTtZQUMzQixJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7YUFDaEI7aUJBQU0sSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQ3RDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ3BCO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2FBQ3RDO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsbUJBQWMsR0FBRyxHQUFHLEVBQUU7WUFDcEIsSUFBSSxDQUFDLEtBQUs7Z0JBQ1IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO29CQUNsQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO29CQUNoQixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQztRQUVGLG1CQUFjLEdBQUcsR0FBRyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDO1FBRUYsVUFBSyxHQUFHLEdBQUcsRUFBRTtZQUNYLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQS9FQyxJQUFJLE9BQU87UUFDVCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM3QixPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FDL0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUNwRCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FDMUIsQ0FBQztRQUNGLElBQUksY0FBYyxJQUFJLENBQUMsRUFBRTtZQUN2QixPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUvQixRQUFRLE1BQU0sQ0FBQyxXQUFXLEVBQUU7WUFDMUIsS0FBSyxnQkFBZ0IsQ0FBQztZQUN0QixLQUFLLGNBQWMsQ0FBQyxDQUFDO2dCQUNuQixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUMzQixPQUFPLDBCQUFnQixDQUFDLE1BQU0sQ0FBQztvQkFDN0IsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsY0FBYyxDQUFDO29CQUNwRCxDQUFDLENBQUMsS0FBSyxDQUFDO2FBQ1g7WUFFRCxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUNiLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7YUFDbEQ7WUFFRCxPQUFPLENBQUMsQ0FBQztnQkFDUCxPQUFPLEtBQUssQ0FBQzthQUNkO1NBQ0Y7SUFDSCxDQUFDO0lBR0QsWUFBWSxDQUFDLE9BQTRCO1FBQ3ZDLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxpQkFBaUIsRUFBRTtZQUN4QyxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDcEM7YUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO1lBQ3RDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztTQUM1QjthQUFNLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDcEQsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztTQUN4QztJQUNILENBQUM7SUFHRCxjQUFjLENBQUMsUUFJZDtRQUNDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBNEJGO0FBL0ZDO0lBREMsaUJBQVU7OEJBQ0YsS0FBSzs0Q0FBMkI7QUFFekM7SUFEQyxpQkFBVTs7MkNBQ2dCO0FBRTNCO0lBREMsaUJBQVU7O21EQUNzQztBQUVqRDtJQURDLGlCQUFVOzswQ0FDUTtBQUVuQjtJQURDLGlCQUFVOzs2Q0FNVDtBQUdGO0lBREMsZUFBUTs7OzBDQStCUjtBQUdEO0lBREMsYUFBTTs7OzsrQ0FVTjtBQUdEO0lBREMsYUFBTTs7OztpREFPTjtBQUdEO0lBREMsYUFBTTs7NkNBU0w7QUFFRjtJQURDLGFBQU07O21EQU1MO0FBRUY7SUFEQyxhQUFNOzttREFHTDtBQUVGO0lBREMsYUFBTTs7MENBSUw7QUFoR0osOEJBaUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9uLCBjb21wdXRlZCwgb2JzZXJ2YWJsZSB9IGZyb20gXCJtb2J4XCI7XHJcbmltcG9ydCB7XHJcbiAgZXNjYXBlQ2FycmlhZ2VSZXR1cm4sXHJcbiAgZXNjYXBlQ2FycmlhZ2VSZXR1cm5TYWZlLFxyXG59IGZyb20gXCJlc2NhcGUtY2FycmlhZ2VcIjtcclxuaW1wb3J0IHsgaXNUZXh0T3V0cHV0T25seSB9IGZyb20gXCIuLi9jb21wb25lbnRzL3Jlc3VsdC12aWV3L2Rpc3BsYXlcIjtcclxuY29uc3Qgb3V0cHV0VHlwZXMgPSBbXCJleGVjdXRlX3Jlc3VsdFwiLCBcImRpc3BsYXlfZGF0YVwiLCBcInN0cmVhbVwiLCBcImVycm9yXCJdO1xyXG5cclxuLyoqXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9udGVyYWN0L2h5ZHJvZ2VuL2lzc3Vlcy80NjYjaXNzdWVjb21tZW50LTI3NDgyMjkzNyBBblxyXG4gKiBvdXRwdXQgY2FuIGJlIGEgc3RyZWFtIG9mIGRhdGEgdGhhdCBkb2VzIG5vdCBhcnJpdmUgYXQgYSBzaW5nbGUgdGltZS4gVGhpc1xyXG4gKiBmdW5jdGlvbiBoYW5kbGVzIHRoZSBkaWZmZXJlbnQgdHlwZXMgb2Ygb3V0cHV0cyBhbmQgYWNjdW11bGF0ZXMgdGhlIGRhdGEgaW50b1xyXG4gKiBhIHJlZHVjZWQgb3V0cHV0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdFtdfSBvdXRwdXRzIC0gS2VybmVsIG91dHB1dCBtZXNzYWdlc1xyXG4gKiBAcGFyYW0ge09iamVjdH0gb3V0cHV0IC0gT3V0cHV0dGVkIHRvIGJlIHJlZHVjZWQgaW50byBsaXN0IG9mIG91dHB1dHNcclxuICogQHJldHVybnMge09iamVjdFtdfSBVcGRhdGVkLW91dHB1dHMgLSBPdXRwdXRzICsgT3V0cHV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlT3V0cHV0cyhcclxuICBvdXRwdXRzOiBBcnJheTxSZWNvcmQ8c3RyaW5nLCBhbnk+PixcclxuICBvdXRwdXQ6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuKTogQXJyYXk8UmVjb3JkPHN0cmluZywgYW55Pj4ge1xyXG4gIGNvbnN0IGxhc3QgPSBvdXRwdXRzLmxlbmd0aCAtIDE7XHJcblxyXG4gIGlmIChcclxuICAgIG91dHB1dHMubGVuZ3RoID4gMCAmJlxyXG4gICAgb3V0cHV0Lm91dHB1dF90eXBlID09PSBcInN0cmVhbVwiICYmXHJcbiAgICBvdXRwdXRzW2xhc3RdLm91dHB1dF90eXBlID09PSBcInN0cmVhbVwiXHJcbiAgKSB7XHJcbiAgICBmdW5jdGlvbiBhcHBlbmRUZXh0KFxyXG4gICAgICBwcmV2aW91czogUmVjb3JkPHN0cmluZywgYW55PixcclxuICAgICAgbmV4dDogUmVjb3JkPHN0cmluZywgYW55PlxyXG4gICAgKSB7XHJcbiAgICAgIHByZXZpb3VzLnRleHQgPSBlc2NhcGVDYXJyaWFnZVJldHVyblNhZmUocHJldmlvdXMudGV4dCArIG5leHQudGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG91dHB1dHNbbGFzdF0ubmFtZSA9PT0gb3V0cHV0Lm5hbWUpIHtcclxuICAgICAgYXBwZW5kVGV4dChvdXRwdXRzW2xhc3RdLCBvdXRwdXQpO1xyXG4gICAgICByZXR1cm4gb3V0cHV0cztcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3V0cHV0cy5sZW5ndGggPiAxICYmIG91dHB1dHNbbGFzdCAtIDFdLm5hbWUgPT09IG91dHB1dC5uYW1lKSB7XHJcbiAgICAgIGFwcGVuZFRleHQob3V0cHV0c1tsYXN0IC0gMV0sIG91dHB1dCk7XHJcbiAgICAgIHJldHVybiBvdXRwdXRzO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb3V0cHV0cy5wdXNoKG91dHB1dCk7XHJcbiAgcmV0dXJuIG91dHB1dHM7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU2luZ2xlTGluZShcclxuICB0ZXh0OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLFxyXG4gIGF2YWlsYWJsZVNwYWNlOiBudW1iZXJcclxuKSB7XHJcbiAgLy8gSWYgaXQgdHVybnMgb3V0IGVzY2FwZUNhcnJpYWdlUmV0dXJuIGlzIGEgYm90dGxlbmVjaywgd2Ugc2hvdWxkIHJlbW92ZSBpdC5cclxuICByZXR1cm4gKFxyXG4gICAgKCF0ZXh0IHx8ICF0ZXh0LmluY2x1ZGVzKFwiXFxuXCIpIHx8IHRleHQuaW5kZXhPZihcIlxcblwiKSA9PT0gdGV4dC5sZW5ndGggLSAxKSAmJlxyXG4gICAgYXZhaWxhYmxlU3BhY2UgPiBlc2NhcGVDYXJyaWFnZVJldHVybih0ZXh0KS5sZW5ndGhcclxuICApO1xyXG59XHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dHB1dFN0b3JlIHtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIG91dHB1dHM6IEFycmF5PFJlY29yZDxzdHJpbmcsIGFueT4+ID0gW107XHJcbiAgQG9ic2VydmFibGVcclxuICBzdGF0dXM6IHN0cmluZyA9IFwicnVubmluZ1wiO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgZXhlY3V0aW9uQ291bnQ6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgaW5kZXg6IG51bWJlciA9IC0xO1xyXG4gIEBvYnNlcnZhYmxlXHJcbiAgcG9zaXRpb24gPSB7XHJcbiAgICBsaW5lSGVpZ2h0OiAwLFxyXG4gICAgbGluZUxlbmd0aDogMCxcclxuICAgIGVkaXRvcldpZHRoOiAwLFxyXG4gICAgY2hhcldpZHRoOiAwLFxyXG4gIH07XHJcblxyXG4gIEBjb21wdXRlZFxyXG4gIGdldCBpc1BsYWluKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKHRoaXMub3V0cHV0cy5sZW5ndGggIT09IDEpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYXZhaWxhYmxlU3BhY2UgPSBNYXRoLmZsb29yKFxyXG4gICAgICAodGhpcy5wb3NpdGlvbi5lZGl0b3JXaWR0aCAtIHRoaXMucG9zaXRpb24ubGluZUxlbmd0aCkgL1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24uY2hhcldpZHRoXHJcbiAgICApO1xyXG4gICAgaWYgKGF2YWlsYWJsZVNwYWNlIDw9IDApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5vdXRwdXRzWzBdO1xyXG5cclxuICAgIHN3aXRjaCAob3V0cHV0Lm91dHB1dF90eXBlKSB7XHJcbiAgICAgIGNhc2UgXCJleGVjdXRlX3Jlc3VsdFwiOlxyXG4gICAgICBjYXNlIFwiZGlzcGxheV9kYXRhXCI6IHtcclxuICAgICAgICBjb25zdCBidW5kbGUgPSBvdXRwdXQuZGF0YTtcclxuICAgICAgICByZXR1cm4gaXNUZXh0T3V0cHV0T25seShidW5kbGUpXHJcbiAgICAgICAgICA/IGlzU2luZ2xlTGluZShidW5kbGVbXCJ0ZXh0L3BsYWluXCJdLCBhdmFpbGFibGVTcGFjZSlcclxuICAgICAgICAgIDogZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhc2UgXCJzdHJlYW1cIjoge1xyXG4gICAgICAgIHJldHVybiBpc1NpbmdsZUxpbmUob3V0cHV0LnRleHQsIGF2YWlsYWJsZVNwYWNlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgQGFjdGlvblxyXG4gIGFwcGVuZE91dHB1dChtZXNzYWdlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XHJcbiAgICBpZiAobWVzc2FnZS5zdHJlYW0gPT09IFwiZXhlY3V0aW9uX2NvdW50XCIpIHtcclxuICAgICAgdGhpcy5leGVjdXRpb25Db3VudCA9IG1lc3NhZ2UuZGF0YTtcclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdHJlYW0gPT09IFwic3RhdHVzXCIpIHtcclxuICAgICAgdGhpcy5zdGF0dXMgPSBtZXNzYWdlLmRhdGE7XHJcbiAgICB9IGVsc2UgaWYgKG91dHB1dFR5cGVzLmluY2x1ZGVzKG1lc3NhZ2Uub3V0cHV0X3R5cGUpKSB7XHJcbiAgICAgIHJlZHVjZU91dHB1dHModGhpcy5vdXRwdXRzLCBtZXNzYWdlKTtcclxuICAgICAgdGhpcy5zZXRJbmRleCh0aGlzLm91dHB1dHMubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgdXBkYXRlUG9zaXRpb24ocG9zaXRpb246IHtcclxuICAgIGxpbmVIZWlnaHQ/OiBudW1iZXI7XHJcbiAgICBsaW5lTGVuZ3RoPzogbnVtYmVyO1xyXG4gICAgZWRpdG9yV2lkdGg/OiBudW1iZXI7XHJcbiAgfSkge1xyXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnBvc2l0aW9uLCBwb3NpdGlvbik7XHJcbiAgfVxyXG5cclxuICBAYWN0aW9uXHJcbiAgc2V0SW5kZXggPSAoaW5kZXg6IG51bWJlcikgPT4ge1xyXG4gICAgaWYgKGluZGV4IDwgMCkge1xyXG4gICAgICB0aGlzLmluZGV4ID0gMDtcclxuICAgIH0gZWxzZSBpZiAoaW5kZXggPCB0aGlzLm91dHB1dHMubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuaW5kZXggPSB0aGlzLm91dHB1dHMubGVuZ3RoIC0gMTtcclxuICAgIH1cclxuICB9O1xyXG4gIEBhY3Rpb25cclxuICBpbmNyZW1lbnRJbmRleCA9ICgpID0+IHtcclxuICAgIHRoaXMuaW5kZXggPVxyXG4gICAgICB0aGlzLmluZGV4IDwgdGhpcy5vdXRwdXRzLmxlbmd0aCAtIDFcclxuICAgICAgICA/IHRoaXMuaW5kZXggKyAxXHJcbiAgICAgICAgOiB0aGlzLm91dHB1dHMubGVuZ3RoIC0gMTtcclxuICB9O1xyXG4gIEBhY3Rpb25cclxuICBkZWNyZW1lbnRJbmRleCA9ICgpID0+IHtcclxuICAgIHRoaXMuaW5kZXggPSB0aGlzLmluZGV4ID4gMCA/IHRoaXMuaW5kZXggLSAxIDogMDtcclxuICB9O1xyXG4gIEBhY3Rpb25cclxuICBjbGVhciA9ICgpID0+IHtcclxuICAgIHRoaXMub3V0cHV0cyA9IFtdO1xyXG4gICAgdGhpcy5pbmRleCA9IC0xO1xyXG4gIH07XHJcbn1cclxuIl19