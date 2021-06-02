"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KernelManager = void 0;
const map_1 = __importDefault(require("lodash/map"));
const mapKeys_1 = __importDefault(require("lodash/mapKeys"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const kernelspecs_1 = require("kernelspecs");
const electron_1 = require("electron");
const zmq_kernel_1 = __importDefault(require("./zmq-kernel"));
const kernel_1 = __importDefault(require("./kernel"));
const kernel_picker_1 = __importDefault(require("./kernel-picker"));
const store_1 = __importDefault(require("./store"));
const utils_1 = require("./utils");
class KernelManager {
    constructor() {
        this.kernelSpecs = null;
    }
    startKernelFor(grammar, editor, filePath, onStarted) {
        this.getKernelSpecForGrammar(grammar).then((kernelSpec) => {
            if (!kernelSpec) {
                const message = `No kernel for grammar \`${grammar.name}\` found`;
                const pythonDescription = grammar && /python/g.test(grammar.scopeName)
                    ? "\n\nTo detect your current Python install you will need to run:<pre>python -m pip install ipykernel\npython -m ipykernel install --user</pre>"
                    : "";
                const description = `Check that the language for this file is set in Atom, that you have a Jupyter kernel installed for it, and that you have configured the language mapping in Hydrogen preferences.${pythonDescription}`;
                atom.notifications.addError(message, {
                    description,
                    dismissable: pythonDescription !== "",
                });
                return;
            }
            this.startKernel(kernelSpec, grammar, editor, filePath, onStarted);
        });
    }
    startKernel(kernelSpec, grammar, editor, filePath, onStarted) {
        const displayName = kernelSpec.display_name;
        if (store_1.default.startingKernels.get(displayName)) {
            return;
        }
        store_1.default.startKernel(displayName);
        const currentPath = utils_1.getEditorDirectory(editor);
        let projectPath;
        utils_1.log("KernelManager: startKernel:", displayName);
        switch (atom.config.get("Hydrogen.startDir")) {
            case "firstProjectDir":
                projectPath = atom.project.getPaths()[0];
                break;
            case "projectDirOfFile":
                projectPath = atom.project.relativizePath(currentPath)[0];
                break;
        }
        const kernelStartDir = projectPath != null ? projectPath : currentPath;
        const options = {
            cwd: kernelStartDir,
            stdio: ["ignore", "pipe", "pipe"],
        };
        const transport = new zmq_kernel_1.default(kernelSpec, grammar, options, () => {
            const kernel = new kernel_1.default(transport);
            store_1.default.newKernel(kernel, filePath, editor, grammar);
            if (onStarted) {
                onStarted(kernel);
            }
        });
    }
    async update() {
        const kernelSpecs = await kernelspecs_1.findAll();
        const kernelResourcesDict = mapKeys_1.default(kernelSpecs, function (value, key) {
            return (value.spec.name = key);
        });
        this.kernelSpecs = sortBy_1.default(map_1.default(kernelResourcesDict, "spec"), (spec) => spec.display_name);
        return this.kernelSpecs;
    }
    async getAllKernelSpecs(grammar) {
        if (this.kernelSpecs) {
            return this.kernelSpecs;
        }
        return this.updateKernelSpecs(grammar);
    }
    async getAllKernelSpecsForGrammar(grammar) {
        if (!grammar) {
            return [];
        }
        const kernelSpecs = await this.getAllKernelSpecs(grammar);
        return kernelSpecs.filter((spec) => utils_1.kernelSpecProvidesGrammar(spec, grammar));
    }
    async getKernelSpecForGrammar(grammar) {
        const kernelSpecs = await this.getAllKernelSpecsForGrammar(grammar);
        if (kernelSpecs.length <= 1) {
            return kernelSpecs[0];
        }
        if (this.kernelPicker) {
            this.kernelPicker.kernelSpecs = kernelSpecs;
        }
        else {
            this.kernelPicker = new kernel_picker_1.default(kernelSpecs);
        }
        return new Promise((resolve) => {
            if (!this.kernelPicker) {
                return resolve(null);
            }
            this.kernelPicker.onConfirmed = (kernelSpec) => resolve(kernelSpec);
            this.kernelPicker.toggle();
        });
    }
    async updateKernelSpecs(grammar) {
        const kernelSpecs = await this.update();
        if (kernelSpecs.length === 0) {
            const message = "No Kernels Installed";
            const options = {
                description: "No kernels are installed on your system so you will not be able to execute code in any language.",
                dismissable: true,
                buttons: [
                    {
                        text: "Install Instructions",
                        onDidClick: () => electron_1.shell.openExternal("https://nteract.gitbooks.io/hydrogen/docs/Installation.html"),
                    },
                    {
                        text: "Popular Kernels",
                        onDidClick: () => electron_1.shell.openExternal("https://nteract.io/kernels"),
                    },
                    {
                        text: "All Kernels",
                        onDidClick: () => electron_1.shell.openExternal("https://github.com/jupyter/jupyter/wiki/Jupyter-kernels"),
                    },
                ],
            };
            atom.notifications.addError(message, options);
        }
        else {
            const message = "Hydrogen Kernels updated:";
            const displayNames = map_1.default(kernelSpecs, "display_name");
            const options = {
                detail: displayNames.join("\n"),
            };
            atom.notifications.addInfo(message, options);
        }
        return kernelSpecs;
    }
}
exports.KernelManager = KernelManager;
if (atom.inSpecMode()) {
    exports.ks = require("kernelspecs");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIva2VybmVsLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EscURBQTZCO0FBQzdCLDZEQUFxQztBQUNyQywyREFBbUM7QUFDbkMsNkNBQTREO0FBQzVELHVDQUFpQztBQUNqQyw4REFBcUM7QUFDckMsc0RBQThCO0FBQzlCLG9FQUEyQztBQUMzQyxvREFBNEI7QUFDNUIsbUNBQTZFO0FBRzdFLE1BQWEsYUFBYTtJQUExQjtRQUNFLGdCQUFXLEdBQWlELElBQUksQ0FBQztJQXVLbkUsQ0FBQztJQXBLQyxjQUFjLENBQ1osT0FBZ0IsRUFDaEIsTUFBa0IsRUFDbEIsUUFBZ0IsRUFDaEIsU0FBbUM7UUFFbkMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQ3hELElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ2YsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQztnQkFDbEUsTUFBTSxpQkFBaUIsR0FDckIsT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztvQkFDMUMsQ0FBQyxDQUFDLCtJQUErSTtvQkFDakosQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDVCxNQUFNLFdBQVcsR0FBRyxvTEFBb0wsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNU4sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO29CQUNuQyxXQUFXO29CQUNYLFdBQVcsRUFBRSxpQkFBaUIsS0FBSyxFQUFFO2lCQUN0QyxDQUFDLENBQUM7Z0JBQ0gsT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7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QWtHO2dCQUNwRyxXQUFXLEVBQUUsSUFBSTtnQkFDakIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSxzQkFBc0I7d0JBQzVCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FDZixnQkFBSyxDQUFDLFlBQVksQ0FDaEIsNkRBQTZELENBQzlEO3FCQUNKO29CQUNEO3dCQUNFLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBSyxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQztxQkFDbkU7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLGFBQWE7d0JBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FDZixnQkFBSyxDQUFDLFlBQVksQ0FDaEIseURBQXlELENBQzFEO3FCQUNKO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMvQzthQUFNO1lBQ0wsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLENBQUM7WUFDNUMsTUFBTSxZQUFZLEdBQUcsYUFBRyxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN0RCxNQUFNLE9BQU8sR0FBRztnQkFDZCxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDaEMsQ0FBQztZQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM5QztRQUVELE9BQU8sV0FBVyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQXhLRCxzQ0F3S0M7QUFHRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRTtJQUNyQixPQUFPLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztDQUNyQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRleHRFZGl0b3IsIEdyYW1tYXIgfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgbWFwIGZyb20gXCJsb2Rhc2gvbWFwXCI7XHJcbmltcG9ydCBtYXBLZXlzIGZyb20gXCJsb2Rhc2gvbWFwS2V5c1wiO1xyXG5pbXBvcnQgc29ydEJ5IGZyb20gXCJsb2Rhc2gvc29ydEJ5XCI7XHJcbmltcG9ydCB7IGZpbmRBbGwgYXMga2VybmVsU3BlY3NGaW5kQWxsIH0gZnJvbSBcImtlcm5lbHNwZWNzXCI7XHJcbmltcG9ydCB7IHNoZWxsIH0gZnJvbSBcImVsZWN0cm9uXCI7XHJcbmltcG9ydCBaTVFLZXJuZWwgZnJvbSBcIi4vem1xLWtlcm5lbFwiO1xyXG5pbXBvcnQgS2VybmVsIGZyb20gXCIuL2tlcm5lbFwiO1xyXG5pbXBvcnQgS2VybmVsUGlja2VyIGZyb20gXCIuL2tlcm5lbC1waWNrZXJcIjtcclxuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XHJcbmltcG9ydCB7IGdldEVkaXRvckRpcmVjdG9yeSwga2VybmVsU3BlY1Byb3ZpZGVzR3JhbW1hciwgbG9nIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBLZXJuZWxNYW5hZ2VyIHtcclxuICBrZXJuZWxTcGVjczogQXJyYXk8S2VybmVsc3BlY01ldGFkYXRhPiB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xyXG4gIGtlcm5lbFBpY2tlcjogS2VybmVsUGlja2VyIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgc3RhcnRLZXJuZWxGb3IoXHJcbiAgICBncmFtbWFyOiBHcmFtbWFyLFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcclxuICAgIG9uU3RhcnRlZDogKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkXHJcbiAgKSB7XHJcbiAgICB0aGlzLmdldEtlcm5lbFNwZWNGb3JHcmFtbWFyKGdyYW1tYXIpLnRoZW4oKGtlcm5lbFNwZWMpID0+IHtcclxuICAgICAgaWYgKCFrZXJuZWxTcGVjKSB7XHJcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBObyBrZXJuZWwgZm9yIGdyYW1tYXIgXFxgJHtncmFtbWFyLm5hbWV9XFxgIGZvdW5kYDtcclxuICAgICAgICBjb25zdCBweXRob25EZXNjcmlwdGlvbiA9XHJcbiAgICAgICAgICBncmFtbWFyICYmIC9weXRob24vZy50ZXN0KGdyYW1tYXIuc2NvcGVOYW1lKVxyXG4gICAgICAgICAgICA/IFwiXFxuXFxuVG8gZGV0ZWN0IHlvdXIgY3VycmVudCBQeXRob24gaW5zdGFsbCB5b3Ugd2lsbCBuZWVkIHRvIHJ1bjo8cHJlPnB5dGhvbiAtbSBwaXAgaW5zdGFsbCBpcHlrZXJuZWxcXG5weXRob24gLW0gaXB5a2VybmVsIGluc3RhbGwgLS11c2VyPC9wcmU+XCJcclxuICAgICAgICAgICAgOiBcIlwiO1xyXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gYENoZWNrIHRoYXQgdGhlIGxhbmd1YWdlIGZvciB0aGlzIGZpbGUgaXMgc2V0IGluIEF0b20sIHRoYXQgeW91IGhhdmUgYSBKdXB5dGVyIGtlcm5lbCBpbnN0YWxsZWQgZm9yIGl0LCBhbmQgdGhhdCB5b3UgaGF2ZSBjb25maWd1cmVkIHRoZSBsYW5ndWFnZSBtYXBwaW5nIGluIEh5ZHJvZ2VuIHByZWZlcmVuY2VzLiR7cHl0aG9uRGVzY3JpcHRpb259YDtcclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSwge1xyXG4gICAgICAgICAgZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICBkaXNtaXNzYWJsZTogcHl0aG9uRGVzY3JpcHRpb24gIT09IFwiXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnN0YXJ0S2VybmVsKGtlcm5lbFNwZWMsIGdyYW1tYXIsIGVkaXRvciwgZmlsZVBhdGgsIG9uU3RhcnRlZCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHN0YXJ0S2VybmVsKFxyXG4gICAga2VybmVsU3BlYzogS2VybmVsc3BlY01ldGFkYXRhLFxyXG4gICAgZ3JhbW1hcjogR3JhbW1hcixcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICAgIGZpbGVQYXRoOiBzdHJpbmcsXHJcbiAgICBvblN0YXJ0ZWQ/OiAoKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkKSB8IG51bGwgfCB1bmRlZmluZWRcclxuICApIHtcclxuICAgIGNvbnN0IGRpc3BsYXlOYW1lID0ga2VybmVsU3BlYy5kaXNwbGF5X25hbWU7XHJcbiAgICAvLyBpZiBrZXJuZWwgc3RhcnR1cCBhbHJlYWR5IGluIHByb2dyZXNzIGRvbid0IHN0YXJ0IGFkZGl0aW9uYWwga2VybmVsXHJcbiAgICBpZiAoc3RvcmUuc3RhcnRpbmdLZXJuZWxzLmdldChkaXNwbGF5TmFtZSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc3RvcmUuc3RhcnRLZXJuZWwoZGlzcGxheU5hbWUpO1xyXG4gICAgY29uc3QgY3VycmVudFBhdGggPSBnZXRFZGl0b3JEaXJlY3RvcnkoZWRpdG9yKTtcclxuICAgIGxldCBwcm9qZWN0UGF0aDtcclxuICAgIGxvZyhcIktlcm5lbE1hbmFnZXI6IHN0YXJ0S2VybmVsOlwiLCBkaXNwbGF5TmFtZSk7XHJcblxyXG4gICAgc3dpdGNoIChhdG9tLmNvbmZpZy5nZXQoXCJIeWRyb2dlbi5zdGFydERpclwiKSkge1xyXG4gICAgICBjYXNlIFwiZmlyc3RQcm9qZWN0RGlyXCI6XHJcbiAgICAgICAgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgXCJwcm9qZWN0RGlyT2ZGaWxlXCI6XHJcbiAgICAgICAgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoY3VycmVudFBhdGgpWzBdO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGtlcm5lbFN0YXJ0RGlyID0gcHJvamVjdFBhdGggIT0gbnVsbCA/IHByb2plY3RQYXRoIDogY3VycmVudFBhdGg7XHJcbiAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICBjd2Q6IGtlcm5lbFN0YXJ0RGlyLFxyXG4gICAgICBzdGRpbzogW1wiaWdub3JlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXHJcbiAgICB9O1xyXG4gICAgY29uc3QgdHJhbnNwb3J0ID0gbmV3IFpNUUtlcm5lbChrZXJuZWxTcGVjLCBncmFtbWFyLCBvcHRpb25zLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGtlcm5lbCA9IG5ldyBLZXJuZWwodHJhbnNwb3J0KTtcclxuICAgICAgc3RvcmUubmV3S2VybmVsKGtlcm5lbCwgZmlsZVBhdGgsIGVkaXRvciwgZ3JhbW1hcik7XHJcbiAgICAgIGlmIChvblN0YXJ0ZWQpIHtcclxuICAgICAgICBvblN0YXJ0ZWQoa2VybmVsKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyB1cGRhdGUoKTogUHJvbWlzZTxLZXJuZWxzcGVjTWV0YWRhdGFbXT4ge1xyXG4gICAgY29uc3Qga2VybmVsU3BlY3MgPSBhd2FpdCBrZXJuZWxTcGVjc0ZpbmRBbGwoKTtcclxuXHJcbiAgICBjb25zdCBrZXJuZWxSZXNvdXJjZXNEaWN0ID0gbWFwS2V5cyhrZXJuZWxTcGVjcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcclxuICAgICAgcmV0dXJuICh2YWx1ZS5zcGVjLm5hbWUgPSBrZXkpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmtlcm5lbFNwZWNzID0gc29ydEJ5KFxyXG4gICAgICBtYXAoa2VybmVsUmVzb3VyY2VzRGljdCwgXCJzcGVjXCIpLFxyXG4gICAgICAoc3BlYykgPT4gc3BlYy5kaXNwbGF5X25hbWVcclxuICAgICk7XHJcbiAgICByZXR1cm4gdGhpcy5rZXJuZWxTcGVjcztcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldEFsbEtlcm5lbFNwZWNzKGdyYW1tYXI6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAodGhpcy5rZXJuZWxTcGVjcykge1xyXG4gICAgICByZXR1cm4gdGhpcy5rZXJuZWxTcGVjcztcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnVwZGF0ZUtlcm5lbFNwZWNzKGdyYW1tYXIpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0QWxsS2VybmVsU3BlY3NGb3JHcmFtbWFyKFxyXG4gICAgZ3JhbW1hcjogR3JhbW1hciB8IG51bGwgfCB1bmRlZmluZWRcclxuICApOiBQcm9taXNlPEtlcm5lbHNwZWNNZXRhZGF0YVtdPiB7XHJcbiAgICBpZiAoIWdyYW1tYXIpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgY29uc3Qga2VybmVsU3BlY3MgPSBhd2FpdCB0aGlzLmdldEFsbEtlcm5lbFNwZWNzKGdyYW1tYXIpO1xyXG4gICAgcmV0dXJuIGtlcm5lbFNwZWNzLmZpbHRlcigoc3BlYykgPT5cclxuICAgICAga2VybmVsU3BlY1Byb3ZpZGVzR3JhbW1hcihzcGVjLCBncmFtbWFyKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldEtlcm5lbFNwZWNGb3JHcmFtbWFyKGdyYW1tYXI6IEdyYW1tYXIpIHtcclxuICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gYXdhaXQgdGhpcy5nZXRBbGxLZXJuZWxTcGVjc0ZvckdyYW1tYXIoZ3JhbW1hcik7XHJcblxyXG4gICAgaWYgKGtlcm5lbFNwZWNzLmxlbmd0aCA8PSAxKSB7XHJcbiAgICAgIHJldHVybiBrZXJuZWxTcGVjc1swXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5rZXJuZWxQaWNrZXIpIHtcclxuICAgICAgdGhpcy5rZXJuZWxQaWNrZXIua2VybmVsU3BlY3MgPSBrZXJuZWxTcGVjcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMua2VybmVsUGlja2VyID0gbmV3IEtlcm5lbFBpY2tlcihrZXJuZWxTcGVjcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEtlcm5lbHNwZWNNZXRhZGF0YT4oKHJlc29sdmUpID0+IHtcclxuICAgICAgaWYgKCF0aGlzLmtlcm5lbFBpY2tlcikge1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKG51bGwpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmtlcm5lbFBpY2tlci5vbkNvbmZpcm1lZCA9IChrZXJuZWxTcGVjKSA9PiByZXNvbHZlKGtlcm5lbFNwZWMpO1xyXG5cclxuICAgICAgdGhpcy5rZXJuZWxQaWNrZXIudG9nZ2xlKCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHVwZGF0ZUtlcm5lbFNwZWNzKGdyYW1tYXI/OiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3Qga2VybmVsU3BlY3MgPSBhd2FpdCB0aGlzLnVwZGF0ZSgpO1xyXG5cclxuICAgIGlmIChrZXJuZWxTcGVjcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgY29uc3QgbWVzc2FnZSA9IFwiTm8gS2VybmVscyBJbnN0YWxsZWRcIjtcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgIFwiTm8ga2VybmVscyBhcmUgaW5zdGFsbGVkIG9uIHlvdXIgc3lzdGVtIHNvIHlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGV4ZWN1dGUgY29kZSBpbiBhbnkgbGFuZ3VhZ2UuXCIsXHJcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXHJcbiAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0ZXh0OiBcIkluc3RhbGwgSW5zdHJ1Y3Rpb25zXCIsXHJcbiAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+XHJcbiAgICAgICAgICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFxyXG4gICAgICAgICAgICAgICAgXCJodHRwczovL250ZXJhY3QuZ2l0Ym9va3MuaW8vaHlkcm9nZW4vZG9jcy9JbnN0YWxsYXRpb24uaHRtbFwiXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHRleHQ6IFwiUG9wdWxhciBLZXJuZWxzXCIsXHJcbiAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHNoZWxsLm9wZW5FeHRlcm5hbChcImh0dHBzOi8vbnRlcmFjdC5pby9rZXJuZWxzXCIpLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdGV4dDogXCJBbGwgS2VybmVsc1wiLFxyXG4gICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PlxyXG4gICAgICAgICAgICAgIHNoZWxsLm9wZW5FeHRlcm5hbChcclxuICAgICAgICAgICAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL2p1cHl0ZXIvanVweXRlci93aWtpL0p1cHl0ZXIta2VybmVsc1wiXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfTtcclxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgbWVzc2FnZSA9IFwiSHlkcm9nZW4gS2VybmVscyB1cGRhdGVkOlwiO1xyXG4gICAgICBjb25zdCBkaXNwbGF5TmFtZXMgPSBtYXAoa2VybmVsU3BlY3MsIFwiZGlzcGxheV9uYW1lXCIpOyAvLyBrZXJuZWxTcGVjcy5tYXAoKGtlcm5lbFNwZWMpID0+IGtlcm5lbFNwZWMuZGlzcGxheV9uYW1lKVxyXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgIGRldGFpbDogZGlzcGxheU5hbWVzLmpvaW4oXCJcXG5cIiksXHJcbiAgICAgIH07XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBrZXJuZWxTcGVjcztcclxuICB9XHJcbn1cclxuXHJcbi8vIHVzZWQgaW4gdGhlIHRlc3RzXHJcbmlmIChhdG9tLmluU3BlY01vZGUoKSkge1xyXG4gIGV4cG9ydHMua3MgPSByZXF1aXJlKFwia2VybmVsc3BlY3NcIik7XHJcbn1cclxuIl19