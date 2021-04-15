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
const xmlhttprequest_1 = __importDefault(require("xmlhttprequest"));
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
            const request = new xmlhttprequest_1.default.XMLHttpRequest();
            request.setDisableHeaderCheck(true);
            return request;
        };
        options.wsFactory = (url, protocol) => {
            const parsedUrl = new url_1.URL(url);
            if (parsedUrl.protocol == "wss:") {
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
        const gatewayOptions = Object.assign({
            xhrFactory: () => new xmlhttprequest_1.default.XMLHttpRequest(),
            wsFactory: (url, protocol) => new ws_1.default(url, protocol),
        }, gatewayInfo.options);
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
                    var _a, _b;
                    let name;
                    if (model.path) {
                        name = tildify_1.default(model.path);
                    }
                    else if (model.notebook && ((_a = model.notebook) === null || _a === void 0 ? void 0 : _a.path)) {
                        name = tildify_1.default((_b = model.notebook) === null || _b === void 0 ? void 0 : _b.path);
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
    async onSession(gatewayName, sessionInfo) {
        if (!sessionInfo.model) {
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
        else {
            this.onSessionChosen(gatewayName, await services_1.Session.connectTo(sessionInfo.model.id, sessionInfo.options));
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi93cy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQThDO0FBQzlDLG9EQUF1QjtBQUN2QixzREFBOEI7QUFDOUIsK0JBQTBCO0FBQzFCLDRDQUFvQjtBQUNwQixvRUFBaUM7QUFDakMsNkJBQTBCO0FBQzFCLG1EQUF5RTtBQUN6RSxzREFBOEI7QUFDOUIsNERBQW1DO0FBQ25DLDhEQUFxQztBQUNyQyxvREFBNEI7QUFFNUIsbUNBQXNEO0FBRXRELE1BQU0sY0FBYztJQU9sQjtRQU5BLGdCQUFXLEdBQXNELElBQUksQ0FBQztRQUN0RSxnQkFBVyxHQUFzRCxJQUFJLENBQUM7UUFNcEUsbUNBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUFjLENBQUM7WUFDdkMsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUFFO1lBQ1QsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJO1lBQ3JDLGNBQWMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN2QixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxtQkFBbUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUM1QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3hCO1lBQ0gsQ0FBQztZQUNELGtCQUFrQixFQUFFLEdBQUcsRUFBRTtnQkFDdkIsSUFBSSxDQUFD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Y3RMaXN0VmlldyBmcm9tIFwiYXRvbS1zZWxlY3QtbGlzdFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB0aWxkaWZ5IGZyb20gXCJ0aWxkaWZ5XCI7XHJcbmltcG9ydCB7IHY0IH0gZnJvbSBcInV1aWRcIjtcclxuaW1wb3J0IHdzIGZyb20gXCJ3c1wiO1xyXG5pbXBvcnQgeGhyIGZyb20gXCJ4bWxodHRwcmVxdWVzdFwiO1xyXG5pbXBvcnQgeyBVUkwgfSBmcm9tIFwidXJsXCI7XHJcbmltcG9ydCB7IEtlcm5lbCwgU2Vzc2lvbiwgU2VydmVyQ29ubmVjdGlvbiB9IGZyb20gXCJAanVweXRlcmxhYi9zZXJ2aWNlc1wiO1xyXG5pbXBvcnQgQ29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQgV1NLZXJuZWwgZnJvbSBcIi4vd3Mta2VybmVsXCI7XHJcbmltcG9ydCBJbnB1dFZpZXcgZnJvbSBcIi4vaW5wdXQtdmlld1wiO1xyXG5pbXBvcnQgc3RvcmUgZnJvbSBcIi4vc3RvcmVcIjtcclxuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcclxuaW1wb3J0IHsgc2V0UHJldmlvdXNseUZvY3VzZWRFbGVtZW50IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmNsYXNzIEN1c3RvbUxpc3RWaWV3IHtcclxuICBvbkNvbmZpcm1lZDogKCguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7XHJcbiAgb25DYW5jZWxsZWQ6ICgoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55KSB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xyXG4gIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHNlbGVjdExpc3RWaWV3OiBTZWxlY3RMaXN0VmlldztcclxuICBwYW5lbDogUGFuZWwgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHNldFByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCh0aGlzKTtcclxuICAgIHRoaXMuc2VsZWN0TGlzdFZpZXcgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xyXG4gICAgICBpdGVtc0NsYXNzTGlzdDogW1wibWFyay1hY3RpdmVcIl0sXHJcbiAgICAgIGl0ZW1zOiBbXSxcclxuICAgICAgZmlsdGVyS2V5Rm9ySXRlbTogKGl0ZW0pID0+IGl0ZW0ubmFtZSxcclxuICAgICAgZWxlbWVudEZvckl0ZW06IChpdGVtKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gaXRlbS5uYW1lO1xyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgICB9LFxyXG4gICAgICBkaWRDb25maXJtU2VsZWN0aW9uOiAoaXRlbSkgPT4ge1xyXG4gICAgICAgIGlmICh0aGlzLm9uQ29uZmlybWVkKSB7XHJcbiAgICAgICAgICB0aGlzLm9uQ29uZmlybWVkKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgZGlkQ2FuY2VsU2VsZWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICBpZiAodGhpcy5vbkNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgdGhpcy5vbkNhbmNlbGxlZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2hvdygpIHtcclxuICAgIGlmICghdGhpcy5wYW5lbCkge1xyXG4gICAgICB0aGlzLnBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XHJcbiAgICAgICAgaXRlbTogdGhpcy5zZWxlY3RMaXN0VmlldyxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wYW5lbC5zaG93KCk7XHJcbiAgICB0aGlzLnNlbGVjdExpc3RWaWV3LmZvY3VzKCk7XHJcbiAgfVxyXG5cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIHJldHVybiB0aGlzLnNlbGVjdExpc3RWaWV3LmRlc3Ryb3koKTtcclxuICB9XHJcblxyXG4gIGNhbmNlbCgpIHtcclxuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wYW5lbCA9IG51bGw7XHJcblxyXG4gICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50KSB7XHJcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50LmZvY3VzKCk7XHJcbiAgICAgIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdTS2VybmVsUGlja2VyIHtcclxuICBfb25DaG9zZW46IChrZXJuZWw6IFdTS2VybmVsKSA9PiB2b2lkO1xyXG4gIF9rZXJuZWxTcGVjRmlsdGVyOiAoa2VybmVsU3BlYzogS2VybmVsLklTcGVjTW9kZWwpID0+IGJvb2xlYW47XHJcbiAgX3BhdGg6IHN0cmluZztcclxuICBsaXN0VmlldzogQ3VzdG9tTGlzdFZpZXc7XHJcblxyXG4gIGNvbnN0cnVjdG9yKG9uQ2hvc2VuOiAoa2VybmVsOiBXU0tlcm5lbCkgPT4gdm9pZCkge1xyXG4gICAgdGhpcy5fb25DaG9zZW4gPSBvbkNob3NlbjtcclxuICAgIHRoaXMubGlzdFZpZXcgPSBuZXcgQ3VzdG9tTGlzdFZpZXcoKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHRvZ2dsZShfa2VybmVsU3BlY0ZpbHRlcjogKGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsKSA9PiBib29sZWFuKSB7XHJcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcy5saXN0Vmlldyk7XHJcbiAgICB0aGlzLl9rZXJuZWxTcGVjRmlsdGVyID0gX2tlcm5lbFNwZWNGaWx0ZXI7XHJcbiAgICBjb25zdCBnYXRld2F5cyA9IENvbmZpZy5nZXRKc29uKFwiZ2F0ZXdheXNcIikgfHwgW107XHJcblxyXG4gICAgaWYgKF8uaXNFbXB0eShnYXRld2F5cykpIHtcclxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiTm8gcmVtb3RlIGtlcm5lbCBnYXRld2F5cyBhdmFpbGFibGVcIiwge1xyXG4gICAgICAgIGRlc2NyaXB0aW9uOlxyXG4gICAgICAgICAgXCJVc2UgdGhlIEh5ZHJvZ2VuIHBhY2thZ2Ugc2V0dGluZ3MgdG8gc3BlY2lmeSB0aGUgbGlzdCBvZiByZW1vdGUgc2VydmVycy4gSHlkcm9nZW4gY2FuIHVzZSByZW1vdGUga2VybmVscyBvbiBlaXRoZXIgYSBKdXB5dGVyIEtlcm5lbCBHYXRld2F5IG9yIEp1cHl0ZXIgbm90ZWJvb2sgc2VydmVyLlwiLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3BhdGggPSBgJHtzdG9yZS5maWxlUGF0aCB8fCBcInVuc2F2ZWRcIn0tJHt2NCgpfWA7XHJcbiAgICB0aGlzLmxpc3RWaWV3Lm9uQ29uZmlybWVkID0gdGhpcy5vbkdhdGV3YXkuYmluZCh0aGlzKTtcclxuICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgaXRlbXM6IGdhdGV3YXlzLFxyXG4gICAgICBpbmZvTWVzc2FnZTogXCJTZWxlY3QgYSBnYXRld2F5XCIsXHJcbiAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBnYXRld2F5cyBhdmFpbGFibGVcIixcclxuICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXHJcbiAgICB9KTtcclxuICAgIHRoaXMubGlzdFZpZXcuc2hvdygpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHJvbXB0Rm9yVGV4dChwcm9tcHQ6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gdGhpcy5saXN0Vmlldy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XHJcbiAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xyXG4gICAgY29uc3QgaW5wdXRQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBpbnB1dFZpZXcgPSBuZXcgSW5wdXRWaWV3KFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHByb21wdCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc29sdmVcclxuICAgICAgKTtcclxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoaW5wdXRWaWV3LmVsZW1lbnQsIHtcclxuICAgICAgICBcImNvcmU6Y2FuY2VsXCI6ICgpID0+IHtcclxuICAgICAgICAgIGlucHV0Vmlldy5jbG9zZSgpO1xyXG4gICAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICAgIGlucHV0Vmlldy5hdHRhY2goKTtcclxuICAgIH0pO1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgaW5wdXRQcm9taXNlO1xyXG5cclxuICAgICAgaWYgKHJlc3BvbnNlID09PSBcIlwiKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXNzdW1lIHRoYXQgbm8gcmVzcG9uc2UgdG8gdGhlIHByb21wdCB3aWxsIGNhbmNlbCB0aGUgZW50aXJlIGZsb3csIHNvXHJcbiAgICAvLyBvbmx5IHJlc3RvcmUgbGlzdFZpZXcgaWYgYSByZXNwb25zZSB3YXMgcmVjZWl2ZWRcclxuICAgIHRoaXMubGlzdFZpZXcuc2hvdygpO1xyXG4gICAgdGhpcy5saXN0Vmlldy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQgPSBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XHJcbiAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwcm9tcHRGb3JDb29raWUob3B0aW9uczogYW55KSB7XHJcbiAgICBjb25zdCBjb29raWUgPSBhd2FpdCB0aGlzLnByb21wdEZvclRleHQoXCJDb29raWU6XCIpO1xyXG5cclxuICAgIGlmIChjb29raWUgPT09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnJlcXVlc3RIZWFkZXJzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgb3B0aW9ucy5yZXF1ZXN0SGVhZGVycyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMucmVxdWVzdEhlYWRlcnMuQ29va2llID0gY29va2llO1xyXG5cclxuICAgIG9wdGlvbnMueGhyRmFjdG9yeSA9ICgpID0+IHtcclxuICAgICAgY29uc3QgcmVxdWVzdCA9IG5ldyB4aHIuWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgLy8gRGlzYWJsZSBwcm90ZWN0aW9ucyBhZ2FpbnN0IHNldHRpbmcgdGhlIENvb2tpZSBoZWFkZXJcclxuICAgICAgcmVxdWVzdC5zZXREaXNhYmxlSGVhZGVyQ2hlY2sodHJ1ZSk7XHJcbiAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgfTtcclxuXHJcbiAgICBvcHRpb25zLndzRmFjdG9yeSA9ICh1cmwsIHByb3RvY29sKSA9PiB7XHJcbiAgICAgIC8vIEF1dGhlbnRpY2F0aW9uIHJlcXVpcmVzIHJlcXVlc3RzIHRvIGFwcGVhciB0byBiZSBzYW1lLW9yaWdpblxyXG4gICAgICBjb25zdCBwYXJzZWRVcmwgPSBuZXcgVVJMKHVybCk7XHJcblxyXG4gICAgICBpZiAocGFyc2VkVXJsLnByb3RvY29sID09IFwid3NzOlwiKSB7XHJcbiAgICAgICAgcGFyc2VkVXJsLnByb3RvY29sID0gXCJodHRwczpcIjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXJzZWRVcmwucHJvdG9jb2wgPSBcImh0dHA6XCI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGhlYWRlcnMgPSB7XHJcbiAgICAgICAgQ29va2llOiBjb29raWUsXHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IG9yaWdpbiA9IHBhcnNlZFVybC5vcmlnaW47XHJcbiAgICAgIGNvbnN0IGhvc3QgPSBwYXJzZWRVcmwuaG9zdDtcclxuICAgICAgcmV0dXJuIG5ldyB3cyh1cmwsIHByb3RvY29sLCB7XHJcbiAgICAgICAgaGVhZGVycyxcclxuICAgICAgICBvcmlnaW4sXHJcbiAgICAgICAgaG9zdCxcclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHJvbXB0Rm9yVG9rZW4ob3B0aW9uczogYW55KSB7XHJcbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IHRoaXMucHJvbXB0Rm9yVGV4dChcIlRva2VuOlwiKTtcclxuXHJcbiAgICBpZiAodG9rZW4gPT09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMudG9rZW4gPSB0b2tlbjtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHJvbXB0Rm9yQ3JlZGVudGlhbHMob3B0aW9uczogYW55KSB7XHJcbiAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogXCJBdXRoZW50aWNhdGUgd2l0aCBhIHRva2VuXCIsXHJcbiAgICAgICAgICBhY3Rpb246IFwidG9rZW5cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIG5hbWU6IFwiQXV0aGVudGljYXRlIHdpdGggYSBjb29raWVcIixcclxuICAgICAgICAgIGFjdGlvbjogXCJjb29raWVcIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIG5hbWU6IFwiQ2FuY2VsXCIsXHJcbiAgICAgICAgICBhY3Rpb246IFwiY2FuY2VsXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgaW5mb01lc3NhZ2U6XHJcbiAgICAgICAgXCJDb25uZWN0aW9uIHRvIGdhdGV3YXkgZmFpbGVkLiBZb3VyIHNldHRpbmdzIG1heSBiZSBpbmNvcnJlY3QsIHRoZSBzZXJ2ZXIgbWF5IGJlIHVuYXZhaWxhYmxlLCBvciB5b3UgbWF5IGxhY2sgc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIGNvbXBsZXRlIHRoZSBjb25uZWN0aW9uLlwiLFxyXG4gICAgICBsb2FkaW5nTWVzc2FnZTogbnVsbCxcclxuICAgICAgZW1wdHlNZXNzYWdlOiBudWxsLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBhY3Rpb24gPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSAoaXRlbSkgPT4gcmVzb2x2ZShpdGVtLmFjdGlvbik7XHJcblxyXG4gICAgICB0aGlzLmxpc3RWaWV3Lm9uQ2FuY2VsbGVkID0gKCkgPT4gcmVzb2x2ZShcImNhbmNlbFwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChhY3Rpb24gPT09IFwidG9rZW5cIikge1xyXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm9tcHRGb3JUb2tlbihvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWN0aW9uID09PSBcImNvb2tpZVwiKSB7XHJcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnByb21wdEZvckNvb2tpZShvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhY3Rpb24gPT09IFwiY2FuY2VsXCJcclxuICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBhc3luYyBvbkdhdGV3YXkoZ2F0ZXdheUluZm86IGFueSkge1xyXG4gICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IG51bGw7XHJcbiAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgIGl0ZW1zOiBbXSxcclxuICAgICAgaW5mb01lc3NhZ2U6IG51bGwsXHJcbiAgICAgIGxvYWRpbmdNZXNzYWdlOiBcIkxvYWRpbmcgc2Vzc2lvbnMuLi5cIixcclxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIHNlc3Npb25zIGF2YWlsYWJsZVwiLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBnYXRld2F5T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXHJcbiAgICAgIHtcclxuICAgICAgICB4aHJGYWN0b3J5OiAoKSA9PiBuZXcgeGhyLlhNTEh0dHBSZXF1ZXN0KCksXHJcbiAgICAgICAgd3NGYWN0b3J5OiAodXJsLCBwcm90b2NvbCkgPT4gbmV3IHdzKHVybCwgcHJvdG9jb2wpLFxyXG4gICAgICB9LFxyXG4gICAgICBnYXRld2F5SW5mby5vcHRpb25zXHJcbiAgICApO1xyXG4gICAgbGV0IHNlcnZlclNldHRpbmdzID0gU2VydmVyQ29ubmVjdGlvbi5tYWtlU2V0dGluZ3MoZ2F0ZXdheU9wdGlvbnMpO1xyXG4gICAgbGV0IHNwZWNNb2RlbHM6IEtlcm5lbC5JU3BlY01vZGVscyB8IHVuZGVmaW5lZDtcclxuICAgIHRyeSB7XHJcbiAgICAgIHNwZWNNb2RlbHMgPSBhd2FpdCBLZXJuZWwuZ2V0U3BlY3Moc2VydmVyU2V0dGluZ3MpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgLy8gVGhlIGVycm9yIHR5cGVzIHlvdSBnZXQgYmFjayBhdCB0aGlzIHN0YWdlIGFyZSBmYWlybHkgb3BhcXVlLiBJblxyXG4gICAgICAvLyBwYXJ0aWN1bGFyLCBoYXZpbmcgaW52YWxpZCBjcmVkZW50aWFscyB0eXBpY2FsbHkgdHJpZ2dlcnMgRUNPTk5SRUZVU0VEXHJcbiAgICAgIC8vIHJhdGhlciB0aGFuIDQwMyBGb3JiaWRkZW4uIFRoaXMgZG9lcyBzb21lIGJhc2ljIGNoZWNrcyBhbmQgdGhlbiBhc3N1bWVzXHJcbiAgICAgIC8vIHRoYXQgYWxsIHJlbWFpbmluZyBlcnJvciB0eXBlcyBjb3VsZCBiZSBjYXVzZWQgYnkgaW52YWxpZCBjcmVkZW50aWFscy5cclxuICAgICAgaWYgKCFlcnJvci54aHIgfHwgIWVycm9yLnhoci5yZXNwb25zZVRleHQpIHtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgfSBlbHNlIGlmIChlcnJvci54aHIucmVzcG9uc2VUZXh0LmluY2x1ZGVzKFwiRVRJTUVET1VUXCIpKSB7XHJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiQ29ubmVjdGlvbiB0byBnYXRld2F5IGZhaWxlZFwiKTtcclxuICAgICAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBwcm9tcHRTdWNjZWVkZWQgPSBhd2FpdCB0aGlzLnByb21wdEZvckNyZWRlbnRpYWxzKGdhdGV3YXlPcHRpb25zKTtcclxuXHJcbiAgICAgICAgaWYgKCFwcm9tcHRTdWNjZWVkZWQpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlcnZlclNldHRpbmdzID0gU2VydmVyQ29ubmVjdGlvbi5tYWtlU2V0dGluZ3MoZ2F0ZXdheU9wdGlvbnMpO1xyXG4gICAgICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgICAgIGl0ZW1zOiBbXSxcclxuICAgICAgICAgIGluZm9NZXNzYWdlOiBudWxsLFxyXG4gICAgICAgICAgbG9hZGluZ01lc3NhZ2U6IFwiTG9hZGluZyBzZXNzaW9ucy4uLlwiLFxyXG4gICAgICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIHNlc3Npb25zIGF2YWlsYWJsZVwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKCFzcGVjTW9kZWxzKSB7XHJcbiAgICAgICAgc3BlY01vZGVscyA9IGF3YWl0IEtlcm5lbC5nZXRTcGVjcyhzZXJ2ZXJTZXR0aW5ncyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gXy5maWx0ZXIoc3BlY01vZGVscy5rZXJuZWxzcGVjcywgKHNwZWMpID0+XHJcbiAgICAgICAgdGhpcy5fa2VybmVsU3BlY0ZpbHRlcihzcGVjKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3Qga2VybmVsTmFtZXMgPSBfLm1hcChrZXJuZWxTcGVjcywgKHNwZWNNb2RlbCkgPT4gc3BlY01vZGVsLm5hbWUpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsZXQgc2Vzc2lvbk1vZGVscyA9IGF3YWl0IFNlc3Npb24ubGlzdFJ1bm5pbmcoc2VydmVyU2V0dGluZ3MpO1xyXG4gICAgICAgIHNlc3Npb25Nb2RlbHMgPSBzZXNzaW9uTW9kZWxzLmZpbHRlcigobW9kZWwpID0+IHtcclxuICAgICAgICAgIGNvbnN0IG5hbWUgPSBtb2RlbC5rZXJuZWwgPyBtb2RlbC5rZXJuZWwubmFtZSA6IG51bGw7XHJcbiAgICAgICAgICByZXR1cm4gbmFtZSA/IGtlcm5lbE5hbWVzLmluY2x1ZGVzKG5hbWUpIDogdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBpdGVtcyA9IHNlc3Npb25Nb2RlbHMubWFwKChtb2RlbCkgPT4ge1xyXG4gICAgICAgICAgbGV0IG5hbWU7XHJcblxyXG4gICAgICAgICAgaWYgKG1vZGVsLnBhdGgpIHtcclxuICAgICAgICAgICAgbmFtZSA9IHRpbGRpZnkobW9kZWwucGF0aCk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKG1vZGVsLm5vdGVib29rICYmIG1vZGVsLm5vdGVib29rPy5wYXRoKSB7XHJcbiAgICAgICAgICAgIG5hbWUgPSB0aWxkaWZ5KG1vZGVsLm5vdGVib29rPy5wYXRoKTsgLy8gVE9ETyBmaXggdGhlIHR5cGVzXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBuYW1lID0gYFNlc3Npb24gJHttb2RlbC5pZH1gO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIG1vZGVsLFxyXG4gICAgICAgICAgICBvcHRpb25zOiBzZXJ2ZXJTZXR0aW5ncyxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaXRlbXMudW5zaGlmdCh7XHJcbiAgICAgICAgICBuYW1lOiBcIltuZXcgc2Vzc2lvbl1cIixcclxuICAgICAgICAgIG1vZGVsOiBudWxsLFxyXG4gICAgICAgICAgb3B0aW9uczogc2VydmVyU2V0dGluZ3MsXHJcbiAgICAgICAgICBrZXJuZWxTcGVjcyxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uQ29uZmlybWVkID0gdGhpcy5vblNlc3Npb24uYmluZCh0aGlzLCBnYXRld2F5SW5mby5uYW1lKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgICAgICBpdGVtcyxcclxuICAgICAgICAgIGxvYWRpbmdNZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IueGhyIHx8IGVycm9yLnhoci5zdGF0dXMgIT09IDQwMykge1xyXG4gICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEdhdGV3YXlzIG9mZmVyIHRoZSBvcHRpb24gb2YgbmV2ZXIgbGlzdGluZyBzZXNzaW9ucywgZm9yIHNlY3VyaXR5XHJcbiAgICAgICAgLy8gcmVhc29ucy5cclxuICAgICAgICAvLyBBc3N1bWUgdGhpcyBpcyB0aGUgY2FzZSBhbmQgcHJvY2VlZCB0byBjcmVhdGluZyBhIG5ldyBzZXNzaW9uLlxyXG4gICAgICAgIHRoaXMub25TZXNzaW9uKGdhdGV3YXlJbmZvLm5hbWUsIHtcclxuICAgICAgICAgIG5hbWU6IFwiW25ldyBzZXNzaW9uXVwiLFxyXG4gICAgICAgICAgbW9kZWw6IG51bGwsXHJcbiAgICAgICAgICBvcHRpb25zOiBzZXJ2ZXJTZXR0aW5ncyxcclxuICAgICAgICAgIGtlcm5lbFNwZWNzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkNvbm5lY3Rpb24gdG8gZ2F0ZXdheSBmYWlsZWRcIik7XHJcbiAgICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBvblNlc3Npb24oZ2F0ZXdheU5hbWU6IHN0cmluZywgc2Vzc2lvbkluZm86IGFueSkge1xyXG4gICAgaWYgKCFzZXNzaW9uSW5mby5tb2RlbCkge1xyXG4gICAgICBpZiAoIXNlc3Npb25JbmZvLm5hbWUpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgICAgICBpdGVtczogW10sXHJcbiAgICAgICAgICBlcnJvck1lc3NhZ2U6IFwiVGhpcyBnYXRld2F5IGRvZXMgbm90IHN1cHBvcnQgbGlzdGluZyBzZXNzaW9uc1wiLFxyXG4gICAgICAgICAgbG9hZGluZ01lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgICBpbmZvTWVzc2FnZTogbnVsbCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgaXRlbXMgPSBfLm1hcChzZXNzaW9uSW5mby5rZXJuZWxTcGVjcywgKHNwZWMpID0+IHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgc2VydmVyU2V0dGluZ3M6IHNlc3Npb25JbmZvLm9wdGlvbnMsXHJcbiAgICAgICAgICBrZXJuZWxOYW1lOiBzcGVjLm5hbWUsXHJcbiAgICAgICAgICBwYXRoOiB0aGlzLl9wYXRoLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIG5hbWU6IHNwZWMuZGlzcGxheV9uYW1lLFxyXG4gICAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICB9O1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSB0aGlzLnN0YXJ0U2Vzc2lvbi5iaW5kKHRoaXMsIGdhdGV3YXlOYW1lKTtcclxuICAgICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xyXG4gICAgICAgIGl0ZW1zLFxyXG4gICAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBrZXJuZWwgc3BlY3MgYXZhaWxhYmxlXCIsXHJcbiAgICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgc2Vzc2lvblwiLFxyXG4gICAgICAgIGxvYWRpbmdNZXNzYWdlOiBudWxsLFxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMub25TZXNzaW9uQ2hvc2VuKFxyXG4gICAgICAgIGdhdGV3YXlOYW1lLFxyXG4gICAgICAgIGF3YWl0IFNlc3Npb24uY29ubmVjdFRvKHNlc3Npb25JbmZvLm1vZGVsLmlkLCBzZXNzaW9uSW5mby5vcHRpb25zKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RhcnRTZXNzaW9uKGdhdGV3YXlOYW1lOiBzdHJpbmcsIHNlc3Npb25JbmZvOiBhbnkpIHtcclxuICAgIFNlc3Npb24uc3RhcnROZXcoc2Vzc2lvbkluZm8ub3B0aW9ucykudGhlbihcclxuICAgICAgdGhpcy5vblNlc3Npb25DaG9zZW4uYmluZCh0aGlzLCBnYXRld2F5TmFtZSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBvblNlc3Npb25DaG9zZW4oZ2F0ZXdheU5hbWU6IHN0cmluZywgc2Vzc2lvbjogYW55KSB7XHJcbiAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xyXG4gICAgY29uc3Qga2VybmVsU3BlYyA9IGF3YWl0IHNlc3Npb24ua2VybmVsLmdldFNwZWMoKTtcclxuICAgIGlmICghc3RvcmUuZ3JhbW1hcikge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBrZXJuZWwgPSBuZXcgV1NLZXJuZWwoXHJcbiAgICAgIGdhdGV3YXlOYW1lLFxyXG4gICAgICBrZXJuZWxTcGVjLFxyXG4gICAgICBzdG9yZS5ncmFtbWFyLFxyXG4gICAgICBzZXNzaW9uXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuX29uQ2hvc2VuKGtlcm5lbCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==