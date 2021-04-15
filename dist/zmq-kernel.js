"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const jmp_1 = require("@aminya/jmp");
const uuid_1 = require("uuid");
const spawnteract_1 = require("spawnteract");
const config_1 = __importDefault(require("./config"));
const kernel_transport_1 = __importDefault(require("./kernel-transport"));
const utils_1 = require("./utils");
class ZMQKernel extends kernel_transport_1.default {
    constructor(kernelSpec, grammar, options, onStarted) {
        super(kernelSpec, grammar);
        this.executionCallbacks = {};
        this.options = options || {};
        options.cleanupConnectionFile = false;
        spawnteract_1.launchSpec(kernelSpec, options).then(({ config, connectionFile, spawn }) => {
            this.connection = config;
            this.connectionFile = connectionFile;
            this.kernelProcess = spawn;
            this.monitorNotifications(spawn);
            this.connect(() => {
                this._executeStartupCode();
                if (onStarted) {
                    onStarted(this);
                }
            });
        });
    }
    connect(done) {
        const scheme = this.connection.signature_scheme.slice("hmac-".length);
        const { key } = this.connection;
        this.shellSocket = new jmp_1.Socket("dealer", scheme, key);
        this.stdinSocket = new jmp_1.Socket("dealer", scheme, key);
        this.ioSocket = new jmp_1.Socket("sub", scheme, key);
        const id = uuid_1.v4();
        this.shellSocket.identity = `dealer${id}`;
        this.stdinSocket.identity = `dealer${id}`;
        this.ioSocket.identity = `sub${id}`;
        const address = `${this.connection.transport}://${this.connection.ip}:`;
        this.shellSocket.connect(address + this.connection.shell_port);
        this.ioSocket.connect(address + this.connection.iopub_port);
        this.ioSocket.subscribe("");
        this.stdinSocket.connect(address + this.connection.stdin_port);
        this.shellSocket.on("message", this.onShellMessage.bind(this));
        this.ioSocket.on("message", this.onIOMessage.bind(this));
        this.stdinSocket.on("message", this.onStdinMessage.bind(this));
        this.monitor(done);
    }
    monitorNotifications(childProcess) {
        childProcess.stdout.on("data", (data) => {
            data = data.toString();
            if (atom.config.get("Hydrogen.kernelNotifications")) {
                atom.notifications.addInfo(this.kernelSpec.display_name, {
                    description: data,
                    dismissable: true,
                });
            }
            else {
                utils_1.log("ZMQKernel: stdout:", data);
            }
        });
        childProcess.stderr.on("data", (data) => {
            atom.notifications.addError(this.kernelSpec.display_name, {
                description: data.toString(),
                dismissable: true,
            });
        });
    }
    monitor(done) {
        try {
            const socketNames = ["shellSocket", "ioSocket"];
            let waitGroup = socketNames.length;
            const onConnect = ({ socketName, socket }) => {
                utils_1.log(`ZMQKernel: ${socketName} connected`);
                socket.unmonitor();
                waitGroup--;
                if (waitGroup === 0) {
                    utils_1.log("ZMQKernel: all main sockets connected");
                    this.setExecutionState("idle");
                    if (done) {
                        done();
                    }
                }
            };
            const monitor = (socketName, socket) => {
                utils_1.log(`ZMQKernel: monitor ${socketName}`);
                socket.on("connect", onConnect.bind(this, {
                    socketName,
                    socket,
                }));
                socket.monitor();
            };
            monitor("shellSocket", this.shellSocket);
            monitor("ioSocket", this.ioSocket);
        }
        catch (err) {
            utils_1.log("ZMQKernel:", err);
        }
    }
    interrupt() {
        if (process.platform === "win32") {
            atom.notifications.addWarning("Cannot interrupt this kernel", {
                detail: "Kernel interruption is currently not supported in Windows.",
            });
        }
        else {
            utils_1.log("ZMQKernel: sending SIGINT");
            this.kernelProcess.kill("SIGINT");
        }
    }
    _kill() {
        utils_1.log("ZMQKernel: sending SIGKILL");
        this.kernelProcess.kill("SIGKILL");
    }
    _executeStartupCode() {
        const displayName = this.kernelSpec.display_name;
        let startupCode = config_1.default.getJson("startupCode")[displayName];
        if (startupCode) {
            utils_1.log("KernelManager: Executing startup code:", startupCode);
            startupCode += "\n";
            this.execute(startupCode, (message, channel) => { });
        }
    }
    shutdown() {
        this._socketShutdown();
    }
    restart(onRestarted) {
        this._socketRestart(onRestarted);
    }
    _socketShutdown(restart = false) {
        const requestId = `shutdown_${uuid_1.v4()}`;
        const message = this._createMessage("shutdown_request", requestId);
        message.content = {
            restart,
        };
        this.shellSocket.send(new jmp_1.Message(message));
    }
    _socketRestart(onRestarted) {
        if (this.executionState === "restarting") {
            return;
        }
        this.setExecutionState("restarting");
        this._socketShutdown(true);
        this._kill();
        const { spawn } = spawnteract_1.launchSpecFromConnectionInfo(this.kernelSpec, this.connection, this.connectionFile, this.options);
        this.kernelProcess = spawn;
        this.monitor(() => {
            this._executeStartupCode();
            if (onRestarted) {
                onRestarted();
            }
        });
    }
    execute(code, onResults) {
        utils_1.log("ZMQKernel.execute:", code);
        const requestId = `execute_${uuid_1.v4()}`;
        const message = this._createMessage("execute_request", requestId);
        message.content = {
            code,
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: true,
        };
        this.executionCallbacks[requestId] = onResults;
        this.shellSocket.send(new jmp_1.Message(message));
    }
    complete(code, onResults) {
        utils_1.log("ZMQKernel.complete:", code);
        const requestId = `complete_${uuid_1.v4()}`;
        const message = this._createMessage("complete_request", requestId);
        message.content = {
            code,
            text: code,
            line: code,
            cursor_pos: utils_1.js_idx_to_char_idx(code.length, code),
        };
        this.executionCallbacks[requestId] = onResults;
        this.shellSocket.send(new jmp_1.Message(message));
    }
    inspect(code, cursorPos, onResults) {
        utils_1.log("ZMQKernel.inspect:", code, cursorPos);
        const requestId = `inspect_${uuid_1.v4()}`;
        const message = this._createMessage("inspect_request", requestId);
        message.content = {
            code,
            cursor_pos: cursorPos,
            detail_level: 0,
        };
        this.executionCallbacks[requestId] = onResults;
        this.shellSocket.send(new jmp_1.Message(message));
    }
    inputReply(input) {
        const requestId = `input_reply_${uuid_1.v4()}`;
        const message = this._createMessage("input_reply", requestId);
        message.content = {
            value: input,
        };
        this.stdinSocket.send(new jmp_1.Message(message));
    }
    onShellMessage(message) {
        utils_1.log("shell message:", message);
        if (!this._isValidMessage(message)) {
            return;
        }
        const { msg_id } = message.parent_header;
        let callback;
        if (msg_id) {
            callback = this.executionCallbacks[msg_id];
        }
        if (callback) {
            callback(message, "shell");
        }
    }
    onStdinMessage(message) {
        utils_1.log("stdin message:", message);
        if (!this._isValidMessage(message)) {
            return;
        }
        const { msg_id } = message.parent_header;
        let callback;
        if (msg_id) {
            callback = this.executionCallbacks[msg_id];
        }
        if (callback) {
            callback(message, "stdin");
        }
    }
    onIOMessage(message) {
        utils_1.log("IO message:", message);
        if (!this._isValidMessage(message)) {
            return;
        }
        const { msg_type } = message.header;
        if (msg_type === "status") {
            const status = message.content.execution_state;
            this.setExecutionState(status);
        }
        const { msg_id } = message.parent_header;
        let callback;
        if (msg_id) {
            callback = this.executionCallbacks[msg_id];
        }
        if (callback) {
            callback(message, "iopub");
        }
    }
    _isValidMessage(message) {
        if (!message) {
            utils_1.log("Invalid message: null");
            return false;
        }
        if (!message.content) {
            utils_1.log("Invalid message: Missing content");
            return false;
        }
        if (message.content.execution_state === "starting") {
            utils_1.log("Dropped starting status IO message");
            return false;
        }
        if (!message.parent_header) {
            utils_1.log("Invalid message: Missing parent_header");
            return false;
        }
        if (!message.parent_header.msg_id) {
            utils_1.log("Invalid message: Missing parent_header.msg_id");
            return false;
        }
        if (!message.parent_header.msg_type) {
            utils_1.log("Invalid message: Missing parent_header.msg_type");
            return false;
        }
        if (!message.header) {
            utils_1.log("Invalid message: Missing header");
            return false;
        }
        if (!message.header.msg_id) {
            utils_1.log("Invalid message: Missing header.msg_id");
            return false;
        }
        if (!message.header.msg_type) {
            utils_1.log("Invalid message: Missing header.msg_type");
            return false;
        }
        return true;
    }
    destroy() {
        utils_1.log("ZMQKernel: destroy:", this);
        this.shutdown();
        this._kill();
        fs_1.default.unlinkSync(this.connectionFile);
        this.shellSocket.close();
        this.ioSocket.close();
        this.stdinSocket.close();
        super.destroy();
    }
    _getUsername() {
        return (process.env.LOGNAME ||
            process.env.USER ||
            process.env.LNAME ||
            process.env.USERNAME);
    }
    _createMessage(msgType, msgId = uuid_1.v4()) {
        const message = {
            header: {
                username: this._getUsername(),
                session: "00000000-0000-0000-0000-000000000000",
                msg_type: msgType,
                msg_id: msgId,
                date: new Date(),
                version: "5.0",
            },
            metadata: {},
            parent_header: {},
            content: {},
        };
        return message;
    }
}
exports.default = ZMQKernel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem1xLWtlcm5lbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi96bXEta2VybmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBRUEsNENBQW9CO0FBQ3BCLHFDQUE4QztBQUM5QywrQkFBMEI7QUFDMUIsNkNBQXVFO0FBQ3ZFLHNEQUE4QjtBQUM5QiwwRUFBaUQ7QUFFakQsbUNBQWtEO0FBZWxELE1BQXFCLFNBQVUsU0FBUSwwQkFBZTtJQVVwRCxZQUNFLFVBQThCLEVBQzlCLE9BQWdCLEVBQ2hCLE9BQTRCLEVBQzVCLFNBQTREO1FBRTVELEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFmN0IsdUJBQWtCLEdBQXdCLEVBQUUsQ0FBQztRQWdCM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO1FBRTdCLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFDdEMsd0JBQVUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUNsQyxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQzNCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDaEIsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBRTNCLElBQUksU0FBUyxFQUFFO29CQUNiLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FDRixDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUF1RDtRQUM3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LENBQUM7UUFDRixPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUF2WkQsNEJBdVpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XHJcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHsgTWVzc2FnZSwgU29ja2V0IH0gZnJvbSBcIkBhbWlueWEvam1wXCI7XHJcbmltcG9ydCB7IHY0IH0gZnJvbSBcInV1aWRcIjtcclxuaW1wb3J0IHsgbGF1bmNoU3BlYywgbGF1bmNoU3BlY0Zyb21Db25uZWN0aW9uSW5mbyB9IGZyb20gXCJzcGF3bnRlcmFjdFwiO1xyXG5pbXBvcnQgQ29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQgS2VybmVsVHJhbnNwb3J0IGZyb20gXCIuL2tlcm5lbC10cmFuc3BvcnRcIjtcclxuaW1wb3J0IHR5cGUgeyBSZXN1bHRzQ2FsbGJhY2sgfSBmcm9tIFwiLi9rZXJuZWwtdHJhbnNwb3J0XCI7XHJcbmltcG9ydCB7IGxvZywganNfaWR4X3RvX2NoYXJfaWR4IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcclxuXHJcbmV4cG9ydCB0eXBlIENvbm5lY3Rpb24gPSB7XHJcbiAgY29udHJvbF9wb3J0OiBudW1iZXI7XHJcbiAgaGJfcG9ydDogbnVtYmVyO1xyXG4gIGlvcHViX3BvcnQ6IG51bWJlcjtcclxuICBpcDogc3RyaW5nO1xyXG4gIGtleTogc3RyaW5nO1xyXG4gIHNoZWxsX3BvcnQ6IG51bWJlcjtcclxuICBzaWduYXR1cmVfc2NoZW1lOiBzdHJpbmc7XHJcbiAgc3RkaW5fcG9ydDogbnVtYmVyO1xyXG4gIHRyYW5zcG9ydDogc3RyaW5nO1xyXG4gIHZlcnNpb246IG51bWJlcjtcclxufTtcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgWk1RS2VybmVsIGV4dGVuZHMgS2VybmVsVHJhbnNwb3J0IHtcclxuICBleGVjdXRpb25DYWxsYmFja3M6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcclxuICBjb25uZWN0aW9uOiBDb25uZWN0aW9uO1xyXG4gIGNvbm5lY3Rpb25GaWxlOiBzdHJpbmc7XHJcbiAga2VybmVsUHJvY2VzczogQ2hpbGRQcm9jZXNzO1xyXG4gIG9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT47XHJcbiAgc2hlbGxTb2NrZXQ6IFNvY2tldDtcclxuICBzdGRpblNvY2tldDogU29ja2V0O1xyXG4gIGlvU29ja2V0OiBTb2NrZXQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAga2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhLFxyXG4gICAgZ3JhbW1hcjogR3JhbW1hcixcclxuICAgIG9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT4sXHJcbiAgICBvblN0YXJ0ZWQ6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKGtlcm5lbFNwZWMsIGdyYW1tYXIpO1xyXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIC8vIE90aGVyd2lzZSBzcGF3bnRlcmFjdCBkZWxldGVzIHRoZSBmaWxlIGFuZCBoeWRyb2dlbidzIHJlc3RhcnQga2VybmVsIGZhaWxzXHJcbiAgICBvcHRpb25zLmNsZWFudXBDb25uZWN0aW9uRmlsZSA9IGZhbHNlO1xyXG4gICAgbGF1bmNoU3BlYyhrZXJuZWxTcGVjLCBvcHRpb25zKS50aGVuKFxyXG4gICAgICAoeyBjb25maWcsIGNvbm5lY3Rpb25GaWxlLCBzcGF3biB9KSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uID0gY29uZmlnO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbkZpbGUgPSBjb25uZWN0aW9uRmlsZTtcclxuICAgICAgICB0aGlzLmtlcm5lbFByb2Nlc3MgPSBzcGF3bjtcclxuICAgICAgICB0aGlzLm1vbml0b3JOb3RpZmljYXRpb25zKHNwYXduKTtcclxuICAgICAgICB0aGlzLmNvbm5lY3QoKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5fZXhlY3V0ZVN0YXJ0dXBDb2RlKCk7XHJcblxyXG4gICAgICAgICAgaWYgKG9uU3RhcnRlZCkge1xyXG4gICAgICAgICAgICBvblN0YXJ0ZWQodGhpcyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBjb25uZWN0KGRvbmU6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICAgIGNvbnN0IHNjaGVtZSA9IHRoaXMuY29ubmVjdGlvbi5zaWduYXR1cmVfc2NoZW1lLnNsaWNlKFwiaG1hYy1cIi5sZW5ndGgpO1xyXG4gICAgY29uc3QgeyBrZXkgfSA9IHRoaXMuY29ubmVjdGlvbjtcclxuICAgIHRoaXMuc2hlbGxTb2NrZXQgPSBuZXcgU29ja2V0KFwiZGVhbGVyXCIsIHNjaGVtZSwga2V5KTtcclxuICAgIHRoaXMuc3RkaW5Tb2NrZXQgPSBuZXcgU29ja2V0KFwiZGVhbGVyXCIsIHNjaGVtZSwga2V5KTtcclxuICAgIHRoaXMuaW9Tb2NrZXQgPSBuZXcgU29ja2V0KFwic3ViXCIsIHNjaGVtZSwga2V5KTtcclxuICAgIGNvbnN0IGlkID0gdjQoKTtcclxuICAgIHRoaXMuc2hlbGxTb2NrZXQuaWRlbnRpdHkgPSBgZGVhbGVyJHtpZH1gO1xyXG4gICAgdGhpcy5zdGRpblNvY2tldC5pZGVudGl0eSA9IGBkZWFsZXIke2lkfWA7XHJcbiAgICB0aGlzLmlvU29ja2V0LmlkZW50aXR5ID0gYHN1YiR7aWR9YDtcclxuICAgIGNvbnN0IGFkZHJlc3MgPSBgJHt0aGlzLmNvbm5lY3Rpb24udHJhbnNwb3J0fTovLyR7dGhpcy5jb25uZWN0aW9uLmlwfTpgO1xyXG4gICAgdGhpcy5zaGVsbFNvY2tldC5jb25uZWN0KGFkZHJlc3MgKyB0aGlzLmNvbm5lY3Rpb24uc2hlbGxfcG9ydCk7XHJcbiAgICB0aGlzLmlvU29ja2V0LmNvbm5lY3QoYWRkcmVzcyArIHRoaXMuY29ubmVjdGlvbi5pb3B1Yl9wb3J0KTtcclxuICAgIHRoaXMuaW9Tb2NrZXQuc3Vic2NyaWJlKFwiXCIpO1xyXG4gICAgdGhpcy5zdGRpblNvY2tldC5jb25uZWN0KGFkZHJlc3MgKyB0aGlzLmNvbm5lY3Rpb24uc3RkaW5fcG9ydCk7XHJcbiAgICB0aGlzLnNoZWxsU29ja2V0Lm9uKFwibWVzc2FnZVwiLCB0aGlzLm9uU2hlbGxNZXNzYWdlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5pb1NvY2tldC5vbihcIm1lc3NhZ2VcIiwgdGhpcy5vbklPTWVzc2FnZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuc3RkaW5Tb2NrZXQub24oXCJtZXNzYWdlXCIsIHRoaXMub25TdGRpbk1lc3NhZ2UuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLm1vbml0b3IoZG9uZSk7XHJcbiAgfVxyXG5cclxuICBtb25pdG9yTm90aWZpY2F0aW9ucyhjaGlsZFByb2Nlc3M6IENoaWxkUHJvY2Vzcykge1xyXG4gICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbihcImRhdGFcIiwgKGRhdGE6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xyXG4gICAgICBkYXRhID0gZGF0YS50b1N0cmluZygpO1xyXG5cclxuICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLmtlcm5lbE5vdGlmaWNhdGlvbnNcIikpIHtcclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyh0aGlzLmtlcm5lbFNwZWMuZGlzcGxheV9uYW1lLCB7XHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogZGF0YSxcclxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvZyhcIlpNUUtlcm5lbDogc3Rkb3V0OlwiLCBkYXRhKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKFwiZGF0YVwiLCAoZGF0YTogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcih0aGlzLmtlcm5lbFNwZWMuZGlzcGxheV9uYW1lLCB7XHJcbiAgICAgICAgZGVzY3JpcHRpb246IGRhdGEudG9TdHJpbmcoKSxcclxuICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG1vbml0b3IoZG9uZTogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc29ja2V0TmFtZXMgPSBbXCJzaGVsbFNvY2tldFwiLCBcImlvU29ja2V0XCJdO1xyXG4gICAgICBsZXQgd2FpdEdyb3VwID0gc29ja2V0TmFtZXMubGVuZ3RoO1xyXG5cclxuICAgICAgY29uc3Qgb25Db25uZWN0ID0gKHsgc29ja2V0TmFtZSwgc29ja2V0IH0pID0+IHtcclxuICAgICAgICBsb2coYFpNUUtlcm5lbDogJHtzb2NrZXROYW1lfSBjb25uZWN0ZWRgKTtcclxuICAgICAgICBzb2NrZXQudW5tb25pdG9yKCk7XHJcbiAgICAgICAgd2FpdEdyb3VwLS07XHJcblxyXG4gICAgICAgIGlmICh3YWl0R3JvdXAgPT09IDApIHtcclxuICAgICAgICAgIGxvZyhcIlpNUUtlcm5lbDogYWxsIG1haW4gc29ja2V0cyBjb25uZWN0ZWRcIik7XHJcbiAgICAgICAgICB0aGlzLnNldEV4ZWN1dGlvblN0YXRlKFwiaWRsZVwiKTtcclxuICAgICAgICAgIGlmIChkb25lKSB7XHJcbiAgICAgICAgICAgIGRvbmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCBtb25pdG9yID0gKHNvY2tldE5hbWUsIHNvY2tldCkgPT4ge1xyXG4gICAgICAgIGxvZyhgWk1RS2VybmVsOiBtb25pdG9yICR7c29ja2V0TmFtZX1gKTtcclxuICAgICAgICBzb2NrZXQub24oXHJcbiAgICAgICAgICBcImNvbm5lY3RcIixcclxuICAgICAgICAgIG9uQ29ubmVjdC5iaW5kKHRoaXMsIHtcclxuICAgICAgICAgICAgc29ja2V0TmFtZSxcclxuICAgICAgICAgICAgc29ja2V0LFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHNvY2tldC5tb25pdG9yKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBtb25pdG9yKFwic2hlbGxTb2NrZXRcIiwgdGhpcy5zaGVsbFNvY2tldCk7XHJcbiAgICAgIG1vbml0b3IoXCJpb1NvY2tldFwiLCB0aGlzLmlvU29ja2V0KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coXCJaTVFLZXJuZWw6XCIsIGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpbnRlcnJ1cHQoKSB7XHJcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiQ2Fubm90IGludGVycnVwdCB0aGlzIGtlcm5lbFwiLCB7XHJcbiAgICAgICAgZGV0YWlsOiBcIktlcm5lbCBpbnRlcnJ1cHRpb24gaXMgY3VycmVudGx5IG5vdCBzdXBwb3J0ZWQgaW4gV2luZG93cy5cIixcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2coXCJaTVFLZXJuZWw6IHNlbmRpbmcgU0lHSU5UXCIpO1xyXG4gICAgICB0aGlzLmtlcm5lbFByb2Nlc3Mua2lsbChcIlNJR0lOVFwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9raWxsKCkge1xyXG4gICAgbG9nKFwiWk1RS2VybmVsOiBzZW5kaW5nIFNJR0tJTExcIik7XHJcbiAgICB0aGlzLmtlcm5lbFByb2Nlc3Mua2lsbChcIlNJR0tJTExcIik7XHJcbiAgfVxyXG5cclxuICBfZXhlY3V0ZVN0YXJ0dXBDb2RlKCkge1xyXG4gICAgY29uc3QgZGlzcGxheU5hbWUgPSB0aGlzLmtlcm5lbFNwZWMuZGlzcGxheV9uYW1lO1xyXG4gICAgbGV0IHN0YXJ0dXBDb2RlID0gQ29uZmlnLmdldEpzb24oXCJzdGFydHVwQ29kZVwiKVtkaXNwbGF5TmFtZV07XHJcblxyXG4gICAgaWYgKHN0YXJ0dXBDb2RlKSB7XHJcbiAgICAgIGxvZyhcIktlcm5lbE1hbmFnZXI6IEV4ZWN1dGluZyBzdGFydHVwIGNvZGU6XCIsIHN0YXJ0dXBDb2RlKTtcclxuICAgICAgc3RhcnR1cENvZGUgKz0gXCJcXG5cIjtcclxuICAgICAgdGhpcy5leGVjdXRlKHN0YXJ0dXBDb2RlLCAobWVzc2FnZSwgY2hhbm5lbCkgPT4ge30pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2h1dGRvd24oKSB7XHJcbiAgICB0aGlzLl9zb2NrZXRTaHV0ZG93bigpO1xyXG4gIH1cclxuXHJcbiAgcmVzdGFydChvblJlc3RhcnRlZDogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgdGhpcy5fc29ja2V0UmVzdGFydChvblJlc3RhcnRlZCk7XHJcbiAgfVxyXG5cclxuICBfc29ja2V0U2h1dGRvd24ocmVzdGFydDogYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgPSBmYWxzZSkge1xyXG4gICAgY29uc3QgcmVxdWVzdElkID0gYHNodXRkb3duXyR7djQoKX1gO1xyXG5cclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVNZXNzYWdlKFwic2h1dGRvd25fcmVxdWVzdFwiLCByZXF1ZXN0SWQpO1xyXG5cclxuICAgIG1lc3NhZ2UuY29udGVudCA9IHtcclxuICAgICAgcmVzdGFydCxcclxuICAgIH07XHJcbiAgICB0aGlzLnNoZWxsU29ja2V0LnNlbmQobmV3IE1lc3NhZ2UobWVzc2FnZSkpO1xyXG4gIH1cclxuXHJcbiAgX3NvY2tldFJlc3RhcnQoXHJcbiAgICBvblJlc3RhcnRlZDogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgaWYgKHRoaXMuZXhlY3V0aW9uU3RhdGUgPT09IFwicmVzdGFydGluZ1wiKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNldEV4ZWN1dGlvblN0YXRlKFwicmVzdGFydGluZ1wiKTtcclxuXHJcbiAgICB0aGlzLl9zb2NrZXRTaHV0ZG93bih0cnVlKTtcclxuXHJcbiAgICB0aGlzLl9raWxsKCk7XHJcblxyXG4gICAgY29uc3QgeyBzcGF3biB9ID0gbGF1bmNoU3BlY0Zyb21Db25uZWN0aW9uSW5mbyhcclxuICAgICAgdGhpcy5rZXJuZWxTcGVjLFxyXG4gICAgICB0aGlzLmNvbm5lY3Rpb24sXHJcbiAgICAgIHRoaXMuY29ubmVjdGlvbkZpbGUsXHJcbiAgICAgIHRoaXMub3B0aW9uc1xyXG4gICAgKTtcclxuICAgIHRoaXMua2VybmVsUHJvY2VzcyA9IHNwYXduO1xyXG4gICAgdGhpcy5tb25pdG9yKCgpID0+IHtcclxuICAgICAgdGhpcy5fZXhlY3V0ZVN0YXJ0dXBDb2RlKCk7XHJcblxyXG4gICAgICBpZiAob25SZXN0YXJ0ZWQpIHtcclxuICAgICAgICBvblJlc3RhcnRlZCgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vIG9uUmVzdWx0cyBpcyBhIGNhbGxiYWNrIHRoYXQgbWF5IGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xyXG4gIC8vIGFzIHJlc3VsdHMgY29tZSBpbiBmcm9tIHRoZSBrZXJuZWxcclxuICBleGVjdXRlKGNvZGU6IHN0cmluZywgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcclxuICAgIGxvZyhcIlpNUUtlcm5lbC5leGVjdXRlOlwiLCBjb2RlKTtcclxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGBleGVjdXRlXyR7djQoKX1gO1xyXG5cclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVNZXNzYWdlKFwiZXhlY3V0ZV9yZXF1ZXN0XCIsIHJlcXVlc3RJZCk7XHJcblxyXG4gICAgbWVzc2FnZS5jb250ZW50ID0ge1xyXG4gICAgICBjb2RlLFxyXG4gICAgICBzaWxlbnQ6IGZhbHNlLFxyXG4gICAgICBzdG9yZV9oaXN0b3J5OiB0cnVlLFxyXG4gICAgICB1c2VyX2V4cHJlc3Npb25zOiB7fSxcclxuICAgICAgYWxsb3dfc3RkaW46IHRydWUsXHJcbiAgICB9O1xyXG4gICAgdGhpcy5leGVjdXRpb25DYWxsYmFja3NbcmVxdWVzdElkXSA9IG9uUmVzdWx0cztcclxuICAgIHRoaXMuc2hlbGxTb2NrZXQuc2VuZChuZXcgTWVzc2FnZShtZXNzYWdlKSk7XHJcbiAgfVxyXG5cclxuICBjb21wbGV0ZShjb2RlOiBzdHJpbmcsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKSB7XHJcbiAgICBsb2coXCJaTVFLZXJuZWwuY29tcGxldGU6XCIsIGNvZGUpO1xyXG4gICAgY29uc3QgcmVxdWVzdElkID0gYGNvbXBsZXRlXyR7djQoKX1gO1xyXG5cclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVNZXNzYWdlKFwiY29tcGxldGVfcmVxdWVzdFwiLCByZXF1ZXN0SWQpO1xyXG5cclxuICAgIG1lc3NhZ2UuY29udGVudCA9IHtcclxuICAgICAgY29kZSxcclxuICAgICAgdGV4dDogY29kZSxcclxuICAgICAgbGluZTogY29kZSxcclxuICAgICAgY3Vyc29yX3BvczoganNfaWR4X3RvX2NoYXJfaWR4KGNvZGUubGVuZ3RoLCBjb2RlKSxcclxuICAgIH07XHJcbiAgICB0aGlzLmV4ZWN1dGlvbkNhbGxiYWNrc1tyZXF1ZXN0SWRdID0gb25SZXN1bHRzO1xyXG4gICAgdGhpcy5zaGVsbFNvY2tldC5zZW5kKG5ldyBNZXNzYWdlKG1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIGluc3BlY3QoY29kZTogc3RyaW5nLCBjdXJzb3JQb3M6IG51bWJlciwgb25SZXN1bHRzOiBSZXN1bHRzQ2FsbGJhY2spIHtcclxuICAgIGxvZyhcIlpNUUtlcm5lbC5pbnNwZWN0OlwiLCBjb2RlLCBjdXJzb3JQb3MpO1xyXG4gICAgY29uc3QgcmVxdWVzdElkID0gYGluc3BlY3RfJHt2NCgpfWA7XHJcblxyXG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuX2NyZWF0ZU1lc3NhZ2UoXCJpbnNwZWN0X3JlcXVlc3RcIiwgcmVxdWVzdElkKTtcclxuXHJcbiAgICBtZXNzYWdlLmNvbnRlbnQgPSB7XHJcbiAgICAgIGNvZGUsXHJcbiAgICAgIGN1cnNvcl9wb3M6IGN1cnNvclBvcyxcclxuICAgICAgZGV0YWlsX2xldmVsOiAwLFxyXG4gICAgfTtcclxuICAgIHRoaXMuZXhlY3V0aW9uQ2FsbGJhY2tzW3JlcXVlc3RJZF0gPSBvblJlc3VsdHM7XHJcbiAgICB0aGlzLnNoZWxsU29ja2V0LnNlbmQobmV3IE1lc3NhZ2UobWVzc2FnZSkpO1xyXG4gIH1cclxuXHJcbiAgaW5wdXRSZXBseShpbnB1dDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCByZXF1ZXN0SWQgPSBgaW5wdXRfcmVwbHlfJHt2NCgpfWA7XHJcblxyXG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuX2NyZWF0ZU1lc3NhZ2UoXCJpbnB1dF9yZXBseVwiLCByZXF1ZXN0SWQpO1xyXG5cclxuICAgIG1lc3NhZ2UuY29udGVudCA9IHtcclxuICAgICAgdmFsdWU6IGlucHV0LFxyXG4gICAgfTtcclxuICAgIHRoaXMuc3RkaW5Tb2NrZXQuc2VuZChuZXcgTWVzc2FnZShtZXNzYWdlKSk7XHJcbiAgfVxyXG5cclxuICBvblNoZWxsTWVzc2FnZShtZXNzYWdlOiBNZXNzYWdlKSB7XHJcbiAgICBsb2coXCJzaGVsbCBtZXNzYWdlOlwiLCBtZXNzYWdlKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuX2lzVmFsaWRNZXNzYWdlKG1lc3NhZ2UpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IG1zZ19pZCB9ID0gbWVzc2FnZS5wYXJlbnRfaGVhZGVyO1xyXG4gICAgbGV0IGNhbGxiYWNrO1xyXG5cclxuICAgIGlmIChtc2dfaWQpIHtcclxuICAgICAgY2FsbGJhY2sgPSB0aGlzLmV4ZWN1dGlvbkNhbGxiYWNrc1ttc2dfaWRdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICBjYWxsYmFjayhtZXNzYWdlLCBcInNoZWxsXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25TdGRpbk1lc3NhZ2UobWVzc2FnZTogTWVzc2FnZSkge1xyXG4gICAgbG9nKFwic3RkaW4gbWVzc2FnZTpcIiwgbWVzc2FnZSk7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9pc1ZhbGlkTWVzc2FnZShtZXNzYWdlKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaW5wdXRfcmVxdWVzdCBtZXNzYWdlcyBhcmUgYXR0cmlidXRhYmxlIHRvIHBhcnRpY3VsYXIgZXhlY3V0aW9uIHJlcXVlc3RzLFxyXG4gICAgLy8gYW5kIHNob3VsZCBwYXNzIHRocm91Z2ggdGhlIG1pZGRsZXdhcmUgc3RhY2sgdG8gYWxsb3cgcGx1Z2lucyB0byBzZWUgdGhlbVxyXG4gICAgY29uc3QgeyBtc2dfaWQgfSA9IG1lc3NhZ2UucGFyZW50X2hlYWRlcjtcclxuICAgIGxldCBjYWxsYmFjaztcclxuXHJcbiAgICBpZiAobXNnX2lkKSB7XHJcbiAgICAgIGNhbGxiYWNrID0gdGhpcy5leGVjdXRpb25DYWxsYmFja3NbbXNnX2lkXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgY2FsbGJhY2sobWVzc2FnZSwgXCJzdGRpblwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIG9uSU9NZXNzYWdlKG1lc3NhZ2U6IE1lc3NhZ2UpIHtcclxuICAgIGxvZyhcIklPIG1lc3NhZ2U6XCIsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmICghdGhpcy5faXNWYWxpZE1lc3NhZ2UobWVzc2FnZSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgbXNnX3R5cGUgfSA9IG1lc3NhZ2UuaGVhZGVyO1xyXG5cclxuICAgIGlmIChtc2dfdHlwZSA9PT0gXCJzdGF0dXNcIikge1xyXG4gICAgICBjb25zdCBzdGF0dXMgPSBtZXNzYWdlLmNvbnRlbnQuZXhlY3V0aW9uX3N0YXRlO1xyXG4gICAgICB0aGlzLnNldEV4ZWN1dGlvblN0YXRlKHN0YXR1cyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBtc2dfaWQgfSA9IG1lc3NhZ2UucGFyZW50X2hlYWRlcjtcclxuICAgIGxldCBjYWxsYmFjaztcclxuXHJcbiAgICBpZiAobXNnX2lkKSB7XHJcbiAgICAgIGNhbGxiYWNrID0gdGhpcy5leGVjdXRpb25DYWxsYmFja3NbbXNnX2lkXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgY2FsbGJhY2sobWVzc2FnZSwgXCJpb3B1YlwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9pc1ZhbGlkTWVzc2FnZShtZXNzYWdlOiBNZXNzYWdlKSB7XHJcbiAgICBpZiAoIW1lc3NhZ2UpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBudWxsXCIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlLmNvbnRlbnQpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIGNvbnRlbnRcIik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobWVzc2FnZS5jb250ZW50LmV4ZWN1dGlvbl9zdGF0ZSA9PT0gXCJzdGFydGluZ1wiKSB7XHJcbiAgICAgIC8vIEtlcm5lbHMgc2VuZCBhIHN0YXJ0aW5nIHN0YXR1cyBtZXNzYWdlIHdpdGggYW4gZW1wdHkgcGFyZW50X2hlYWRlclxyXG4gICAgICBsb2coXCJEcm9wcGVkIHN0YXJ0aW5nIHN0YXR1cyBJTyBtZXNzYWdlXCIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlLnBhcmVudF9oZWFkZXIpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIHBhcmVudF9oZWFkZXJcIik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1lc3NhZ2UucGFyZW50X2hlYWRlci5tc2dfaWQpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIHBhcmVudF9oZWFkZXIubXNnX2lkXCIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlLnBhcmVudF9oZWFkZXIubXNnX3R5cGUpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIHBhcmVudF9oZWFkZXIubXNnX3R5cGVcIik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1lc3NhZ2UuaGVhZGVyKSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBoZWFkZXJcIik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1lc3NhZ2UuaGVhZGVyLm1zZ19pZCkge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgaGVhZGVyLm1zZ19pZFwiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbWVzc2FnZS5oZWFkZXIubXNnX3R5cGUpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIGhlYWRlci5tc2dfdHlwZVwiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIGxvZyhcIlpNUUtlcm5lbDogZGVzdHJveTpcIiwgdGhpcyk7XHJcbiAgICB0aGlzLnNodXRkb3duKCk7XHJcblxyXG4gICAgdGhpcy5fa2lsbCgpO1xyXG5cclxuICAgIGZzLnVubGlua1N5bmModGhpcy5jb25uZWN0aW9uRmlsZSk7XHJcbiAgICB0aGlzLnNoZWxsU29ja2V0LmNsb3NlKCk7XHJcbiAgICB0aGlzLmlvU29ja2V0LmNsb3NlKCk7XHJcbiAgICB0aGlzLnN0ZGluU29ja2V0LmNsb3NlKCk7XHJcbiAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgfVxyXG5cclxuICBfZ2V0VXNlcm5hbWUoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBwcm9jZXNzLmVudi5MT0dOQU1FIHx8XHJcbiAgICAgIHByb2Nlc3MuZW52LlVTRVIgfHxcclxuICAgICAgcHJvY2Vzcy5lbnYuTE5BTUUgfHxcclxuICAgICAgcHJvY2Vzcy5lbnYuVVNFUk5BTUVcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBfY3JlYXRlTWVzc2FnZShtc2dUeXBlOiBzdHJpbmcsIG1zZ0lkOiBzdHJpbmcgPSB2NCgpKSB7XHJcbiAgICBjb25zdCBtZXNzYWdlID0ge1xyXG4gICAgICBoZWFkZXI6IHtcclxuICAgICAgICB1c2VybmFtZTogdGhpcy5fZ2V0VXNlcm5hbWUoKSxcclxuICAgICAgICBzZXNzaW9uOiBcIjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMFwiLFxyXG4gICAgICAgIG1zZ190eXBlOiBtc2dUeXBlLFxyXG4gICAgICAgIG1zZ19pZDogbXNnSWQsXHJcbiAgICAgICAgZGF0ZTogbmV3IERhdGUoKSxcclxuICAgICAgICB2ZXJzaW9uOiBcIjUuMFwiLFxyXG4gICAgICB9LFxyXG4gICAgICBtZXRhZGF0YToge30sXHJcbiAgICAgIHBhcmVudF9oZWFkZXI6IHt9LFxyXG4gICAgICBjb250ZW50OiB7fSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gbWVzc2FnZTtcclxuICB9XHJcbn1cclxuIl19