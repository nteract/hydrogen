"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_select_list_1 = __importDefault(require("atom-select-list"));
const lodash_1 = __importDefault(require("lodash"));
const tildify_1 = __importDefault(require("tildify"));
const uuid_1 = require("uuid");
const ws_1 = __importDefault(require("ws"));
const xmlhttprequest_1 = require("xmlhttprequest");
const url_1 = require("url");
const services_1 = require("@jupyterlab/services");
const config_1 = __importDefault(require("./config"));
const ws_kernel_1 = __importDefault(require("./ws-kernel"));
const input_view_1 = __importDefault(require("./input-view"));
const store_1 = __importDefault(require("./store"));
const utils_1 = require("./utils");
class CustomListView {
    constructor() {
        this.onConfirmed = null;
        this.onCancelled = null;
        utils_1.setPreviouslyFocusedElement(this);
        this.selectListView = new atom_select_list_1.default({
            itemsClassList: ["mark-active"],
            items: [],
            filterKeyForItem: (item) => item.name,
            elementForItem: (item) => {
                const element = document.createElement("li");
                element.textContent = item.name;
                return element;
            },
            didConfirmSelection: (item) => {
                if (this.onConfirmed) {
                    this.onConfirmed(item);
                }
            },
            didCancelSelection: () => {
                this.cancel();
                if (this.onCancelled) {
                    this.onCancelled();
                }
            },
        });
    }
    show() {
        if (!this.panel) {
            this.panel = atom.workspace.addModalPanel({
                item: this.selectListView,
            });
        }
        this.panel.show();
        this.selectListView.focus();
    }
    destroy() {
        this.cancel();
        return this.selectListView.destroy();
    }
    cancel() {
        if (this.panel != null) {
            this.panel.destroy();
        }
        this.panel = null;
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }
}
class WSKernelPicker {
    constructor(onChosen) {
        this._onChosen = onChosen;
        this.listView = new CustomListView();
    }
    async toggle(_kernelSpecFilter) {
        utils_1.setPreviouslyFocusedElement(this.listView);
        this._kernelSpecFilter = _kernelSpecFilter;
        const gateways = config_1.default.getJson("gateways") || [];
        if (lodash_1.default.isEmpty(gateways)) {
            atom.notifications.addError("No remote kernel gateways available", {
                description: "Use the Hydrogen package settings to specify the list of remote servers. Hydrogen can use remote kernels on either a Jupyter Kernel Gateway or Jupyter notebook server.",
            });
            return;
        }
        this._path = `${store_1.default.filePath || "unsaved"}-${uuid_1.v4()}`;
        this.listView.onConfirmed = this.onGateway.bind(this);
        await this.listView.selectListView.update({
            items: gateways,
            infoMessage: "Select a gateway",
            emptyMessage: "No gateways available",
            loadingMessage: null,
        });
        this.listView.show();
    }
    async promptForText(prompt) {
        const previouslyFocusedElement = this.listView.previouslyFocusedElement;
        this.listView.cancel();
        const inputPromise = new Promise((resolve, reject) => {
            const inputView = new input_view_1.default({
                prompt,
            }, resolve);
            atom.commands.add(inputView.element, {
                "core:cancel": () => {
                    inputView.close();
                    reject();
                },
            });
            inputView.attach();
        });
        let response = undefined;
        try {
            response = await inputPromise;
            if (response === "") {
                return null;
            }
        }
        catch (e) {
            return null;
        }
        this.listView.show();
        this.listView.previouslyFocusedElement = previouslyFocusedElement;
        return response;
    }
    async promptForCookie(options) {
        const cookie = await this.promptForText("Cookie:");
        if (cookie === null || cookie === undefined) {
            return false;
        }
        if (options.requestHeaders === undefined) {
            options.requestHeaders = {};
        }
        options.requestHeaders.Cookie = cookie;
        options.xhrFactory = () => {
            const request = new xmlhttprequest_1.XMLHttpRequest();
            request.setDisableHeaderCheck(true);
            return request;
        };
        options.wsFactory = (url, protocol) => {
            const parsedUrl = new url_1.URL(url);
            if (parsedUrl.protocol === "wss:") {
                parsedUrl.protocol = "https:";
            }
            else {
                parsedUrl.protocol = "http:";
            }
            const headers = {
                Cookie: cookie,
            };
            const origin = parsedUrl.origin;
            const host = parsedUrl.host;
            return new ws_1.default(url, protocol, {
                headers,
                origin,
                host,
            });
        };
        return true;
    }
    async promptForToken(options) {
        const token = await this.promptForText("Token:");
        if (token === null) {
            return false;
        }
        options.token = token;
        return true;
    }
    async promptForCredentials(options) {
        await this.listView.selectListView.update({
            items: [
                {
                    name: "Authenticate with a token",
                    action: "token",
                },
                {
                    name: "Authenticate with a cookie",
                    action: "cookie",
                },
                {
                    name: "Cancel",
                    action: "cancel",
                },
            ],
            infoMessage: "Connection to gateway failed. Your settings may be incorrect, the server may be unavailable, or you may lack sufficient privileges to complete the connection.",
            loadingMessage: null,
            emptyMessage: null,
        });
        const action = await new Promise((resolve, reject) => {
            this.listView.onConfirmed = (item) => resolve(item.action);
            this.listView.onCancelled = () => resolve("cancel");
        });
        if (action === "token") {
            return this.promptForToken(options);
        }
        if (action === "cookie") {
            return this.promptForCookie(options);
        }
        this.listView.cancel();
        return false;
    }
    async onGateway(gatewayInfo) {
        this.listView.onConfirmed = null;
        await this.listView.selectListView.update({
            items: [],
            infoMessage: null,
            loadingMessage: "Loading sessions...",
            emptyMessage: "No sessions available",
        });
        const gatewayOptions = {
            xhrFactory: () => new XMLHttpRequest(),
            wsFactory: (url, protocol) => new ws_1.default(url, protocol),
            ...gatewayInfo.options,
        };
        let serverSettings = services_1.ServerConnection.makeSettings(gatewayOptions);
        let specModels;
        try {
            specModels = await services_1.Kernel.getSpecs(serverSettings);
        }
        catch (error) {
            if (!error.xhr || !error.xhr.responseText) {
                throw error;
            }
            else if (error.xhr.responseText.includes("ETIMEDOUT")) {
                atom.notifications.addError("Connection to gateway failed");
                this.listView.cancel();
                return;
            }
            else {
                const promptSucceeded = await this.promptForCredentials(gatewayOptions);
                if (!promptSucceeded) {
                    return;
                }
                serverSettings = services_1.ServerConnection.makeSettings(gatewayOptions);
                await this.listView.selectListView.update({
                    items: [],
                    infoMessage: null,
                    loadingMessage: "Loading sessions...",
                    emptyMessage: "No sessions available",
                });
            }
        }
        try {
            if (!specModels) {
                specModels = await services_1.Kernel.getSpecs(serverSettings);
            }
            const kernelSpecs = lodash_1.default.filter(specModels.kernelspecs, (spec) => this._kernelSpecFilter(spec));
            const kernelNames = lodash_1.default.map(kernelSpecs, (specModel) => specModel.name);
            try {
                let sessionModels = await services_1.Session.listRunning(serverSettings);
                sessionModels = sessionModels.filter((model) => {
                    const name = model.kernel ? model.kernel.name : null;
                    return name ? kernelNames.includes(name) : true;
                });
                const items = sessionModels.map((model) => {
                    var _a;
                    let name;
                    if (model.path) {
                        name = tildify_1.default(model.path);
                    }
                    else if ((_a = model.notebook) === null || _a === void 0 ? void 0 : _a.path) {
                        name = tildify_1.default(model.notebook.path);
                    }
                    else {
                        name = `Session ${model.id}`;
                    }
                    return {
                        name,
                        model,
                        options: serverSettings,
                    };
                });
                items.unshift({
                    name: "[new session]",
                    model: null,
                    options: serverSettings,
                    kernelSpecs,
                });
                this.listView.onConfirmed = this.onSession.bind(this, gatewayInfo.name);
                await this.listView.selectListView.update({
                    items,
                    loadingMessage: null,
                });
            }
            catch (error) {
                if (!error.xhr || error.xhr.status !== 403) {
                    throw error;
                }
                this.onSession(gatewayInfo.name, {
                    name: "[new session]",
                    model: null,
                    options: serverSettings,
                    kernelSpecs,
                });
            }
        }
        catch (e) {
            atom.notifications.addError("Connection to gateway failed");
            this.listView.cancel();
        }
    }
    onSession(gatewayName, sessionInfo) {
        const model = sessionInfo.model;
        if (model === null || model === undefined) {
            return this.onSessionWitouthModel(gatewayName, sessionInfo);
        }
        else {
            return this.onSessionWithModel(gatewayName, sessionInfo);
        }
    }
    async onSessionWithModel(gatewayName, sessionInfo) {
        this.onSessionChosen(gatewayName, await services_1.Session.connectTo(sessionInfo.model.id, sessionInfo.options));
    }
    async onSessionWitouthModel(gatewayName, sessionInfo) {
        if (!sessionInfo.name) {
            await this.listView.selectListView.update({
                items: [],
                errorMessage: "This gateway does not support listing sessions",
                loadingMessage: null,
                infoMessage: null,
            });
        }
        const items = lodash_1.default.map(sessionInfo.kernelSpecs, (spec) => {
            const options = {
                serverSettings: sessionInfo.options,
                kernelName: spec.name,
                path: this._path,
            };
            return {
                name: spec.display_name,
                options,
            };
        });
        this.listView.onConfirmed = this.startSession.bind(this, gatewayName);
        await this.listView.selectListView.update({
            items,
            emptyMessage: "No kernel specs available",
            infoMessage: "Select a session",
            loadingMessage: null,
        });
    }
    startSession(gatewayName, sessionInfo) {
        services_1.Session.startNew(sessionInfo.options).then(this.onSessionChosen.bind(this, gatewayName));
    }
    async onSessionChosen(gatewayName, session) {
        this.listView.cancel();
        const kernelSpec = await session.kernel.getSpec();
        if (!store_1.default.grammar) {
            return;
        }
        const kernel = new ws_kernel_1.default(gatewayName, kernelSpec, store_1.default.grammar, session);
        this._onChosen(kernel);
    }
}
exports.default = WSKernelPicker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi93cy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQThDO0FBQzlDLG9EQUF1QjtBQUN2QixzREFBOEI7QUFDOUIsK0JBQTBCO0FBQzFCLDRDQUFvQjtBQUNwQixtREFBc0U7QUFDdEUsNkJBQTBCO0FBQzFCLG1EQUF5RTtBQUN6RSxzREFBOEI7QUFDOUIsNERBQW1DO0FBQ25DLDhEQUFxQztBQUNyQyxvREFBNEI7QUFFNUIsbUNBQXFFO0FBaUNyRSxNQUFNLGNBQWM7SUFPbEI7UUFOQSxnQkFBVyxHQUFzRCxJQUFJLENBQUM7UUFDdEUsZ0JBQVcsR0FBa0MsSUFBSSxDQUFDO1FBTWhELG1DQUEyQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSwwQkFBYyxDQUFDO1lBQ3ZDLGNBQWMsRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUMvQixLQUFLLEVBQUUsRUFBRTtZQUNULGdCQUFnQixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDckQsY0FBYyxFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxtQkFBbUIsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtnQkFDNUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4QjtZQUNILENBQUM7WUFDRCxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZCLElBQUks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QU87U0FDUjtRQUNELE1BQU0sTUFBTSxHQUFHLElBQUksbUJBQVEsQ0FDekIsV0FBVyxFQUNYLFVBQVUsRUFDVixlQUFLLENBQUMsT0FBTyxFQUNiLE9BQU8sQ0FDUixDQUFDO1FBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUFqWEQsaUNBaVhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgU2VsZWN0TGlzdFZpZXcgZnJvbSBcImF0b20tc2VsZWN0LWxpc3RcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQgdGlsZGlmeSBmcm9tIFwidGlsZGlmeVwiO1xyXG5pbXBvcnQgeyB2NCB9IGZyb20gXCJ1dWlkXCI7XHJcbmltcG9ydCB3cyBmcm9tIFwid3NcIjtcclxuaW1wb3J0IHsgWE1MSHR0cFJlcXVlc3QgYXMgTm9kZVhNTEh0dHBSZXF1ZXN0IH0gZnJvbSBcInhtbGh0dHByZXF1ZXN0XCI7IC8vIFRPRE8gdXNlIEBhbWlueWEveG1saHR0cHJlcXVlc3RcclxuaW1wb3J0IHsgVVJMIH0gZnJvbSBcInVybFwiO1xyXG5pbXBvcnQgeyBLZXJuZWwsIFNlc3Npb24sIFNlcnZlckNvbm5lY3Rpb24gfSBmcm9tIFwiQGp1cHl0ZXJsYWIvc2VydmljZXNcIjtcclxuaW1wb3J0IENvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IFdTS2VybmVsIGZyb20gXCIuL3dzLWtlcm5lbFwiO1xyXG5pbXBvcnQgSW5wdXRWaWV3IGZyb20gXCIuL2lucHV0LXZpZXdcIjtcclxuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XHJcbmltcG9ydCB0eXBlIHsgS2VybmVsc3BlY01ldGFkYXRhIH0gZnJvbSBcIkBudGVyYWN0L3R5cGVzXCI7XHJcbmltcG9ydCB7IHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCwgRGVlcFdyaXRlYWJsZSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG50eXBlIFNlbGVjdExpc3RJdGVtID0gYW55O1xyXG5cclxuZXhwb3J0IHR5cGUgS2VybmVsR2F0ZXdheU9wdGlvbnMgPSBQYXJhbWV0ZXJzPFxyXG4gIHR5cGVvZiBTZXJ2ZXJDb25uZWN0aW9uW1wibWFrZVNldHRpbmdzXCJdXHJcbj5bMF07XHJcblxyXG4vLyBCYXNlZCBvbiB0aGUgY29uZmlnIGRvY3VtZW50YXRpb25cclxuLy8gVE9ETyB2ZXJpZnkgdGhpc1xyXG5leHBvcnQgdHlwZSBNaW5pbWFsU2VydmVyQ29ubmVjdGlvblNldHRpbmdzID0gUGljazxcclxuICBLZXJuZWxHYXRld2F5T3B0aW9ucyxcclxuICBcImJhc2VVcmxcIlxyXG4+O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBLZXJuZWxHYXRld2F5IHtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgb3B0aW9uczogS2VybmVsR2F0ZXdheU9wdGlvbnM7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbkluZm9XaXRoTW9kZWwge1xyXG4gIG1vZGVsOiBLZXJuZWwuSU1vZGVsO1xyXG4gIG9wdGlvbnM6IFBhcmFtZXRlcnM8dHlwZW9mIFNlc3Npb24uY29ubmVjdFRvPlsxXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uSW5mb1dpdGhvdXRNb2RlbCB7XHJcbiAgbmFtZT86IHN0cmluZztcclxuICBrZXJuZWxTcGVjczogS2VybmVsLklTcGVjTW9kZWxbXTtcclxuICBvcHRpb25zOiBQYXJhbWV0ZXJzPHR5cGVvZiBTZXNzaW9uLnN0YXJ0TmV3PlswXTtcclxuICAvLyBubyBtb2RlbFxyXG4gIG1vZGVsPzogbmV2ZXIgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG59XHJcblxyXG5jbGFzcyBDdXN0b21MaXN0VmlldyB7XHJcbiAgb25Db25maXJtZWQ6IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4gdm9pZCB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xyXG4gIG9uQ2FuY2VsbGVkOiAoKSA9PiB2b2lkIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7XHJcbiAgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgc2VsZWN0TGlzdFZpZXc6IFNlbGVjdExpc3RWaWV3O1xyXG4gIHBhbmVsOiBQYW5lbCB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50KHRoaXMpO1xyXG4gICAgdGhpcy5zZWxlY3RMaXN0VmlldyA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XHJcbiAgICAgIGl0ZW1zQ2xhc3NMaXN0OiBbXCJtYXJrLWFjdGl2ZVwiXSxcclxuICAgICAgaXRlbXM6IFtdLFxyXG4gICAgICBmaWx0ZXJLZXlGb3JJdGVtOiAoaXRlbTogU2VsZWN0TGlzdEl0ZW0pID0+IGl0ZW0ubmFtZSxcclxuICAgICAgZWxlbWVudEZvckl0ZW06IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGl0ZW0ubmFtZTtcclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgfSxcclxuICAgICAgZGlkQ29uZmlybVNlbGVjdGlvbjogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiB7XHJcbiAgICAgICAgaWYgKHRoaXMub25Db25maXJtZWQpIHtcclxuICAgICAgICAgIHRoaXMub25Db25maXJtZWQoaXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBkaWRDYW5jZWxTZWxlY3Rpb246ICgpID0+IHtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgICAgIGlmICh0aGlzLm9uQ2FuY2VsbGVkKSB7XHJcbiAgICAgICAgICB0aGlzLm9uQ2FuY2VsbGVkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzaG93KCkge1xyXG4gICAgaWYgKCF0aGlzLnBhbmVsKSB7XHJcbiAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcclxuICAgICAgICBpdGVtOiB0aGlzLnNlbGVjdExpc3RWaWV3LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnBhbmVsLnNob3coKTtcclxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcuZm9jdXMoKTtcclxuICB9XHJcblxyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0TGlzdFZpZXcuZGVzdHJveSgpO1xyXG4gIH1cclxuXHJcbiAgY2FuY2VsKCkge1xyXG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnBhbmVsID0gbnVsbDtcclxuXHJcbiAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcclxuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQuZm9jdXMoKTtcclxuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV1NLZXJuZWxQaWNrZXIge1xyXG4gIF9vbkNob3NlbjogKGtlcm5lbDogV1NLZXJuZWwpID0+IHZvaWQ7XHJcbiAgX2tlcm5lbFNwZWNGaWx0ZXI6IChrZXJuZWxTcGVjOiBLZXJuZWwuSVNwZWNNb2RlbCkgPT4gYm9vbGVhbjtcclxuICBfcGF0aDogc3RyaW5nO1xyXG4gIGxpc3RWaWV3OiBDdXN0b21MaXN0VmlldztcclxuXHJcbiAgY29uc3RydWN0b3Iob25DaG9zZW46IChrZXJuZWw6IFdTS2VybmVsKSA9PiB2b2lkKSB7XHJcbiAgICB0aGlzLl9vbkNob3NlbiA9IG9uQ2hvc2VuO1xyXG4gICAgdGhpcy5saXN0VmlldyA9IG5ldyBDdXN0b21MaXN0VmlldygpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdG9nZ2xlKFxyXG4gICAgX2tlcm5lbFNwZWNGaWx0ZXI6IChcclxuICAgICAga2VybmVsU3BlYzogS2VybmVsLklTcGVjTW9kZWwgfCBLZXJuZWxzcGVjTWV0YWRhdGFcclxuICAgICkgPT4gYm9vbGVhblxyXG4gICkge1xyXG4gICAgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50KHRoaXMubGlzdFZpZXcpO1xyXG4gICAgdGhpcy5fa2VybmVsU3BlY0ZpbHRlciA9IF9rZXJuZWxTcGVjRmlsdGVyO1xyXG4gICAgY29uc3QgZ2F0ZXdheXMgPSBDb25maWcuZ2V0SnNvbihcImdhdGV3YXlzXCIpIHx8IFtdO1xyXG5cclxuICAgIGlmIChfLmlzRW1wdHkoZ2F0ZXdheXMpKSB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIk5vIHJlbW90ZSBrZXJuZWwgZ2F0ZXdheXMgYXZhaWxhYmxlXCIsIHtcclxuICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgIFwiVXNlIHRoZSBIeWRyb2dlbiBwYWNrYWdlIHNldHRpbmdzIHRvIHNwZWNpZnkgdGhlIGxpc3Qgb2YgcmVtb3RlIHNlcnZlcnMuIEh5ZHJvZ2VuIGNhbiB1c2UgcmVtb3RlIGtlcm5lbHMgb24gZWl0aGVyIGEgSnVweXRlciBLZXJuZWwgR2F0ZXdheSBvciBKdXB5dGVyIG5vdGVib29rIHNlcnZlci5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9wYXRoID0gYCR7c3RvcmUuZmlsZVBhdGggfHwgXCJ1bnNhdmVkXCJ9LSR7djQoKX1gO1xyXG4gICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IHRoaXMub25HYXRld2F5LmJpbmQodGhpcyk7XHJcbiAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgIGl0ZW1zOiBnYXRld2F5cyxcclxuICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgZ2F0ZXdheVwiLFxyXG4gICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8gZ2F0ZXdheXMgYXZhaWxhYmxlXCIsXHJcbiAgICAgIGxvYWRpbmdNZXNzYWdlOiBudWxsLFxyXG4gICAgfSk7XHJcbiAgICB0aGlzLmxpc3RWaWV3LnNob3coKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHByb21wdEZvclRleHQocHJvbXB0OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IHRoaXMubGlzdFZpZXcucHJldmlvdXNseUZvY3VzZWRFbGVtZW50O1xyXG4gICAgdGhpcy5saXN0Vmlldy5jYW5jZWwoKTtcclxuICAgIGNvbnN0IGlucHV0UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBpbnB1dFZpZXcgPSBuZXcgSW5wdXRWaWV3KFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHByb21wdCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc29sdmVcclxuICAgICAgKTtcclxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoaW5wdXRWaWV3LmVsZW1lbnQsIHtcclxuICAgICAgICBcImNvcmU6Y2FuY2VsXCI6ICgpID0+IHtcclxuICAgICAgICAgIGlucHV0Vmlldy5jbG9zZSgpO1xyXG4gICAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICAgIGlucHV0Vmlldy5hdHRhY2goKTtcclxuICAgIH0pO1xyXG4gICAgbGV0IHJlc3BvbnNlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgaW5wdXRQcm9taXNlO1xyXG5cclxuICAgICAgaWYgKHJlc3BvbnNlID09PSBcIlwiKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXNzdW1lIHRoYXQgbm8gcmVzcG9uc2UgdG8gdGhlIHByb21wdCB3aWxsIGNhbmNlbCB0aGUgZW50aXJlIGZsb3csIHNvXHJcbiAgICAvLyBvbmx5IHJlc3RvcmUgbGlzdFZpZXcgaWYgYSByZXNwb25zZSB3YXMgcmVjZWl2ZWRcclxuICAgIHRoaXMubGlzdFZpZXcuc2hvdygpO1xyXG4gICAgdGhpcy5saXN0Vmlldy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XHJcbiAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwcm9tcHRGb3JDb29raWUob3B0aW9uczogRGVlcFdyaXRlYWJsZTxLZXJuZWxHYXRld2F5T3B0aW9ucz4pIHtcclxuICAgIGNvbnN0IGNvb2tpZSA9IGF3YWl0IHRoaXMucHJvbXB0Rm9yVGV4dChcIkNvb2tpZTpcIik7XHJcblxyXG4gICAgaWYgKGNvb2tpZSA9PT0gbnVsbCB8fCBjb29raWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMucmVxdWVzdEhlYWRlcnMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBvcHRpb25zLnJlcXVlc3RIZWFkZXJzID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucy5yZXF1ZXN0SGVhZGVycy5Db29raWUgPSBjb29raWU7XHJcblxyXG4gICAgb3B0aW9ucy54aHJGYWN0b3J5ID0gKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IE5vZGVYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAvLyBEaXNhYmxlIHByb3RlY3Rpb25zIGFnYWluc3Qgc2V0dGluZyB0aGUgQ29va2llIGhlYWRlclxyXG4gICAgICByZXF1ZXN0LnNldERpc2FibGVIZWFkZXJDaGVjayh0cnVlKTtcclxuICAgICAgcmV0dXJuIHJlcXVlc3QgYXMgWE1MSHR0cFJlcXVlc3Q7IC8vIFRPRE8gZml4IHRoZSB0eXBlc1xyXG4gICAgfTtcclxuXHJcbiAgICBvcHRpb25zLndzRmFjdG9yeSA9ICh1cmw6IHN0cmluZywgcHJvdG9jb2w/OiBzdHJpbmcgfCBzdHJpbmdbXSkgPT4ge1xyXG4gICAgICAvLyBBdXRoZW50aWNhdGlvbiByZXF1aXJlcyByZXF1ZXN0cyB0byBhcHBlYXIgdG8gYmUgc2FtZS1vcmlnaW5cclxuICAgICAgY29uc3QgcGFyc2VkVXJsID0gbmV3IFVSTCh1cmwpO1xyXG5cclxuICAgICAgaWYgKHBhcnNlZFVybC5wcm90b2NvbCA9PT0gXCJ3c3M6XCIpIHtcclxuICAgICAgICBwYXJzZWRVcmwucHJvdG9jb2wgPSBcImh0dHBzOlwiO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBhcnNlZFVybC5wcm90b2NvbCA9IFwiaHR0cDpcIjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgaGVhZGVycyA9IHtcclxuICAgICAgICBDb29raWU6IGNvb2tpZSxcclxuICAgICAgfTtcclxuICAgICAgY29uc3Qgb3JpZ2luID0gcGFyc2VkVXJsLm9yaWdpbjtcclxuICAgICAgY29uc3QgaG9zdCA9IHBhcnNlZFVybC5ob3N0O1xyXG4gICAgICByZXR1cm4gbmV3IHdzKHVybCwgcHJvdG9jb2wsIHtcclxuICAgICAgICBoZWFkZXJzLFxyXG4gICAgICAgIG9yaWdpbixcclxuICAgICAgICBob3N0LFxyXG4gICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwcm9tcHRGb3JUb2tlbihvcHRpb25zOiBEZWVwV3JpdGVhYmxlPEtlcm5lbEdhdGV3YXlPcHRpb25zPikge1xyXG4gICAgY29uc3QgdG9rZW4gPSBhd2FpdCB0aGlzLnByb21wdEZvclRleHQoXCJUb2tlbjpcIik7XHJcblxyXG4gICAgaWYgKHRva2VuID09PSBudWxsKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zLnRva2VuID0gdG9rZW47XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHByb21wdEZvckNyZWRlbnRpYWxzKG9wdGlvbnM6IERlZXBXcml0ZWFibGU8S2VybmVsR2F0ZXdheU9wdGlvbnM+KSB7XHJcbiAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogXCJBdXRoZW50aWNhdGUgd2l0aCBhIHRva2VuXCIsXHJcbiAgICAgICAgICBhY3Rpb246IFwidG9rZW5cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIG5hbWU6IFwiQXV0aGVudGljYXRlIHdpdGggYSBjb29raWVcIixcclxuICAgICAgICAgIGFjdGlvbjogXCJjb29raWVcIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIG5hbWU6IFwiQ2FuY2VsXCIsXHJcbiAgICAgICAgICBhY3Rpb246IFwiY2FuY2VsXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgaW5mb01lc3NhZ2U6XHJcbiAgICAgICAgXCJDb25uZWN0aW9uIHRvIGdhdGV3YXkgZmFpbGVkLiBZb3VyIHNldHRpbmdzIG1heSBiZSBpbmNvcnJlY3QsIHRoZSBzZXJ2ZXIgbWF5IGJlIHVuYXZhaWxhYmxlLCBvciB5b3UgbWF5IGxhY2sgc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIGNvbXBsZXRlIHRoZSBjb25uZWN0aW9uLlwiLFxyXG4gICAgICBsb2FkaW5nTWVzc2FnZTogbnVsbCxcclxuICAgICAgZW1wdHlNZXNzYWdlOiBudWxsLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBhY3Rpb24gPSBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IChpdGVtOiB7IGFjdGlvbjogc3RyaW5nIH0pID0+XHJcbiAgICAgICAgcmVzb2x2ZShpdGVtLmFjdGlvbik7XHJcblxyXG4gICAgICB0aGlzLmxpc3RWaWV3Lm9uQ2FuY2VsbGVkID0gKCkgPT4gcmVzb2x2ZShcImNhbmNlbFwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChhY3Rpb24gPT09IFwidG9rZW5cIikge1xyXG4gICAgICByZXR1cm4gdGhpcy5wcm9tcHRGb3JUb2tlbihvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWN0aW9uID09PSBcImNvb2tpZVwiKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnByb21wdEZvckNvb2tpZShvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhY3Rpb24gPT09IFwiY2FuY2VsXCJcclxuICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBhc3luYyBvbkdhdGV3YXkoZ2F0ZXdheUluZm86IEtlcm5lbEdhdGV3YXkpIHtcclxuICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSBudWxsO1xyXG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xyXG4gICAgICBpdGVtczogW10sXHJcbiAgICAgIGluZm9NZXNzYWdlOiBudWxsLFxyXG4gICAgICBsb2FkaW5nTWVzc2FnZTogXCJMb2FkaW5nIHNlc3Npb25zLi4uXCIsXHJcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBzZXNzaW9ucyBhdmFpbGFibGVcIixcclxuICAgIH0pO1xyXG4gICAgY29uc3QgZ2F0ZXdheU9wdGlvbnMgPSB7XHJcbiAgICAgIHhockZhY3Rvcnk6ICgpID0+IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxyXG4gICAgICB3c0ZhY3Rvcnk6ICh1cmw6IHN0cmluZywgcHJvdG9jb2w/OiBzdHJpbmcgfCBzdHJpbmdbXSkgPT5cclxuICAgICAgICBuZXcgd3ModXJsLCBwcm90b2NvbCksXHJcbiAgICAgIC4uLmdhdGV3YXlJbmZvLm9wdGlvbnMsXHJcbiAgICB9O1xyXG4gICAgbGV0IHNlcnZlclNldHRpbmdzID0gU2VydmVyQ29ubmVjdGlvbi5tYWtlU2V0dGluZ3MoZ2F0ZXdheU9wdGlvbnMpO1xyXG4gICAgbGV0IHNwZWNNb2RlbHM6IEtlcm5lbC5JU3BlY01vZGVscyB8IHVuZGVmaW5lZDtcclxuICAgIHRyeSB7XHJcbiAgICAgIHNwZWNNb2RlbHMgPSBhd2FpdCBLZXJuZWwuZ2V0U3BlY3Moc2VydmVyU2V0dGluZ3MpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgLy8gVGhlIGVycm9yIHR5cGVzIHlvdSBnZXQgYmFjayBhdCB0aGlzIHN0YWdlIGFyZSBmYWlybHkgb3BhcXVlLiBJblxyXG4gICAgICAvLyBwYXJ0aWN1bGFyLCBoYXZpbmcgaW52YWxpZCBjcmVkZW50aWFscyB0eXBpY2FsbHkgdHJpZ2dlcnMgRUNPTk5SRUZVU0VEXHJcbiAgICAgIC8vIHJhdGhlciB0aGFuIDQwMyBGb3JiaWRkZW4uIFRoaXMgZG9lcyBzb21lIGJhc2ljIGNoZWNrcyBhbmQgdGhlbiBhc3N1bWVzXHJcbiAgICAgIC8vIHRoYXQgYWxsIHJlbWFpbmluZyBlcnJvciB0eXBlcyBjb3VsZCBiZSBjYXVzZWQgYnkgaW52YWxpZCBjcmVkZW50aWFscy5cclxuICAgICAgaWYgKCFlcnJvci54aHIgfHwgIWVycm9yLnhoci5yZXNwb25zZVRleHQpIHtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgfSBlbHNlIGlmIChlcnJvci54aHIucmVzcG9uc2VUZXh0LmluY2x1ZGVzKFwiRVRJTUVET1VUXCIpKSB7XHJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiQ29ubmVjdGlvbiB0byBnYXRld2F5IGZhaWxlZFwiKTtcclxuICAgICAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBwcm9tcHRTdWNjZWVkZWQgPSBhd2FpdCB0aGlzLnByb21wdEZvckNyZWRlbnRpYWxzKGdhdGV3YXlPcHRpb25zKTtcclxuXHJcbiAgICAgICAgaWYgKCFwcm9tcHRTdWNjZWVkZWQpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlcnZlclNldHRpbmdzID0gU2VydmVyQ29ubmVjdGlvbi5tYWtlU2V0dGluZ3MoZ2F0ZXdheU9wdGlvbnMpO1xyXG4gICAgICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgICAgIGl0ZW1zOiBbXSxcclxuICAgICAgICAgIGluZm9NZXNzYWdlOiBudWxsLFxyXG4gICAgICAgICAgbG9hZGluZ01lc3NhZ2U6IFwiTG9hZGluZyBzZXNzaW9ucy4uLlwiLFxyXG4gICAgICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIHNlc3Npb25zIGF2YWlsYWJsZVwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKCFzcGVjTW9kZWxzKSB7XHJcbiAgICAgICAgc3BlY01vZGVscyA9IGF3YWl0IEtlcm5lbC5nZXRTcGVjcyhzZXJ2ZXJTZXR0aW5ncyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gXy5maWx0ZXIoc3BlY01vZGVscy5rZXJuZWxzcGVjcywgKHNwZWMpID0+XHJcbiAgICAgICAgdGhpcy5fa2VybmVsU3BlY0ZpbHRlcihzcGVjKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3Qga2VybmVsTmFtZXMgPSBfLm1hcChrZXJuZWxTcGVjcywgKHNwZWNNb2RlbCkgPT4gc3BlY01vZGVsLm5hbWUpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsZXQgc2Vzc2lvbk1vZGVscyA9IGF3YWl0IFNlc3Npb24ubGlzdFJ1bm5pbmcoc2VydmVyU2V0dGluZ3MpO1xyXG4gICAgICAgIHNlc3Npb25Nb2RlbHMgPSBzZXNzaW9uTW9kZWxzLmZpbHRlcigobW9kZWwpID0+IHtcclxuICAgICAgICAgIGNvbnN0IG5hbWUgPSBtb2RlbC5rZXJuZWwgPyBtb2RlbC5rZXJuZWwubmFtZSA6IG51bGw7XHJcbiAgICAgICAgICByZXR1cm4gbmFtZSA/IGtlcm5lbE5hbWVzLmluY2x1ZGVzKG5hbWUpIDogdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBpdGVtcyA9IHNlc3Npb25Nb2RlbHMubWFwKChtb2RlbCkgPT4ge1xyXG4gICAgICAgICAgbGV0IG5hbWU6IHN0cmluZztcclxuXHJcbiAgICAgICAgICBpZiAobW9kZWwucGF0aCkge1xyXG4gICAgICAgICAgICBuYW1lID0gdGlsZGlmeShtb2RlbC5wYXRoKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAobW9kZWwubm90ZWJvb2s/LnBhdGgpIHtcclxuICAgICAgICAgICAgbmFtZSA9IHRpbGRpZnkobW9kZWwubm90ZWJvb2shLnBhdGgpOyAvLyBUT0RPIGZpeCB0aGUgdHlwZXNcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5hbWUgPSBgU2Vzc2lvbiAke21vZGVsLmlkfWA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgbW9kZWwsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHNlcnZlclNldHRpbmdzLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpdGVtcy51bnNoaWZ0KHtcclxuICAgICAgICAgIG5hbWU6IFwiW25ldyBzZXNzaW9uXVwiLFxyXG4gICAgICAgICAgbW9kZWw6IG51bGwsXHJcbiAgICAgICAgICBvcHRpb25zOiBzZXJ2ZXJTZXR0aW5ncyxcclxuICAgICAgICAgIGtlcm5lbFNwZWNzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSB0aGlzLm9uU2Vzc2lvbi5iaW5kKHRoaXMsIGdhdGV3YXlJbmZvLm5hbWUpO1xyXG4gICAgICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgICAgIGl0ZW1zLFxyXG4gICAgICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgaWYgKCFlcnJvci54aHIgfHwgZXJyb3IueGhyLnN0YXR1cyAhPT0gNDAzKSB7XHJcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gR2F0ZXdheXMgb2ZmZXIgdGhlIG9wdGlvbiBvZiBuZXZlciBsaXN0aW5nIHNlc3Npb25zLCBmb3Igc2VjdXJpdHlcclxuICAgICAgICAvLyByZWFzb25zLlxyXG4gICAgICAgIC8vIEFzc3VtZSB0aGlzIGlzIHRoZSBjYXNlIGFuZCBwcm9jZWVkIHRvIGNyZWF0aW5nIGEgbmV3IHNlc3Npb24uXHJcbiAgICAgICAgdGhpcy5vblNlc3Npb24oZ2F0ZXdheUluZm8ubmFtZSwge1xyXG4gICAgICAgICAgbmFtZTogXCJbbmV3IHNlc3Npb25dXCIsXHJcbiAgICAgICAgICBtb2RlbDogbnVsbCxcclxuICAgICAgICAgIG9wdGlvbnM6IHNlcnZlclNldHRpbmdzLFxyXG4gICAgICAgICAga2VybmVsU3BlY3MsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiQ29ubmVjdGlvbiB0byBnYXRld2F5IGZhaWxlZFwiKTtcclxuICAgICAgdGhpcy5saXN0Vmlldy5jYW5jZWwoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIG9uU2Vzc2lvbihcclxuICAgIGdhdGV3YXlOYW1lOiBzdHJpbmcsXHJcbiAgICBzZXNzaW9uSW5mbzogU2Vzc2lvbkluZm9XaXRoTW9kZWwgfCBTZXNzaW9uSW5mb1dpdGhvdXRNb2RlbFxyXG4gICkge1xyXG4gICAgY29uc3QgbW9kZWwgPSBzZXNzaW9uSW5mby5tb2RlbDtcclxuICAgIGlmIChtb2RlbCA9PT0gbnVsbCB8fCBtb2RlbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIG1vZGVsIG5vdCBwcm92aWRlZFxyXG4gICAgICByZXR1cm4gdGhpcy5vblNlc3Npb25XaXRvdXRoTW9kZWwoXHJcbiAgICAgICAgZ2F0ZXdheU5hbWUsXHJcbiAgICAgICAgc2Vzc2lvbkluZm8gYXMgU2Vzc2lvbkluZm9XaXRob3V0TW9kZWxcclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHdpdGggbW9kZWxcclxuICAgICAgcmV0dXJuIHRoaXMub25TZXNzaW9uV2l0aE1vZGVsKFxyXG4gICAgICAgIGdhdGV3YXlOYW1lLFxyXG4gICAgICAgIHNlc3Npb25JbmZvIGFzIFNlc3Npb25JbmZvV2l0aE1vZGVsXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBvblNlc3Npb25XaXRoTW9kZWwoXHJcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxyXG4gICAgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aE1vZGVsXHJcbiAgKSB7XHJcbiAgICB0aGlzLm9uU2Vzc2lvbkNob3NlbihcclxuICAgICAgZ2F0ZXdheU5hbWUsXHJcbiAgICAgIGF3YWl0IFNlc3Npb24uY29ubmVjdFRvKHNlc3Npb25JbmZvLm1vZGVsLmlkLCBzZXNzaW9uSW5mby5vcHRpb25zKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIG9uU2Vzc2lvbldpdG91dGhNb2RlbChcclxuICAgIGdhdGV3YXlOYW1lOiBzdHJpbmcsXHJcbiAgICBzZXNzaW9uSW5mbzogU2Vzc2lvbkluZm9XaXRob3V0TW9kZWxcclxuICApIHtcclxuICAgIGlmICghc2Vzc2lvbkluZm8ubmFtZSkge1xyXG4gICAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgICAgaXRlbXM6IFtdLFxyXG4gICAgICAgIGVycm9yTWVzc2FnZTogXCJUaGlzIGdhdGV3YXkgZG9lcyBub3Qgc3VwcG9ydCBsaXN0aW5nIHNlc3Npb25zXCIsXHJcbiAgICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgaW5mb01lc3NhZ2U6IG51bGwsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGl0ZW1zID0gXy5tYXAoc2Vzc2lvbkluZm8ua2VybmVsU3BlY3MsIChzcGVjKSA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgc2VydmVyU2V0dGluZ3M6IHNlc3Npb25JbmZvLm9wdGlvbnMsXHJcbiAgICAgICAga2VybmVsTmFtZTogc3BlYy5uYW1lLFxyXG4gICAgICAgIHBhdGg6IHRoaXMuX3BhdGgsXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbmFtZTogc3BlYy5kaXNwbGF5X25hbWUsXHJcbiAgICAgICAgb3B0aW9ucyxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSB0aGlzLnN0YXJ0U2Vzc2lvbi5iaW5kKHRoaXMsIGdhdGV3YXlOYW1lKTtcclxuICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgaXRlbXMsXHJcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBrZXJuZWwgc3BlY3MgYXZhaWxhYmxlXCIsXHJcbiAgICAgIGluZm9NZXNzYWdlOiBcIlNlbGVjdCBhIHNlc3Npb25cIixcclxuICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHN0YXJ0U2Vzc2lvbihnYXRld2F5TmFtZTogc3RyaW5nLCBzZXNzaW9uSW5mbzogU2Vzc2lvbkluZm9XaXRob3V0TW9kZWwpIHtcclxuICAgIFNlc3Npb24uc3RhcnROZXcoc2Vzc2lvbkluZm8ub3B0aW9ucykudGhlbihcclxuICAgICAgdGhpcy5vblNlc3Npb25DaG9zZW4uYmluZCh0aGlzLCBnYXRld2F5TmFtZSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBvblNlc3Npb25DaG9zZW4oZ2F0ZXdheU5hbWU6IHN0cmluZywgc2Vzc2lvbjogU2Vzc2lvbi5JU2Vzc2lvbikge1xyXG4gICAgdGhpcy5saXN0Vmlldy5jYW5jZWwoKTtcclxuICAgIGNvbnN0IGtlcm5lbFNwZWMgPSBhd2FpdCBzZXNzaW9uLmtlcm5lbC5nZXRTcGVjKCk7XHJcbiAgICBpZiAoIXN0b3JlLmdyYW1tYXIpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3Qga2VybmVsID0gbmV3IFdTS2VybmVsKFxyXG4gICAgICBnYXRld2F5TmFtZSxcclxuICAgICAga2VybmVsU3BlYyxcclxuICAgICAgc3RvcmUuZ3JhbW1hcixcclxuICAgICAgc2Vzc2lvblxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLl9vbkNob3NlbihrZXJuZWwpO1xyXG4gIH1cclxufVxyXG4iXX0=