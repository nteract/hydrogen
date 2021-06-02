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
        if (isEmpty_1.default(gateways)) {
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
            const kernelSpecs = filter_1.default(specModels.kernelspecs, (spec) => this._kernelSpecFilter(spec));
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
                        name = tildify_1.default(model.path);
                    }
                    else if (model.notebook.path) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Mta2VybmVsLXBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi93cy1rZXJuZWwtcGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esd0VBQXdFO0FBQ3hFLDJEQUFtQztBQUNuQyw2REFBcUM7QUFDckMsc0RBQThCO0FBQzlCLCtCQUEwQjtBQUMxQiw0Q0FBb0I7QUFDcEIsbURBQXNFO0FBQ3RFLDZCQUEwQjtBQUMxQixtREFBeUU7QUFDekUsc0RBQThCO0FBQzlCLDREQUFtQztBQUNuQyw4REFBcUM7QUFDckMsb0RBQTRCO0FBRTVCLG1DQUFxRTtBQWlDckUsTUFBTSxjQUFjO0lBT2xCO1FBTkEsZ0JBQVcsR0FBc0QsSUFBSSxDQUFDO1FBQ3RFLGdCQUFXLEdBQWtDLElBQUksQ0FBQztRQU1oRCxtQ0FBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksMEJBQWMsQ0FBQztZQUN2QyxjQUFjLEVBQUUsQ0FBQyxhQUFhLENBQUM7WUFDL0IsS0FBSyxFQUFFLEVBQUU7WUFDVCxnQkFBZ0IsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJO1lBQ3JELGNBQWMsRUFBRSxDQUFDLElBQW9CLEVBQUUsRUFBRTtnQkFDdkMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0MsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNoQyxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDO1lBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7Z0JBQzVDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtvQkFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDeEI7WUFDSCxDQUFDO1lBQ0Qsa0JBQWtCLEVBQUUsR0FBRyxFQUFF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V0FBb0M7UUFDcEUsa0JBQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FDeEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUM3QyxDQUFDO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBbUIsRUFBRSxPQUF5QjtRQUNsRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsRCxJQUFJLENBQUMsZUFBSyxDQUFDLE9BQU8sRUFBRTtZQUNsQixPQUFPO1NBQ1I7UUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFRLENBQ3pCLFdBQVcsRUFDWCxVQUFVLEVBQ1YsZUFBSyxDQUFDLE9BQU8sRUFDYixPQUFPLENBQ1IsQ0FBQztRQUVGLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDekIsQ0FBQztDQUNGO0FBcFlELGlDQW9ZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhbmVsIH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IFNlbGVjdExpc3RWaWV3LCB7IFNlbGVjdExpc3RQcm9wZXJ0aWVzIH0gZnJvbSBcImF0b20tc2VsZWN0LWxpc3RcIjtcclxuaW1wb3J0IGZpbHRlciBmcm9tIFwibG9kYXNoL2ZpbHRlclwiO1xyXG5pbXBvcnQgaXNFbXB0eSBmcm9tIFwibG9kYXNoL2lzRW1wdHlcIjtcclxuaW1wb3J0IHRpbGRpZnkgZnJvbSBcInRpbGRpZnlcIjtcclxuaW1wb3J0IHsgdjQgfSBmcm9tIFwidXVpZFwiO1xyXG5pbXBvcnQgd3MgZnJvbSBcIndzXCI7XHJcbmltcG9ydCB7IFhNTEh0dHBSZXF1ZXN0IGFzIE5vZGVYTUxIdHRwUmVxdWVzdCB9IGZyb20gXCJ4bWxodHRwcmVxdWVzdFwiOyAvLyBUT0RPIHVzZSBAYW1pbnlhL3htbGh0dHByZXF1ZXN0XHJcbmltcG9ydCB7IFVSTCB9IGZyb20gXCJ1cmxcIjtcclxuaW1wb3J0IHsgS2VybmVsLCBTZXNzaW9uLCBTZXJ2ZXJDb25uZWN0aW9uIH0gZnJvbSBcIkBqdXB5dGVybGFiL3NlcnZpY2VzXCI7XHJcbmltcG9ydCBDb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCBXU0tlcm5lbCBmcm9tIFwiLi93cy1rZXJuZWxcIjtcclxuaW1wb3J0IElucHV0VmlldyBmcm9tIFwiLi9pbnB1dC12aWV3XCI7XHJcbmltcG9ydCBzdG9yZSBmcm9tIFwiLi9zdG9yZVwiO1xyXG5pbXBvcnQgdHlwZSB7IEtlcm5lbHNwZWNNZXRhZGF0YSB9IGZyb20gXCJAbnRlcmFjdC90eXBlc1wiO1xyXG5pbXBvcnQgeyBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQsIERlZXBXcml0ZWFibGUgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuZXhwb3J0IHR5cGUgS2VybmVsR2F0ZXdheU9wdGlvbnMgPSBQYXJhbWV0ZXJzPFxyXG4gIHR5cGVvZiBTZXJ2ZXJDb25uZWN0aW9uW1wibWFrZVNldHRpbmdzXCJdXHJcbj5bMF07XHJcblxyXG4vLyBCYXNlZCBvbiB0aGUgY29uZmlnIGRvY3VtZW50YXRpb25cclxuLy8gVE9ETyB2ZXJpZnkgdGhpc1xyXG5leHBvcnQgdHlwZSBNaW5pbWFsU2VydmVyQ29ubmVjdGlvblNldHRpbmdzID0gUGljazxcclxuICBLZXJuZWxHYXRld2F5T3B0aW9ucyxcclxuICBcImJhc2VVcmxcIlxyXG4+O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBLZXJuZWxHYXRld2F5IHtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgb3B0aW9uczogS2VybmVsR2F0ZXdheU9wdGlvbnM7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbkluZm9XaXRoTW9kZWwge1xyXG4gIG1vZGVsOiBLZXJuZWwuSU1vZGVsO1xyXG4gIG9wdGlvbnM6IFBhcmFtZXRlcnM8dHlwZW9mIFNlc3Npb24uY29ubmVjdFRvPlsxXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uSW5mb1dpdGhvdXRNb2RlbCB7XHJcbiAgbmFtZT86IHN0cmluZztcclxuICBrZXJuZWxTcGVjczogS2VybmVsLklTcGVjTW9kZWxbXTtcclxuICBvcHRpb25zOiBQYXJhbWV0ZXJzPHR5cGVvZiBTZXNzaW9uLnN0YXJ0TmV3PlswXTtcclxuICAvLyBubyBtb2RlbFxyXG4gIG1vZGVsPzogbmV2ZXIgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG59XHJcblxyXG50eXBlIFNlbGVjdExpc3RJdGVtID0gS2VybmVsR2F0ZXdheTtcclxuXHJcbmNsYXNzIEN1c3RvbUxpc3RWaWV3IHtcclxuICBvbkNvbmZpcm1lZDogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiB2b2lkIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7XHJcbiAgb25DYW5jZWxsZWQ6ICgpID0+IHZvaWQgfCBudWxsIHwgdW5kZWZpbmVkID0gbnVsbDtcclxuICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBzZWxlY3RMaXN0VmlldzogU2VsZWN0TGlzdFZpZXc7XHJcbiAgcGFuZWw6IFBhbmVsIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcyk7XHJcbiAgICB0aGlzLnNlbGVjdExpc3RWaWV3ID0gbmV3IFNlbGVjdExpc3RWaWV3KHtcclxuICAgICAgaXRlbXNDbGFzc0xpc3Q6IFtcIm1hcmstYWN0aXZlXCJdLFxyXG4gICAgICBpdGVtczogW10sXHJcbiAgICAgIGZpbHRlcktleUZvckl0ZW06IChpdGVtOiBTZWxlY3RMaXN0SXRlbSkgPT4gaXRlbS5uYW1lLFxyXG4gICAgICBlbGVtZW50Rm9ySXRlbTogKGl0ZW06IFNlbGVjdExpc3RJdGVtKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gaXRlbS5uYW1lO1xyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgICB9LFxyXG4gICAgICBkaWRDb25maXJtU2VsZWN0aW9uOiAoaXRlbTogU2VsZWN0TGlzdEl0ZW0pID0+IHtcclxuICAgICAgICBpZiAodGhpcy5vbkNvbmZpcm1lZCkge1xyXG4gICAgICAgICAgdGhpcy5vbkNvbmZpcm1lZChpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgICAgaWYgKHRoaXMub25DYW5jZWxsZWQpIHtcclxuICAgICAgICAgIHRoaXMub25DYW5jZWxsZWQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNob3coKSB7XHJcbiAgICBpZiAoIXRoaXMucGFuZWwpIHtcclxuICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xyXG4gICAgICAgIGl0ZW06IHRoaXMuc2VsZWN0TGlzdFZpZXcsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucGFuZWwuc2hvdygpO1xyXG4gICAgdGhpcy5zZWxlY3RMaXN0Vmlldy5mb2N1cygpO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RMaXN0Vmlldy5kZXN0cm95KCk7XHJcbiAgfVxyXG5cclxuICBjYW5jZWwoKSB7XHJcbiAgICBpZiAodGhpcy5wYW5lbCAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucGFuZWwgPSBudWxsO1xyXG5cclxuICAgIGlmICh0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCkge1xyXG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpO1xyXG4gICAgICB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXU0tlcm5lbFBpY2tlciB7XHJcbiAgX29uQ2hvc2VuOiAoa2VybmVsOiBXU0tlcm5lbCkgPT4gdm9pZDtcclxuICBfa2VybmVsU3BlY0ZpbHRlcjogKGtlcm5lbFNwZWM6IEtlcm5lbC5JU3BlY01vZGVsKSA9PiBib29sZWFuO1xyXG4gIF9wYXRoOiBzdHJpbmc7XHJcbiAgbGlzdFZpZXc6IEN1c3RvbUxpc3RWaWV3O1xyXG5cclxuICBjb25zdHJ1Y3RvcihvbkNob3NlbjogKGtlcm5lbDogV1NLZXJuZWwpID0+IHZvaWQpIHtcclxuICAgIHRoaXMuX29uQ2hvc2VuID0gb25DaG9zZW47XHJcbiAgICB0aGlzLmxpc3RWaWV3ID0gbmV3IEN1c3RvbUxpc3RWaWV3KCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyB0b2dnbGUoXHJcbiAgICBfa2VybmVsU3BlY0ZpbHRlcjogKFxyXG4gICAgICBrZXJuZWxTcGVjOiBLZXJuZWwuSVNwZWNNb2RlbCB8IEtlcm5lbHNwZWNNZXRhZGF0YVxyXG4gICAgKSA9PiBib29sZWFuXHJcbiAgKSB7XHJcbiAgICBzZXRQcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQodGhpcy5saXN0Vmlldyk7XHJcbiAgICB0aGlzLl9rZXJuZWxTcGVjRmlsdGVyID0gX2tlcm5lbFNwZWNGaWx0ZXI7XHJcbiAgICBjb25zdCBnYXRld2F5cyA9IENvbmZpZy5nZXRKc29uKFwiZ2F0ZXdheXNcIikgfHwgW107XHJcblxyXG4gICAgaWYgKGlzRW1wdHkoZ2F0ZXdheXMpKSB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIk5vIHJlbW90ZSBrZXJuZWwgZ2F0ZXdheXMgYXZhaWxhYmxlXCIsIHtcclxuICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgIFwiVXNlIHRoZSBIeWRyb2dlbiBwYWNrYWdlIHNldHRpbmdzIHRvIHNwZWNpZnkgdGhlIGxpc3Qgb2YgcmVtb3RlIHNlcnZlcnMuIEh5ZHJvZ2VuIGNhbiB1c2UgcmVtb3RlIGtlcm5lbHMgb24gZWl0aGVyIGEgSnVweXRlciBLZXJuZWwgR2F0ZXdheSBvciBKdXB5dGVyIG5vdGVib29rIHNlcnZlci5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9wYXRoID0gYCR7c3RvcmUuZmlsZVBhdGggfHwgXCJ1bnNhdmVkXCJ9LSR7djQoKX1gO1xyXG4gICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IHRoaXMub25HYXRld2F5LmJpbmQodGhpcyk7XHJcbiAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgIGl0ZW1zOiBnYXRld2F5cyxcclxuICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgZ2F0ZXdheVwiLFxyXG4gICAgICBlbXB0eU1lc3NhZ2U6IFwiTm8gZ2F0ZXdheXMgYXZhaWxhYmxlXCIsXHJcbiAgICAgIGxvYWRpbmdNZXNzYWdlOiB1bmRlZmluZWQsXHJcbiAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcclxuICAgIHRoaXMubGlzdFZpZXcuc2hvdygpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHJvbXB0Rm9yVGV4dChwcm9tcHQ6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gdGhpcy5saXN0Vmlldy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ7XHJcbiAgICB0aGlzLmxpc3RWaWV3LmNhbmNlbCgpO1xyXG4gICAgY29uc3QgaW5wdXRQcm9taXNlID0gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGlucHV0VmlldyA9IG5ldyBJbnB1dFZpZXcoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcHJvbXB0LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVzb2x2ZVxyXG4gICAgICApO1xyXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChpbnB1dFZpZXcuZWxlbWVudCwge1xyXG4gICAgICAgIFwiY29yZTpjYW5jZWxcIjogKCkgPT4ge1xyXG4gICAgICAgICAgaW5wdXRWaWV3LmNsb3NlKCk7XHJcbiAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuICAgICAgaW5wdXRWaWV3LmF0dGFjaCgpO1xyXG4gICAgfSk7XHJcbiAgICBsZXQgcmVzcG9uc2U6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBpbnB1dFByb21pc2U7XHJcblxyXG4gICAgICBpZiAocmVzcG9uc2UgPT09IFwiXCIpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBc3N1bWUgdGhhdCBubyByZXNwb25zZSB0byB0aGUgcHJvbXB0IHdpbGwgY2FuY2VsIHRoZSBlbnRpcmUgZmxvdywgc29cclxuICAgIC8vIG9ubHkgcmVzdG9yZSBsaXN0VmlldyBpZiBhIHJlc3BvbnNlIHdhcyByZWNlaXZlZFxyXG4gICAgdGhpcy5saXN0Vmlldy5zaG93KCk7XHJcbiAgICB0aGlzLmxpc3RWaWV3LnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9IHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDtcclxuICAgIHJldHVybiByZXNwb25zZTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHByb21wdEZvckNvb2tpZShvcHRpb25zOiBEZWVwV3JpdGVhYmxlPEtlcm5lbEdhdGV3YXlPcHRpb25zPikge1xyXG4gICAgY29uc3QgY29va2llID0gYXdhaXQgdGhpcy5wcm9tcHRGb3JUZXh0KFwiQ29va2llOlwiKTtcclxuXHJcbiAgICBpZiAoY29va2llID09PSBudWxsIHx8IGNvb2tpZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5yZXF1ZXN0SGVhZGVycyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIG9wdGlvbnMucmVxdWVzdEhlYWRlcnMgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zLnJlcXVlc3RIZWFkZXJzLkNvb2tpZSA9IGNvb2tpZTtcclxuXHJcbiAgICBvcHRpb25zLnhockZhY3RvcnkgPSAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgTm9kZVhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgIC8vIERpc2FibGUgcHJvdGVjdGlvbnMgYWdhaW5zdCBzZXR0aW5nIHRoZSBDb29raWUgaGVhZGVyXHJcbiAgICAgIHJlcXVlc3Quc2V0RGlzYWJsZUhlYWRlckNoZWNrKHRydWUpO1xyXG4gICAgICByZXR1cm4gcmVxdWVzdCBhcyBYTUxIdHRwUmVxdWVzdDsgLy8gVE9ETyBmaXggdGhlIHR5cGVzXHJcbiAgICB9O1xyXG5cclxuICAgIG9wdGlvbnMud3NGYWN0b3J5ID0gKHVybDogc3RyaW5nLCBwcm90b2NvbD86IHN0cmluZyB8IHN0cmluZ1tdKSA9PiB7XHJcbiAgICAgIC8vIEF1dGhlbnRpY2F0aW9uIHJlcXVpcmVzIHJlcXVlc3RzIHRvIGFwcGVhciB0byBiZSBzYW1lLW9yaWdpblxyXG4gICAgICBjb25zdCBwYXJzZWRVcmwgPSBuZXcgVVJMKHVybCk7XHJcblxyXG4gICAgICBpZiAocGFyc2VkVXJsLnByb3RvY29sID09PSBcIndzczpcIikge1xyXG4gICAgICAgIHBhcnNlZFVybC5wcm90b2NvbCA9IFwiaHR0cHM6XCI7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGFyc2VkVXJsLnByb3RvY29sID0gXCJodHRwOlwiO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBoZWFkZXJzID0ge1xyXG4gICAgICAgIENvb2tpZTogY29va2llLFxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCBvcmlnaW4gPSBwYXJzZWRVcmwub3JpZ2luO1xyXG4gICAgICBjb25zdCBob3N0ID0gcGFyc2VkVXJsLmhvc3Q7XHJcbiAgICAgIHJldHVybiBuZXcgd3ModXJsLCBwcm90b2NvbCwge1xyXG4gICAgICAgIGhlYWRlcnMsXHJcbiAgICAgICAgb3JpZ2luLFxyXG4gICAgICAgIGhvc3QsXHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHByb21wdEZvclRva2VuKG9wdGlvbnM6IERlZXBXcml0ZWFibGU8S2VybmVsR2F0ZXdheU9wdGlvbnM+KSB7XHJcbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IHRoaXMucHJvbXB0Rm9yVGV4dChcIlRva2VuOlwiKTtcclxuXHJcbiAgICBpZiAodG9rZW4gPT09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMudG9rZW4gPSB0b2tlbjtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHJvbXB0Rm9yQ3JlZGVudGlhbHMob3B0aW9uczogRGVlcFdyaXRlYWJsZTxLZXJuZWxHYXRld2F5T3B0aW9ucz4pIHtcclxuICAgIGF3YWl0IHRoaXMubGlzdFZpZXcuc2VsZWN0TGlzdFZpZXcudXBkYXRlKHtcclxuICAgICAgaXRlbXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBuYW1lOiBcIkF1dGhlbnRpY2F0ZSB3aXRoIGEgdG9rZW5cIixcclxuICAgICAgICAgIGFjdGlvbjogXCJ0b2tlblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogXCJBdXRoZW50aWNhdGUgd2l0aCBhIGNvb2tpZVwiLFxyXG4gICAgICAgICAgYWN0aW9uOiBcImNvb2tpZVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogXCJDYW5jZWxcIixcclxuICAgICAgICAgIGFjdGlvbjogXCJjYW5jZWxcIixcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgICBpbmZvTWVzc2FnZTpcclxuICAgICAgICBcIllvdSBtYXkgbmVlZCB0byBhdXRoZW50aWNhdGUgdG8gY29tcGxldGUgdGhlIGNvbm5lY3Rpb24sIG9yIHlvdXIgc2V0dGluZ3MgbWF5IGJlIGluY29ycmVjdCwgb3IgdGhlIHNlcnZlciBtYXkgYmUgdW5hdmFpbGFibGUuXCIsXHJcbiAgICAgIGxvYWRpbmdNZXNzYWdlOiBudWxsLFxyXG4gICAgICBlbXB0eU1lc3NhZ2U6IG51bGwsXHJcbiAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcclxuICAgIGNvbnN0IGFjdGlvbiA9IGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAvLyBUT0RPIHJldXNlcyB0aGUgU2VsZWN0TGlzdFZpZXchXHJcbiAgICAgIHR5cGUgTmV3U2VsZWN0TGlzdEl0ZW0gPSB7IGFjdGlvbjogc3RyaW5nIH07XHJcbiAgICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSAoaXRlbTogTmV3U2VsZWN0TGlzdEl0ZW0pID0+XHJcbiAgICAgICAgcmVzb2x2ZShpdGVtLmFjdGlvbik7XHJcblxyXG4gICAgICB0aGlzLmxpc3RWaWV3Lm9uQ2FuY2VsbGVkID0gKCkgPT4gcmVzb2x2ZShcImNhbmNlbFwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChhY3Rpb24gPT09IFwidG9rZW5cIikge1xyXG4gICAgICByZXR1cm4gdGhpcy5wcm9tcHRGb3JUb2tlbihvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWN0aW9uID09PSBcImNvb2tpZVwiKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnByb21wdEZvckNvb2tpZShvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhY3Rpb24gPT09IFwiY2FuY2VsXCJcclxuICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBhc3luYyBvbkdhdGV3YXkoZ2F0ZXdheUluZm86IEtlcm5lbEdhdGV3YXkpIHtcclxuICAgIHRoaXMubGlzdFZpZXcub25Db25maXJtZWQgPSBudWxsO1xyXG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xyXG4gICAgICBpdGVtczogW10sXHJcbiAgICAgIGluZm9NZXNzYWdlOiB1bmRlZmluZWQsXHJcbiAgICAgIGxvYWRpbmdNZXNzYWdlOiBcIkxvYWRpbmcgc2Vzc2lvbnMuLi5cIixcclxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIHNlc3Npb25zIGF2YWlsYWJsZVwiLFxyXG4gICAgfSBhcyBTZWxlY3RMaXN0UHJvcGVydGllcyk7XHJcbiAgICBjb25zdCBnYXRld2F5T3B0aW9ucyA9IHtcclxuICAgICAgeGhyRmFjdG9yeTogKCkgPT4gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXHJcbiAgICAgIHdzRmFjdG9yeTogKHVybDogc3RyaW5nLCBwcm90b2NvbD86IHN0cmluZyB8IHN0cmluZ1tdKSA9PlxyXG4gICAgICAgIG5ldyB3cyh1cmwsIHByb3RvY29sKSxcclxuICAgICAgLi4uZ2F0ZXdheUluZm8ub3B0aW9ucyxcclxuICAgIH07XHJcbiAgICBsZXQgc2VydmVyU2V0dGluZ3MgPSBTZXJ2ZXJDb25uZWN0aW9uLm1ha2VTZXR0aW5ncyhnYXRld2F5T3B0aW9ucyk7XHJcbiAgICBsZXQgc3BlY01vZGVsczogS2VybmVsLklTcGVjTW9kZWxzIHwgdW5kZWZpbmVkO1xyXG4gICAgdHJ5IHtcclxuICAgICAgc3BlY01vZGVscyA9IGF3YWl0IEtlcm5lbC5nZXRTcGVjcyhzZXJ2ZXJTZXR0aW5ncyk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAvLyBUaGUgZXJyb3IgdHlwZXMgeW91IGdldCBiYWNrIGF0IHRoaXMgc3RhZ2UgYXJlIGZhaXJseSBvcGFxdWUuIEluXHJcbiAgICAgIC8vIHBhcnRpY3VsYXIsIGhhdmluZyBpbnZhbGlkIGNyZWRlbnRpYWxzIHR5cGljYWxseSB0cmlnZ2VycyBFQ09OTlJFRlVTRURcclxuICAgICAgLy8gcmF0aGVyIHRoYW4gNDAzIEZvcmJpZGRlbi4gVGhpcyBkb2VzIHNvbWUgYmFzaWMgY2hlY2tzIGFuZCB0aGVuIGFzc3VtZXNcclxuICAgICAgLy8gdGhhdCBhbGwgcmVtYWluaW5nIGVycm9yIHR5cGVzIGNvdWxkIGJlIGNhdXNlZCBieSBpbnZhbGlkIGNyZWRlbnRpYWxzLlxyXG4gICAgICBpZiAoIWVycm9yLnhociB8fCAhZXJyb3IueGhyLnJlc3BvbnNlVGV4dCkge1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICB9IGVsc2UgaWYgKGVycm9yLnhoci5yZXNwb25zZVRleHQuaW5jbHVkZXMoXCJFVElNRURPVVRcIikpIHtcclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXCJDb25uZWN0aW9uIHRvIGdhdGV3YXkgZmFpbGVkXCIpO1xyXG4gICAgICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHByb21wdFN1Y2NlZWRlZCA9IGF3YWl0IHRoaXMucHJvbXB0Rm9yQ3JlZGVudGlhbHMoZ2F0ZXdheU9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAoIXByb21wdFN1Y2NlZWRlZCkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VydmVyU2V0dGluZ3MgPSBTZXJ2ZXJDb25uZWN0aW9uLm1ha2VTZXR0aW5ncyhnYXRld2F5T3B0aW9ucyk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xyXG4gICAgICAgICAgaXRlbXM6IFtdLFxyXG4gICAgICAgICAgaW5mb01lc3NhZ2U6IHVuZGVmaW5lZCxcclxuICAgICAgICAgIGxvYWRpbmdNZXNzYWdlOiBcIkxvYWRpbmcgc2Vzc2lvbnMuLi5cIixcclxuICAgICAgICAgIGVtcHR5TWVzc2FnZTogXCJObyBzZXNzaW9ucyBhdmFpbGFibGVcIixcclxuICAgICAgICB9IGFzIFNlbGVjdExpc3RQcm9wZXJ0aWVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGlmICghc3BlY01vZGVscykge1xyXG4gICAgICAgIHNwZWNNb2RlbHMgPSBhd2FpdCBLZXJuZWwuZ2V0U3BlY3Moc2VydmVyU2V0dGluZ3MpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBrZXJuZWxTcGVjcyA9IGZpbHRlcihzcGVjTW9kZWxzLmtlcm5lbHNwZWNzLCAoc3BlYykgPT5cclxuICAgICAgICB0aGlzLl9rZXJuZWxTcGVjRmlsdGVyKHNwZWMpXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoa2VybmVsU3BlY3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgdGhpcy5saXN0Vmlldy5jYW5jZWwoKTtcclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXHJcbiAgICAgICAgICBgVGhlcmVyIGFyZSBubyBrZXJuZWxzIHRoYXQgbWF0Y2hlcyB0aGUgZ3JhbW1hciBvZiB0aGUgY3VycmVudGx5IG9wZW4gZmlsZS5cclxuICAgICAgICAgICBPcGVuIHRoZSBmaWxlIHlvdSBpbnRlbmQgdG8gdXNlIHRoZSByZW1vdGUga2VybmVsIGZvciBhbmQgdHJ5IGFnYWluLlxyXG4gICAgICAgICAgIFlvdSBtaWdodCBhbHNvIG5lZWQgdG8gY2hvb3NlIHRoZSBjb3JyZWN0IGdyYW1tYXIgZm9yIHRoZSBmaWxlLmBcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qga2VybmVsTmFtZXMgPSBrZXJuZWxTcGVjcy5tYXAoKHNwZWNNb2RlbCkgPT4gc3BlY01vZGVsLm5hbWUpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsZXQgc2Vzc2lvbk1vZGVscyA9IGF3YWl0IFNlc3Npb24ubGlzdFJ1bm5pbmcoc2VydmVyU2V0dGluZ3MpO1xyXG4gICAgICAgIC8vIGlmIG5vIHNlZXNzaW9uIHByb3BtdCBmb3IgdGhlIGNyZW5kaWFsc1xyXG4gICAgICAgIC8vIGlmIHRoZSBrZXJuZWwgc3RpbGwgcmVmdXNlZCwgdGhlbiBnbyB0byBjYXRjaCBibG9ja1xyXG4gICAgICAgIGlmIChzZXNzaW9uTW9kZWxzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgYXdhaXQgdGhpcy5wcm9tcHRGb3JDcmVkZW50aWFscyhnYXRld2F5T3B0aW9ucyk7XHJcbiAgICAgICAgICBzZXJ2ZXJTZXR0aW5ncyA9IFNlcnZlckNvbm5lY3Rpb24ubWFrZVNldHRpbmdzKGdhdGV3YXlPcHRpb25zKTtcclxuICAgICAgICAgIHNlc3Npb25Nb2RlbHMgPSBhd2FpdCBTZXNzaW9uLmxpc3RSdW5uaW5nKHNlcnZlclNldHRpbmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2Vzc2lvbk1vZGVscyA9IHNlc3Npb25Nb2RlbHMuZmlsdGVyKChtb2RlbCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgbmFtZSA9IG1vZGVsLmtlcm5lbCA/IG1vZGVsLmtlcm5lbC5uYW1lIDogbnVsbDtcclxuICAgICAgICAgIHJldHVybiBuYW1lID8ga2VybmVsTmFtZXMuaW5jbHVkZXMobmFtZSkgOiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gc2Vzc2lvbk1vZGVscy5tYXAoKG1vZGVsKSA9PiB7XHJcbiAgICAgICAgICBsZXQgbmFtZTogc3RyaW5nO1xyXG5cclxuICAgICAgICAgIGlmIChtb2RlbC5wYXRoKSB7XHJcbiAgICAgICAgICAgIG5hbWUgPSB0aWxkaWZ5KG1vZGVsLnBhdGgpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChtb2RlbC5ub3RlYm9vay5wYXRoKSB7XHJcbiAgICAgICAgICAgIG5hbWUgPSB0aWxkaWZ5KG1vZGVsLm5vdGVib29rIS5wYXRoKTsgLy8gVE9ETyBmaXggdGhlIHR5cGVzXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBuYW1lID0gYFNlc3Npb24gJHttb2RlbC5pZH1gO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIG1vZGVsLFxyXG4gICAgICAgICAgICBvcHRpb25zOiBzZXJ2ZXJTZXR0aW5ncyxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaXRlbXMudW5zaGlmdCh7XHJcbiAgICAgICAgICBuYW1lOiBcIltuZXcgc2Vzc2lvbl1cIixcclxuICAgICAgICAgIG1vZGVsOiBudWxsLFxyXG4gICAgICAgICAgb3B0aW9uczogc2VydmVyU2V0dGluZ3MsXHJcbiAgICAgICAgICBrZXJuZWxTcGVjcyxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uQ29uZmlybWVkID0gdGhpcy5vblNlc3Npb24uYmluZCh0aGlzLCBnYXRld2F5SW5mby5uYW1lKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmxpc3RWaWV3LnNlbGVjdExpc3RWaWV3LnVwZGF0ZSh7XHJcbiAgICAgICAgICBpdGVtcyxcclxuICAgICAgICAgIGxvYWRpbmdNZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIH0gYXMgU2VsZWN0TGlzdFByb3BlcnRpZXMpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IueGhyIHx8IGVycm9yLnhoci5zdGF0dXMgIT09IDQwMykge1xyXG4gICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEdhdGV3YXlzIG9mZmVyIHRoZSBvcHRpb24gb2YgbmV2ZXIgbGlzdGluZyBzZXNzaW9ucywgZm9yIHNlY3VyaXR5XHJcbiAgICAgICAgLy8gcmVhc29ucy5cclxuICAgICAgICAvLyBBc3N1bWUgdGhpcyBpcyB0aGUgY2FzZSBhbmQgcHJvY2VlZCB0byBjcmVhdGluZyBhIG5ldyBzZXNzaW9uLlxyXG4gICAgICAgIHRoaXMub25TZXNzaW9uKGdhdGV3YXlJbmZvLm5hbWUsIHtcclxuICAgICAgICAgIG5hbWU6IFwiW25ldyBzZXNzaW9uXVwiLFxyXG4gICAgICAgICAgbW9kZWw6IG51bGwsXHJcbiAgICAgICAgICBvcHRpb25zOiBzZXJ2ZXJTZXR0aW5ncyxcclxuICAgICAgICAgIGtlcm5lbFNwZWNzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkNvbm5lY3Rpb24gdG8gZ2F0ZXdheSBmYWlsZWRcIik7XHJcbiAgICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBvblNlc3Npb24oXHJcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxyXG4gICAgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aE1vZGVsIHwgU2Vzc2lvbkluZm9XaXRob3V0TW9kZWxcclxuICApIHtcclxuICAgIGNvbnN0IG1vZGVsID0gc2Vzc2lvbkluZm8ubW9kZWw7XHJcbiAgICBpZiAobW9kZWwgPT09IG51bGwgfHwgbW9kZWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBtb2RlbCBub3QgcHJvdmlkZWRcclxuICAgICAgcmV0dXJuIHRoaXMub25TZXNzaW9uV2l0b3V0aE1vZGVsKFxyXG4gICAgICAgIGdhdGV3YXlOYW1lLFxyXG4gICAgICAgIHNlc3Npb25JbmZvIGFzIFNlc3Npb25JbmZvV2l0aG91dE1vZGVsXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyB3aXRoIG1vZGVsXHJcbiAgICAgIHJldHVybiB0aGlzLm9uU2Vzc2lvbldpdGhNb2RlbChcclxuICAgICAgICBnYXRld2F5TmFtZSxcclxuICAgICAgICBzZXNzaW9uSW5mbyBhcyBTZXNzaW9uSW5mb1dpdGhNb2RlbFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25TZXNzaW9uV2l0aE1vZGVsKFxyXG4gICAgZ2F0ZXdheU5hbWU6IHN0cmluZyxcclxuICAgIHNlc3Npb25JbmZvOiBTZXNzaW9uSW5mb1dpdGhNb2RlbFxyXG4gICkge1xyXG4gICAgdGhpcy5vblNlc3Npb25DaG9zZW4oXHJcbiAgICAgIGdhdGV3YXlOYW1lLFxyXG4gICAgICBhd2FpdCBTZXNzaW9uLmNvbm5lY3RUbyhzZXNzaW9uSW5mby5tb2RlbC5pZCwgc2Vzc2lvbkluZm8ub3B0aW9ucylcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBvblNlc3Npb25XaXRvdXRoTW9kZWwoXHJcbiAgICBnYXRld2F5TmFtZTogc3RyaW5nLFxyXG4gICAgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aG91dE1vZGVsXHJcbiAgKSB7XHJcbiAgICBpZiAoIXNlc3Npb25JbmZvLm5hbWUpIHtcclxuICAgICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xyXG4gICAgICAgIGl0ZW1zOiBbXSxcclxuICAgICAgICBlcnJvck1lc3NhZ2U6IFwiVGhpcyBnYXRld2F5IGRvZXMgbm90IHN1cHBvcnQgbGlzdGluZyBzZXNzaW9uc1wiLFxyXG4gICAgICAgIGxvYWRpbmdNZXNzYWdlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgaW5mb01lc3NhZ2U6IHVuZGVmaW5lZCxcclxuICAgICAgfSBhcyBTZWxlY3RMaXN0UHJvcGVydGllcyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaXRlbXMgPSBzZXNzaW9uSW5mby5rZXJuZWxTcGVjcy5tYXAoKHNwZWMpID0+IHtcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICBzZXJ2ZXJTZXR0aW5nczogc2Vzc2lvbkluZm8ub3B0aW9ucyxcclxuICAgICAgICBrZXJuZWxOYW1lOiBzcGVjLm5hbWUsXHJcbiAgICAgICAgcGF0aDogdGhpcy5fcGF0aCxcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBuYW1lOiBzcGVjLmRpc3BsYXlfbmFtZSxcclxuICAgICAgICBvcHRpb25zLFxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5saXN0Vmlldy5vbkNvbmZpcm1lZCA9IHRoaXMuc3RhcnRTZXNzaW9uLmJpbmQodGhpcywgZ2F0ZXdheU5hbWUpO1xyXG4gICAgYXdhaXQgdGhpcy5saXN0Vmlldy5zZWxlY3RMaXN0Vmlldy51cGRhdGUoe1xyXG4gICAgICBpdGVtcyxcclxuICAgICAgZW1wdHlNZXNzYWdlOiBcIk5vIGtlcm5lbCBzcGVjcyBhdmFpbGFibGVcIixcclxuICAgICAgaW5mb01lc3NhZ2U6IFwiU2VsZWN0IGEgc2Vzc2lvblwiLFxyXG4gICAgICBsb2FkaW5nTWVzc2FnZTogdW5kZWZpbmVkLFxyXG4gICAgfSBhcyBTZWxlY3RMaXN0UHJvcGVydGllcyk7XHJcbiAgfVxyXG5cclxuICBzdGFydFNlc3Npb24oZ2F0ZXdheU5hbWU6IHN0cmluZywgc2Vzc2lvbkluZm86IFNlc3Npb25JbmZvV2l0aG91dE1vZGVsKSB7XHJcbiAgICBTZXNzaW9uLnN0YXJ0TmV3KHNlc3Npb25JbmZvLm9wdGlvbnMpLnRoZW4oXHJcbiAgICAgIHRoaXMub25TZXNzaW9uQ2hvc2VuLmJpbmQodGhpcywgZ2F0ZXdheU5hbWUpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25TZXNzaW9uQ2hvc2VuKGdhdGV3YXlOYW1lOiBzdHJpbmcsIHNlc3Npb246IFNlc3Npb24uSVNlc3Npb24pIHtcclxuICAgIHRoaXMubGlzdFZpZXcuY2FuY2VsKCk7XHJcbiAgICBjb25zdCBrZXJuZWxTcGVjID0gYXdhaXQgc2Vzc2lvbi5rZXJuZWwuZ2V0U3BlYygpO1xyXG4gICAgaWYgKCFzdG9yZS5ncmFtbWFyKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGtlcm5lbCA9IG5ldyBXU0tlcm5lbChcclxuICAgICAgZ2F0ZXdheU5hbWUsXHJcbiAgICAgIGtlcm5lbFNwZWMsXHJcbiAgICAgIHN0b3JlLmdyYW1tYXIsXHJcbiAgICAgIHNlc3Npb25cclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5fb25DaG9zZW4oa2VybmVsKTtcclxuICB9XHJcbn1cclxuIl19