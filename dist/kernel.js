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
const atom_1 = require("atom");
const mobx_1 = require("mobx");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
const store_1 = __importDefault(require("./store"));
const watches_1 = __importDefault(require("./store/watches"));
const output_1 = __importDefault(require("./store/output"));
const hydrogen_kernel_1 = __importDefault(require("./plugin-api/hydrogen-kernel"));
const input_view_1 = __importDefault(require("./input-view"));
const kernel_transport_1 = __importDefault(require("./kernel-transport"));
function protectFromInvalidMessages(onResults) {
    const wrappedOnResults = (message, channel) => {
        if (!message) {
            utils_1.log("Invalid message: null");
            return;
        }
        if (!message.content) {
            utils_1.log("Invalid message: Missing content");
            return;
        }
        if (message.content.execution_state === "starting") {
            utils_1.log("Dropped starting status IO message");
            return;
        }
        if (!message.parent_header) {
            utils_1.log("Invalid message: Missing parent_header");
            return;
        }
        if (!message.parent_header.msg_id) {
            utils_1.log("Invalid message: Missing parent_header.msg_id");
            return;
        }
        if (!message.parent_header.msg_type) {
            utils_1.log("Invalid message: Missing parent_header.msg_type");
            return;
        }
        if (!message.header) {
            utils_1.log("Invalid message: Missing header");
            return;
        }
        if (!message.header.msg_id) {
            utils_1.log("Invalid message: Missing header.msg_id");
            return;
        }
        if (!message.header.msg_type) {
            utils_1.log("Invalid message: Missing header.msg_type");
            return;
        }
        onResults(message, channel);
    };
    return wrappedOnResults;
}
class MiddlewareAdapter {
    constructor(middleware, next) {
        this._middleware = middleware;
        this._next = next;
    }
    get _nextAsPluginType() {
        if (this._next instanceof kernel_transport_1.default) {
            throw new Error("MiddlewareAdapter: _nextAsPluginType must never be called when _next is KernelTransport");
        }
        return this._next;
    }
    interrupt() {
        if (this._middleware.interrupt) {
            this._middleware.interrupt(this._nextAsPluginType);
        }
        else {
            this._next.interrupt();
        }
    }
    shutdown() {
        if (this._middleware.shutdown) {
            this._middleware.shutdown(this._nextAsPluginType);
        }
        else {
            this._next.shutdown();
        }
    }
    restart(onRestarted) {
        if (this._middleware.restart) {
            this._middleware.restart(this._nextAsPluginType, onRestarted);
        }
        else {
            this._next.restart(onRestarted);
        }
    }
    execute(code, onResults) {
        const safeOnResults = this._middleware.execute || this._next instanceof kernel_transport_1.default
            ? protectFromInvalidMessages(onResults)
            : onResults;
        if (this._middleware.execute) {
            this._middleware.execute(this._nextAsPluginType, code, safeOnResults);
        }
        else {
            this._next.execute(code, safeOnResults);
        }
    }
    complete(code, onResults) {
        const safeOnResults = this._middleware.complete || this._next instanceof kernel_transport_1.default
            ? protectFromInvalidMessages(onResults)
            : onResults;
        if (this._middleware.complete) {
            this._middleware.complete(this._nextAsPluginType, code, safeOnResults);
        }
        else {
            this._next.complete(code, safeOnResults);
        }
    }
    inspect(code, cursorPos, onResults) {
        const safeOnResults = this._middleware.inspect || this._next instanceof kernel_transport_1.default
            ? protectFromInvalidMessages(onResults)
            : onResults;
        if (this._middleware.inspect) {
            this._middleware.inspect(this._nextAsPluginType, code, cursorPos, safeOnResults);
        }
        else {
            this._next.inspect(code, cursorPos, safeOnResults);
        }
    }
}
class Kernel {
    constructor(kernel) {
        this.inspector = {
            bundle: {},
        };
        this.outputStore = new output_1.default();
        this.watchCallbacks = [];
        this.emitter = new atom_1.Emitter();
        this.pluginWrapper = null;
        this.transport = kernel;
        this.watchesStore = new watches_1.default(this);
        const delegateToTransport = new MiddlewareAdapter({}, this.transport);
        this.middleware = [delegateToTransport];
    }
    get kernelSpec() {
        return this.transport.kernelSpec;
    }
    get grammar() {
        return this.transport.grammar;
    }
    get language() {
        return this.transport.language;
    }
    get displayName() {
        return this.transport.displayName;
    }
    get firstMiddlewareAdapter() {
        return this.middleware[0];
    }
    addMiddleware(middleware) {
        this.middleware.unshift(new MiddlewareAdapter(middleware, this.middleware[0]));
    }
    get executionState() {
        return this.transport.executionState;
    }
    setExecutionState(state) {
        this.transport.setExecutionState(state);
    }
    get executionCount() {
        return this.transport.executionCount;
    }
    setExecutionCount(count) {
        this.transport.setExecutionCount(count);
    }
    get lastExecutionTime() {
        return this.transport.lastExecutionTime;
    }
    setLastExecutionTime(timeString) {
        this.transport.setLastExecutionTime(timeString);
    }
    async setInspectorResult(bundle, editor) {
        if (lodash_1.isEqual(this.inspector.bundle, bundle)) {
            await atom.workspace.toggle(utils_1.INSPECTOR_URI);
        }
        else if (bundle.size !== 0) {
            this.inspector.bundle = bundle;
            await atom.workspace.open(utils_1.INSPECTOR_URI, {
                searchAllPanes: true,
            });
        }
        utils_1.focus(editor);
    }
    getPluginWrapper() {
        if (!this.pluginWrapper) {
            this.pluginWrapper = new hydrogen_kernel_1.default(this);
        }
        return this.pluginWrapper;
    }
    addWatchCallback(watchCallback) {
        this.watchCallbacks.push(watchCallback);
    }
    interrupt() {
        this.firstMiddlewareAdapter.interrupt();
    }
    shutdown() {
        this.firstMiddlewareAdapter.shutdown();
    }
    restart(onRestarted) {
        this.firstMiddlewareAdapter.restart(onRestarted);
        this.setExecutionCount(0);
        this.setLastExecutionTime("No execution");
    }
    execute(code, onResults) {
        const wrappedOnResults = this._wrapExecutionResultsCallback(onResults);
        this.firstMiddlewareAdapter.execute(code, (message, channel) => {
            wrappedOnResults(message, channel);
            const { msg_type } = message.header;
            if (msg_type === "execute_input") {
                this.setLastExecutionTime("Running ...");
            }
            if (msg_type === "execute_reply") {
                const count = message.content.execution_count;
                this.setExecutionCount(count);
                const timeString = utils_1.executionTime(message);
                this.setLastExecutionTime(timeString);
            }
            const { execution_state } = message.content;
            if (channel == "iopub" &&
                msg_type === "status" &&
                execution_state === "idle") {
                this._callWatchCallbacks();
            }
        });
    }
    executeWatch(code, onResults) {
        this.firstMiddlewareAdapter.execute(code, this._wrapExecutionResultsCallback(onResults));
    }
    _callWatchCallbacks() {
        this.watchCallbacks.forEach((watchCallback) => watchCallback());
    }
    _wrapExecutionResultsCallback(onResults) {
        return (message, channel) => {
            if (channel === "shell") {
                const { status } = message.content;
                if (status === "error" || status === "ok") {
                    onResults({
                        data: status,
                        stream: "status",
                    });
                }
                else {
                    utils_1.log("Kernel: ignoring unexpected value for message.content.status");
                }
            }
            else if (channel === "iopub") {
                if (message.header.msg_type === "execute_input") {
                    onResults({
                        data: message.content.execution_count,
                        stream: "execution_count",
                    });
                }
                const result = utils_1.msgSpecToNotebookFormat(utils_1.msgSpecV4toV5(message));
                onResults(result);
            }
            else if (channel === "stdin") {
                if (message.header.msg_type !== "input_request") {
                    return;
                }
                const { prompt, password } = message.content;
                const inputView = new input_view_1.default({
                    prompt,
                    password,
                }, (input) => this.transport.inputReply(input));
                inputView.attach();
            }
        };
    }
    complete(code, onResults) {
        this.firstMiddlewareAdapter.complete(code, (message, channel) => {
            if (channel !== "shell") {
                utils_1.log("Invalid reply: wrong channel");
                return;
            }
            onResults(message.content);
        });
    }
    inspect(code, cursorPos, onResults) {
        this.firstMiddlewareAdapter.inspect(code, cursorPos, (message, channel) => {
            if (channel !== "shell") {
                utils_1.log("Invalid reply: wrong channel");
                return;
            }
            onResults({
                data: message.content.data,
                found: message.content.found,
            });
        });
    }
    destroy() {
        utils_1.log("Kernel: Destroying");
        this.watchesStore.destroy();
        store_1.default.deleteKernel(this);
        this.transport.destroy();
        if (this.pluginWrapper) {
            this.pluginWrapper.destroyed = true;
        }
        this.emitter.emit("did-destroy");
        this.emitter.dispose();
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], Kernel.prototype, "inspector", void 0);
__decorate([
    mobx_1.computed,
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Kernel.prototype, "executionState", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], Kernel.prototype, "executionCount", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Kernel.prototype, "lastExecutionTime", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, atom_1.TextEditor]),
    __metadata("design:returntype", Promise)
], Kernel.prototype, "setInspectorResult", null);
exports.default = Kernel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2tlcm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUFvRDtBQUNwRCwrQkFBb0Q7QUFDcEQsbUNBQWlDO0FBQ2pDLG1DQU9pQjtBQUNqQixvREFBNEI7QUFDNUIsOERBQTJDO0FBQzNDLDREQUF5QztBQUN6QyxtRkFBMEQ7QUFLMUQsOERBQXFDO0FBQ3JDLDBFQUFpRDtBQU1qRCxTQUFTLDBCQUEwQixDQUNqQyxTQUEwQjtJQUUxQixNQUFNLGdCQUFnQixHQUFvQixDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUM3RCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osV0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDN0IsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDcEIsV0FBRyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7WUFDeEMsT0FBTztTQUNSO1FBRUQsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLGVBQWUsS0FBSyxVQUFVLEVBQUU7WUFFbEQsV0FBRyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFDMUMsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDMUIsV0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7WUFDOUMsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pDLFdBQUcsQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1lBQ3JELE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRTtZQUNuQyxXQUFHLENBQUMsaURBQWlELENBQUMsQ0FBQztZQUN2RCxPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUNuQixX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Z0JBQzFCLEtBQUssRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUs7YUFDN0IsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBTztRQUNMLFdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRTFCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsZUFBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXpCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDckM7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3pCLENBQUM7Q0FDRjtBQTNRQztJQURDLGlCQUFVOzt5Q0FHVDtBQWtERjtJQURDLGVBQVE7Ozs0Q0FHUjtBQU9EO0lBREMsZUFBUTs7OzRDQUdSO0FBT0Q7SUFEQyxlQUFROzs7K0NBR1I7QUFPRDtJQURDLGFBQU07OzZDQUdHLGlCQUFVOztnREFZbkI7QUEvRkgseUJBNlFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW1pdHRlciwgVGV4dEVkaXRvciwgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XHJcbmltcG9ydCB7IG9ic2VydmFibGUsIGFjdGlvbiwgY29tcHV0ZWQgfSBmcm9tIFwibW9ieFwiO1xyXG5pbXBvcnQgeyBpc0VxdWFsIH0gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge1xyXG4gIGxvZyxcclxuICBmb2N1cyxcclxuICBtc2dTcGVjVG9Ob3RlYm9va0Zvcm1hdCxcclxuICBtc2dTcGVjVjR0b1Y1LFxyXG4gIElOU1BFQ1RPUl9VUkksXHJcbiAgZXhlY3V0aW9uVGltZSxcclxufSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgc3RvcmUgZnJvbSBcIi4vc3RvcmVcIjtcclxuaW1wb3J0IFdhdGNoZXNTdG9yZSBmcm9tIFwiLi9zdG9yZS93YXRjaGVzXCI7XHJcbmltcG9ydCBPdXRwdXRTdG9yZSBmcm9tIFwiLi9zdG9yZS9vdXRwdXRcIjtcclxuaW1wb3J0IEh5ZHJvZ2VuS2VybmVsIGZyb20gXCIuL3BsdWdpbi1hcGkvaHlkcm9nZW4ta2VybmVsXCI7XHJcbmltcG9ydCB0eXBlIHtcclxuICBIeWRyb2dlbktlcm5lbE1pZGRsZXdhcmVUaHVuayxcclxuICBIeWRyb2dlbktlcm5lbE1pZGRsZXdhcmUsXHJcbn0gZnJvbSBcIi4vcGx1Z2luLWFwaS9oeWRyb2dlbi10eXBlc1wiO1xyXG5pbXBvcnQgSW5wdXRWaWV3IGZyb20gXCIuL2lucHV0LXZpZXdcIjtcclxuaW1wb3J0IEtlcm5lbFRyYW5zcG9ydCBmcm9tIFwiLi9rZXJuZWwtdHJhbnNwb3J0XCI7XHJcbmltcG9ydCB0eXBlIHsgUmVzdWx0c0NhbGxiYWNrIH0gZnJvbSBcIi4va2VybmVsLXRyYW5zcG9ydFwiO1xyXG5cclxuaW1wb3J0IHR5cGUgeyBNZXNzYWdlIH0gZnJvbSBcIi4vaHlkcm9nZW5cIjtcclxuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcclxuXHJcbmZ1bmN0aW9uIHByb3RlY3RGcm9tSW52YWxpZE1lc3NhZ2VzKFxyXG4gIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrXHJcbik6IFJlc3VsdHNDYWxsYmFjayB7XHJcbiAgY29uc3Qgd3JhcHBlZE9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrID0gKG1lc3NhZ2UsIGNoYW5uZWwpID0+IHtcclxuICAgIGlmICghbWVzc2FnZSkge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IG51bGxcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1lc3NhZ2UuY29udGVudCkge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgY29udGVudFwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChtZXNzYWdlLmNvbnRlbnQuZXhlY3V0aW9uX3N0YXRlID09PSBcInN0YXJ0aW5nXCIpIHtcclxuICAgICAgLy8gS2VybmVscyBzZW5kIGEgc3RhcnRpbmcgc3RhdHVzIG1lc3NhZ2Ugd2l0aCBhbiBlbXB0eSBwYXJlbnRfaGVhZGVyXHJcbiAgICAgIGxvZyhcIkRyb3BwZWQgc3RhcnRpbmcgc3RhdHVzIElPIG1lc3NhZ2VcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1lc3NhZ2UucGFyZW50X2hlYWRlcikge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgcGFyZW50X2hlYWRlclwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbWVzc2FnZS5wYXJlbnRfaGVhZGVyLm1zZ19pZCkge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgcGFyZW50X2hlYWRlci5tc2dfaWRcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1lc3NhZ2UucGFyZW50X2hlYWRlci5tc2dfdHlwZSkge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgcGFyZW50X2hlYWRlci5tc2dfdHlwZVwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbWVzc2FnZS5oZWFkZXIpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIGhlYWRlclwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbWVzc2FnZS5oZWFkZXIubXNnX2lkKSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBoZWFkZXIubXNnX2lkXCIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlLmhlYWRlci5tc2dfdHlwZSkge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgaGVhZGVyLm1zZ190eXBlXCIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgb25SZXN1bHRzKG1lc3NhZ2UsIGNoYW5uZWwpO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiB3cmFwcGVkT25SZXN1bHRzO1xyXG59IC8vIEFkYXB0cyBtaWRkbGV3YXJlIG9iamVjdHMgcHJvdmlkZWQgYnkgcGx1Z2lucyB0byBhbiBpbnRlcm5hbCBpbnRlcmZhY2UuIEluXHJcbi8vIHBhcnRpY3VsYXIsIHRoaXMgaW1wbGVtZW50cyBmYWxsdGhyb3VnaCBsb2dpYyBmb3Igd2hlbiBhIHBsdWdpbiBkZWZpbmVzIHNvbWVcclxuLy8gbWV0aG9kcyAoZS5nLiBleGVjdXRlKSBidXQgZG9lc24ndCBpbXBsZW1lbnQgb3RoZXJzIChlLmcuIGludGVycnVwdCkuIE5vdGVcclxuLy8gdGhhdCBIeWRyb2dlbktlcm5lbE1pZGRsZXdhcmUgb2JqZWN0cyBhcmUgbXV0YWJsZTogdGhleSBtYXkgbG9zZS9nYWluIG1ldGhvZHNcclxuLy8gYXQgYW55IHRpbWUsIGluY2x1ZGluZyBpbiB0aGUgbWlkZGxlIG9mIHByb2Nlc3NpbmcgYSByZXF1ZXN0LiBUaGlzIGNsYXNzIGFsc29cclxuLy8gYWRkcyBiYXNpYyBjaGVja3MgdGhhdCBtZXNzYWdlcyBwYXNzZWQgdmlhIHRoZSBgb25SZXN1bHRzYCBjYWxsYmFja3MgYXJlIG5vdFxyXG4vLyBtaXNzaW5nIGtleSBtYW5kYXRvcnkgZmllbGRzIHNwZWNpZmllZCBpbiB0aGUgSnVweXRlciBtZXNzYWdpbmcgc3BlYy5cclxuXHJcbmNsYXNzIE1pZGRsZXdhcmVBZGFwdGVyIGltcGxlbWVudHMgSHlkcm9nZW5LZXJuZWxNaWRkbGV3YXJlVGh1bmsge1xyXG4gIF9taWRkbGV3YXJlOiBIeWRyb2dlbktlcm5lbE1pZGRsZXdhcmU7XHJcbiAgX25leHQ6IE1pZGRsZXdhcmVBZGFwdGVyIHwgS2VybmVsVHJhbnNwb3J0O1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG1pZGRsZXdhcmU6IEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZSxcclxuICAgIG5leHQ6IE1pZGRsZXdhcmVBZGFwdGVyIHwgS2VybmVsVHJhbnNwb3J0XHJcbiAgKSB7XHJcbiAgICB0aGlzLl9taWRkbGV3YXJlID0gbWlkZGxld2FyZTtcclxuICAgIHRoaXMuX25leHQgPSBuZXh0O1xyXG4gIH1cclxuXHJcbiAgLy8gVGhlIHJldHVybiB2YWx1ZSBvZiB0aGlzIG1ldGhvZCBnZXRzIHBhc3NlZCB0byBwbHVnaW5zISBGb3Igbm93IHdlIGp1c3RcclxuICAvLyByZXR1cm4gdGhlIE1pZGRsZXdhcmVBZGFwdGVyIG9iamVjdCBpdHNlbGYsIHdoaWNoIGlzIHdoeSBhbGwgcHJpdmF0ZVxyXG4gIC8vIGZ1bmN0aW9uYWxpdHkgaXMgcHJlZml4ZWQgd2l0aCBfLCBhbmQgd2h5IE1pZGRsZXdhcmVBZGFwdGVyIGlzIG1hcmtlZCBhc1xyXG4gIC8vIGltcGxlbWVudGluZyBIeWRyb2dlbktlcm5lbE1pZGRsZXdhcmVUaHVuay4gT25jZSBtdWx0aXBsZSBwbHVnaW4gQVBJXHJcbiAgLy8gdmVyc2lvbnMgZXhpc3QsIHdlIG1heSB3YW50IHRvIGdlbmVyYXRlIGEgSHlkcm9nZW5LZXJuZWxNaWRkbGV3YXJlVGh1bmtcclxuICAvLyBzcGVjaWFsaXplZCBmb3IgYSBwYXJ0aWN1bGFyIHBsdWdpbiBBUEkgdmVyc2lvbi5cclxuICBnZXQgX25leHRBc1BsdWdpblR5cGUoKTogSHlkcm9nZW5LZXJuZWxNaWRkbGV3YXJlVGh1bmsge1xyXG4gICAgaWYgKHRoaXMuX25leHQgaW5zdGFuY2VvZiBLZXJuZWxUcmFuc3BvcnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIFwiTWlkZGxld2FyZUFkYXB0ZXI6IF9uZXh0QXNQbHVnaW5UeXBlIG11c3QgbmV2ZXIgYmUgY2FsbGVkIHdoZW4gX25leHQgaXMgS2VybmVsVHJhbnNwb3J0XCJcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5fbmV4dDtcclxuICB9XHJcblxyXG4gIGludGVycnVwdCgpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLl9taWRkbGV3YXJlLmludGVycnVwdCkge1xyXG4gICAgICB0aGlzLl9taWRkbGV3YXJlLmludGVycnVwdCh0aGlzLl9uZXh0QXNQbHVnaW5UeXBlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX25leHQuaW50ZXJydXB0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzaHV0ZG93bigpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLl9taWRkbGV3YXJlLnNodXRkb3duKSB7XHJcbiAgICAgIHRoaXMuX21pZGRsZXdhcmUuc2h1dGRvd24odGhpcy5fbmV4dEFzUGx1Z2luVHlwZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9uZXh0LnNodXRkb3duKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXN0YXJ0KFxyXG4gICAgb25SZXN0YXJ0ZWQ6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWRcclxuICApOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLl9taWRkbGV3YXJlLnJlc3RhcnQpIHtcclxuICAgICAgdGhpcy5fbWlkZGxld2FyZS5yZXN0YXJ0KHRoaXMuX25leHRBc1BsdWdpblR5cGUsIG9uUmVzdGFydGVkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX25leHQucmVzdGFydChvblJlc3RhcnRlZCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBleGVjdXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spOiB2b2lkIHtcclxuICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gcmVwZWF0ZWRseSB3cmFwIHRoZSBvblJlc3VsdHMgY2FsbGJhY2sgZXZlcnkgdGltZSB3ZVxyXG4gICAgLy8gZmFsbCB0aHJvdWdoLCBidXQgd2UgbmVlZCB0byBkbyBpdCBhdCBsZWFzdCBvbmNlIGJlZm9yZSBkZWxlZ2F0aW5nIHRvXHJcbiAgICAvLyB0aGUgS2VybmVsVHJhbnNwb3J0LlxyXG4gICAgY29uc3Qgc2FmZU9uUmVzdWx0cyA9XHJcbiAgICAgIHRoaXMuX21pZGRsZXdhcmUuZXhlY3V0ZSB8fCB0aGlzLl9uZXh0IGluc3RhbmNlb2YgS2VybmVsVHJhbnNwb3J0XHJcbiAgICAgICAgPyBwcm90ZWN0RnJvbUludmFsaWRNZXNzYWdlcyhvblJlc3VsdHMpXHJcbiAgICAgICAgOiBvblJlc3VsdHM7XHJcblxyXG4gICAgaWYgKHRoaXMuX21pZGRsZXdhcmUuZXhlY3V0ZSkge1xyXG4gICAgICB0aGlzLl9taWRkbGV3YXJlLmV4ZWN1dGUodGhpcy5fbmV4dEFzUGx1Z2luVHlwZSwgY29kZSwgc2FmZU9uUmVzdWx0cyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9uZXh0LmV4ZWN1dGUoY29kZSwgc2FmZU9uUmVzdWx0cyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb21wbGV0ZShjb2RlOiBzdHJpbmcsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKTogdm9pZCB7XHJcbiAgICBjb25zdCBzYWZlT25SZXN1bHRzID1cclxuICAgICAgdGhpcy5fbWlkZGxld2FyZS5jb21wbGV0ZSB8fCB0aGlzLl9uZXh0IGluc3RhbmNlb2YgS2VybmVsVHJhbnNwb3J0XHJcbiAgICAgICAgPyBwcm90ZWN0RnJvbUludmFsaWRNZXNzYWdlcyhvblJlc3VsdHMpXHJcbiAgICAgICAgOiBvblJlc3VsdHM7XHJcblxyXG4gICAgaWYgKHRoaXMuX21pZGRsZXdhcmUuY29tcGxldGUpIHtcclxuICAgICAgdGhpcy5fbWlkZGxld2FyZS5jb21wbGV0ZSh0aGlzLl9uZXh0QXNQbHVnaW5UeXBlLCBjb2RlLCBzYWZlT25SZXN1bHRzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX25leHQuY29tcGxldGUoY29kZSwgc2FmZU9uUmVzdWx0cyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpbnNwZWN0KGNvZGU6IHN0cmluZywgY3Vyc29yUG9zOiBudW1iZXIsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKTogdm9pZCB7XHJcbiAgICBjb25zdCBzYWZlT25SZXN1bHRzID1cclxuICAgICAgdGhpcy5fbWlkZGxld2FyZS5pbnNwZWN0IHx8IHRoaXMuX25leHQgaW5zdGFuY2VvZiBLZXJuZWxUcmFuc3BvcnRcclxuICAgICAgICA/IHByb3RlY3RGcm9tSW52YWxpZE1lc3NhZ2VzKG9uUmVzdWx0cylcclxuICAgICAgICA6IG9uUmVzdWx0cztcclxuXHJcbiAgICBpZiAodGhpcy5fbWlkZGxld2FyZS5pbnNwZWN0KSB7XHJcbiAgICAgIHRoaXMuX21pZGRsZXdhcmUuaW5zcGVjdChcclxuICAgICAgICB0aGlzLl9uZXh0QXNQbHVnaW5UeXBlLFxyXG4gICAgICAgIGNvZGUsXHJcbiAgICAgICAgY3Vyc29yUG9zLFxyXG4gICAgICAgIHNhZmVPblJlc3VsdHNcclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX25leHQuaW5zcGVjdChjb2RlLCBjdXJzb3JQb3MsIHNhZmVPblJlc3VsdHMpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgS2VybmVsIHtcclxuICBAb2JzZXJ2YWJsZVxyXG4gIGluc3BlY3RvciA9IHtcclxuICAgIGJ1bmRsZToge30sXHJcbiAgfTtcclxuICBvdXRwdXRTdG9yZSA9IG5ldyBPdXRwdXRTdG9yZSgpO1xyXG4gIHdhdGNoZXNTdG9yZTogV2F0Y2hlc1N0b3JlO1xyXG4gIHdhdGNoQ2FsbGJhY2tzOiBBcnJheTwoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55PiA9IFtdO1xyXG4gIGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpO1xyXG4gIHBsdWdpbldyYXBwZXI6IEh5ZHJvZ2VuS2VybmVsIHwgbnVsbCA9IG51bGw7XHJcbiAgdHJhbnNwb3J0OiBLZXJuZWxUcmFuc3BvcnQ7XHJcbiAgLy8gSW52YXJpYW50OiB0aGUgYC5fbmV4dGAgb2YgZWFjaCBlbnRyeSBpbiB0aGlzIGFycmF5IG11c3QgcG9pbnQgdG8gdGhlIG5leHRcclxuICAvLyBlbGVtZW50IG9mIHRoZSBhcnJheS4gVGhlIGAuX25leHRgIG9mIHRoZSBsYXN0IGVsZW1lbnQgbXVzdCBwb2ludCB0b1xyXG4gIC8vIGB0aGlzLnRyYW5zcG9ydGAuXHJcbiAgbWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZUFkYXB0ZXI+O1xyXG5cclxuICBjb25zdHJ1Y3RvcihrZXJuZWw6IEtlcm5lbFRyYW5zcG9ydCkge1xyXG4gICAgdGhpcy50cmFuc3BvcnQgPSBrZXJuZWw7XHJcbiAgICB0aGlzLndhdGNoZXNTdG9yZSA9IG5ldyBXYXRjaGVzU3RvcmUodGhpcyk7XHJcbiAgICAvLyBBIE1pZGRsZXdhcmVBZGFwdGVyIHRoYXQgZm9yd2FyZHMgYWxsIHJlcXVlc3RzIHRvIGB0aGlzLnRyYW5zcG9ydGAuXHJcbiAgICAvLyBOZWVkZWQgdG8gdGVybWluYXRlIHRoZSBtaWRkbGV3YXJlIGNoYWluIGluIGEgd2F5IHN1Y2ggdGhhdCB0aGUgYG5leHRgXHJcbiAgICAvLyBvYmplY3QgcGFzc2VkIHRvIHRoZSBsYXN0IG1pZGRsZXdhcmUgaXMgbm90IHRoZSBLZXJuZWxUcmFuc3BvcnQgaW5zdGFuY2VcclxuICAgIC8vIGl0c2VsZiAod2hpY2ggd291bGQgYmUgdmlvbGF0ZSBpc29sYXRpb24gb2YgaW50ZXJuYWxzIGZyb20gcGx1Z2lucykuXHJcbiAgICBjb25zdCBkZWxlZ2F0ZVRvVHJhbnNwb3J0ID0gbmV3IE1pZGRsZXdhcmVBZGFwdGVyKHt9LCB0aGlzLnRyYW5zcG9ydCk7XHJcbiAgICB0aGlzLm1pZGRsZXdhcmUgPSBbZGVsZWdhdGVUb1RyYW5zcG9ydF07XHJcbiAgfVxyXG5cclxuICBnZXQga2VybmVsU3BlYygpOiBLZXJuZWxzcGVjTWV0YWRhdGEge1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0Lmtlcm5lbFNwZWM7XHJcbiAgfVxyXG5cclxuICBnZXQgZ3JhbW1hcigpOiBHcmFtbWFyIHtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5ncmFtbWFyO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGxhbmd1YWdlKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQubGFuZ3VhZ2U7XHJcbiAgfVxyXG5cclxuICBnZXQgZGlzcGxheU5hbWUoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5kaXNwbGF5TmFtZTtcclxuICB9XHJcblxyXG4gIGdldCBmaXJzdE1pZGRsZXdhcmVBZGFwdGVyKCk6IE1pZGRsZXdhcmVBZGFwdGVyIHtcclxuICAgIHJldHVybiB0aGlzLm1pZGRsZXdhcmVbMF07XHJcbiAgfVxyXG5cclxuICBhZGRNaWRkbGV3YXJlKG1pZGRsZXdhcmU6IEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZSkge1xyXG4gICAgdGhpcy5taWRkbGV3YXJlLnVuc2hpZnQoXHJcbiAgICAgIG5ldyBNaWRkbGV3YXJlQWRhcHRlcihtaWRkbGV3YXJlLCB0aGlzLm1pZGRsZXdhcmVbMF0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgQGNvbXB1dGVkXHJcbiAgZ2V0IGV4ZWN1dGlvblN0YXRlKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuZXhlY3V0aW9uU3RhdGU7XHJcbiAgfVxyXG5cclxuICBzZXRFeGVjdXRpb25TdGF0ZShzdGF0ZTogc3RyaW5nKSB7XHJcbiAgICB0aGlzLnRyYW5zcG9ydC5zZXRFeGVjdXRpb25TdGF0ZShzdGF0ZSk7XHJcbiAgfVxyXG5cclxuICBAY29tcHV0ZWRcclxuICBnZXQgZXhlY3V0aW9uQ291bnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5leGVjdXRpb25Db3VudDtcclxuICB9XHJcblxyXG4gIHNldEV4ZWN1dGlvbkNvdW50KGNvdW50OiBudW1iZXIpIHtcclxuICAgIHRoaXMudHJhbnNwb3J0LnNldEV4ZWN1dGlvbkNvdW50KGNvdW50KTtcclxuICB9XHJcblxyXG4gIEBjb21wdXRlZFxyXG4gIGdldCBsYXN0RXhlY3V0aW9uVGltZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0Lmxhc3RFeGVjdXRpb25UaW1lO1xyXG4gIH1cclxuXHJcbiAgc2V0TGFzdEV4ZWN1dGlvblRpbWUodGltZVN0cmluZzogc3RyaW5nKSB7XHJcbiAgICB0aGlzLnRyYW5zcG9ydC5zZXRMYXN0RXhlY3V0aW9uVGltZSh0aW1lU3RyaW5nKTtcclxuICB9XHJcblxyXG4gIEBhY3Rpb25cclxuICBhc3luYyBzZXRJbnNwZWN0b3JSZXN1bHQoXHJcbiAgICBidW5kbGU6IFJlY29yZDxzdHJpbmcsIGFueT4sXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IgfCBudWxsIHwgdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBpZiAoaXNFcXVhbCh0aGlzLmluc3BlY3Rvci5idW5kbGUsIGJ1bmRsZSkpIHtcclxuICAgICAgYXdhaXQgYXRvbS53b3Jrc3BhY2UudG9nZ2xlKElOU1BFQ1RPUl9VUkkpO1xyXG4gICAgfSBlbHNlIGlmIChidW5kbGUuc2l6ZSAhPT0gMCkge1xyXG4gICAgICB0aGlzLmluc3BlY3Rvci5idW5kbGUgPSBidW5kbGU7XHJcbiAgICAgIGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oSU5TUEVDVE9SX1VSSSwge1xyXG4gICAgICAgIHNlYXJjaEFsbFBhbmVzOiB0cnVlLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmb2N1cyhlZGl0b3IpO1xyXG4gIH1cclxuXHJcbiAgZ2V0UGx1Z2luV3JhcHBlcigpIHtcclxuICAgIGlmICghdGhpcy5wbHVnaW5XcmFwcGVyKSB7XHJcbiAgICAgIHRoaXMucGx1Z2luV3JhcHBlciA9IG5ldyBIeWRyb2dlbktlcm5lbCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5wbHVnaW5XcmFwcGVyO1xyXG4gIH1cclxuXHJcbiAgYWRkV2F0Y2hDYWxsYmFjayh3YXRjaENhbGxiYWNrOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB7XHJcbiAgICB0aGlzLndhdGNoQ2FsbGJhY2tzLnB1c2god2F0Y2hDYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBpbnRlcnJ1cHQoKSB7XHJcbiAgICB0aGlzLmZpcnN0TWlkZGxld2FyZUFkYXB0ZXIuaW50ZXJydXB0KCk7XHJcbiAgfVxyXG5cclxuICBzaHV0ZG93bigpIHtcclxuICAgIHRoaXMuZmlyc3RNaWRkbGV3YXJlQWRhcHRlci5zaHV0ZG93bigpO1xyXG4gIH1cclxuXHJcbiAgcmVzdGFydChvblJlc3RhcnRlZDogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgdGhpcy5maXJzdE1pZGRsZXdhcmVBZGFwdGVyLnJlc3RhcnQob25SZXN0YXJ0ZWQpO1xyXG4gICAgdGhpcy5zZXRFeGVjdXRpb25Db3VudCgwKTtcclxuICAgIHRoaXMuc2V0TGFzdEV4ZWN1dGlvblRpbWUoXCJObyBleGVjdXRpb25cIik7XHJcbiAgfVxyXG5cclxuICBleGVjdXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB7XHJcbiAgICBjb25zdCB3cmFwcGVkT25SZXN1bHRzID0gdGhpcy5fd3JhcEV4ZWN1dGlvblJlc3VsdHNDYWxsYmFjayhvblJlc3VsdHMpO1xyXG5cclxuICAgIHRoaXMuZmlyc3RNaWRkbGV3YXJlQWRhcHRlci5leGVjdXRlKFxyXG4gICAgICBjb2RlLFxyXG4gICAgICAobWVzc2FnZTogTWVzc2FnZSwgY2hhbm5lbDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgd3JhcHBlZE9uUmVzdWx0cyhtZXNzYWdlLCBjaGFubmVsKTtcclxuICAgICAgICBjb25zdCB7IG1zZ190eXBlIH0gPSBtZXNzYWdlLmhlYWRlcjtcclxuXHJcbiAgICAgICAgaWYgKG1zZ190eXBlID09PSBcImV4ZWN1dGVfaW5wdXRcIikge1xyXG4gICAgICAgICAgdGhpcy5zZXRMYXN0RXhlY3V0aW9uVGltZShcIlJ1bm5pbmcgLi4uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1zZ190eXBlID09PSBcImV4ZWN1dGVfcmVwbHlcIikge1xyXG4gICAgICAgICAgY29uc3QgY291bnQgPSBtZXNzYWdlLmNvbnRlbnQuZXhlY3V0aW9uX2NvdW50O1xyXG4gICAgICAgICAgdGhpcy5zZXRFeGVjdXRpb25Db3VudChjb3VudCk7XHJcbiAgICAgICAgICBjb25zdCB0aW1lU3RyaW5nID0gZXhlY3V0aW9uVGltZShtZXNzYWdlKTtcclxuICAgICAgICAgIHRoaXMuc2V0TGFzdEV4ZWN1dGlvblRpbWUodGltZVN0cmluZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB7IGV4ZWN1dGlvbl9zdGF0ZSB9ID0gbWVzc2FnZS5jb250ZW50O1xyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBjaGFubmVsID09IFwiaW9wdWJcIiAmJlxyXG4gICAgICAgICAgbXNnX3R5cGUgPT09IFwic3RhdHVzXCIgJiZcclxuICAgICAgICAgIGV4ZWN1dGlvbl9zdGF0ZSA9PT0gXCJpZGxlXCJcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHRoaXMuX2NhbGxXYXRjaENhbGxiYWNrcygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGV4ZWN1dGVXYXRjaChjb2RlOiBzdHJpbmcsIG9uUmVzdWx0czogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkge1xyXG4gICAgdGhpcy5maXJzdE1pZGRsZXdhcmVBZGFwdGVyLmV4ZWN1dGUoXHJcbiAgICAgIGNvZGUsXHJcbiAgICAgIHRoaXMuX3dyYXBFeGVjdXRpb25SZXN1bHRzQ2FsbGJhY2sob25SZXN1bHRzKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIF9jYWxsV2F0Y2hDYWxsYmFja3MoKSB7XHJcbiAgICB0aGlzLndhdGNoQ2FsbGJhY2tzLmZvckVhY2goKHdhdGNoQ2FsbGJhY2spID0+IHdhdGNoQ2FsbGJhY2soKSk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAqIFRha2VzIGEgY2FsbGJhY2sgdGhhdCBhY2NlcHRzIGV4ZWN1dGlvbiByZXN1bHRzIGluIGEgaHlkcm9nZW4taW50ZXJuYWxcclxuICAgKiBmb3JtYXQgYW5kIHdyYXBzIGl0IHRvIGFjY2VwdCBKdXB5dGVyIG1lc3NhZ2UvY2hhbm5lbCBwYWlycyBpbnN0ZWFkLlxyXG4gICAqIEtlcm5lbHMgYW5kIHBsdWdpbnMgYWxsIG9wZXJhdGUgb24gdHlwZXMgc3BlY2lmaWVkIGJ5IHRoZSBKdXB5dGVyIG1lc3NhZ2luZ1xyXG4gICAqIHByb3RvY29sIGluIG9yZGVyIHRvIG1heGltaXplIGNvbXBhdGliaWxpdHksIGJ1dCBoeWRyb2dlbiBpbnRlcm5hbGx5IHVzZXNcclxuICAgKiBpdHMgb3duIHR5cGVzLlxyXG4gICAqL1xyXG4gIF93cmFwRXhlY3V0aW9uUmVzdWx0c0NhbGxiYWNrKG9uUmVzdWx0czogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkge1xyXG4gICAgcmV0dXJuIChtZXNzYWdlOiBNZXNzYWdlLCBjaGFubmVsOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGNoYW5uZWwgPT09IFwic2hlbGxcIikge1xyXG4gICAgICAgIGNvbnN0IHsgc3RhdHVzIH0gPSBtZXNzYWdlLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgIGlmIChzdGF0dXMgPT09IFwiZXJyb3JcIiB8fCBzdGF0dXMgPT09IFwib2tcIikge1xyXG4gICAgICAgICAgb25SZXN1bHRzKHtcclxuICAgICAgICAgICAgZGF0YTogc3RhdHVzLFxyXG4gICAgICAgICAgICBzdHJlYW06IFwic3RhdHVzXCIsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbG9nKFwiS2VybmVsOiBpZ25vcmluZyB1bmV4cGVjdGVkIHZhbHVlIGZvciBtZXNzYWdlLmNvbnRlbnQuc3RhdHVzXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmIChjaGFubmVsID09PSBcImlvcHViXCIpIHtcclxuICAgICAgICBpZiAobWVzc2FnZS5oZWFkZXIubXNnX3R5cGUgPT09IFwiZXhlY3V0ZV9pbnB1dFwiKSB7XHJcbiAgICAgICAgICBvblJlc3VsdHMoe1xyXG4gICAgICAgICAgICBkYXRhOiBtZXNzYWdlLmNvbnRlbnQuZXhlY3V0aW9uX2NvdW50LFxyXG4gICAgICAgICAgICBzdHJlYW06IFwiZXhlY3V0aW9uX2NvdW50XCIsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE8obmlraXRhKTogQ29uc2lkZXIgY29udmVydGluZyB0byBWNSBlbHNld2hlcmUsIHNvIHRoYXQgcGx1Z2luc1xyXG4gICAgICAgIC8vIG5ldmVyIGhhdmUgdG8gZGVhbCB3aXRoIG1lc3NhZ2VzIGluIHRoZSBWNCBmb3JtYXRcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBtc2dTcGVjVG9Ob3RlYm9va0Zvcm1hdChtc2dTcGVjVjR0b1Y1KG1lc3NhZ2UpKTtcclxuICAgICAgICBvblJlc3VsdHMocmVzdWx0KTtcclxuICAgICAgfSBlbHNlIGlmIChjaGFubmVsID09PSBcInN0ZGluXCIpIHtcclxuICAgICAgICBpZiAobWVzc2FnZS5oZWFkZXIubXNnX3R5cGUgIT09IFwiaW5wdXRfcmVxdWVzdFwiKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB7IHByb21wdCwgcGFzc3dvcmQgfSA9IG1lc3NhZ2UuY29udGVudDtcclxuICAgICAgICAvLyBUT0RPKG5pa2l0YSk6IHBlcmhhcHMgaXQgd291bGQgbWFrZSBzZW5zZSB0byBpbnN0YWxsIG1pZGRsZXdhcmUgZm9yXHJcbiAgICAgICAgLy8gc2VuZGluZyBpbnB1dCByZXBsaWVzXHJcbiAgICAgICAgY29uc3QgaW5wdXRWaWV3ID0gbmV3IElucHV0VmlldyhcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcHJvbXB0LFxyXG4gICAgICAgICAgICBwYXNzd29yZCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoaW5wdXQ6IHN0cmluZykgPT4gdGhpcy50cmFuc3BvcnQuaW5wdXRSZXBseShpbnB1dClcclxuICAgICAgICApO1xyXG4gICAgICAgIGlucHV0Vmlldy5hdHRhY2goKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbXBsZXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB7XHJcbiAgICB0aGlzLmZpcnN0TWlkZGxld2FyZUFkYXB0ZXIuY29tcGxldGUoXHJcbiAgICAgIGNvZGUsXHJcbiAgICAgIChtZXNzYWdlOiBNZXNzYWdlLCBjaGFubmVsOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoY2hhbm5lbCAhPT0gXCJzaGVsbFwiKSB7XHJcbiAgICAgICAgICBsb2coXCJJbnZhbGlkIHJlcGx5OiB3cm9uZyBjaGFubmVsXCIpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25SZXN1bHRzKG1lc3NhZ2UuY29udGVudCk7XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBpbnNwZWN0KFxyXG4gICAgY29kZTogc3RyaW5nLFxyXG4gICAgY3Vyc29yUG9zOiBudW1iZXIsXHJcbiAgICBvblJlc3VsdHM6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnlcclxuICApIHtcclxuICAgIHRoaXMuZmlyc3RNaWRkbGV3YXJlQWRhcHRlci5pbnNwZWN0KFxyXG4gICAgICBjb2RlLFxyXG4gICAgICBjdXJzb3JQb3MsXHJcbiAgICAgIChtZXNzYWdlOiBNZXNzYWdlLCBjaGFubmVsOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoY2hhbm5lbCAhPT0gXCJzaGVsbFwiKSB7XHJcbiAgICAgICAgICBsb2coXCJJbnZhbGlkIHJlcGx5OiB3cm9uZyBjaGFubmVsXCIpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25SZXN1bHRzKHtcclxuICAgICAgICAgIGRhdGE6IG1lc3NhZ2UuY29udGVudC5kYXRhLFxyXG4gICAgICAgICAgZm91bmQ6IG1lc3NhZ2UuY29udGVudC5mb3VuZCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICBsb2coXCJLZXJuZWw6IERlc3Ryb3lpbmdcIik7XHJcbiAgICAvLyBUaGlzIGlzIGZvciBjbGVhbnVwIHRvIGltcHJvdmUgcGVyZm9ybWFuY2VcclxuICAgIHRoaXMud2F0Y2hlc1N0b3JlLmRlc3Ryb3koKTtcclxuICAgIHN0b3JlLmRlbGV0ZUtlcm5lbCh0aGlzKTtcclxuICAgIHRoaXMudHJhbnNwb3J0LmRlc3Ryb3koKTtcclxuXHJcbiAgICBpZiAodGhpcy5wbHVnaW5XcmFwcGVyKSB7XHJcbiAgICAgIHRoaXMucGx1Z2luV3JhcHBlci5kZXN0cm95ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiZGlkLWRlc3Ryb3lcIik7XHJcbiAgICB0aGlzLmVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxufVxyXG4iXX0=