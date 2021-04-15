"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KernelManager = void 0;
const lodash_1 = __importDefault(require("lodash"));
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
        this.kernelSpecs = lodash_1.default.sortBy(lodash_1.default.map(lodash_1.default.mapKeys(kernelSpecs, function (value, key) {
            return (value.spec.name = key);
        }), "spec"), (spec) => spec.display_name);
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
            const options = {
                detail: lodash_1.default.map(kernelSpecs, "display_name").join("\n"),
            };
            atom.notifications.addInfo(message, options);
        }
        return kernelSpecs;
    }
}
exports.KernelManager = KernelManager;
exports.default = new KernelManager();
if (atom.inSpecMode()) {
    exports.ks = require("kernelspecs");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIva2VybmVsLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0Esb0RBQXVCO0FBQ3ZCLDZDQUE0RDtBQUM1RCx1Q0FBaUM7QUFDakMsOERBQXFDO0FBQ3JDLHNEQUE4QjtBQUM5QixvRUFBMkM7QUFDM0Msb0RBQTRCO0FBQzVCLG1DQUE2RTtBQUk3RSxNQUFhLGFBQWE7SUFBMUI7UUFDRSxnQkFBVyxHQUFpRCxJQUFJLENBQUM7SUF1S25FLENBQUM7SUFwS0MsY0FBYyxDQUNaLE9BQWdCLEVBQ2hCLE1BQWtCLEVBQ2xCLFFBQWdCLEVBQ2hCLFNBQW1DO1FBRW5DLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUN4RCxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNmLE1BQU0sT0FBTyxHQUFHLDJCQUEyQixPQUFPLENBQUMsSUFBSSxVQUFVLENBQUM7Z0JBQ2xFLE1BQU0saUJBQWlCLEdBQ3JCLE9BQU8sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7b0JBQzFDLENBQUMsQ0FBQywrSUFBK0k7b0JBQ2pKLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ1QsTUFBTSxXQUFXLEdBQUcsb0xBQW9MLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVOLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtvQkFDbkMsV0FBVztvQkFDWCxXQUFXLEVBQUUsaUJBQWlCLEtBQUssRUFBRTtpQkFDdEMsQ0FBQyxDQUFDO2dCQUNILE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLENBQUMsQ0FBQyxDQUFDO0lBQ0ws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akIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSxzQkFBc0I7d0JBQzVCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FDZixnQkFBSyxDQUFDLFlBQVksQ0FDaEIsNkRBQTZELENBQzlEO3FCQUNKO29CQUNEO3dCQUNFLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBSyxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQztxQkFDbkU7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLGFBQWE7d0JBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FDZixnQkFBSyxDQUFDLFlBQVksQ0FDaEIseURBQXlELENBQzFEO3FCQUNKO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMvQzthQUFNO1lBQ0wsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLENBQUM7WUFDNUMsTUFBTSxPQUFPLEdBQUc7Z0JBQ2QsTUFBTSxFQUFFLGdCQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ3RELENBQUM7WUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDOUM7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUF4S0Qsc0NBd0tDO0FBQ0Qsa0JBQWUsSUFBSSxhQUFhLEVBQUUsQ0FBQztBQUduQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRTtJQUNyQixPQUFPLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztDQUNyQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRleHRFZGl0b3IsIEdyYW1tYXIgfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7IGZpbmRBbGwgYXMga2VybmVsU3BlY3NGaW5kQWxsIH0gZnJvbSBcImtlcm5lbHNwZWNzXCI7XHJcbmltcG9ydCB7IHNoZWxsIH0gZnJvbSBcImVsZWN0cm9uXCI7XHJcbmltcG9ydCBaTVFLZXJuZWwgZnJvbSBcIi4vem1xLWtlcm5lbFwiO1xyXG5pbXBvcnQgS2VybmVsIGZyb20gXCIuL2tlcm5lbFwiO1xyXG5pbXBvcnQgS2VybmVsUGlja2VyIGZyb20gXCIuL2tlcm5lbC1waWNrZXJcIjtcclxuaW1wb3J0IHN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XHJcbmltcG9ydCB7IGdldEVkaXRvckRpcmVjdG9yeSwga2VybmVsU3BlY1Byb3ZpZGVzR3JhbW1hciwgbG9nIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHR5cGUgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vem1xLWtlcm5lbFwiO1xyXG5pbXBvcnQgdHlwZSB7IEtlcm5lbHNwZWNNZXRhZGF0YSB9IGZyb20gXCJAbnRlcmFjdC90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEtlcm5lbE1hbmFnZXIge1xyXG4gIGtlcm5lbFNwZWNzOiBBcnJheTxLZXJuZWxzcGVjTWV0YWRhdGE+IHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7XHJcbiAga2VybmVsUGlja2VyOiBLZXJuZWxQaWNrZXIgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBzdGFydEtlcm5lbEZvcihcclxuICAgIGdyYW1tYXI6IEdyYW1tYXIsXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgICBmaWxlUGF0aDogc3RyaW5nLFxyXG4gICAgb25TdGFydGVkOiAoa2VybmVsOiBLZXJuZWwpID0+IHZvaWRcclxuICApIHtcclxuICAgIHRoaXMuZ2V0S2VybmVsU3BlY0ZvckdyYW1tYXIoZ3JhbW1hcikudGhlbigoa2VybmVsU3BlYykgPT4ge1xyXG4gICAgICBpZiAoIWtlcm5lbFNwZWMpIHtcclxuICAgICAgICBjb25zdCBtZXNzYWdlID0gYE5vIGtlcm5lbCBmb3IgZ3JhbW1hciBcXGAke2dyYW1tYXIubmFtZX1cXGAgZm91bmRgO1xyXG4gICAgICAgIGNvbnN0IHB5dGhvbkRlc2NyaXB0aW9uID1cclxuICAgICAgICAgIGdyYW1tYXIgJiYgL3B5dGhvbi9nLnRlc3QoZ3JhbW1hci5zY29wZU5hbWUpXHJcbiAgICAgICAgICAgID8gXCJcXG5cXG5UbyBkZXRlY3QgeW91ciBjdXJyZW50IFB5dGhvbiBpbnN0YWxsIHlvdSB3aWxsIG5lZWQgdG8gcnVuOjxwcmU+cHl0aG9uIC1tIHBpcCBpbnN0YWxsIGlweWtlcm5lbFxcbnB5dGhvbiAtbSBpcHlrZXJuZWwgaW5zdGFsbCAtLXVzZXI8L3ByZT5cIlxyXG4gICAgICAgICAgICA6IFwiXCI7XHJcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBgQ2hlY2sgdGhhdCB0aGUgbGFuZ3VhZ2UgZm9yIHRoaXMgZmlsZSBpcyBzZXQgaW4gQXRvbSwgdGhhdCB5b3UgaGF2ZSBhIEp1cHl0ZXIga2VybmVsIGluc3RhbGxlZCBmb3IgaXQsIGFuZCB0aGF0IHlvdSBoYXZlIGNvbmZpZ3VyZWQgdGhlIGxhbmd1YWdlIG1hcHBpbmcgaW4gSHlkcm9nZW4gcHJlZmVyZW5jZXMuJHtweXRob25EZXNjcmlwdGlvbn1gO1xyXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlLCB7XHJcbiAgICAgICAgICBkZXNjcmlwdGlvbixcclxuICAgICAgICAgIGRpc21pc3NhYmxlOiBweXRob25EZXNjcmlwdGlvbiAhPT0gXCJcIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuc3RhcnRLZXJuZWwoa2VybmVsU3BlYywgZ3JhbW1hciwgZWRpdG9yLCBmaWxlUGF0aCwgb25TdGFydGVkKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc3RhcnRLZXJuZWwoXHJcbiAgICBrZXJuZWxTcGVjOiBLZXJuZWxzcGVjTWV0YWRhdGEsXHJcbiAgICBncmFtbWFyOiBHcmFtbWFyLFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcclxuICAgIG9uU3RhcnRlZD86ICgoa2VybmVsOiBLZXJuZWwpID0+IHZvaWQpIHwgbnVsbCB8IHVuZGVmaW5lZFxyXG4gICkge1xyXG4gICAgY29uc3QgZGlzcGxheU5hbWUgPSBrZXJuZWxTcGVjLmRpc3BsYXlfbmFtZTtcclxuICAgIC8vIGlmIGtlcm5lbCBzdGFydHVwIGFscmVhZHkgaW4gcHJvZ3Jlc3MgZG9uJ3Qgc3RhcnQgYWRkaXRpb25hbCBrZXJuZWxcclxuICAgIGlmIChzdG9yZS5zdGFydGluZ0tlcm5lbHMuZ2V0KGRpc3BsYXlOYW1lKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBzdG9yZS5zdGFydEtlcm5lbChkaXNwbGF5TmFtZSk7XHJcbiAgICBjb25zdCBjdXJyZW50UGF0aCA9IGdldEVkaXRvckRpcmVjdG9yeShlZGl0b3IpO1xyXG4gICAgbGV0IHByb2plY3RQYXRoO1xyXG4gICAgbG9nKFwiS2VybmVsTWFuYWdlcjogc3RhcnRLZXJuZWw6XCIsIGRpc3BsYXlOYW1lKTtcclxuXHJcbiAgICBzd2l0Y2ggKGF0b20uY29uZmlnLmdldChcIkh5ZHJvZ2VuLnN0YXJ0RGlyXCIpKSB7XHJcbiAgICAgIGNhc2UgXCJmaXJzdFByb2plY3REaXJcIjpcclxuICAgICAgICBwcm9qZWN0UGF0aCA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBcInByb2plY3REaXJPZkZpbGVcIjpcclxuICAgICAgICBwcm9qZWN0UGF0aCA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChjdXJyZW50UGF0aClbMF07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qga2VybmVsU3RhcnREaXIgPSBwcm9qZWN0UGF0aCAhPSBudWxsID8gcHJvamVjdFBhdGggOiBjdXJyZW50UGF0aDtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgIGN3ZDoga2VybmVsU3RhcnREaXIsXHJcbiAgICAgIHN0ZGlvOiBbXCJpZ25vcmVcIiwgXCJwaXBlXCIsIFwicGlwZVwiXSxcclxuICAgIH07XHJcbiAgICBjb25zdCB0cmFuc3BvcnQgPSBuZXcgWk1RS2VybmVsKGtlcm5lbFNwZWMsIGdyYW1tYXIsIG9wdGlvbnMsICgpID0+IHtcclxuICAgICAgY29uc3Qga2VybmVsID0gbmV3IEtlcm5lbCh0cmFuc3BvcnQpO1xyXG4gICAgICBzdG9yZS5uZXdLZXJuZWwoa2VybmVsLCBmaWxlUGF0aCwgZWRpdG9yLCBncmFtbWFyKTtcclxuICAgICAgaWYgKG9uU3RhcnRlZCkge1xyXG4gICAgICAgIG9uU3RhcnRlZChrZXJuZWwpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHVwZGF0ZSgpOiBQcm9taXNlPEtlcm5lbHNwZWNNZXRhZGF0YVtdPiB7XHJcbiAgICBjb25zdCBrZXJuZWxTcGVjcyA9IGF3YWl0IGtlcm5lbFNwZWNzRmluZEFsbCgpO1xyXG4gICAgdGhpcy5rZXJuZWxTcGVjcyA9IF8uc29ydEJ5KFxyXG4gICAgICBfLm1hcChcclxuICAgICAgICBfLm1hcEtleXMoa2VybmVsU3BlY3MsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgICByZXR1cm4gKHZhbHVlLnNwZWMubmFtZSA9IGtleSk7XHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgXCJzcGVjXCJcclxuICAgICAgKSxcclxuICAgICAgKHNwZWMpID0+IHNwZWMuZGlzcGxheV9uYW1lXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHRoaXMua2VybmVsU3BlY3M7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRBbGxLZXJuZWxTcGVjcyhncmFtbWFyOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKHRoaXMua2VybmVsU3BlY3MpIHtcclxuICAgICAgcmV0dXJuIHRoaXMua2VybmVsU3BlY3M7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy51cGRhdGVLZXJuZWxTcGVjcyhncmFtbWFyKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldEFsbEtlcm5lbFNwZWNzRm9yR3JhbW1hcihcclxuICAgIGdyYW1tYXI6IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxLZXJuZWxzcGVjTWV0YWRhdGFbXT4ge1xyXG4gICAgaWYgKCFncmFtbWFyKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gYXdhaXQgdGhpcy5nZXRBbGxLZXJuZWxTcGVjcyhncmFtbWFyKTtcclxuICAgIHJldHVybiBrZXJuZWxTcGVjcy5maWx0ZXIoKHNwZWMpID0+XHJcbiAgICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoc3BlYywgZ3JhbW1hcilcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRLZXJuZWxTcGVjRm9yR3JhbW1hcihncmFtbWFyOiBHcmFtbWFyKSB7XHJcbiAgICBjb25zdCBrZXJuZWxTcGVjcyA9IGF3YWl0IHRoaXMuZ2V0QWxsS2VybmVsU3BlY3NGb3JHcmFtbWFyKGdyYW1tYXIpO1xyXG5cclxuICAgIGlmIChrZXJuZWxTcGVjcy5sZW5ndGggPD0gMSkge1xyXG4gICAgICByZXR1cm4ga2VybmVsU3BlY3NbMF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMua2VybmVsUGlja2VyKSB7XHJcbiAgICAgIHRoaXMua2VybmVsUGlja2VyLmtlcm5lbFNwZWNzID0ga2VybmVsU3BlY3M7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmtlcm5lbFBpY2tlciA9IG5ldyBLZXJuZWxQaWNrZXIoa2VybmVsU3BlY3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxLZXJuZWxzcGVjTWV0YWRhdGE+KChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIGlmICghdGhpcy5rZXJuZWxQaWNrZXIpIHtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZShudWxsKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5rZXJuZWxQaWNrZXIub25Db25maXJtZWQgPSAoa2VybmVsU3BlYykgPT4gcmVzb2x2ZShrZXJuZWxTcGVjKTtcclxuXHJcbiAgICAgIHRoaXMua2VybmVsUGlja2VyLnRvZ2dsZSgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyB1cGRhdGVLZXJuZWxTcGVjcyhncmFtbWFyOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3Qga2VybmVsU3BlY3MgPSBhd2FpdCB0aGlzLnVwZGF0ZSgpO1xyXG5cclxuICAgIGlmIChrZXJuZWxTcGVjcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgY29uc3QgbWVzc2FnZSA9IFwiTm8gS2VybmVscyBJbnN0YWxsZWRcIjtcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgIFwiTm8ga2VybmVscyBhcmUgaW5zdGFsbGVkIG9uIHlvdXIgc3lzdGVtIHNvIHlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGV4ZWN1dGUgY29kZSBpbiBhbnkgbGFuZ3VhZ2UuXCIsXHJcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXHJcbiAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0ZXh0OiBcIkluc3RhbGwgSW5zdHJ1Y3Rpb25zXCIsXHJcbiAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+XHJcbiAgICAgICAgICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFxyXG4gICAgICAgICAgICAgICAgXCJodHRwczovL250ZXJhY3QuZ2l0Ym9va3MuaW8vaHlkcm9nZW4vZG9jcy9JbnN0YWxsYXRpb24uaHRtbFwiXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHRleHQ6IFwiUG9wdWxhciBLZXJuZWxzXCIsXHJcbiAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHNoZWxsLm9wZW5FeHRlcm5hbChcImh0dHBzOi8vbnRlcmFjdC5pby9rZXJuZWxzXCIpLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdGV4dDogXCJBbGwgS2VybmVsc1wiLFxyXG4gICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PlxyXG4gICAgICAgICAgICAgIHNoZWxsLm9wZW5FeHRlcm5hbChcclxuICAgICAgICAgICAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL2p1cHl0ZXIvanVweXRlci93aWtpL0p1cHl0ZXIta2VybmVsc1wiXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfTtcclxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgbWVzc2FnZSA9IFwiSHlkcm9nZW4gS2VybmVscyB1cGRhdGVkOlwiO1xyXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgIGRldGFpbDogXy5tYXAoa2VybmVsU3BlY3MsIFwiZGlzcGxheV9uYW1lXCIpLmpvaW4oXCJcXG5cIiksXHJcbiAgICAgIH07XHJcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBrZXJuZWxTcGVjcztcclxuICB9XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgbmV3IEtlcm5lbE1hbmFnZXIoKTtcclxuXHJcbi8vIHVzZWQgaW4gdGhlIHRlc3RzXHJcbmlmIChhdG9tLmluU3BlY01vZGUoKSkge1xyXG4gIGV4cG9ydHMua3MgPSByZXF1aXJlKFwia2VybmVsc3BlY3NcIik7XHJcbn1cclxuIl19