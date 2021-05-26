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
const xmlhttprequest_1 = require("@aminya/xmlhttprequest");
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
        let response;
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
        if (cookie === null) {
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
            return await this.promptForToken(options);
        }
        if (action === "cookie") {
            return await this.promptForCookie(options);
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
            xhrFactory: () => new xmlhttprequest_1.XMLHttpRequest(),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi93cy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQThDO0FBQzlDLG9EQUF1QjtBQUN2QixzREFBOEI7QUFDOUIsK0JBQTBCO0FBQzFCLDRDQUFvQjtBQUNwQiwyREFBOEU7QUFDOUUsNkJBQTBCO0FBQzFCLG1EQUF5RTtBQUN6RSxzREFBOEI7QUFDOUIsNERBQW1DO0FBQ25DLDhEQUFxQztBQUNyQyxvREFBNEI7QUFFNUIsbUNBQXFFO0FBaUNyRSxNQUFNLGNBQWM7SUFPbEI7UUFOQSxnQkFBVyxHQUFzRCxJQUFJLENBQUM7UUFDdEUsZ0JBQVcsR0FBa0MsSUFBSSxDQUFDO1FBTWhELG1DQUEyQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSwwQkFBYyxDQUFDO1lBQ3ZDLGNBQWMsRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUMvQixLQUFLLEVBQUUsRUFBRTtZQUNULGdCQUFnQixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDckQsY0FBYyxFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxtQkFBbUIsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtnQkFDNUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4QjtZQUNILENBQUM7WUFDRCxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZCLElBQUks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QUFHLElBQUksbUJBQVEsQ0FDekIsV0FBVyxFQUNYLFVBQVUsRUFDVixlQUFLLENBQUMsT0FBTyxFQUNiLE9BQU8sQ0FDUixDQUFDO1FBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUEvV0QsaUNBK1dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFNlbGVjdExpc3RWaWV3IGZyb20gXCJhdG9tLXNlbGVjdC1saXN0XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgdGlsZGlmeSBmcm9tIFwidGlsZGlmeVwiO1xuaW1wb3J0IHsgdjQgfSBmcm9tIFwidXVpZFwiO1xuaW1wb3J0IHdzIGZyb20gXCJ3c1wiO1xuaW1wb3J0IHsgWE1MSHR0cFJlcXVlc3QgYXMgTm9kZVhNTEh0dHBSZXF1ZXN0IH0gZnJvbSBcIkBhbWlueWEveG1saHR0cHJlcXVlc3RcIjtcbmltcG9ydCB7IFVSTCB9IGZyb20gXCJ1cmxcIjtcbmltcG9ydCB7IEtlcm5lbCwgU2Vzc2lvbiwgU2VydmVyQ29ubmVjdGlvbiB9IGZyb20gXCJAanVweXRlcmxhYi9zZXJ2aWNlc1wiO1xuaW1wb3J0IENvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBXU0tlcm5lbCBmcm9tIFwiLi93cy1rZXJuZWxcIjtcbmltcG9ydCBJbnB1dFZpZXcgZnJvbSBcIi4vaW5wdXQtdmlld1wiO1xuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XG5pbXBvcnQgdHlwZSB7IEtlcm5lbHNwZWNNZXRhZGF0YSB9IGZyb20gXCJAbnRlcmFjdC90eXBlc1wiO1xuaW1wb3J0IHsgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50LCBEZWVwV3JpdGVhYmxlIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxudHlwZSBTZWxlY3RMaXN0SXRlbSA9IGFueTtcblxuZXhwb3J0IHR5cGUgS2VybmVsR2F0ZXdheU9wdGlvbnMgPSBQYXJhbWV0ZXJzPFxuICB0eXBlb2YgU2VydmVyQ29ubmVjdGlvbltcIm1ha2VTZXR0aW5nc1wiXVxuPlswXTtcblxuLy8gQmFzZWQgb24gdGhlIGNvbmZpZyBkb2N1bWVudGF0aW9uXG4vLyBUT0RPIHZlcmlmeSB0aGlzXG5leHBvcnQgdHlwZSBNaW5pbWFsU2VydmVyQ29ubmVjdGlvblNldHRpbmdzID0gUGljazxcbiAgS2VybmVsR2F0ZXdheU9wdGlvbnMsXG4gIFwiYmFzZVVybFwiXG4+O1xuXG5leHBvcnQgaW50ZXJmYWNlIEtlcm5lbEdhdGV3YXkge1xuICBuYW1lOiBzdHJpbmc7XG4gIG9wdGlvbnM6IEtlcm5lbEdhdGV3YXlPcHRpb25zO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25JbmZvV2l0aE1vZGVsIHtcbiAgbW9kZWw6IEtlcm5lbC5JTW9kZWw7XG4gIG9wdGlvbnM6IFBhcmFtZXRlcnM8dHlwZW9mIFNlc3Npb24uY29ubmVjdFRvPlsxXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uSW5mb1dpdGhvdXRNb2RlbCB7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIGtlcm5lbFNwZWNzOiBLZXJuZWwuSVNwZWNNb2RlbFtdO1xuICBvcHRpb25zOiBQYXJhbWV0ZXJzPHR5cGVvZiBTZXNzaW9uLnN0YXJ0TmV3PlswXTtcbiAgLy8gbm8gbW9kZWxcbiAgbW9kZWw/OiBuZXZlciB8IG51bGwgfCB1bmRlZmluZWQ7XG59XG5cbmNsYXNzIEN1c3RvbUxpc3RWaWV3IHtcbiAgb25Db25maXJtZWQ6IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4gdm9pZCB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xuICBvbkNhbmNlbGxlZDogKCkgPT4gdm9pZCB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xuICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgc2VsZWN0TGlzdFZpZXc6IFNlbGVjdExpc3RWaWV3O1xuICBwYW5lbDogUGFuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCh0aGlzKTtcbiAgICB0aGlzLnNlbGVjdExpc3RWaWV3ID0gbmV3IFNlbGVjdExpc3RWaWV3KHtcbiAgICAgIGl0ZW1zQ2xhc3NMaXN0OiBbXCJtYXJrLWFjdGl2ZVwiXSxcbiAgICAgIGl0ZW1zOiBbXSxcbiAgICAgIGZpbHRlcktleUZvckl0ZW06IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4gaXRlbS5uYW1lLFxuICAgICAgZWxlbWVudEZvckl0ZW06IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gaXRlbS5uYW1lO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgIH0sXG4gICAgICBkaWRDb25maXJtU2VsZWN0aW9uOiAoaXRlbTogU2VsZWN0TGlzdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25Db25maXJtZWQpIHtcbiAgICAgICAgICB0aGlzLm9uQ29uZmlybWVkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZGlkQ2FuY2VsU2VsZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgICAgIGlmICh0aGlzLm9uQ2FuY2VsbGVkKSB7XG4gICAgICAgICAgdGhpcy5vbkNhbmNlbGxlZCgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgc2hvdygpIHtcbiAgICBpZiAoIXRoaXMucGFuZWwpIHtcbiAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgICAgaXRlbTogdGhpcy5zZWxlY3RMaXN0VmlldyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucGFuZWwuc2hvdygpO1xuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcuZm9jdXMoKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RMaXN0Vmlldy5kZXN0cm95KCk7XG4gIH1cblxuICBjYW5jZWwoKSB7XG4gICAgaWYgKHRoaXMucGFuZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5wYW5lbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdTS2VybmVsUGlja2VyIHtcbiAgX29uQ2hvc2VuOiAoa2VybmVsOiBXU0tlcm5lbCkgPT4gdm9pZDtcbiAgX2tlcm5lbFNwZWNGaWx0ZXI6IChrZXJuZWxTcGVjOiBLZXJuZWwuSVNwZWNNb2RlbCkgPT4gYm9vbGVhbjtcbiAgX3BhdGg6IHN0cmluZztcbiAgbGlzdFZpZXc6IEN1c3RvbUxpc3RWaWV3O1xuXG4gIGNvbnN0cnVjdG9yKG9uQ2hvc2VuOiAoa2VybmVsOiBXU0tlcm5lbCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX29uQ2hvc2VuID0gb25DaG9zZW47XG4gICAgdGhpcy5saXN0VmlldyA9IG5ldyBDdXN0b21MaXN0VmlldygpO1xuICB9XG5cbiAgYXN5bmMgdG9nZ2xlKFxuICAgIF9rZXJuZWxTcGVjRmlsdGVyOiAoXG4gICAgICBrZXJuZWxTcGVjOiBLZXJuZWwuSVNwZWNNb2RlbCB8IEtlcm5lbHNwZWNNZXRhZGF0YVxuICAgICkgPT4gYm9vbGVhblxuICApIHtcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcy5saXN0Vmlldyk7XG4gICAgdGhpcy5fa2VybmVsU3BlY0ZpbHRlciA9IF9rZXJuZWxTcGVjRmlsdGVyO1xuICAgIGNvbnN0IGdhdGV3YXlzID0gQ29uZmlnLmdldEpzb24oXCJnYXRld2F5c1wiKSB8fCBbXTtcblxuICAgIGlmIChfLmlzRW1wdHkoZ2F0ZXdheXMpKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJObyByZW1vdGUga2VybmVsIGdhdGV3YXlzIGF2YWlsYWJsZVwiLCB7XG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiVXNlIHRoZSBIeWRyb2dlbiBwYWNrYWdlIHNldHRpbmdzIHRvIHNwZWNpZnkgdGhlIGxpc3Qgb2YgcmVtb3RlIHNlcnZlcnMuIEh5ZHJvZ2VuIGNhbiB1c2UgcmVtb3RlIGtlcm5lbHMgb24gZWl0aGVyIGEgSnVweXRlciBLZXJuZWwgR2F0ZXdheSBvciBKdXB5dGVyIG5vdGVib29rIHNlcnZlci5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3BhdGggPSBgJHtzdG9yZS5maWxlUGF0aCB8fCBcInVuc2F2ZWRcIn0tJHt2NCgpfWA7XG4gICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IHRoaXMub25HYXRld2F5LmJpbmQodGhpcyk7XG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgaXRlbXM6IGdhdGV3YXlzLFxuICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgZ2F0ZXdheVwiLFxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIGdhdGV3YXlzIGF2YWlsYWJsZVwiLFxuICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXG4gICAgfSk7XG4gICAgdGhpcy5saXN0Vmlldy5zaG93KCk7XG4gIH1cblxuICBhc3luYyBwcm9tcHRGb3JUZXh0KHByb21wdDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gdGhpcy5saXN0Vmlldy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XG4gICAgdGhpcy5saXN0Vmlldy5jYW5jZWwoKTtcbiAgICBjb25zdCBpbnB1dFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBpbnB1dFZpZXcgPSBuZXcgSW5wdXRWaWV3KFxuICAgICAgICB7XG4gICAgICAgICAgcHJvbXB0LFxuICAgICAgICB9LFxuICAgICAgICByZXNvbHZlXG4gICAgICApO1xuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoaW5wdXRWaWV3LmVsZW1lbnQsIHtcbiAgICAgICAgXCJjb3JlOmNhbmNlbFwiOiAoKSA9PiB7XG4gICAgICAgICAgaW5wdXRWaWV3LmNsb3NlKCk7XG4gICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlucHV0Vmlldy5hdHRhY2goKTtcbiAgICB9KTtcbiAgICBsZXQgcmVzcG9uc2U7XG5cbiAgICB0cnkge1xuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBpbnB1dFByb21pc2U7XG5cbiAgICAgIGlmIChyZXNwb25zZSA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBBc3N1bWUgdGhhdCBubyByZXNwb25zZSB0byB0aGUgcHJvbXB0IHdpbGwgY2FuY2VsIHRoZSBlbnRpcmUgZmxvdywgc29cbiAgICAvLyBvbmx5IHJlc3RvcmUgbGlzdFZpZXcgaWYgYSByZXNwb25zZSB3YXMgcmVjZWl2ZWRcbiAgICB0aGlzLmxpc3RWaWV3LnNob3coKTtcbiAgICB0aGlzLmxpc3RWaWV3LnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICBhc3luYyBwcm9tcHRGb3JDb29raWUob3B0aW9uczogRGVlcFdyaXRlYWJsZTxLZXJuZWxHYXRld2F5T3B0aW9ucz4pIHtcbiAgICBjb25zdCBjb29raWUgPSBhd2FpdCB0aGlzLnByb21wdEZvclRleHQoXCJDb29raWU6XCIpO1xuXG4gICAgaWYgKGNvb2tpZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnJlcXVlc3RIZWFkZXJzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG9wdGlvbnMucmVxdWVzdEhlYWRlcnMgPSB7fTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnJlcXVlc3RIZWFkZXJzLkNvb2tpZSA9IGNvb2tpZTtcblxuICAgIG9wdGlvbnMueGhyRmFjdG9yeSA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgTm9kZVhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAvLyBEaXNhYmxlIHByb3RlY3Rpb25zIGFnYWluc3Qgc2V0dGluZyB0aGUgQ29va2llIGhlYWRlclxuICAgICAgcmVxdWVzdC5zZXREaXNhYmxlSGVhZGVyQ2hlY2sodHJ1ZSk7XG4gICAgICByZXR1cm4gcmVxdWVzdCBhcyBYTUxIdHRwUmVxdWVzdDsgLy8gVE9ETyBmaXggdGhlIHR5cGVzXG4gICAgfTtcblxuICAgIG9wdGlvbnMud3NGYWN0b3J5ID0gKHVybCwgcHJvdG9jb2wpID0+IHtcbiAgICAgIC8vIEF1dGhlbnRpY2F0aW9uIHJlcXVpcmVzIHJlcXVlc3RzIHRvIGFwcGVhciB0byBiZSBzYW1lLW9yaWdpblxuICAgICAgY29uc3QgcGFyc2VkVXJsID0gbmV3IFVSTCh1cmwpO1xuXG4gICAgICBpZiAocGFyc2VkVXJsLnByb3RvY29sID09PSBcIndzczpcIikge1xuICAgICAgICBwYXJzZWRVcmwucHJvdG9jb2wgPSBcImh0dHBzOlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyc2VkVXJsLnByb3RvY29sID0gXCJodHRwOlwiO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICBDb29raWU6IGNvb2tpZSxcbiAgICAgIH07XG4gICAgICBjb25zdCBvcmlnaW4gPSBwYXJzZWRVcmwub3JpZ2luO1xuICAgICAgY29uc3QgaG9zdCA9IHBhcnNlZFVybC5ob3N0O1xuICAgICAgcmV0dXJuIG5ldyB3cyh1cmwsIHByb3RvY29sLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIG9yaWdpbixcbiAgICAgICAgaG9zdCxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIHByb21wdEZvclRva2VuKG9wdGlvbnM6IERlZXBXcml0ZWFibGU8S2VybmVsR2F0ZXdheU9wdGlvbnM+KSB7XG4gICAgY29uc3QgdG9rZW4gPSBhd2FpdCB0aGlzLnByb21wdEZvclRleHQoXCJUb2tlbjpcIik7XG5cbiAgICBpZiAodG9rZW4gPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnRva2VuID0gdG9rZW47XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBwcm9tcHRGb3JDcmVkZW50aWFscyhvcHRpb25zOiBEZWVwV3JpdGVhYmxlPEtlcm5lbEdhdGV3YXlPcHRpb25zPikge1xuICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcIkF1dGhlbnRpY2F0ZSB3aXRoIGEgdG9rZW5cIixcbiAgICAgICAgICBhY3Rpb246IFwidG9rZW5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFwiQXV0aGVudGljYXRlIHdpdGggYSBjb29raWVcIixcbiAgICAgICAgICBhY3Rpb246IFwiY29va2llXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcIkNhbmNlbFwiLFxuICAgICAgICAgIGFjdGlvbjogXCJjYW5jZWxcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBpbmZvTWVzc2FnZTpcbiAgICAgICAgXCJDb25uZWN0aW9uIHRvIGdhdGV3YXkgZmFpbGVkLiBZb3VyIHNldHRpbmdzIG1heSBiZSBpbmNvcnJlY3QsIHRoZSBzZXJ2ZXIgbWF5IGJlIHVuYXZhaWxhYmxlLCBvciB5b3UgbWF5IGxhY2sgc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIGNvbXBsZXRlIHRoZSBjb25uZWN0aW9uLlwiLFxuICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXG4gICAgICBlbXB0eU1lc3NhZ2U6IG51bGwsXG4gICAgfSk7XG4gICAgY29uc3QgYWN0aW9uID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IChpdGVtKSA9PiByZXNvbHZlKGl0ZW0uYWN0aW9uKTtcblxuICAgICAgdGhpcy5saXN0Vmlldy5vbkNhbmNlbGxlZCA9ICgpID0+IHJlc29sdmUoXCJjYW5jZWxcIik7XG4gICAgfSk7XG5cbiAgICBpZiAoYWN0aW9uID09PSBcInRva2VuXCIpIHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnByb21wdEZvclRva2VuKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChhY3Rpb24gPT09IFwiY29va2llXCIpIHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnByb21wdEZvckNvb2tpZShvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBhY3Rpb24gPT09IFwiY2FuY2VsXCJcbiAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIG9uR2F0ZXdheShnYXRld2F5SW5mbzogS2VybmVsR2F0ZXdheSkge1xuICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSBudWxsO1xuICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcbiAgICAgIGl0ZW1zOiBbXSxcbiAgICAgIGluZm9NZXNzYWdlOiBudWxsLFxuICAgICAgbG9hZGluZ01lc3NhZ2U6IFwiTG9hZGluZyBzZXNzaW9ucy4uLlwiLFxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIHNlc3Npb25zIGF2YWlsYWJsZVwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGdhdGV3YXlPcHRpb25zID0ge1xuICAgICAgeGhyRmFjdG9yeTogKCkgPT4gbmV3IE5vZGVYTUxIdHRwUmVxdWVzdCgpIGFzIFhNTEh0dHBSZXF1ZXN0LCAvLyBUT0RPIGZpeCB0aGUgdHlwZXNcbiAgICAgIHdzRmFjdG9yeTogKHVybCwgcHJvdG9jb2wpID0+IG5ldyB3cyh1cmwsIHByb3RvY29sKSxcbiAgICAgIC4uLmdhdGV3YXlJbmZvLm9wdGlvbnMsXG4gICAgfTtcbiAgICBsZXQgc2VydmVyU2V0dGluZ3MgPSBTZXJ2ZXJDb25uZWN0aW9uLm1ha2VTZXR0aW5ncyhnYXRld2F5T3B0aW9ucyk7XG4gICAgbGV0IHNwZWNNb2RlbHM6IEtlcm5lbC5JU3BlY01vZGVscyB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgc3BlY01vZGVscyA9IGF3YWl0IEtlcm5lbC5nZXRTcGVjcyhzZXJ2ZXJTZXR0aW5ncyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIFRoZSBlcnJvciB0eXBlcyB5b3UgZ2V0IGJhY2sgYXQgdGhpcyBzdGFnZSBhcmUgZmFpcmx5IG9wYXF1ZS4gSW5cbiAgICAgIC8vIHBhcnRpY3VsYXIsIGhhdmluZyBpbnZhbGlkIGNyZWRlbnRpYWxzIHR5cGljYWxseSB0cmlnZ2VycyBFQ09OTlJFRlVTRURcbiAgICAgIC8vIHJhdGhlciB0aGFuIDQwMyBGb3JiaWRkZW4uIFRoaXMgZG9lcyBzb21lIGJhc2ljIGNoZWNrcyBhbmQgdGhlbiBhc3N1bWVzXG4gICAgICAvLyB0aGF0IGFsbCByZW1haW5pbmcgZXJyb3IgdHlwZXMgY291bGQgYmUgY2F1c2VkIGJ5IGludmFsaWQgY3JlZGVudGlhbHMuXG4gICAgICBpZiAoIWVycm9yLnhociB8fCAhZXJyb3IueGhyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0gZWxzZSBpZiAoZXJyb3IueGhyLnJlc3BvbnNlVGV4dC5pbmNsdWRlcyhcIkVUSU1FRE9VVFwiKSkge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJDb25uZWN0aW9uIHRvIGdhdGV3YXkgZmFpbGVkXCIpO1xuICAgICAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcm9tcHRTdWNjZWVkZWQgPSBhd2FpdCB0aGlzLnByb21wdEZvckNyZWRlbnRpYWxzKGdhdGV3YXlPcHRpb25zKTtcblxuICAgICAgICBpZiAoIXByb21wdFN1Y2NlZWRlZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlcnZlclNldHRpbmdzID0gU2VydmVyQ29ubmVjdGlvbi5tYWtlU2V0dGluZ3MoZ2F0ZXdheU9wdGlvbnMpO1xuICAgICAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XG4gICAgICAgICAgaXRlbXM6IFtdLFxuICAgICAgICAgIGluZm9NZXNzYWdlOiBudWxsLFxuICAgICAgICAgIGxvYWRpbmdNZXNzYWdlOiBcIkxvYWRpbmcgc2Vzc2lvbnMuLi5cIixcbiAgICAgICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8gc2Vzc2lvbnMgYXZhaWxhYmxlXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBpZiAoIXNwZWNNb2RlbHMpIHtcbiAgICAgICAgc3BlY01vZGVscyA9IGF3YWl0IEtlcm5lbC5nZXRTcGVjcyhzZXJ2ZXJTZXR0aW5ncyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gXy5maWx0ZXIoc3BlY01vZGVscy5rZXJuZWxzcGVjcywgKHNwZWMpID0+XG4gICAgICAgIHRoaXMuX2tlcm5lbFNwZWNGaWx0ZXIoc3BlYylcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGtlcm5lbE5hbWVzID0gXy5tYXAoa2VybmVsU3BlY3MsIChzcGVjTW9kZWwpID0+IHNwZWNNb2RlbC5uYW1lKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHNlc3Npb25Nb2RlbHMgPSBhd2FpdCBTZXNzaW9uLmxpc3RSdW5uaW5nKHNlcnZlclNldHRpbmdzKTtcbiAgICAgICAgc2Vzc2lvbk1vZGVscyA9IHNlc3Npb25Nb2RlbHMuZmlsdGVyKChtb2RlbCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBtb2RlbC5rZXJuZWwgPyBtb2RlbC5rZXJuZWwubmFtZSA6IG51bGw7XG4gICAgICAgICAgcmV0dXJuIG5hbWUgPyBrZXJuZWxOYW1lcy5pbmNsdWRlcyhuYW1lKSA6IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBpdGVtcyA9IHNlc3Npb25Nb2RlbHMubWFwKChtb2RlbCkgPT4ge1xuICAgICAgICAgIGxldCBuYW1lOiBzdHJpbmc7XG5cbiAgICAgICAgICBpZiAobW9kZWwucGF0aCkge1xuICAgICAgICAgICAgbmFtZSA9IHRpbGRpZnkobW9kZWwucGF0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtb2RlbC5ub3RlYm9vaz8ucGF0aCkge1xuICAgICAgICAgICAgbmFtZSA9IHRpbGRpZnkobW9kZWwubm90ZWJvb2shLnBhdGgpOyAvLyBUT0RPIGZpeCB0aGUgdHlwZXNcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmFtZSA9IGBTZXNzaW9uICR7bW9kZWwuaWR9YDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIG1vZGVsLFxuICAgICAgICAgICAgb3B0aW9uczogc2VydmVyU2V0dGluZ3MsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0ZW1zLnVuc2hpZnQoe1xuICAgICAgICAgIG5hbWU6IFwiW25ldyBzZXNzaW9uXVwiLFxuICAgICAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgICAgIG9wdGlvbnM6IHNlcnZlclNldHRpbmdzLFxuICAgICAgICAgIGtlcm5lbFNwZWNzLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IHRoaXMub25TZXNzaW9uLmJpbmQodGhpcywgZ2F0ZXdheUluZm8ubmFtZSk7XG4gICAgICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcbiAgICAgICAgICBpdGVtcyxcbiAgICAgICAgICBsb2FkaW5nTWVzc2FnZTogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoIWVycm9yLnhociB8fCBlcnJvci54aHIuc3RhdHVzICE9PSA0MDMpIHtcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICAvLyBHYXRld2F5cyBvZmZlciB0aGUgb3B0aW9uIG9mIG5ldmVyIGxpc3Rpbmcgc2Vzc2lvbnMsIGZvciBzZWN1cml0eVxuICAgICAgICAvLyByZWFzb25zLlxuICAgICAgICAvLyBBc3N1bWUgdGhpcyBpcyB0aGUgY2FzZSBhbmQgcHJvY2VlZCB0byBjcmVhdGluZyBhIG5ldyBzZXNzaW9uLlxuICAgICAgICB0aGlzLm9uU2Vzc2lvbihnYXRld2F5SW5mby5uYW1lLCB7XG4gICAgICAgICAgbmFtZTogXCJbbmV3IHNlc3Npb25dXCIsXG4gICAgICAgICAgbW9kZWw6IG51bGwsXG4gICAgICAgICAgb3B0aW9uczogc2VydmVyU2V0dGluZ3MsXG4gICAgICAgICAga2VybmVsU3BlY3MsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkNvbm5lY3Rpb24gdG8gZ2F0ZXdheSBmYWlsZWRcIik7XG4gICAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xuICAgIH1cbiAgfVxuXG4gIG9uU2Vzc2lvbihcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxuICAgIHNlc3Npb25JbmZvOiBTZXNzaW9uSW5mb1dpdGhNb2RlbCB8IFNlc3Npb25JbmZvV2l0aG91dE1vZGVsXG4gICkge1xuICAgIGNvbnN0IG1vZGVsID0gc2Vzc2lvbkluZm8ubW9kZWw7XG4gICAgaWYgKG1vZGVsID09PSBudWxsIHx8IG1vZGVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIG1vZGVsIG5vdCBwcm92aWRlZFxuICAgICAgcmV0dXJuIHRoaXMub25TZXNzaW9uV2l0b3V0aE1vZGVsKFxuICAgICAgICBnYXRld2F5TmFtZSxcbiAgICAgICAgc2Vzc2lvbkluZm8gYXMgU2Vzc2lvbkluZm9XaXRob3V0TW9kZWxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGggbW9kZWxcbiAgICAgIHJldHVybiB0aGlzLm9uU2Vzc2lvbldpdGhNb2RlbChcbiAgICAgICAgZ2F0ZXdheU5hbWUsXG4gICAgICAgIHNlc3Npb25JbmZvIGFzIFNlc3Npb25JbmZvV2l0aE1vZGVsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG9uU2Vzc2lvbldpdGhNb2RlbChcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxuICAgIHNlc3Npb25JbmZvOiBTZXNzaW9uSW5mb1dpdGhNb2RlbFxuICApIHtcbiAgICB0aGlzLm9uU2Vzc2lvbkNob3NlbihcbiAgICAgIGdhdGV3YXlOYW1lLFxuICAgICAgYXdhaXQgU2Vzc2lvbi5jb25uZWN0VG8oc2Vzc2lvbkluZm8ubW9kZWwuaWQsIHNlc3Npb25JbmZvLm9wdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIG9uU2Vzc2lvbldpdG91dGhNb2RlbChcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxuICAgIHNlc3Npb25JbmZvOiBTZXNzaW9uSW5mb1dpdGhvdXRNb2RlbFxuICApIHtcbiAgICBpZiAoIXNlc3Npb25JbmZvLm5hbWUpIHtcbiAgICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcbiAgICAgICAgaXRlbXM6IFtdLFxuICAgICAgICBlcnJvck1lc3NhZ2U6IFwiVGhpcyBnYXRld2F5IGRvZXMgbm90IHN1cHBvcnQgbGlzdGluZyBzZXNzaW9uc1wiLFxuICAgICAgICBsb2FkaW5nTWVzc2FnZTogbnVsbCxcbiAgICAgICAgaW5mb01lc3NhZ2U6IG51bGwsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtcyA9IF8ubWFwKHNlc3Npb25JbmZvLmtlcm5lbFNwZWNzLCAoc3BlYykgPT4ge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgc2VydmVyU2V0dGluZ3M6IHNlc3Npb25JbmZvLm9wdGlvbnMsXG4gICAgICAgIGtlcm5lbE5hbWU6IHNwZWMubmFtZSxcbiAgICAgICAgcGF0aDogdGhpcy5fcGF0aCxcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBzcGVjLmRpc3BsYXlfbmFtZSxcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICB0aGlzLmxpc3RWaWV3Lm9uQ29uZmlybWVkID0gdGhpcy5zdGFydFNlc3Npb24uYmluZCh0aGlzLCBnYXRld2F5TmFtZSk7XG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgaXRlbXMsXG4gICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8ga2VybmVsIHNwZWNzIGF2YWlsYWJsZVwiLFxuICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgc2Vzc2lvblwiLFxuICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXG4gICAgfSk7XG4gIH1cblxuICBzdGFydFNlc3Npb24oZ2F0ZXdheU5hbWU6IHN0cmluZywgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aG91dE1vZGVsKSB7XG4gICAgU2Vzc2lvbi5zdGFydE5ldyhzZXNzaW9uSW5mby5vcHRpb25zKS50aGVuKFxuICAgICAgdGhpcy5vblNlc3Npb25DaG9zZW4uYmluZCh0aGlzLCBnYXRld2F5TmFtZSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgb25TZXNzaW9uQ2hvc2VuKGdhdGV3YXlOYW1lOiBzdHJpbmcsIHNlc3Npb246IFNlc3Npb24uSVNlc3Npb24pIHtcbiAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xuICAgIGNvbnN0IGtlcm5lbFNwZWMgPSBhd2FpdCBzZXNzaW9uLmtlcm5lbC5nZXRTcGVjKCk7XG4gICAgaWYgKCFzdG9yZS5ncmFtbWFyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGtlcm5lbCA9IG5ldyBXU0tlcm5lbChcbiAgICAgIGdhdGV3YXlOYW1lLFxuICAgICAga2VybmVsU3BlYyxcbiAgICAgIHN0b3JlLmdyYW1tYXIsXG4gICAgICBzZXNzaW9uXG4gICAgKTtcblxuICAgIHRoaXMuX29uQ2hvc2VuKGtlcm5lbCk7XG4gIH1cbn1cbiJdfQ==