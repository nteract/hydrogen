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
const isEqual_1 = __importDefault(require("lodash/isEqual"));
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
            (0, utils_1.log)("Invalid message: null");
            return;
        }
        if (!message.content) {
            (0, utils_1.log)("Invalid message: Missing content");
            return;
        }
        if (message.content.execution_state === "starting") {
            (0, utils_1.log)("Dropped starting status IO message");
            return;
        }
        if (!message.parent_header) {
            (0, utils_1.log)("Invalid message: Missing parent_header");
            return;
        }
        if (!message.parent_header.msg_id) {
            (0, utils_1.log)("Invalid message: Missing parent_header.msg_id");
            return;
        }
        if (!message.parent_header.msg_type) {
            (0, utils_1.log)("Invalid message: Missing parent_header.msg_type");
            return;
        }
        if (!message.header) {
            (0, utils_1.log)("Invalid message: Missing header");
            return;
        }
        if (!message.header.msg_id) {
            (0, utils_1.log)("Invalid message: Missing header.msg_id");
            return;
        }
        if (!message.header.msg_type) {
            (0, utils_1.log)("Invalid message: Missing header.msg_type");
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
        if ((0, isEqual_1.default)(this.inspector.bundle, bundle)) {
            await atom.workspace.toggle(utils_1.INSPECTOR_URI);
        }
        else if (bundle.size !== 0) {
            this.inspector.bundle = bundle;
            await atom.workspace.open(utils_1.INSPECTOR_URI, {
                searchAllPanes: true,
            });
        }
        (0, utils_1.focus)(editor);
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
                const timeString = (0, utils_1.executionTime)(message);
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
                    (0, utils_1.log)("Kernel: ignoring unexpected value for message.content.status");
                }
            }
            else if (channel === "iopub") {
                if (message.header.msg_type === "execute_input") {
                    onResults({
                        data: message.content.execution_count,
                        stream: "execution_count",
                    });
                }
                const result = (0, utils_1.msgSpecToNotebookFormat)((0, utils_1.msgSpecV4toV5)(message));
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
                (0, utils_1.log)("Invalid reply: wrong channel");
                return;
            }
            onResults(message.content);
        });
    }
    inspect(code, cursorPos, onResults) {
        this.firstMiddlewareAdapter.inspect(code, cursorPos, (message, channel) => {
            if (channel !== "shell") {
                (0, utils_1.log)("Invalid reply: wrong channel");
                return;
            }
            onResults({
                data: message.content.data,
                found: message.content.found,
            });
        });
    }
    destroy() {
        (0, utils_1.log)("Kernel: Destroying");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2tlcm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUFvRDtBQUNwRCwrQkFBb0Q7QUFDcEQsNkRBQXFDO0FBQ3JDLG1DQU9pQjtBQUNqQixvREFBNEI7QUFDNUIsOERBQTJDO0FBQzNDLDREQUF5QztBQUN6QyxtRkFBMEQ7QUFLMUQsOERBQXFDO0FBQ3JDLDBFQUFpRDtBQU9qRCxTQUFTLDBCQUEwQixDQUNqQyxTQUEwQjtJQUUxQixNQUFNLGdCQUFnQixHQUFvQixDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUM3RCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osSUFBQSxXQUFHLEVBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM3QixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUNwQixJQUFBLFdBQUcsRUFBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ3hDLE9BQU87U0FDUjtRQUVELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEtBQUssVUFBVSxFQUFFO1lBRWxELElBQUEsV0FBRyxFQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFDMUMsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDMUIsSUFBQSxXQUFHLEVBQUMsd0NBQXdDLENBQUMsQ0FBQztZQUM5QyxPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakMsSUFBQSxXQUFHLEVBQUMsK0NBQStDLENBQUMsQ0FBQztZQUNyRCxPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUU7WUFDbkMsSUFBQSxXQUFHLEVBQUMsaURBQWlELENBQUMsQ0FBQztZQUN2RCxPQUFPO1NBQ1I7UUFFRCxJQUFJLENB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OEJBQThCLENBQUMsQ0FBQztnQkFDcEMsT0FBTzthQUNSO1lBRUQsU0FBUyxDQUFDO2dCQUNSLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUk7Z0JBQzFCLEtBQUssRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUs7YUFDN0IsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBTztRQUNMLElBQUEsV0FBRyxFQUFDLG9CQUFvQixDQUFDLENBQUM7UUFFMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixlQUFLLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFekIsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUNyQztRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDekIsQ0FBQztDQUNGO0FBNVFDO0lBQUMsaUJBQVU7O3lDQUdUO0FBaURGO0lBQUMsZUFBUTs7OzRDQUdSO0FBTUQ7SUFBQyxlQUFROzs7NENBR1I7QUFNRDtJQUFDLGVBQVE7OzsrQ0FHUjtBQU9LO0lBREwsYUFBTTs7NkNBR0csaUJBQVU7O2dEQVluQjtBQS9GSCx5QkE2UUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbWl0dGVyLCBUZXh0RWRpdG9yLCBHcmFtbWFyIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IG9ic2VydmFibGUsIGFjdGlvbiwgY29tcHV0ZWQgfSBmcm9tIFwibW9ieFwiO1xuaW1wb3J0IGlzRXF1YWwgZnJvbSBcImxvZGFzaC9pc0VxdWFsXCI7XG5pbXBvcnQge1xuICBsb2csXG4gIGZvY3VzLFxuICBtc2dTcGVjVG9Ob3RlYm9va0Zvcm1hdCxcbiAgbXNnU3BlY1Y0dG9WNSxcbiAgSU5TUEVDVE9SX1VSSSxcbiAgZXhlY3V0aW9uVGltZSxcbn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBzdG9yZSBmcm9tIFwiLi9zdG9yZVwiO1xuaW1wb3J0IFdhdGNoZXNTdG9yZSBmcm9tIFwiLi9zdG9yZS93YXRjaGVzXCI7XG5pbXBvcnQgT3V0cHV0U3RvcmUgZnJvbSBcIi4vc3RvcmUvb3V0cHV0XCI7XG5pbXBvcnQgSHlkcm9nZW5LZXJuZWwgZnJvbSBcIi4vcGx1Z2luLWFwaS9oeWRyb2dlbi1rZXJuZWxcIjtcbmltcG9ydCB0eXBlIHtcbiAgSHlkcm9nZW5LZXJuZWxNaWRkbGV3YXJlVGh1bmssXG4gIEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZSxcbn0gZnJvbSBcIi4vcGx1Z2luLWFwaS9oeWRyb2dlbi10eXBlc1wiO1xuaW1wb3J0IElucHV0VmlldyBmcm9tIFwiLi9pbnB1dC12aWV3XCI7XG5pbXBvcnQgS2VybmVsVHJhbnNwb3J0IGZyb20gXCIuL2tlcm5lbC10cmFuc3BvcnRcIjtcbmltcG9ydCB0eXBlIHsgUmVzdWx0c0NhbGxiYWNrIH0gZnJvbSBcIi4va2VybmVsLXRyYW5zcG9ydFwiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWwgYXMgSnVweXRlcmxhYktlcm5lbCB9IGZyb20gXCJAanVweXRlcmxhYi9zZXJ2aWNlc1wiO1xuXG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tIFwiLi9oeWRyb2dlblwiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcblxuZnVuY3Rpb24gcHJvdGVjdEZyb21JbnZhbGlkTWVzc2FnZXMoXG4gIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrXG4pOiBSZXN1bHRzQ2FsbGJhY2sge1xuICBjb25zdCB3cmFwcGVkT25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2sgPSAobWVzc2FnZSwgY2hhbm5lbCkgPT4ge1xuICAgIGlmICghbWVzc2FnZSkge1xuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBudWxsXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghbWVzc2FnZS5jb250ZW50KSB7XG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgY29udGVudFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobWVzc2FnZS5jb250ZW50LmV4ZWN1dGlvbl9zdGF0ZSA9PT0gXCJzdGFydGluZ1wiKSB7XG4gICAgICAvLyBLZXJuZWxzIHNlbmQgYSBzdGFydGluZyBzdGF0dXMgbWVzc2FnZSB3aXRoIGFuIGVtcHR5IHBhcmVudF9oZWFkZXJcbiAgICAgIGxvZyhcIkRyb3BwZWQgc3RhcnRpbmcgc3RhdHVzIElPIG1lc3NhZ2VcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFtZXNzYWdlLnBhcmVudF9oZWFkZXIpIHtcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBwYXJlbnRfaGVhZGVyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghbWVzc2FnZS5wYXJlbnRfaGVhZGVyLm1zZ19pZCkge1xuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIHBhcmVudF9oZWFkZXIubXNnX2lkXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghbWVzc2FnZS5wYXJlbnRfaGVhZGVyLm1zZ190eXBlKSB7XG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgcGFyZW50X2hlYWRlci5tc2dfdHlwZVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIW1lc3NhZ2UuaGVhZGVyKSB7XG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgaGVhZGVyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghbWVzc2FnZS5oZWFkZXIubXNnX2lkKSB7XG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgaGVhZGVyLm1zZ19pZFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIW1lc3NhZ2UuaGVhZGVyLm1zZ190eXBlKSB7XG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgaGVhZGVyLm1zZ190eXBlXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9uUmVzdWx0cyhtZXNzYWdlLCBjaGFubmVsKTtcbiAgfTtcblxuICByZXR1cm4gd3JhcHBlZE9uUmVzdWx0cztcbn0gLy8gQWRhcHRzIG1pZGRsZXdhcmUgb2JqZWN0cyBwcm92aWRlZCBieSBwbHVnaW5zIHRvIGFuIGludGVybmFsIGludGVyZmFjZS4gSW5cbi8vIHBhcnRpY3VsYXIsIHRoaXMgaW1wbGVtZW50cyBmYWxsdGhyb3VnaCBsb2dpYyBmb3Igd2hlbiBhIHBsdWdpbiBkZWZpbmVzIHNvbWVcbi8vIG1ldGhvZHMgKGUuZy4gZXhlY3V0ZSkgYnV0IGRvZXNuJ3QgaW1wbGVtZW50IG90aGVycyAoZS5nLiBpbnRlcnJ1cHQpLiBOb3RlXG4vLyB0aGF0IEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZSBvYmplY3RzIGFyZSBtdXRhYmxlOiB0aGV5IG1heSBsb3NlL2dhaW4gbWV0aG9kc1xuLy8gYXQgYW55IHRpbWUsIGluY2x1ZGluZyBpbiB0aGUgbWlkZGxlIG9mIHByb2Nlc3NpbmcgYSByZXF1ZXN0LiBUaGlzIGNsYXNzIGFsc29cbi8vIGFkZHMgYmFzaWMgY2hlY2tzIHRoYXQgbWVzc2FnZXMgcGFzc2VkIHZpYSB0aGUgYG9uUmVzdWx0c2AgY2FsbGJhY2tzIGFyZSBub3Rcbi8vIG1pc3Npbmcga2V5IG1hbmRhdG9yeSBmaWVsZHMgc3BlY2lmaWVkIGluIHRoZSBKdXB5dGVyIG1lc3NhZ2luZyBzcGVjLlxuXG5jbGFzcyBNaWRkbGV3YXJlQWRhcHRlciBpbXBsZW1lbnRzIEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZVRodW5rIHtcbiAgX21pZGRsZXdhcmU6IEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZTtcbiAgX25leHQ6IE1pZGRsZXdhcmVBZGFwdGVyIHwgS2VybmVsVHJhbnNwb3J0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG1pZGRsZXdhcmU6IEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZSxcbiAgICBuZXh0OiBNaWRkbGV3YXJlQWRhcHRlciB8IEtlcm5lbFRyYW5zcG9ydFxuICApIHtcbiAgICB0aGlzLl9taWRkbGV3YXJlID0gbWlkZGxld2FyZTtcbiAgICB0aGlzLl9uZXh0ID0gbmV4dDtcbiAgfVxuXG4gIC8vIFRoZSByZXR1cm4gdmFsdWUgb2YgdGhpcyBtZXRob2QgZ2V0cyBwYXNzZWQgdG8gcGx1Z2lucyEgRm9yIG5vdyB3ZSBqdXN0XG4gIC8vIHJldHVybiB0aGUgTWlkZGxld2FyZUFkYXB0ZXIgb2JqZWN0IGl0c2VsZiwgd2hpY2ggaXMgd2h5IGFsbCBwcml2YXRlXG4gIC8vIGZ1bmN0aW9uYWxpdHkgaXMgcHJlZml4ZWQgd2l0aCBfLCBhbmQgd2h5IE1pZGRsZXdhcmVBZGFwdGVyIGlzIG1hcmtlZCBhc1xuICAvLyBpbXBsZW1lbnRpbmcgSHlkcm9nZW5LZXJuZWxNaWRkbGV3YXJlVGh1bmsuIE9uY2UgbXVsdGlwbGUgcGx1Z2luIEFQSVxuICAvLyB2ZXJzaW9ucyBleGlzdCwgd2UgbWF5IHdhbnQgdG8gZ2VuZXJhdGUgYSBIeWRyb2dlbktlcm5lbE1pZGRsZXdhcmVUaHVua1xuICAvLyBzcGVjaWFsaXplZCBmb3IgYSBwYXJ0aWN1bGFyIHBsdWdpbiBBUEkgdmVyc2lvbi5cbiAgZ2V0IF9uZXh0QXNQbHVnaW5UeXBlKCk6IEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZVRodW5rIHtcbiAgICBpZiAodGhpcy5fbmV4dCBpbnN0YW5jZW9mIEtlcm5lbFRyYW5zcG9ydCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIk1pZGRsZXdhcmVBZGFwdGVyOiBfbmV4dEFzUGx1Z2luVHlwZSBtdXN0IG5ldmVyIGJlIGNhbGxlZCB3aGVuIF9uZXh0IGlzIEtlcm5lbFRyYW5zcG9ydFwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9uZXh0O1xuICB9XG5cbiAgaW50ZXJydXB0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9taWRkbGV3YXJlLmludGVycnVwdCkge1xuICAgICAgdGhpcy5fbWlkZGxld2FyZS5pbnRlcnJ1cHQodGhpcy5fbmV4dEFzUGx1Z2luVHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX25leHQuaW50ZXJydXB0KCk7XG4gICAgfVxuICB9XG5cbiAgc2h1dGRvd24oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX21pZGRsZXdhcmUuc2h1dGRvd24pIHtcbiAgICAgIHRoaXMuX21pZGRsZXdhcmUuc2h1dGRvd24odGhpcy5fbmV4dEFzUGx1Z2luVHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX25leHQuc2h1dGRvd24oKTtcbiAgICB9XG4gIH1cblxuICByZXN0YXJ0KFxuICAgIG9uUmVzdGFydGVkOiAoKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkgfCBudWxsIHwgdW5kZWZpbmVkXG4gICk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9taWRkbGV3YXJlLnJlc3RhcnQpIHtcbiAgICAgIHRoaXMuX21pZGRsZXdhcmUucmVzdGFydCh0aGlzLl9uZXh0QXNQbHVnaW5UeXBlLCBvblJlc3RhcnRlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX25leHQucmVzdGFydChvblJlc3RhcnRlZCk7XG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZShjb2RlOiBzdHJpbmcsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKTogdm9pZCB7XG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byByZXBlYXRlZGx5IHdyYXAgdGhlIG9uUmVzdWx0cyBjYWxsYmFjayBldmVyeSB0aW1lIHdlXG4gICAgLy8gZmFsbCB0aHJvdWdoLCBidXQgd2UgbmVlZCB0byBkbyBpdCBhdCBsZWFzdCBvbmNlIGJlZm9yZSBkZWxlZ2F0aW5nIHRvXG4gICAgLy8gdGhlIEtlcm5lbFRyYW5zcG9ydC5cbiAgICBjb25zdCBzYWZlT25SZXN1bHRzID1cbiAgICAgIHRoaXMuX21pZGRsZXdhcmUuZXhlY3V0ZSB8fCB0aGlzLl9uZXh0IGluc3RhbmNlb2YgS2VybmVsVHJhbnNwb3J0XG4gICAgICAgID8gcHJvdGVjdEZyb21JbnZhbGlkTWVzc2FnZXMob25SZXN1bHRzKVxuICAgICAgICA6IG9uUmVzdWx0cztcblxuICAgIGlmICh0aGlzLl9taWRkbGV3YXJlLmV4ZWN1dGUpIHtcbiAgICAgIHRoaXMuX21pZGRsZXdhcmUuZXhlY3V0ZSh0aGlzLl9uZXh0QXNQbHVnaW5UeXBlLCBjb2RlLCBzYWZlT25SZXN1bHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbmV4dC5leGVjdXRlKGNvZGUsIHNhZmVPblJlc3VsdHMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBsZXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spOiB2b2lkIHtcbiAgICBjb25zdCBzYWZlT25SZXN1bHRzID1cbiAgICAgIHRoaXMuX21pZGRsZXdhcmUuY29tcGxldGUgfHwgdGhpcy5fbmV4dCBpbnN0YW5jZW9mIEtlcm5lbFRyYW5zcG9ydFxuICAgICAgICA/IHByb3RlY3RGcm9tSW52YWxpZE1lc3NhZ2VzKG9uUmVzdWx0cylcbiAgICAgICAgOiBvblJlc3VsdHM7XG5cbiAgICBpZiAodGhpcy5fbWlkZGxld2FyZS5jb21wbGV0ZSkge1xuICAgICAgdGhpcy5fbWlkZGxld2FyZS5jb21wbGV0ZSh0aGlzLl9uZXh0QXNQbHVnaW5UeXBlLCBjb2RlLCBzYWZlT25SZXN1bHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbmV4dC5jb21wbGV0ZShjb2RlLCBzYWZlT25SZXN1bHRzKTtcbiAgICB9XG4gIH1cblxuICBpbnNwZWN0KGNvZGU6IHN0cmluZywgY3Vyc29yUG9zOiBudW1iZXIsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKTogdm9pZCB7XG4gICAgY29uc3Qgc2FmZU9uUmVzdWx0cyA9XG4gICAgICB0aGlzLl9taWRkbGV3YXJlLmluc3BlY3QgfHwgdGhpcy5fbmV4dCBpbnN0YW5jZW9mIEtlcm5lbFRyYW5zcG9ydFxuICAgICAgICA/IHByb3RlY3RGcm9tSW52YWxpZE1lc3NhZ2VzKG9uUmVzdWx0cylcbiAgICAgICAgOiBvblJlc3VsdHM7XG5cbiAgICBpZiAodGhpcy5fbWlkZGxld2FyZS5pbnNwZWN0KSB7XG4gICAgICB0aGlzLl9taWRkbGV3YXJlLmluc3BlY3QoXG4gICAgICAgIHRoaXMuX25leHRBc1BsdWdpblR5cGUsXG4gICAgICAgIGNvZGUsXG4gICAgICAgIGN1cnNvclBvcyxcbiAgICAgICAgc2FmZU9uUmVzdWx0c1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbmV4dC5pbnNwZWN0KGNvZGUsIGN1cnNvclBvcywgc2FmZU9uUmVzdWx0cyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEtlcm5lbCB7XG4gIEBvYnNlcnZhYmxlXG4gIGluc3BlY3RvciA9IHtcbiAgICBidW5kbGU6IHt9LFxuICB9O1xuICBvdXRwdXRTdG9yZSA9IG5ldyBPdXRwdXRTdG9yZSgpO1xuICB3YXRjaGVzU3RvcmU6IFdhdGNoZXNTdG9yZTtcbiAgd2F0Y2hDYWxsYmFja3M6IEFycmF5PCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnk+ID0gW107XG4gIGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpO1xuICBwbHVnaW5XcmFwcGVyOiBIeWRyb2dlbktlcm5lbCB8IG51bGwgPSBudWxsO1xuICB0cmFuc3BvcnQ6IEtlcm5lbFRyYW5zcG9ydDtcbiAgLy8gSW52YXJpYW50OiB0aGUgYC5fbmV4dGAgb2YgZWFjaCBlbnRyeSBpbiB0aGlzIGFycmF5IG11c3QgcG9pbnQgdG8gdGhlIG5leHRcbiAgLy8gZWxlbWVudCBvZiB0aGUgYXJyYXkuIFRoZSBgLl9uZXh0YCBvZiB0aGUgbGFzdCBlbGVtZW50IG11c3QgcG9pbnQgdG9cbiAgLy8gYHRoaXMudHJhbnNwb3J0YC5cbiAgbWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZUFkYXB0ZXI+O1xuXG4gIGNvbnN0cnVjdG9yKGtlcm5lbDogS2VybmVsVHJhbnNwb3J0KSB7XG4gICAgdGhpcy50cmFuc3BvcnQgPSBrZXJuZWw7XG4gICAgdGhpcy53YXRjaGVzU3RvcmUgPSBuZXcgV2F0Y2hlc1N0b3JlKHRoaXMpO1xuICAgIC8vIEEgTWlkZGxld2FyZUFkYXB0ZXIgdGhhdCBmb3J3YXJkcyBhbGwgcmVxdWVzdHMgdG8gYHRoaXMudHJhbnNwb3J0YC5cbiAgICAvLyBOZWVkZWQgdG8gdGVybWluYXRlIHRoZSBtaWRkbGV3YXJlIGNoYWluIGluIGEgd2F5IHN1Y2ggdGhhdCB0aGUgYG5leHRgXG4gICAgLy8gb2JqZWN0IHBhc3NlZCB0byB0aGUgbGFzdCBtaWRkbGV3YXJlIGlzIG5vdCB0aGUgS2VybmVsVHJhbnNwb3J0IGluc3RhbmNlXG4gICAgLy8gaXRzZWxmICh3aGljaCB3b3VsZCBiZSB2aW9sYXRlIGlzb2xhdGlvbiBvZiBpbnRlcm5hbHMgZnJvbSBwbHVnaW5zKS5cbiAgICBjb25zdCBkZWxlZ2F0ZVRvVHJhbnNwb3J0ID0gbmV3IE1pZGRsZXdhcmVBZGFwdGVyKHt9LCB0aGlzLnRyYW5zcG9ydCk7XG4gICAgdGhpcy5taWRkbGV3YXJlID0gW2RlbGVnYXRlVG9UcmFuc3BvcnRdO1xuICB9XG5cbiAgZ2V0IGtlcm5lbFNwZWMoKTogSnVweXRlcmxhYktlcm5lbC5JU3BlY01vZGVsIHwgS2VybmVsc3BlY01ldGFkYXRhIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQua2VybmVsU3BlYztcbiAgfVxuXG4gIGdldCBncmFtbWFyKCk6IEdyYW1tYXIge1xuICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5ncmFtbWFyO1xuICB9XG5cbiAgZ2V0IGxhbmd1YWdlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0Lmxhbmd1YWdlO1xuICB9XG5cbiAgZ2V0IGRpc3BsYXlOYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LmRpc3BsYXlOYW1lO1xuICB9XG5cbiAgZ2V0IGZpcnN0TWlkZGxld2FyZUFkYXB0ZXIoKTogTWlkZGxld2FyZUFkYXB0ZXIge1xuICAgIHJldHVybiB0aGlzLm1pZGRsZXdhcmVbMF07XG4gIH1cblxuICBhZGRNaWRkbGV3YXJlKG1pZGRsZXdhcmU6IEh5ZHJvZ2VuS2VybmVsTWlkZGxld2FyZSkge1xuICAgIHRoaXMubWlkZGxld2FyZS51bnNoaWZ0KFxuICAgICAgbmV3IE1pZGRsZXdhcmVBZGFwdGVyKG1pZGRsZXdhcmUsIHRoaXMubWlkZGxld2FyZVswXSlcbiAgICApO1xuICB9XG5cbiAgQGNvbXB1dGVkXG4gIGdldCBleGVjdXRpb25TdGF0ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5leGVjdXRpb25TdGF0ZTtcbiAgfVxuXG4gIHNldEV4ZWN1dGlvblN0YXRlKHN0YXRlOiBzdHJpbmcpIHtcbiAgICB0aGlzLnRyYW5zcG9ydC5zZXRFeGVjdXRpb25TdGF0ZShzdGF0ZSk7XG4gIH1cblxuICBAY29tcHV0ZWRcbiAgZ2V0IGV4ZWN1dGlvbkNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNwb3J0LmV4ZWN1dGlvbkNvdW50O1xuICB9XG5cbiAgc2V0RXhlY3V0aW9uQ291bnQoY291bnQ6IG51bWJlcikge1xuICAgIHRoaXMudHJhbnNwb3J0LnNldEV4ZWN1dGlvbkNvdW50KGNvdW50KTtcbiAgfVxuXG4gIEBjb21wdXRlZFxuICBnZXQgbGFzdEV4ZWN1dGlvblRpbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQubGFzdEV4ZWN1dGlvblRpbWU7XG4gIH1cblxuICBzZXRMYXN0RXhlY3V0aW9uVGltZSh0aW1lU3RyaW5nOiBzdHJpbmcpIHtcbiAgICB0aGlzLnRyYW5zcG9ydC5zZXRMYXN0RXhlY3V0aW9uVGltZSh0aW1lU3RyaW5nKTtcbiAgfVxuXG4gIEBhY3Rpb25cbiAgYXN5bmMgc2V0SW5zcGVjdG9yUmVzdWx0KFxuICAgIGJ1bmRsZTogUmVjb3JkPHN0cmluZywgYW55PixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IgfCBudWxsIHwgdW5kZWZpbmVkXG4gICkge1xuICAgIGlmIChpc0VxdWFsKHRoaXMuaW5zcGVjdG9yLmJ1bmRsZSwgYnVuZGxlKSkge1xuICAgICAgYXdhaXQgYXRvbS53b3Jrc3BhY2UudG9nZ2xlKElOU1BFQ1RPUl9VUkkpO1xuICAgIH0gZWxzZSBpZiAoYnVuZGxlLnNpemUgIT09IDApIHtcbiAgICAgIHRoaXMuaW5zcGVjdG9yLmJ1bmRsZSA9IGJ1bmRsZTtcbiAgICAgIGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oSU5TUEVDVE9SX1VSSSwge1xuICAgICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZvY3VzKGVkaXRvcik7XG4gIH1cblxuICBnZXRQbHVnaW5XcmFwcGVyKCkge1xuICAgIGlmICghdGhpcy5wbHVnaW5XcmFwcGVyKSB7XG4gICAgICB0aGlzLnBsdWdpbldyYXBwZXIgPSBuZXcgSHlkcm9nZW5LZXJuZWwodGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucGx1Z2luV3JhcHBlcjtcbiAgfVxuXG4gIGFkZFdhdGNoQ2FsbGJhY2sod2F0Y2hDYWxsYmFjazogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkge1xuICAgIHRoaXMud2F0Y2hDYWxsYmFja3MucHVzaCh3YXRjaENhbGxiYWNrKTtcbiAgfVxuXG4gIGludGVycnVwdCgpIHtcbiAgICB0aGlzLmZpcnN0TWlkZGxld2FyZUFkYXB0ZXIuaW50ZXJydXB0KCk7XG4gIH1cblxuICBzaHV0ZG93bigpIHtcbiAgICB0aGlzLmZpcnN0TWlkZGxld2FyZUFkYXB0ZXIuc2h1dGRvd24oKTtcbiAgfVxuXG4gIHJlc3RhcnQob25SZXN0YXJ0ZWQ/OiAoKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5maXJzdE1pZGRsZXdhcmVBZGFwdGVyLnJlc3RhcnQob25SZXN0YXJ0ZWQpO1xuICAgIHRoaXMuc2V0RXhlY3V0aW9uQ291bnQoMCk7XG4gICAgdGhpcy5zZXRMYXN0RXhlY3V0aW9uVGltZShcIk5vIGV4ZWN1dGlvblwiKTtcbiAgfVxuXG4gIGV4ZWN1dGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHtcbiAgICBjb25zdCB3cmFwcGVkT25SZXN1bHRzID0gdGhpcy5fd3JhcEV4ZWN1dGlvblJlc3VsdHNDYWxsYmFjayhvblJlc3VsdHMpO1xuXG4gICAgdGhpcy5maXJzdE1pZGRsZXdhcmVBZGFwdGVyLmV4ZWN1dGUoXG4gICAgICBjb2RlLFxuICAgICAgKG1lc3NhZ2U6IE1lc3NhZ2UsIGNoYW5uZWw6IHN0cmluZykgPT4ge1xuICAgICAgICB3cmFwcGVkT25SZXN1bHRzKG1lc3NhZ2UsIGNoYW5uZWwpO1xuICAgICAgICBjb25zdCB7IG1zZ190eXBlIH0gPSBtZXNzYWdlLmhlYWRlcjtcblxuICAgICAgICBpZiAobXNnX3R5cGUgPT09IFwiZXhlY3V0ZV9pbnB1dFwiKSB7XG4gICAgICAgICAgdGhpcy5zZXRMYXN0RXhlY3V0aW9uVGltZShcIlJ1bm5pbmcgLi4uXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1zZ190eXBlID09PSBcImV4ZWN1dGVfcmVwbHlcIikge1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gbWVzc2FnZS5jb250ZW50LmV4ZWN1dGlvbl9jb3VudDtcbiAgICAgICAgICB0aGlzLnNldEV4ZWN1dGlvbkNvdW50KGNvdW50KTtcbiAgICAgICAgICBjb25zdCB0aW1lU3RyaW5nID0gZXhlY3V0aW9uVGltZShtZXNzYWdlKTtcbiAgICAgICAgICB0aGlzLnNldExhc3RFeGVjdXRpb25UaW1lKHRpbWVTdHJpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBleGVjdXRpb25fc3RhdGUgfSA9IG1lc3NhZ2UuY29udGVudDtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgY2hhbm5lbCA9PSBcImlvcHViXCIgJiZcbiAgICAgICAgICBtc2dfdHlwZSA9PT0gXCJzdGF0dXNcIiAmJlxuICAgICAgICAgIGV4ZWN1dGlvbl9zdGF0ZSA9PT0gXCJpZGxlXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5fY2FsbFdhdGNoQ2FsbGJhY2tzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZXhlY3V0ZVdhdGNoKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB7XG4gICAgdGhpcy5maXJzdE1pZGRsZXdhcmVBZGFwdGVyLmV4ZWN1dGUoXG4gICAgICBjb2RlLFxuICAgICAgdGhpcy5fd3JhcEV4ZWN1dGlvblJlc3VsdHNDYWxsYmFjayhvblJlc3VsdHMpXG4gICAgKTtcbiAgfVxuXG4gIF9jYWxsV2F0Y2hDYWxsYmFja3MoKSB7XG4gICAgdGhpcy53YXRjaENhbGxiYWNrcy5mb3JFYWNoKCh3YXRjaENhbGxiYWNrKSA9PiB3YXRjaENhbGxiYWNrKCkpO1xuICB9XG5cbiAgLypcbiAgICogVGFrZXMgYSBjYWxsYmFjayB0aGF0IGFjY2VwdHMgZXhlY3V0aW9uIHJlc3VsdHMgaW4gYSBoeWRyb2dlbi1pbnRlcm5hbFxuICAgKiBmb3JtYXQgYW5kIHdyYXBzIGl0IHRvIGFjY2VwdCBKdXB5dGVyIG1lc3NhZ2UvY2hhbm5lbCBwYWlycyBpbnN0ZWFkLlxuICAgKiBLZXJuZWxzIGFuZCBwbHVnaW5zIGFsbCBvcGVyYXRlIG9uIHR5cGVzIHNwZWNpZmllZCBieSB0aGUgSnVweXRlciBtZXNzYWdpbmdcbiAgICogcHJvdG9jb2wgaW4gb3JkZXIgdG8gbWF4aW1pemUgY29tcGF0aWJpbGl0eSwgYnV0IGh5ZHJvZ2VuIGludGVybmFsbHkgdXNlc1xuICAgKiBpdHMgb3duIHR5cGVzLlxuICAgKi9cbiAgX3dyYXBFeGVjdXRpb25SZXN1bHRzQ2FsbGJhY2sob25SZXN1bHRzOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB7XG4gICAgcmV0dXJuIChtZXNzYWdlOiBNZXNzYWdlLCBjaGFubmVsOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChjaGFubmVsID09PSBcInNoZWxsXCIpIHtcbiAgICAgICAgY29uc3QgeyBzdGF0dXMgfSA9IG1lc3NhZ2UuY29udGVudDtcblxuICAgICAgICBpZiAoc3RhdHVzID09PSBcImVycm9yXCIgfHwgc3RhdHVzID09PSBcIm9rXCIpIHtcbiAgICAgICAgICBvblJlc3VsdHMoe1xuICAgICAgICAgICAgZGF0YTogc3RhdHVzLFxuICAgICAgICAgICAgc3RyZWFtOiBcInN0YXR1c1wiLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvZyhcIktlcm5lbDogaWdub3JpbmcgdW5leHBlY3RlZCB2YWx1ZSBmb3IgbWVzc2FnZS5jb250ZW50LnN0YXR1c1wiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaGFubmVsID09PSBcImlvcHViXCIpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuaGVhZGVyLm1zZ190eXBlID09PSBcImV4ZWN1dGVfaW5wdXRcIikge1xuICAgICAgICAgIG9uUmVzdWx0cyh7XG4gICAgICAgICAgICBkYXRhOiBtZXNzYWdlLmNvbnRlbnQuZXhlY3V0aW9uX2NvdW50LFxuICAgICAgICAgICAgc3RyZWFtOiBcImV4ZWN1dGlvbl9jb3VudFwiLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETyhuaWtpdGEpOiBDb25zaWRlciBjb252ZXJ0aW5nIHRvIFY1IGVsc2V3aGVyZSwgc28gdGhhdCBwbHVnaW5zXG4gICAgICAgIC8vIG5ldmVyIGhhdmUgdG8gZGVhbCB3aXRoIG1lc3NhZ2VzIGluIHRoZSBWNCBmb3JtYXRcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbXNnU3BlY1RvTm90ZWJvb2tGb3JtYXQobXNnU3BlY1Y0dG9WNShtZXNzYWdlKSk7XG4gICAgICAgIG9uUmVzdWx0cyhyZXN1bHQpO1xuICAgICAgfSBlbHNlIGlmIChjaGFubmVsID09PSBcInN0ZGluXCIpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuaGVhZGVyLm1zZ190eXBlICE9PSBcImlucHV0X3JlcXVlc3RcIikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgcHJvbXB0LCBwYXNzd29yZCB9ID0gbWVzc2FnZS5jb250ZW50O1xuICAgICAgICAvLyBUT0RPKG5pa2l0YSk6IHBlcmhhcHMgaXQgd291bGQgbWFrZSBzZW5zZSB0byBpbnN0YWxsIG1pZGRsZXdhcmUgZm9yXG4gICAgICAgIC8vIHNlbmRpbmcgaW5wdXQgcmVwbGllc1xuICAgICAgICBjb25zdCBpbnB1dFZpZXcgPSBuZXcgSW5wdXRWaWV3KFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb21wdCxcbiAgICAgICAgICAgIHBhc3N3b3JkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKGlucHV0OiBzdHJpbmcpID0+IHRoaXMudHJhbnNwb3J0LmlucHV0UmVwbHkoaW5wdXQpXG4gICAgICAgICk7XG4gICAgICAgIGlucHV0Vmlldy5hdHRhY2goKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgY29tcGxldGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHtcbiAgICB0aGlzLmZpcnN0TWlkZGxld2FyZUFkYXB0ZXIuY29tcGxldGUoXG4gICAgICBjb2RlLFxuICAgICAgKG1lc3NhZ2U6IE1lc3NhZ2UsIGNoYW5uZWw6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAoY2hhbm5lbCAhPT0gXCJzaGVsbFwiKSB7XG4gICAgICAgICAgbG9nKFwiSW52YWxpZCByZXBseTogd3JvbmcgY2hhbm5lbFwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBvblJlc3VsdHMobWVzc2FnZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaW5zcGVjdChcbiAgICBjb2RlOiBzdHJpbmcsXG4gICAgY3Vyc29yUG9zOiBudW1iZXIsXG4gICAgb25SZXN1bHRzOiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55XG4gICkge1xuICAgIHRoaXMuZmlyc3RNaWRkbGV3YXJlQWRhcHRlci5pbnNwZWN0KFxuICAgICAgY29kZSxcbiAgICAgIGN1cnNvclBvcyxcbiAgICAgIChtZXNzYWdlOiBNZXNzYWdlLCBjaGFubmVsOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKGNoYW5uZWwgIT09IFwic2hlbGxcIikge1xuICAgICAgICAgIGxvZyhcIkludmFsaWQgcmVwbHk6IHdyb25nIGNoYW5uZWxcIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgb25SZXN1bHRzKHtcbiAgICAgICAgICBkYXRhOiBtZXNzYWdlLmNvbnRlbnQuZGF0YSxcbiAgICAgICAgICBmb3VuZDogbWVzc2FnZS5jb250ZW50LmZvdW5kLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBsb2coXCJLZXJuZWw6IERlc3Ryb3lpbmdcIik7XG4gICAgLy8gVGhpcyBpcyBmb3IgY2xlYW51cCB0byBpbXByb3ZlIHBlcmZvcm1hbmNlXG4gICAgdGhpcy53YXRjaGVzU3RvcmUuZGVzdHJveSgpO1xuICAgIHN0b3JlLmRlbGV0ZUtlcm5lbCh0aGlzKTtcbiAgICB0aGlzLnRyYW5zcG9ydC5kZXN0cm95KCk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW5XcmFwcGVyKSB7XG4gICAgICB0aGlzLnBsdWdpbldyYXBwZXIuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC1kZXN0cm95XCIpO1xuICAgIHRoaXMuZW1pdHRlci5kaXNwb3NlKCk7XG4gIH1cbn1cbiJdfQ==