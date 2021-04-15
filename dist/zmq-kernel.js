"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const jmp_1 = require("jmp");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem1xLWtlcm5lbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi96bXEta2VybmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBRUEsNENBQW9CO0FBQ3BCLDZCQUFzQztBQUN0QywrQkFBMEI7QUFDMUIsNkNBQXVFO0FBQ3ZFLHNEQUE4QjtBQUM5QiwwRUFBaUQ7QUFFakQsbUNBQWtEO0FBZWxELE1BQXFCLFNBQVUsU0FBUSwwQkFBZTtJQVVwRCxZQUNFLFVBQThCLEVBQzlCLE9BQWdCLEVBQ2hCLE9BQTRCLEVBQzVCLFNBQTREO1FBRTVELEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFmN0IsdUJBQWtCLEdBQXdCLEVBQUUsQ0FBQztRQWdCM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO1FBRTdCLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFDdEMsd0JBQVUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUNsQyxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQzNCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDaEIsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBRTNCLElBQUksU0FBUyxFQUFFO29CQUNiLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FDRixDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUF1RDtRQUM3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LENBQUM7UUFDRixPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUF2WkQsNEJBdVpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhbW1hciB9IGZyb20gXCJhdG9tXCI7XHJcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHsgTWVzc2FnZSwgU29ja2V0IH0gZnJvbSBcImptcFwiO1xyXG5pbXBvcnQgeyB2NCB9IGZyb20gXCJ1dWlkXCI7XHJcbmltcG9ydCB7IGxhdW5jaFNwZWMsIGxhdW5jaFNwZWNGcm9tQ29ubmVjdGlvbkluZm8gfSBmcm9tIFwic3Bhd250ZXJhY3RcIjtcclxuaW1wb3J0IENvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IEtlcm5lbFRyYW5zcG9ydCBmcm9tIFwiLi9rZXJuZWwtdHJhbnNwb3J0XCI7XHJcbmltcG9ydCB0eXBlIHsgUmVzdWx0c0NhbGxiYWNrIH0gZnJvbSBcIi4va2VybmVsLXRyYW5zcG9ydFwiO1xyXG5pbXBvcnQgeyBsb2csIGpzX2lkeF90b19jaGFyX2lkeCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XHJcblxyXG5leHBvcnQgdHlwZSBDb25uZWN0aW9uID0ge1xyXG4gIGNvbnRyb2xfcG9ydDogbnVtYmVyO1xyXG4gIGhiX3BvcnQ6IG51bWJlcjtcclxuICBpb3B1Yl9wb3J0OiBudW1iZXI7XHJcbiAgaXA6IHN0cmluZztcclxuICBrZXk6IHN0cmluZztcclxuICBzaGVsbF9wb3J0OiBudW1iZXI7XHJcbiAgc2lnbmF0dXJlX3NjaGVtZTogc3RyaW5nO1xyXG4gIHN0ZGluX3BvcnQ6IG51bWJlcjtcclxuICB0cmFuc3BvcnQ6IHN0cmluZztcclxuICB2ZXJzaW9uOiBudW1iZXI7XHJcbn07XHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFpNUUtlcm5lbCBleHRlbmRzIEtlcm5lbFRyYW5zcG9ydCB7XHJcbiAgZXhlY3V0aW9uQ2FsbGJhY2tzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XHJcbiAgY29ubmVjdGlvbjogQ29ubmVjdGlvbjtcclxuICBjb25uZWN0aW9uRmlsZTogc3RyaW5nO1xyXG4gIGtlcm5lbFByb2Nlc3M6IENoaWxkUHJvY2VzcztcclxuICBvcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xyXG4gIHNoZWxsU29ja2V0OiBTb2NrZXQ7XHJcbiAgc3RkaW5Tb2NrZXQ6IFNvY2tldDtcclxuICBpb1NvY2tldDogU29ja2V0O1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGtlcm5lbFNwZWM6IEtlcm5lbHNwZWNNZXRhZGF0YSxcclxuICAgIGdyYW1tYXI6IEdyYW1tYXIsXHJcbiAgICBvcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxyXG4gICAgb25TdGFydGVkOiAoKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkgfCBudWxsIHwgdW5kZWZpbmVkXHJcbiAgKSB7XHJcbiAgICBzdXBlcihrZXJuZWxTcGVjLCBncmFtbWFyKTtcclxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAvLyBPdGhlcndpc2Ugc3Bhd250ZXJhY3QgZGVsZXRlcyB0aGUgZmlsZSBhbmQgaHlkcm9nZW4ncyByZXN0YXJ0IGtlcm5lbCBmYWlsc1xyXG4gICAgb3B0aW9ucy5jbGVhbnVwQ29ubmVjdGlvbkZpbGUgPSBmYWxzZTtcclxuICAgIGxhdW5jaFNwZWMoa2VybmVsU3BlYywgb3B0aW9ucykudGhlbihcclxuICAgICAgKHsgY29uZmlnLCBjb25uZWN0aW9uRmlsZSwgc3Bhd24gfSkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbmZpZztcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25GaWxlID0gY29ubmVjdGlvbkZpbGU7XHJcbiAgICAgICAgdGhpcy5rZXJuZWxQcm9jZXNzID0gc3Bhd247XHJcbiAgICAgICAgdGhpcy5tb25pdG9yTm90aWZpY2F0aW9ucyhzcGF3bik7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0KCgpID0+IHtcclxuICAgICAgICAgIHRoaXMuX2V4ZWN1dGVTdGFydHVwQ29kZSgpO1xyXG5cclxuICAgICAgICAgIGlmIChvblN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgb25TdGFydGVkKHRoaXMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgY29ubmVjdChkb25lOiAoKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSkgfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcbiAgICBjb25zdCBzY2hlbWUgPSB0aGlzLmNvbm5lY3Rpb24uc2lnbmF0dXJlX3NjaGVtZS5zbGljZShcImhtYWMtXCIubGVuZ3RoKTtcclxuICAgIGNvbnN0IHsga2V5IH0gPSB0aGlzLmNvbm5lY3Rpb247XHJcbiAgICB0aGlzLnNoZWxsU29ja2V0ID0gbmV3IFNvY2tldChcImRlYWxlclwiLCBzY2hlbWUsIGtleSk7XHJcbiAgICB0aGlzLnN0ZGluU29ja2V0ID0gbmV3IFNvY2tldChcImRlYWxlclwiLCBzY2hlbWUsIGtleSk7XHJcbiAgICB0aGlzLmlvU29ja2V0ID0gbmV3IFNvY2tldChcInN1YlwiLCBzY2hlbWUsIGtleSk7XHJcbiAgICBjb25zdCBpZCA9IHY0KCk7XHJcbiAgICB0aGlzLnNoZWxsU29ja2V0LmlkZW50aXR5ID0gYGRlYWxlciR7aWR9YDtcclxuICAgIHRoaXMuc3RkaW5Tb2NrZXQuaWRlbnRpdHkgPSBgZGVhbGVyJHtpZH1gO1xyXG4gICAgdGhpcy5pb1NvY2tldC5pZGVudGl0eSA9IGBzdWIke2lkfWA7XHJcbiAgICBjb25zdCBhZGRyZXNzID0gYCR7dGhpcy5jb25uZWN0aW9uLnRyYW5zcG9ydH06Ly8ke3RoaXMuY29ubmVjdGlvbi5pcH06YDtcclxuICAgIHRoaXMuc2hlbGxTb2NrZXQuY29ubmVjdChhZGRyZXNzICsgdGhpcy5jb25uZWN0aW9uLnNoZWxsX3BvcnQpO1xyXG4gICAgdGhpcy5pb1NvY2tldC5jb25uZWN0KGFkZHJlc3MgKyB0aGlzLmNvbm5lY3Rpb24uaW9wdWJfcG9ydCk7XHJcbiAgICB0aGlzLmlvU29ja2V0LnN1YnNjcmliZShcIlwiKTtcclxuICAgIHRoaXMuc3RkaW5Tb2NrZXQuY29ubmVjdChhZGRyZXNzICsgdGhpcy5jb25uZWN0aW9uLnN0ZGluX3BvcnQpO1xyXG4gICAgdGhpcy5zaGVsbFNvY2tldC5vbihcIm1lc3NhZ2VcIiwgdGhpcy5vblNoZWxsTWVzc2FnZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuaW9Tb2NrZXQub24oXCJtZXNzYWdlXCIsIHRoaXMub25JT01lc3NhZ2UuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLnN0ZGluU29ja2V0Lm9uKFwibWVzc2FnZVwiLCB0aGlzLm9uU3RkaW5NZXNzYWdlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5tb25pdG9yKGRvbmUpO1xyXG4gIH1cclxuXHJcbiAgbW9uaXRvck5vdGlmaWNhdGlvbnMoY2hpbGRQcm9jZXNzOiBDaGlsZFByb2Nlc3MpIHtcclxuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oXCJkYXRhXCIsIChkYXRhOiBzdHJpbmcgfCBCdWZmZXIpID0+IHtcclxuICAgICAgZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJIeWRyb2dlbi5rZXJuZWxOb3RpZmljYXRpb25zXCIpKSB7XHJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8odGhpcy5rZXJuZWxTcGVjLmRpc3BsYXlfbmFtZSwge1xyXG4gICAgICAgICAgZGVzY3JpcHRpb246IGRhdGEsXHJcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb2coXCJaTVFLZXJuZWw6IHN0ZG91dDpcIiwgZGF0YSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbihcImRhdGFcIiwgKGRhdGE6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xyXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IodGhpcy5rZXJuZWxTcGVjLmRpc3BsYXlfbmFtZSwge1xyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkYXRhLnRvU3RyaW5nKCksXHJcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBtb25pdG9yKGRvbmU6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHNvY2tldE5hbWVzID0gW1wic2hlbGxTb2NrZXRcIiwgXCJpb1NvY2tldFwiXTtcclxuICAgICAgbGV0IHdhaXRHcm91cCA9IHNvY2tldE5hbWVzLmxlbmd0aDtcclxuXHJcbiAgICAgIGNvbnN0IG9uQ29ubmVjdCA9ICh7IHNvY2tldE5hbWUsIHNvY2tldCB9KSA9PiB7XHJcbiAgICAgICAgbG9nKGBaTVFLZXJuZWw6ICR7c29ja2V0TmFtZX0gY29ubmVjdGVkYCk7XHJcbiAgICAgICAgc29ja2V0LnVubW9uaXRvcigpO1xyXG4gICAgICAgIHdhaXRHcm91cC0tO1xyXG5cclxuICAgICAgICBpZiAod2FpdEdyb3VwID09PSAwKSB7XHJcbiAgICAgICAgICBsb2coXCJaTVFLZXJuZWw6IGFsbCBtYWluIHNvY2tldHMgY29ubmVjdGVkXCIpO1xyXG4gICAgICAgICAgdGhpcy5zZXRFeGVjdXRpb25TdGF0ZShcImlkbGVcIik7XHJcbiAgICAgICAgICBpZiAoZG9uZSkge1xyXG4gICAgICAgICAgICBkb25lKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgbW9uaXRvciA9IChzb2NrZXROYW1lLCBzb2NrZXQpID0+IHtcclxuICAgICAgICBsb2coYFpNUUtlcm5lbDogbW9uaXRvciAke3NvY2tldE5hbWV9YCk7XHJcbiAgICAgICAgc29ja2V0Lm9uKFxyXG4gICAgICAgICAgXCJjb25uZWN0XCIsXHJcbiAgICAgICAgICBvbkNvbm5lY3QuYmluZCh0aGlzLCB7XHJcbiAgICAgICAgICAgIHNvY2tldE5hbWUsXHJcbiAgICAgICAgICAgIHNvY2tldCxcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgICAgICBzb2NrZXQubW9uaXRvcigpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgbW9uaXRvcihcInNoZWxsU29ja2V0XCIsIHRoaXMuc2hlbGxTb2NrZXQpO1xyXG4gICAgICBtb25pdG9yKFwiaW9Tb2NrZXRcIiwgdGhpcy5pb1NvY2tldCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKFwiWk1RS2VybmVsOlwiLCBlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaW50ZXJydXB0KCkge1xyXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIikge1xyXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIkNhbm5vdCBpbnRlcnJ1cHQgdGhpcyBrZXJuZWxcIiwge1xyXG4gICAgICAgIGRldGFpbDogXCJLZXJuZWwgaW50ZXJydXB0aW9uIGlzIGN1cnJlbnRseSBub3Qgc3VwcG9ydGVkIGluIFdpbmRvd3MuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9nKFwiWk1RS2VybmVsOiBzZW5kaW5nIFNJR0lOVFwiKTtcclxuICAgICAgdGhpcy5rZXJuZWxQcm9jZXNzLmtpbGwoXCJTSUdJTlRcIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBfa2lsbCgpIHtcclxuICAgIGxvZyhcIlpNUUtlcm5lbDogc2VuZGluZyBTSUdLSUxMXCIpO1xyXG4gICAgdGhpcy5rZXJuZWxQcm9jZXNzLmtpbGwoXCJTSUdLSUxMXCIpO1xyXG4gIH1cclxuXHJcbiAgX2V4ZWN1dGVTdGFydHVwQ29kZSgpIHtcclxuICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gdGhpcy5rZXJuZWxTcGVjLmRpc3BsYXlfbmFtZTtcclxuICAgIGxldCBzdGFydHVwQ29kZSA9IENvbmZpZy5nZXRKc29uKFwic3RhcnR1cENvZGVcIilbZGlzcGxheU5hbWVdO1xyXG5cclxuICAgIGlmIChzdGFydHVwQ29kZSkge1xyXG4gICAgICBsb2coXCJLZXJuZWxNYW5hZ2VyOiBFeGVjdXRpbmcgc3RhcnR1cCBjb2RlOlwiLCBzdGFydHVwQ29kZSk7XHJcbiAgICAgIHN0YXJ0dXBDb2RlICs9IFwiXFxuXCI7XHJcbiAgICAgIHRoaXMuZXhlY3V0ZShzdGFydHVwQ29kZSwgKG1lc3NhZ2UsIGNoYW5uZWwpID0+IHt9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNodXRkb3duKCkge1xyXG4gICAgdGhpcy5fc29ja2V0U2h1dGRvd24oKTtcclxuICB9XHJcblxyXG4gIHJlc3RhcnQob25SZXN0YXJ0ZWQ6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICAgIHRoaXMuX3NvY2tldFJlc3RhcnQob25SZXN0YXJ0ZWQpO1xyXG4gIH1cclxuXHJcbiAgX3NvY2tldFNodXRkb3duKHJlc3RhcnQ6IGJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkID0gZmFsc2UpIHtcclxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGBzaHV0ZG93bl8ke3Y0KCl9YDtcclxuXHJcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5fY3JlYXRlTWVzc2FnZShcInNodXRkb3duX3JlcXVlc3RcIiwgcmVxdWVzdElkKTtcclxuXHJcbiAgICBtZXNzYWdlLmNvbnRlbnQgPSB7XHJcbiAgICAgIHJlc3RhcnQsXHJcbiAgICB9O1xyXG4gICAgdGhpcy5zaGVsbFNvY2tldC5zZW5kKG5ldyBNZXNzYWdlKG1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIF9zb2NrZXRSZXN0YXJ0KFxyXG4gICAgb25SZXN0YXJ0ZWQ6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWRcclxuICApIHtcclxuICAgIGlmICh0aGlzLmV4ZWN1dGlvblN0YXRlID09PSBcInJlc3RhcnRpbmdcIikge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZXRFeGVjdXRpb25TdGF0ZShcInJlc3RhcnRpbmdcIik7XHJcblxyXG4gICAgdGhpcy5fc29ja2V0U2h1dGRvd24odHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5fa2lsbCgpO1xyXG5cclxuICAgIGNvbnN0IHsgc3Bhd24gfSA9IGxhdW5jaFNwZWNGcm9tQ29ubmVjdGlvbkluZm8oXHJcbiAgICAgIHRoaXMua2VybmVsU3BlYyxcclxuICAgICAgdGhpcy5jb25uZWN0aW9uLFxyXG4gICAgICB0aGlzLmNvbm5lY3Rpb25GaWxlLFxyXG4gICAgICB0aGlzLm9wdGlvbnNcclxuICAgICk7XHJcbiAgICB0aGlzLmtlcm5lbFByb2Nlc3MgPSBzcGF3bjtcclxuICAgIHRoaXMubW9uaXRvcigoKSA9PiB7XHJcbiAgICAgIHRoaXMuX2V4ZWN1dGVTdGFydHVwQ29kZSgpO1xyXG5cclxuICAgICAgaWYgKG9uUmVzdGFydGVkKSB7XHJcbiAgICAgICAgb25SZXN0YXJ0ZWQoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBvblJlc3VsdHMgaXMgYSBjYWxsYmFjayB0aGF0IG1heSBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXNcclxuICAvLyBhcyByZXN1bHRzIGNvbWUgaW4gZnJvbSB0aGUga2VybmVsXHJcbiAgZXhlY3V0ZShjb2RlOiBzdHJpbmcsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKSB7XHJcbiAgICBsb2coXCJaTVFLZXJuZWwuZXhlY3V0ZTpcIiwgY29kZSk7XHJcbiAgICBjb25zdCByZXF1ZXN0SWQgPSBgZXhlY3V0ZV8ke3Y0KCl9YDtcclxuXHJcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5fY3JlYXRlTWVzc2FnZShcImV4ZWN1dGVfcmVxdWVzdFwiLCByZXF1ZXN0SWQpO1xyXG5cclxuICAgIG1lc3NhZ2UuY29udGVudCA9IHtcclxuICAgICAgY29kZSxcclxuICAgICAgc2lsZW50OiBmYWxzZSxcclxuICAgICAgc3RvcmVfaGlzdG9yeTogdHJ1ZSxcclxuICAgICAgdXNlcl9leHByZXNzaW9uczoge30sXHJcbiAgICAgIGFsbG93X3N0ZGluOiB0cnVlLFxyXG4gICAgfTtcclxuICAgIHRoaXMuZXhlY3V0aW9uQ2FsbGJhY2tzW3JlcXVlc3RJZF0gPSBvblJlc3VsdHM7XHJcbiAgICB0aGlzLnNoZWxsU29ja2V0LnNlbmQobmV3IE1lc3NhZ2UobWVzc2FnZSkpO1xyXG4gIH1cclxuXHJcbiAgY29tcGxldGUoY29kZTogc3RyaW5nLCBvblJlc3VsdHM6IFJlc3VsdHNDYWxsYmFjaykge1xyXG4gICAgbG9nKFwiWk1RS2VybmVsLmNvbXBsZXRlOlwiLCBjb2RlKTtcclxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGBjb21wbGV0ZV8ke3Y0KCl9YDtcclxuXHJcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5fY3JlYXRlTWVzc2FnZShcImNvbXBsZXRlX3JlcXVlc3RcIiwgcmVxdWVzdElkKTtcclxuXHJcbiAgICBtZXNzYWdlLmNvbnRlbnQgPSB7XHJcbiAgICAgIGNvZGUsXHJcbiAgICAgIHRleHQ6IGNvZGUsXHJcbiAgICAgIGxpbmU6IGNvZGUsXHJcbiAgICAgIGN1cnNvcl9wb3M6IGpzX2lkeF90b19jaGFyX2lkeChjb2RlLmxlbmd0aCwgY29kZSksXHJcbiAgICB9O1xyXG4gICAgdGhpcy5leGVjdXRpb25DYWxsYmFja3NbcmVxdWVzdElkXSA9IG9uUmVzdWx0cztcclxuICAgIHRoaXMuc2hlbGxTb2NrZXQuc2VuZChuZXcgTWVzc2FnZShtZXNzYWdlKSk7XHJcbiAgfVxyXG5cclxuICBpbnNwZWN0KGNvZGU6IHN0cmluZywgY3Vyc29yUG9zOiBudW1iZXIsIG9uUmVzdWx0czogUmVzdWx0c0NhbGxiYWNrKSB7XHJcbiAgICBsb2coXCJaTVFLZXJuZWwuaW5zcGVjdDpcIiwgY29kZSwgY3Vyc29yUG9zKTtcclxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGBpbnNwZWN0XyR7djQoKX1gO1xyXG5cclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVNZXNzYWdlKFwiaW5zcGVjdF9yZXF1ZXN0XCIsIHJlcXVlc3RJZCk7XHJcblxyXG4gICAgbWVzc2FnZS5jb250ZW50ID0ge1xyXG4gICAgICBjb2RlLFxyXG4gICAgICBjdXJzb3JfcG9zOiBjdXJzb3JQb3MsXHJcbiAgICAgIGRldGFpbF9sZXZlbDogMCxcclxuICAgIH07XHJcbiAgICB0aGlzLmV4ZWN1dGlvbkNhbGxiYWNrc1tyZXF1ZXN0SWRdID0gb25SZXN1bHRzO1xyXG4gICAgdGhpcy5zaGVsbFNvY2tldC5zZW5kKG5ldyBNZXNzYWdlKG1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIGlucHV0UmVwbHkoaW5wdXQ6IHN0cmluZykge1xyXG4gICAgY29uc3QgcmVxdWVzdElkID0gYGlucHV0X3JlcGx5XyR7djQoKX1gO1xyXG5cclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVNZXNzYWdlKFwiaW5wdXRfcmVwbHlcIiwgcmVxdWVzdElkKTtcclxuXHJcbiAgICBtZXNzYWdlLmNvbnRlbnQgPSB7XHJcbiAgICAgIHZhbHVlOiBpbnB1dCxcclxuICAgIH07XHJcbiAgICB0aGlzLnN0ZGluU29ja2V0LnNlbmQobmV3IE1lc3NhZ2UobWVzc2FnZSkpO1xyXG4gIH1cclxuXHJcbiAgb25TaGVsbE1lc3NhZ2UobWVzc2FnZTogTWVzc2FnZSkge1xyXG4gICAgbG9nKFwic2hlbGwgbWVzc2FnZTpcIiwgbWVzc2FnZSk7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9pc1ZhbGlkTWVzc2FnZShtZXNzYWdlKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBtc2dfaWQgfSA9IG1lc3NhZ2UucGFyZW50X2hlYWRlcjtcclxuICAgIGxldCBjYWxsYmFjaztcclxuXHJcbiAgICBpZiAobXNnX2lkKSB7XHJcbiAgICAgIGNhbGxiYWNrID0gdGhpcy5leGVjdXRpb25DYWxsYmFja3NbbXNnX2lkXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgY2FsbGJhY2sobWVzc2FnZSwgXCJzaGVsbFwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIG9uU3RkaW5NZXNzYWdlKG1lc3NhZ2U6IE1lc3NhZ2UpIHtcclxuICAgIGxvZyhcInN0ZGluIG1lc3NhZ2U6XCIsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmICghdGhpcy5faXNWYWxpZE1lc3NhZ2UobWVzc2FnZSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlucHV0X3JlcXVlc3QgbWVzc2FnZXMgYXJlIGF0dHJpYnV0YWJsZSB0byBwYXJ0aWN1bGFyIGV4ZWN1dGlvbiByZXF1ZXN0cyxcclxuICAgIC8vIGFuZCBzaG91bGQgcGFzcyB0aHJvdWdoIHRoZSBtaWRkbGV3YXJlIHN0YWNrIHRvIGFsbG93IHBsdWdpbnMgdG8gc2VlIHRoZW1cclxuICAgIGNvbnN0IHsgbXNnX2lkIH0gPSBtZXNzYWdlLnBhcmVudF9oZWFkZXI7XHJcbiAgICBsZXQgY2FsbGJhY2s7XHJcblxyXG4gICAgaWYgKG1zZ19pZCkge1xyXG4gICAgICBjYWxsYmFjayA9IHRoaXMuZXhlY3V0aW9uQ2FsbGJhY2tzW21zZ19pZF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgIGNhbGxiYWNrKG1lc3NhZ2UsIFwic3RkaW5cIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBvbklPTWVzc2FnZShtZXNzYWdlOiBNZXNzYWdlKSB7XHJcbiAgICBsb2coXCJJTyBtZXNzYWdlOlwiLCBtZXNzYWdlKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuX2lzVmFsaWRNZXNzYWdlKG1lc3NhZ2UpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IG1zZ190eXBlIH0gPSBtZXNzYWdlLmhlYWRlcjtcclxuXHJcbiAgICBpZiAobXNnX3R5cGUgPT09IFwic3RhdHVzXCIpIHtcclxuICAgICAgY29uc3Qgc3RhdHVzID0gbWVzc2FnZS5jb250ZW50LmV4ZWN1dGlvbl9zdGF0ZTtcclxuICAgICAgdGhpcy5zZXRFeGVjdXRpb25TdGF0ZShzdGF0dXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgbXNnX2lkIH0gPSBtZXNzYWdlLnBhcmVudF9oZWFkZXI7XHJcbiAgICBsZXQgY2FsbGJhY2s7XHJcblxyXG4gICAgaWYgKG1zZ19pZCkge1xyXG4gICAgICBjYWxsYmFjayA9IHRoaXMuZXhlY3V0aW9uQ2FsbGJhY2tzW21zZ19pZF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgIGNhbGxiYWNrKG1lc3NhZ2UsIFwiaW9wdWJcIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBfaXNWYWxpZE1lc3NhZ2UobWVzc2FnZTogTWVzc2FnZSkge1xyXG4gICAgaWYgKCFtZXNzYWdlKSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogbnVsbFwiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbWVzc2FnZS5jb250ZW50KSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBjb250ZW50XCIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuY29udGVudC5leGVjdXRpb25fc3RhdGUgPT09IFwic3RhcnRpbmdcIikge1xyXG4gICAgICAvLyBLZXJuZWxzIHNlbmQgYSBzdGFydGluZyBzdGF0dXMgbWVzc2FnZSB3aXRoIGFuIGVtcHR5IHBhcmVudF9oZWFkZXJcclxuICAgICAgbG9nKFwiRHJvcHBlZCBzdGFydGluZyBzdGF0dXMgSU8gbWVzc2FnZVwiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbWVzc2FnZS5wYXJlbnRfaGVhZGVyKSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBwYXJlbnRfaGVhZGVyXCIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlLnBhcmVudF9oZWFkZXIubXNnX2lkKSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBwYXJlbnRfaGVhZGVyLm1zZ19pZFwiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbWVzc2FnZS5wYXJlbnRfaGVhZGVyLm1zZ190eXBlKSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBwYXJlbnRfaGVhZGVyLm1zZ190eXBlXCIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlLmhlYWRlcikge1xyXG4gICAgICBsb2coXCJJbnZhbGlkIG1lc3NhZ2U6IE1pc3NpbmcgaGVhZGVyXCIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlLmhlYWRlci5tc2dfaWQpIHtcclxuICAgICAgbG9nKFwiSW52YWxpZCBtZXNzYWdlOiBNaXNzaW5nIGhlYWRlci5tc2dfaWRcIik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1lc3NhZ2UuaGVhZGVyLm1zZ190eXBlKSB7XHJcbiAgICAgIGxvZyhcIkludmFsaWQgbWVzc2FnZTogTWlzc2luZyBoZWFkZXIubXNnX3R5cGVcIik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICBsb2coXCJaTVFLZXJuZWw6IGRlc3Ryb3k6XCIsIHRoaXMpO1xyXG4gICAgdGhpcy5zaHV0ZG93bigpO1xyXG5cclxuICAgIHRoaXMuX2tpbGwoKTtcclxuXHJcbiAgICBmcy51bmxpbmtTeW5jKHRoaXMuY29ubmVjdGlvbkZpbGUpO1xyXG4gICAgdGhpcy5zaGVsbFNvY2tldC5jbG9zZSgpO1xyXG4gICAgdGhpcy5pb1NvY2tldC5jbG9zZSgpO1xyXG4gICAgdGhpcy5zdGRpblNvY2tldC5jbG9zZSgpO1xyXG4gICAgc3VwZXIuZGVzdHJveSgpO1xyXG4gIH1cclxuXHJcbiAgX2dldFVzZXJuYW1lKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgcHJvY2Vzcy5lbnYuTE9HTkFNRSB8fFxyXG4gICAgICBwcm9jZXNzLmVudi5VU0VSIHx8XHJcbiAgICAgIHByb2Nlc3MuZW52LkxOQU1FIHx8XHJcbiAgICAgIHByb2Nlc3MuZW52LlVTRVJOQU1FXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgX2NyZWF0ZU1lc3NhZ2UobXNnVHlwZTogc3RyaW5nLCBtc2dJZDogc3RyaW5nID0gdjQoKSkge1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IHtcclxuICAgICAgaGVhZGVyOiB7XHJcbiAgICAgICAgdXNlcm5hbWU6IHRoaXMuX2dldFVzZXJuYW1lKCksXHJcbiAgICAgICAgc2Vzc2lvbjogXCIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDBcIixcclxuICAgICAgICBtc2dfdHlwZTogbXNnVHlwZSxcclxuICAgICAgICBtc2dfaWQ6IG1zZ0lkLFxyXG4gICAgICAgIGRhdGU6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgdmVyc2lvbjogXCI1LjBcIixcclxuICAgICAgfSxcclxuICAgICAgbWV0YWRhdGE6IHt9LFxyXG4gICAgICBwYXJlbnRfaGVhZGVyOiB7fSxcclxuICAgICAgY29udGVudDoge30sXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbiAgfVxyXG59XHJcbiJdfQ==