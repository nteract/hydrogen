"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_select_list_1 = __importDefault(require("atom-select-list"));
const filter_1 = __importDefault(require("lodash/filter"));
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
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
        (0, utils_1.setPreviouslyFocusedElement)(this);
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
        (0, utils_1.setPreviouslyFocusedElement)(this.listView);
        this._kernelSpecFilter = _kernelSpecFilter;
        const gateways = config_1.default.getJson("gateways") || [];
        if ((0, isEmpty_1.default)(gateways)) {
            atom.notifications.addError("No remote kernel gateways available", {
                description: "Use the Hydrogen package settings to specify the list of remote servers. Hydrogen can use remote kernels on either a Jupyter Kernel Gateway or Jupyter notebook server.",
            });
            return;
        }
        this._path = `${store_1.default.filePath || "unsaved"}-${(0, uuid_1.v4)()}`;
        this.listView.onConfirmed = this.onGateway.bind(this);
        await this.listView.selectListView.update({
            items: gateways,
            infoMessage: "Select a gateway",
            emptyMessage: "No gateways available",
            loadingMessage: undefined,
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
            infoMessage: "You may need to authenticate to complete the connection, or your settings may be incorrect, or the server may be unavailable.",
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
            infoMessage: undefined,
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
                    infoMessage: undefined,
                    loadingMessage: "Loading sessions...",
                    emptyMessage: "No sessions available",
                });
            }
        }
        try {
            if (!specModels) {
                specModels = await services_1.Kernel.getSpecs(serverSettings);
            }
            const kernelSpecs = (0, filter_1.default)(specModels.kernelspecs, (spec) => this._kernelSpecFilter(spec));
            if (kernelSpecs.length === 0) {
                this.listView.cancel();
                atom.notifications.addError(`Therer are no kernels that matches the grammar of the currently open file.
           Open the file you intend to use the remote kernel for and try again.
           You might also need to choose the correct grammar for the file.`);
                return;
            }
            const kernelNames = kernelSpecs.map((specModel) => specModel.name);
            try {
                let sessionModels = await services_1.Session.listRunning(serverSettings);
                if (sessionModels.length === 0) {
                    await this.promptForCredentials(gatewayOptions);
                    serverSettings = services_1.ServerConnection.makeSettings(gatewayOptions);
                    sessionModels = await services_1.Session.listRunning(serverSettings);
                }
                sessionModels = sessionModels.filter((model) => {
                    const name = model.kernel ? model.kernel.name : null;
                    return name ? kernelNames.includes(name) : true;
                });
                const items = sessionModels.map((model) => {
                    let name;
                    if (model.path) {
                        name = (0, tildify_1.default)(model.path);
                    }
                    else if (model.notebook.path) {
                        name = (0, tildify_1.default)(model.notebook.path);
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
                loadingMessage: undefined,
                infoMessage: undefined,
            });
        }
        const items = sessionInfo.kernelSpecs.map((spec) => {
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
            loadingMessage: undefined,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi93cy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQXdFO0FBQ3hFLDJEQUFtQztBQUNuQyw2REFBcUM7QUFDckMsc0RBQThCO0FBQzlCLCtCQUEwQjtBQUMxQiw0Q0FBb0I7QUFDcEIsbURBQXNFO0FBQ3RFLDZCQUEwQjtBQUMxQixtREFBeUU7QUFDekUsc0RBQThCO0FBQzlCLDREQUFtQztBQUNuQyw4REFBcUM7QUFDckMsb0RBQTRCO0FBRTVCLG1DQUFxRTtBQWlDckUsTUFBTSxjQUFjO0lBT2xCO1FBTkEsZ0JBQVcsR0FBc0QsSUFBSSxDQUFDO1FBQ3RFLGdCQUFXLEdBQWtDLElBQUksQ0FBQztRQU1oRCxJQUFBLG1DQUEyQixFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSwwQkFBYyxDQUFDO1lBQ3ZDLGNBQWMsRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUMvQixLQUFLLEVBQUUsRUFBRTtZQUNULGdCQUFnQixFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDckQsY0FBYyxFQUFFLENBQUMsSUFBb0IsRUFBRSxFQUFFO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxtQkFBbUIsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtnQkFDNUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4QjtZQUNILENBQUM7WUFDRCxrQkFBa0IsRUFBRSxHQUFH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QzdCLENBQUM7SUFFRCxZQUFZLENBQUMsV0FBbUIsRUFBRSxXQUFvQztRQUNwRSxrQkFBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQzdDLENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxDQUFDLGVBQWUsQ0FBQyxXQUFtQixFQUFFLE9BQXlCO1FBQ2xFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkIsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xELElBQUksQ0FBQyxlQUFLLENBQUMsT0FBTyxFQUFFO1lBQ2xCLE9BQU87U0FDUjtRQUNELE1BQU0sTUFBTSxHQUFHLElBQUksbUJBQVEsQ0FDekIsV0FBVyxFQUNYLFVBQVUsRUFDVixlQUFLLENBQUMsT0FBTyxFQUNiLE9BQU8sQ0FDUixDQUFDO1FBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUFwWUQsaUNBb1lDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IFNlbGVjdExpc3RWaWV3LCB7IFNlbGVjdExpc3RQcm9wZXJ0aWVzIH0gZnJvbSBcImF0b20tc2VsZWN0LWxpc3RcIjtcbmltcG9ydCBmaWx0ZXIgZnJvbSBcImxvZGFzaC9maWx0ZXJcIjtcbmltcG9ydCBpc0VtcHR5IGZyb20gXCJsb2Rhc2gvaXNFbXB0eVwiO1xuaW1wb3J0IHRpbGRpZnkgZnJvbSBcInRpbGRpZnlcIjtcbmltcG9ydCB7IHY0IH0gZnJvbSBcInV1aWRcIjtcbmltcG9ydCB3cyBmcm9tIFwid3NcIjtcbmltcG9ydCB7IFhNTEh0dHBSZXF1ZXN0IGFzIE5vZGVYTUxIdHRwUmVxdWVzdCB9IGZyb20gXCJ4bWxodHRwcmVxdWVzdFwiOyAvLyBUT0RPIHVzZSBAYW1pbnlhL3htbGh0dHByZXF1ZXN0XG5pbXBvcnQgeyBVUkwgfSBmcm9tIFwidXJsXCI7XG5pbXBvcnQgeyBLZXJuZWwsIFNlc3Npb24sIFNlcnZlckNvbm5lY3Rpb24gfSBmcm9tIFwiQGp1cHl0ZXJsYWIvc2VydmljZXNcIjtcbmltcG9ydCBDb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgV1NLZXJuZWwgZnJvbSBcIi4vd3Mta2VybmVsXCI7XG5pbXBvcnQgSW5wdXRWaWV3IGZyb20gXCIuL2lucHV0LXZpZXdcIjtcbmltcG9ydCBzdG9yZSBmcm9tIFwiLi9zdG9yZVwiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcbmltcG9ydCB7IHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCwgRGVlcFdyaXRlYWJsZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCB0eXBlIEtlcm5lbEdhdGV3YXlPcHRpb25zID0gUGFyYW1ldGVyczxcbiAgdHlwZW9mIFNlcnZlckNvbm5lY3Rpb25bXCJtYWtlU2V0dGluZ3NcIl1cbj5bMF07XG5cbi8vIEJhc2VkIG9uIHRoZSBjb25maWcgZG9jdW1lbnRhdGlvblxuLy8gVE9ETyB2ZXJpZnkgdGhpc1xuZXhwb3J0IHR5cGUgTWluaW1hbFNlcnZlckNvbm5lY3Rpb25TZXR0aW5ncyA9IFBpY2s8XG4gIEtlcm5lbEdhdGV3YXlPcHRpb25zLFxuICBcImJhc2VVcmxcIlxuPjtcblxuZXhwb3J0IGludGVyZmFjZSBLZXJuZWxHYXRld2F5IHtcbiAgbmFtZTogc3RyaW5nO1xuICBvcHRpb25zOiBLZXJuZWxHYXRld2F5T3B0aW9ucztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uSW5mb1dpdGhNb2RlbCB7XG4gIG1vZGVsOiBLZXJuZWwuSU1vZGVsO1xuICBvcHRpb25zOiBQYXJhbWV0ZXJzPHR5cGVvZiBTZXNzaW9uLmNvbm5lY3RUbz5bMV07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbkluZm9XaXRob3V0TW9kZWwge1xuICBuYW1lPzogc3RyaW5nO1xuICBrZXJuZWxTcGVjczogS2VybmVsLklTcGVjTW9kZWxbXTtcbiAgb3B0aW9uczogUGFyYW1ldGVyczx0eXBlb2YgU2Vzc2lvbi5zdGFydE5ldz5bMF07XG4gIC8vIG5vIG1vZGVsXG4gIG1vZGVsPzogbmV2ZXIgfCBudWxsIHwgdW5kZWZpbmVkO1xufVxuXG50eXBlIFNlbGVjdExpc3RJdGVtID0gS2VybmVsR2F0ZXdheTtcblxuY2xhc3MgQ3VzdG9tTGlzdFZpZXcge1xuICBvbkNvbmZpcm1lZDogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiB2b2lkIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7XG4gIG9uQ2FuY2VsbGVkOiAoKSA9PiB2b2lkIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7XG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzZWxlY3RMaXN0VmlldzogU2VsZWN0TGlzdFZpZXc7XG4gIHBhbmVsOiBQYW5lbCB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50KHRoaXMpO1xuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xuICAgICAgaXRlbXNDbGFzc0xpc3Q6IFtcIm1hcmstYWN0aXZlXCJdLFxuICAgICAgaXRlbXM6IFtdLFxuICAgICAgZmlsdGVyS2V5Rm9ySXRlbTogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiBpdGVtLm5hbWUsXG4gICAgICBlbGVtZW50Rm9ySXRlbTogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBpdGVtLm5hbWU7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfSxcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkNvbmZpcm1lZCkge1xuICAgICAgICAgIHRoaXMub25Db25maXJtZWQoaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkaWRDYW5jZWxTZWxlY3Rpb246ICgpID0+IHtcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICAgICAgaWYgKHRoaXMub25DYW5jZWxsZWQpIHtcbiAgICAgICAgICB0aGlzLm9uQ2FuY2VsbGVkKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBzaG93KCkge1xuICAgIGlmICghdGhpcy5wYW5lbCkge1xuICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICBpdGVtOiB0aGlzLnNlbGVjdExpc3RWaWV3LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5wYW5lbC5zaG93KCk7XG4gICAgdGhpcy5zZWxlY3RMaXN0Vmlldy5mb2N1cygpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmNhbmNlbCgpO1xuICAgIHJldHVybiB0aGlzLnNlbGVjdExpc3RWaWV3LmRlc3Ryb3koKTtcbiAgfVxuXG4gIGNhbmNlbCgpIHtcbiAgICBpZiAodGhpcy5wYW5lbCAhPSBudWxsKSB7XG4gICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLnBhbmVsID0gbnVsbDtcblxuICAgIGlmICh0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCkge1xuICAgICAgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV1NLZXJuZWxQaWNrZXIge1xuICBfb25DaG9zZW46IChrZXJuZWw6IFdTS2VybmVsKSA9PiB2b2lkO1xuICBfa2VybmVsU3BlY0ZpbHRlcjogKGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsKSA9PiBib29sZWFuO1xuICBfcGF0aDogc3RyaW5nO1xuICBsaXN0VmlldzogQ3VzdG9tTGlzdFZpZXc7XG5cbiAgY29uc3RydWN0b3Iob25DaG9zZW46IChrZXJuZWw6IFdTS2VybmVsKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5fb25DaG9zZW4gPSBvbkNob3NlbjtcbiAgICB0aGlzLmxpc3RWaWV3ID0gbmV3IEN1c3RvbUxpc3RWaWV3KCk7XG4gIH1cblxuICBhc3luYyB0b2dnbGUoXG4gICAgX2tlcm5lbFNwZWNGaWx0ZXI6IChcbiAgICAgIGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsIHwgS2VybmVsc3BlY01ldGFkYXRhXG4gICAgKSA9PiBib29sZWFuXG4gICkge1xuICAgIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCh0aGlzLmxpc3RWaWV3KTtcbiAgICB0aGlzLl9rZXJuZWxTcGVjRmlsdGVyID0gX2tlcm5lbFNwZWNGaWx0ZXI7XG4gICAgY29uc3QgZ2F0ZXdheXMgPSBDb25maWcuZ2V0SnNvbihcImdhdGV3YXlzXCIpIHx8IFtdO1xuXG4gICAgaWYgKGlzRW1wdHkoZ2F0ZXdheXMpKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJObyByZW1vdGUga2VybmVsIGdhdGV3YXlzIGF2YWlsYWJsZVwiLCB7XG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiVXNlIHRoZSBIeWRyb2dlbiBwYWNrYWdlIHNldHRpbmdzIHRvIHNwZWNpZnkgdGhlIGxpc3Qgb2YgcmVtb3RlIHNlcnZlcnMuIEh5ZHJvZ2VuIGNhbiB1c2UgcmVtb3RlIGtlcm5lbHMgb24gZWl0aGVyIGEgSnVweXRlciBLZXJuZWwgR2F0ZXdheSBvciBKdXB5dGVyIG5vdGVib29rIHNlcnZlci5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3BhdGggPSBgJHtzdG9yZS5maWxlUGF0aCB8fCBcInVuc2F2ZWRcIn0tJHt2NCgpfWA7XG4gICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IHRoaXMub25HYXRld2F5LmJpbmQodGhpcyk7XG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgaXRlbXM6IGdhdGV3YXlzLFxuICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgZ2F0ZXdheVwiLFxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIGdhdGV3YXlzIGF2YWlsYWJsZVwiLFxuICAgICAgbG9hZGluZ01lc3NhZ2U6IHVuZGVmaW5lZCxcbiAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcbiAgICB0aGlzLmxpc3RWaWV3LnNob3coKTtcbiAgfVxuXG4gIGFzeW5jIHByb21wdEZvclRleHQocHJvbXB0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmxpc3RWaWV3LnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDtcbiAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xuICAgIGNvbnN0IGlucHV0UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgaW5wdXRWaWV3ID0gbmV3IElucHV0VmlldyhcbiAgICAgICAge1xuICAgICAgICAgIHByb21wdCxcbiAgICAgICAgfSxcbiAgICAgICAgcmVzb2x2ZVxuICAgICAgKTtcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKGlucHV0Vmlldy5lbGVtZW50LCB7XG4gICAgICAgIFwiY29yZTpjYW5jZWxcIjogKCkgPT4ge1xuICAgICAgICAgIGlucHV0Vmlldy5jbG9zZSgpO1xuICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBpbnB1dFZpZXcuYXR0YWNoKCk7XG4gICAgfSk7XG4gICAgbGV0IHJlc3BvbnNlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgaW5wdXRQcm9taXNlO1xuXG4gICAgICBpZiAocmVzcG9uc2UgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gQXNzdW1lIHRoYXQgbm8gcmVzcG9uc2UgdG8gdGhlIHByb21wdCB3aWxsIGNhbmNlbCB0aGUgZW50aXJlIGZsb3csIHNvXG4gICAgLy8gb25seSByZXN0b3JlIGxpc3RWaWV3IGlmIGEgcmVzcG9uc2Ugd2FzIHJlY2VpdmVkXG4gICAgdGhpcy5saXN0Vmlldy5zaG93KCk7XG4gICAgdGhpcy5saXN0Vmlldy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgYXN5bmMgcHJvbXB0Rm9yQ29va2llKG9wdGlvbnM6IERlZXBXcml0ZWFibGU8S2VybmVsR2F0ZXdheU9wdGlvbnM+KSB7XG4gICAgY29uc3QgY29va2llID0gYXdhaXQgdGhpcy5wcm9tcHRGb3JUZXh0KFwiQ29va2llOlwiKTtcblxuICAgIGlmIChjb29raWUgPT09IG51bGwgfHwgY29va2llID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5yZXF1ZXN0SGVhZGVycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBvcHRpb25zLnJlcXVlc3RIZWFkZXJzID0ge307XG4gICAgfVxuXG4gICAgb3B0aW9ucy5yZXF1ZXN0SGVhZGVycy5Db29raWUgPSBjb29raWU7XG5cbiAgICBvcHRpb25zLnhockZhY3RvcnkgPSAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IE5vZGVYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgLy8gRGlzYWJsZSBwcm90ZWN0aW9ucyBhZ2FpbnN0IHNldHRpbmcgdGhlIENvb2tpZSBoZWFkZXJcbiAgICAgIHJlcXVlc3Quc2V0RGlzYWJsZUhlYWRlckNoZWNrKHRydWUpO1xuICAgICAgcmV0dXJuIHJlcXVlc3QgYXMgWE1MSHR0cFJlcXVlc3Q7IC8vIFRPRE8gZml4IHRoZSB0eXBlc1xuICAgIH07XG5cbiAgICBvcHRpb25zLndzRmFjdG9yeSA9ICh1cmw6IHN0cmluZywgcHJvdG9jb2w/OiBzdHJpbmcgfCBzdHJpbmdbXSkgPT4ge1xuICAgICAgLy8gQXV0aGVudGljYXRpb24gcmVxdWlyZXMgcmVxdWVzdHMgdG8gYXBwZWFyIHRvIGJlIHNhbWUtb3JpZ2luXG4gICAgICBjb25zdCBwYXJzZWRVcmwgPSBuZXcgVVJMKHVybCk7XG5cbiAgICAgIGlmIChwYXJzZWRVcmwucHJvdG9jb2wgPT09IFwid3NzOlwiKSB7XG4gICAgICAgIHBhcnNlZFVybC5wcm90b2NvbCA9IFwiaHR0cHM6XCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJzZWRVcmwucHJvdG9jb2wgPSBcImh0dHA6XCI7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICAgIENvb2tpZTogY29va2llLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IG9yaWdpbiA9IHBhcnNlZFVybC5vcmlnaW47XG4gICAgICBjb25zdCBob3N0ID0gcGFyc2VkVXJsLmhvc3Q7XG4gICAgICByZXR1cm4gbmV3IHdzKHVybCwgcHJvdG9jb2wsIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgb3JpZ2luLFxuICAgICAgICBob3N0LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgcHJvbXB0Rm9yVG9rZW4ob3B0aW9uczogRGVlcFdyaXRlYWJsZTxLZXJuZWxHYXRld2F5T3B0aW9ucz4pIHtcbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IHRoaXMucHJvbXB0Rm9yVGV4dChcIlRva2VuOlwiKTtcblxuICAgIGlmICh0b2tlbiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIG9wdGlvbnMudG9rZW4gPSB0b2tlbjtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIHByb21wdEZvckNyZWRlbnRpYWxzKG9wdGlvbnM6IERlZXBXcml0ZWFibGU8S2VybmVsR2F0ZXdheU9wdGlvbnM+KSB7XG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgaXRlbXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFwiQXV0aGVudGljYXRlIHdpdGggYSB0b2tlblwiLFxuICAgICAgICAgIGFjdGlvbjogXCJ0b2tlblwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogXCJBdXRoZW50aWNhdGUgd2l0aCBhIGNvb2tpZVwiLFxuICAgICAgICAgIGFjdGlvbjogXCJjb29raWVcIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgYWN0aW9uOiBcImNhbmNlbFwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGluZm9NZXNzYWdlOlxuICAgICAgICBcIllvdSBtYXkgbmVlZCB0byBhdXRoZW50aWNhdGUgdG8gY29tcGxldGUgdGhlIGNvbm5lY3Rpb24sIG9yIHlvdXIgc2V0dGluZ3MgbWF5IGJlIGluY29ycmVjdCwgb3IgdGhlIHNlcnZlciBtYXkgYmUgdW5hdmFpbGFibGUuXCIsXG4gICAgICBsb2FkaW5nTWVzc2FnZTogbnVsbCxcbiAgICAgIGVtcHR5TWVzc2FnZTogbnVsbCxcbiAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcbiAgICBjb25zdCBhY3Rpb24gPSBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIFRPRE8gcmV1c2VzIHRoZSBTZWxlY3RMaXN0VmlldyFcbiAgICAgIHR5cGUgTmV3U2VsZWN0TGlzdEl0ZW0gPSB7IGFjdGlvbjogc3RyaW5nIH07XG4gICAgICB0aGlzLmxpc3RWaWV3Lm9uQ29uZmlybWVkID0gKGl0ZW06IE5ld1NlbGVjdExpc3RJdGVtKSA9PlxuICAgICAgICByZXNvbHZlKGl0ZW0uYWN0aW9uKTtcblxuICAgICAgdGhpcy5saXN0Vmlldy5vbkNhbmNlbGxlZCA9ICgpID0+IHJlc29sdmUoXCJjYW5jZWxcIik7XG4gICAgfSk7XG5cbiAgICBpZiAoYWN0aW9uID09PSBcInRva2VuXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb21wdEZvclRva2VuKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChhY3Rpb24gPT09IFwiY29va2llXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb21wdEZvckNvb2tpZShvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBhY3Rpb24gPT09IFwiY2FuY2VsXCJcbiAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIG9uR2F0ZXdheShnYXRld2F5SW5mbzogS2VybmVsR2F0ZXdheSkge1xuICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSBudWxsO1xuICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcbiAgICAgIGl0ZW1zOiBbXSxcbiAgICAgIGluZm9NZXNzYWdlOiB1bmRlZmluZWQsXG4gICAgICBsb2FkaW5nTWVzc2FnZTogXCJMb2FkaW5nIHNlc3Npb25zLi4uXCIsXG4gICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8gc2Vzc2lvbnMgYXZhaWxhYmxlXCIsXG4gICAgfSBhcyBTZWxlY3RMaXN0UHJvcGVydGllcyk7XG4gICAgY29uc3QgZ2F0ZXdheU9wdGlvbnMgPSB7XG4gICAgICB4aHJGYWN0b3J5OiAoKSA9PiBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcbiAgICAgIHdzRmFjdG9yeTogKHVybDogc3RyaW5nLCBwcm90b2NvbD86IHN0cmluZyB8IHN0cmluZ1tdKSA9PlxuICAgICAgICBuZXcgd3ModXJsLCBwcm90b2NvbCksXG4gICAgICAuLi5nYXRld2F5SW5mby5vcHRpb25zLFxuICAgIH07XG4gICAgbGV0IHNlcnZlclNldHRpbmdzID0gU2VydmVyQ29ubmVjdGlvbi5tYWtlU2V0dGluZ3MoZ2F0ZXdheU9wdGlvbnMpO1xuICAgIGxldCBzcGVjTW9kZWxzOiBLZXJuZWwuSVNwZWNNb2RlbHMgfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIHNwZWNNb2RlbHMgPSBhd2FpdCBLZXJuZWwuZ2V0U3BlY3Moc2VydmVyU2V0dGluZ3MpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBUaGUgZXJyb3IgdHlwZXMgeW91IGdldCBiYWNrIGF0IHRoaXMgc3RhZ2UgYXJlIGZhaXJseSBvcGFxdWUuIEluXG4gICAgICAvLyBwYXJ0aWN1bGFyLCBoYXZpbmcgaW52YWxpZCBjcmVkZW50aWFscyB0eXBpY2FsbHkgdHJpZ2dlcnMgRUNPTk5SRUZVU0VEXG4gICAgICAvLyByYXRoZXIgdGhhbiA0MDMgRm9yYmlkZGVuLiBUaGlzIGRvZXMgc29tZSBiYXNpYyBjaGVja3MgYW5kIHRoZW4gYXNzdW1lc1xuICAgICAgLy8gdGhhdCBhbGwgcmVtYWluaW5nIGVycm9yIHR5cGVzIGNvdWxkIGJlIGNhdXNlZCBieSBpbnZhbGlkIGNyZWRlbnRpYWxzLlxuICAgICAgaWYgKCFlcnJvci54aHIgfHwgIWVycm9yLnhoci5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9IGVsc2UgaWYgKGVycm9yLnhoci5yZXNwb25zZVRleHQuaW5jbHVkZXMoXCJFVElNRURPVVRcIikpIHtcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiQ29ubmVjdGlvbiB0byBnYXRld2F5IGZhaWxlZFwiKTtcbiAgICAgICAgdGhpcy5saXN0Vmlldy5jYW5jZWwoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJvbXB0U3VjY2VlZGVkID0gYXdhaXQgdGhpcy5wcm9tcHRGb3JDcmVkZW50aWFscyhnYXRld2F5T3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKCFwcm9tcHRTdWNjZWVkZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZXJ2ZXJTZXR0aW5ncyA9IFNlcnZlckNvbm5lY3Rpb24ubWFrZVNldHRpbmdzKGdhdGV3YXlPcHRpb25zKTtcbiAgICAgICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgICBpbmZvTWVzc2FnZTogdW5kZWZpbmVkLFxuICAgICAgICAgIGxvYWRpbmdNZXNzYWdlOiBcIkxvYWRpbmcgc2Vzc2lvbnMuLi5cIixcbiAgICAgICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8gc2Vzc2lvbnMgYXZhaWxhYmxlXCIsXG4gICAgICAgIH0gYXMgU2VsZWN0TGlzdFByb3BlcnRpZXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBpZiAoIXNwZWNNb2RlbHMpIHtcbiAgICAgICAgc3BlY01vZGVscyA9IGF3YWl0IEtlcm5lbC5nZXRTcGVjcyhzZXJ2ZXJTZXR0aW5ncyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gZmlsdGVyKHNwZWNNb2RlbHMua2VybmVsc3BlY3MsIChzcGVjKSA9PlxuICAgICAgICB0aGlzLl9rZXJuZWxTcGVjRmlsdGVyKHNwZWMpXG4gICAgICApO1xuXG4gICAgICBpZiAoa2VybmVsU3BlY3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICBgVGhlcmVyIGFyZSBubyBrZXJuZWxzIHRoYXQgbWF0Y2hlcyB0aGUgZ3JhbW1hciBvZiB0aGUgY3VycmVudGx5IG9wZW4gZmlsZS5cbiAgICAgICAgICAgT3BlbiB0aGUgZmlsZSB5b3UgaW50ZW5kIHRvIHVzZSB0aGUgcmVtb3RlIGtlcm5lbCBmb3IgYW5kIHRyeSBhZ2Fpbi5cbiAgICAgICAgICAgWW91IG1pZ2h0IGFsc28gbmVlZCB0byBjaG9vc2UgdGhlIGNvcnJlY3QgZ3JhbW1hciBmb3IgdGhlIGZpbGUuYFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGtlcm5lbE5hbWVzID0ga2VybmVsU3BlY3MubWFwKChzcGVjTW9kZWwpID0+IHNwZWNNb2RlbC5uYW1lKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHNlc3Npb25Nb2RlbHMgPSBhd2FpdCBTZXNzaW9uLmxpc3RSdW5uaW5nKHNlcnZlclNldHRpbmdzKTtcbiAgICAgICAgLy8gaWYgbm8gc2Vlc3Npb24gcHJvcG10IGZvciB0aGUgY3JlbmRpYWxzXG4gICAgICAgIC8vIGlmIHRoZSBrZXJuZWwgc3RpbGwgcmVmdXNlZCwgdGhlbiBnbyB0byBjYXRjaCBibG9ja1xuICAgICAgICBpZiAoc2Vzc2lvbk1vZGVscy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnByb21wdEZvckNyZWRlbnRpYWxzKGdhdGV3YXlPcHRpb25zKTtcbiAgICAgICAgICBzZXJ2ZXJTZXR0aW5ncyA9IFNlcnZlckNvbm5lY3Rpb24ubWFrZVNldHRpbmdzKGdhdGV3YXlPcHRpb25zKTtcbiAgICAgICAgICBzZXNzaW9uTW9kZWxzID0gYXdhaXQgU2Vzc2lvbi5saXN0UnVubmluZyhzZXJ2ZXJTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICAgICAgc2Vzc2lvbk1vZGVscyA9IHNlc3Npb25Nb2RlbHMuZmlsdGVyKChtb2RlbCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBtb2RlbC5rZXJuZWwgPyBtb2RlbC5rZXJuZWwubmFtZSA6IG51bGw7XG4gICAgICAgICAgcmV0dXJuIG5hbWUgPyBrZXJuZWxOYW1lcy5pbmNsdWRlcyhuYW1lKSA6IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBpdGVtcyA9IHNlc3Npb25Nb2RlbHMubWFwKChtb2RlbCkgPT4ge1xuICAgICAgICAgIGxldCBuYW1lOiBzdHJpbmc7XG5cbiAgICAgICAgICBpZiAobW9kZWwucGF0aCkge1xuICAgICAgICAgICAgbmFtZSA9IHRpbGRpZnkobW9kZWwucGF0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtb2RlbC5ub3RlYm9vay5wYXRoKSB7XG4gICAgICAgICAgICBuYW1lID0gdGlsZGlmeShtb2RlbC5ub3RlYm9vayEucGF0aCk7IC8vIFRPRE8gZml4IHRoZSB0eXBlc1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuYW1lID0gYFNlc3Npb24gJHttb2RlbC5pZH1gO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgbW9kZWwsXG4gICAgICAgICAgICBvcHRpb25zOiBzZXJ2ZXJTZXR0aW5ncyxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgaXRlbXMudW5zaGlmdCh7XG4gICAgICAgICAgbmFtZTogXCJbbmV3IHNlc3Npb25dXCIsXG4gICAgICAgICAgbW9kZWw6IG51bGwsXG4gICAgICAgICAgb3B0aW9uczogc2VydmVyU2V0dGluZ3MsXG4gICAgICAgICAga2VybmVsU3BlY3MsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uQ29uZmlybWVkID0gdGhpcy5vblNlc3Npb24uYmluZCh0aGlzLCBnYXRld2F5SW5mby5uYW1lKTtcbiAgICAgICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgICAgIGl0ZW1zLFxuICAgICAgICAgIGxvYWRpbmdNZXNzYWdlOiBudWxsLFxuICAgICAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGlmICghZXJyb3IueGhyIHx8IGVycm9yLnhoci5zdGF0dXMgIT09IDQwMykge1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIC8vIEdhdGV3YXlzIG9mZmVyIHRoZSBvcHRpb24gb2YgbmV2ZXIgbGlzdGluZyBzZXNzaW9ucywgZm9yIHNlY3VyaXR5XG4gICAgICAgIC8vIHJlYXNvbnMuXG4gICAgICAgIC8vIEFzc3VtZSB0aGlzIGlzIHRoZSBjYXNlIGFuZCBwcm9jZWVkIHRvIGNyZWF0aW5nIGEgbmV3IHNlc3Npb24uXG4gICAgICAgIHRoaXMub25TZXNzaW9uKGdhdGV3YXlJbmZvLm5hbWUsIHtcbiAgICAgICAgICBuYW1lOiBcIltuZXcgc2Vzc2lvbl1cIixcbiAgICAgICAgICBtb2RlbDogbnVsbCxcbiAgICAgICAgICBvcHRpb25zOiBzZXJ2ZXJTZXR0aW5ncyxcbiAgICAgICAgICBrZXJuZWxTcGVjcyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiQ29ubmVjdGlvbiB0byBnYXRld2F5IGZhaWxlZFwiKTtcbiAgICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XG4gICAgfVxuICB9XG5cbiAgb25TZXNzaW9uKFxuICAgIGdhdGV3YXlOYW1lOiBzdHJpbmcsXG4gICAgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aE1vZGVsIHwgU2Vzc2lvbkluZm9XaXRob3V0TW9kZWxcbiAgKSB7XG4gICAgY29uc3QgbW9kZWwgPSBzZXNzaW9uSW5mby5tb2RlbDtcbiAgICBpZiAobW9kZWwgPT09IG51bGwgfHwgbW9kZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gbW9kZWwgbm90IHByb3ZpZGVkXG4gICAgICByZXR1cm4gdGhpcy5vblNlc3Npb25XaXRvdXRoTW9kZWwoXG4gICAgICAgIGdhdGV3YXlOYW1lLFxuICAgICAgICBzZXNzaW9uSW5mbyBhcyBTZXNzaW9uSW5mb1dpdGhvdXRNb2RlbFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aCBtb2RlbFxuICAgICAgcmV0dXJuIHRoaXMub25TZXNzaW9uV2l0aE1vZGVsKFxuICAgICAgICBnYXRld2F5TmFtZSxcbiAgICAgICAgc2Vzc2lvbkluZm8gYXMgU2Vzc2lvbkluZm9XaXRoTW9kZWxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgb25TZXNzaW9uV2l0aE1vZGVsKFxuICAgIGdhdGV3YXlOYW1lOiBzdHJpbmcsXG4gICAgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aE1vZGVsXG4gICkge1xuICAgIHRoaXMub25TZXNzaW9uQ2hvc2VuKFxuICAgICAgZ2F0ZXdheU5hbWUsXG4gICAgICBhd2FpdCBTZXNzaW9uLmNvbm5lY3RUbyhzZXNzaW9uSW5mby5tb2RlbC5pZCwgc2Vzc2lvbkluZm8ub3B0aW9ucylcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgb25TZXNzaW9uV2l0b3V0aE1vZGVsKFxuICAgIGdhdGV3YXlOYW1lOiBzdHJpbmcsXG4gICAgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aG91dE1vZGVsXG4gICkge1xuICAgIGlmICghc2Vzc2lvbkluZm8ubmFtZSkge1xuICAgICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgICBpdGVtczogW10sXG4gICAgICAgIGVycm9yTWVzc2FnZTogXCJUaGlzIGdhdGV3YXkgZG9lcyBub3Qgc3VwcG9ydCBsaXN0aW5nIHNlc3Npb25zXCIsXG4gICAgICAgIGxvYWRpbmdNZXNzYWdlOiB1bmRlZmluZWQsXG4gICAgICAgIGluZm9NZXNzYWdlOiB1bmRlZmluZWQsXG4gICAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtcyA9IHNlc3Npb25JbmZvLmtlcm5lbFNwZWNzLm1hcCgoc3BlYykgPT4ge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgc2VydmVyU2V0dGluZ3M6IHNlc3Npb25JbmZvLm9wdGlvbnMsXG4gICAgICAgIGtlcm5lbE5hbWU6IHNwZWMubmFtZSxcbiAgICAgICAgcGF0aDogdGhpcy5fcGF0aCxcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBzcGVjLmRpc3BsYXlfbmFtZSxcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICB0aGlzLmxpc3RWaWV3Lm9uQ29uZmlybWVkID0gdGhpcy5zdGFydFNlc3Npb24uYmluZCh0aGlzLCBnYXRld2F5TmFtZSk7XG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xuICAgICAgaXRlbXMsXG4gICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8ga2VybmVsIHNwZWNzIGF2YWlsYWJsZVwiLFxuICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgc2Vzc2lvblwiLFxuICAgICAgbG9hZGluZ01lc3NhZ2U6IHVuZGVmaW5lZCxcbiAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcbiAgfVxuXG4gIHN0YXJ0U2Vzc2lvbihnYXRld2F5TmFtZTogc3RyaW5nLCBzZXNzaW9uSW5mbzogU2Vzc2lvbkluZm9XaXRob3V0TW9kZWwpIHtcbiAgICBTZXNzaW9uLnN0YXJ0TmV3KHNlc3Npb25JbmZvLm9wdGlvbnMpLnRoZW4oXG4gICAgICB0aGlzLm9uU2Vzc2lvbkNob3Nlbi5iaW5kKHRoaXMsIGdhdGV3YXlOYW1lKVxuICAgICk7XG4gIH1cblxuICBhc3luYyBvblNlc3Npb25DaG9zZW4oZ2F0ZXdheU5hbWU6IHN0cmluZywgc2Vzc2lvbjogU2Vzc2lvbi5JU2Vzc2lvbikge1xuICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XG4gICAgY29uc3Qga2VybmVsU3BlYyA9IGF3YWl0IHNlc3Npb24ua2VybmVsLmdldFNwZWMoKTtcbiAgICBpZiAoIXN0b3JlLmdyYW1tYXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qga2VybmVsID0gbmV3IFdTS2VybmVsKFxuICAgICAgZ2F0ZXdheU5hbWUsXG4gICAgICBrZXJuZWxTcGVjLFxuICAgICAgc3RvcmUuZ3JhbW1hcixcbiAgICAgIHNlc3Npb25cbiAgICApO1xuXG4gICAgdGhpcy5fb25DaG9zZW4oa2VybmVsKTtcbiAgfVxufVxuIl19