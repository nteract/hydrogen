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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIva2VybmVsLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0Esb0RBQXVCO0FBQ3ZCLDZDQUE0RDtBQUM1RCx1Q0FBaUM7QUFDakMsOERBQXFDO0FBQ3JDLHNEQUE4QjtBQUM5QixvRUFBMkM7QUFDM0Msb0RBQTRCO0FBQzVCLG1DQUE2RTtBQUk3RSxNQUFhLGFBQWE7SUFBMUI7UUFDRSxnQkFBVyxHQUFpRCxJQUFJLENBQUM7SUF1S25FLENBQUM7SUFwS0MsY0FBYyxDQUNaLE9BQWdCLEVBQ2hCLE1BQWtCLEVBQ2xCLFFBQWdCLEVBQ2hCLFNBQW1DO1FBRW5DLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUN4RCxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNmLE1BQU0sT0FBTyxHQUFHLDJCQUEyQixPQUFPLENBQUMsSUFBSSxVQUFVLENBQUM7Z0JBQ2xFLE1BQU0saUJBQWlCLEdBQ3JCLE9BQU8sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7b0JBQzFDLENBQUMsQ0FBQywrSUFBK0k7b0JBQ2pKLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ1QsTUFBTSxXQUFXLEdBQUcsb0xBQW9MLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVOLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtvQkFDbkMsV0FBVztvQkFDWCxXQUFXLEVBQUUsaUJBQWlCLEtBQUssRUFBRTtpQkFDdEMsQ0FBQyxDQUFDO2dCQUNILE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLENBQUMsQ0FBQyxDQUFDO0lBQ0ws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akIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSxzQkFBc0I7d0JBQzVCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FDZixnQkFBSyxDQUFDLFlBQVksQ0FDaEIsNkRBQTZELENBQzlEO3FCQUNKO29CQUNEO3dCQUNFLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBSyxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQztxQkFDbkU7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLGFBQWE7d0JBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FDZixnQkFBSyxDQUFDLFlBQVksQ0FDaEIseURBQXlELENBQzFEO3FCQUNKO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMvQzthQUFNO1lBQ0wsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLENBQUM7WUFDNUMsTUFBTSxPQUFPLEdBQUc7Z0JBQ2QsTUFBTSxFQUFFLGdCQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ3RELENBQUM7WUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDOUM7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUF4S0Qsc0NBd0tDO0FBQ0Qsa0JBQWUsSUFBSSxhQUFhLEVBQUUsQ0FBQztBQUduQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRTtJQUNyQixPQUFPLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztDQUNyQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRleHRFZGl0b3IsIEdyYW1tYXIgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgZmluZEFsbCBhcyBrZXJuZWxTcGVjc0ZpbmRBbGwgfSBmcm9tIFwia2VybmVsc3BlY3NcIjtcbmltcG9ydCB7IHNoZWxsIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgWk1RS2VybmVsIGZyb20gXCIuL3ptcS1rZXJuZWxcIjtcbmltcG9ydCBLZXJuZWwgZnJvbSBcIi4va2VybmVsXCI7XG5pbXBvcnQgS2VybmVsUGlja2VyIGZyb20gXCIuL2tlcm5lbC1waWNrZXJcIjtcbmltcG9ydCBzdG9yZSBmcm9tIFwiLi9zdG9yZVwiO1xuaW1wb3J0IHsgZ2V0RWRpdG9yRGlyZWN0b3J5LCBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyLCBsb2cgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vem1xLWtlcm5lbFwiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEtlcm5lbE1hbmFnZXIge1xuICBrZXJuZWxTcGVjczogQXJyYXk8S2VybmVsc3BlY01ldGFkYXRhPiB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xuICBrZXJuZWxQaWNrZXI6IEtlcm5lbFBpY2tlciB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgc3RhcnRLZXJuZWxGb3IoXG4gICAgZ3JhbW1hcjogR3JhbW1hcixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICBvblN0YXJ0ZWQ6IChrZXJuZWw6IEtlcm5lbCkgPT4gdm9pZFxuICApIHtcbiAgICB0aGlzLmdldEtlcm5lbFNwZWNGb3JHcmFtbWFyKGdyYW1tYXIpLnRoZW4oKGtlcm5lbFNwZWMpID0+IHtcbiAgICAgIGlmICgha2VybmVsU3BlYykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gYE5vIGtlcm5lbCBmb3IgZ3JhbW1hciBcXGAke2dyYW1tYXIubmFtZX1cXGAgZm91bmRgO1xuICAgICAgICBjb25zdCBweXRob25EZXNjcmlwdGlvbiA9XG4gICAgICAgICAgZ3JhbW1hciAmJiAvcHl0aG9uL2cudGVzdChncmFtbWFyLnNjb3BlTmFtZSlcbiAgICAgICAgICAgID8gXCJcXG5cXG5UbyBkZXRlY3QgeW91ciBjdXJyZW50IFB5dGhvbiBpbnN0YWxsIHlvdSB3aWxsIG5lZWQgdG8gcnVuOjxwcmU+cHl0aG9uIC1tIHBpcCBpbnN0YWxsIGlweWtlcm5lbFxcbnB5dGhvbiAtbSBpcHlrZXJuZWwgaW5zdGFsbCAtLXVzZXI8L3ByZT5cIlxuICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGBDaGVjayB0aGF0IHRoZSBsYW5ndWFnZSBmb3IgdGhpcyBmaWxlIGlzIHNldCBpbiBBdG9tLCB0aGF0IHlvdSBoYXZlIGEgSnVweXRlciBrZXJuZWwgaW5zdGFsbGVkIGZvciBpdCwgYW5kIHRoYXQgeW91IGhhdmUgY29uZmlndXJlZCB0aGUgbGFuZ3VhZ2UgbWFwcGluZyBpbiBIeWRyb2dlbiBwcmVmZXJlbmNlcy4ke3B5dGhvbkRlc2NyaXB0aW9ufWA7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlLCB7XG4gICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHB5dGhvbkRlc2NyaXB0aW9uICE9PSBcIlwiLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YXJ0S2VybmVsKGtlcm5lbFNwZWMsIGdyYW1tYXIsIGVkaXRvciwgZmlsZVBhdGgsIG9uU3RhcnRlZCk7XG4gICAgfSk7XG4gIH1cblxuICBzdGFydEtlcm5lbChcbiAgICBrZXJuZWxTcGVjOiBLZXJuZWxzcGVjTWV0YWRhdGEsXG4gICAgZ3JhbW1hcjogR3JhbW1hcixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICBvblN0YXJ0ZWQ/OiAoKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkKSB8IG51bGwgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgY29uc3QgZGlzcGxheU5hbWUgPSBrZXJuZWxTcGVjLmRpc3BsYXlfbmFtZTtcbiAgICAvLyBpZiBrZXJuZWwgc3RhcnR1cCBhbHJlYWR5IGluIHByb2dyZXNzIGRvbid0IHN0YXJ0IGFkZGl0aW9uYWwga2VybmVsXG4gICAgaWYgKHN0b3JlLnN0YXJ0aW5nS2VybmVscy5nZXQoZGlzcGxheU5hbWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0b3JlLnN0YXJ0S2VybmVsKGRpc3BsYXlOYW1lKTtcbiAgICBjb25zdCBjdXJyZW50UGF0aCA9IGdldEVkaXRvckRpcmVjdG9yeShlZGl0b3IpO1xuICAgIGxldCBwcm9qZWN0UGF0aDtcbiAgICBsb2coXCJLZXJuZWxNYW5hZ2VyOiBzdGFydEtlcm5lbDpcIiwgZGlzcGxheU5hbWUpO1xuXG4gICAgc3dpdGNoIChhdG9tLmNvbmZpZy5nZXQoXCJIeWRyb2dlbi5zdGFydERpclwiKSkge1xuICAgICAgY2FzZSBcImZpcnN0UHJvamVjdERpclwiOlxuICAgICAgICBwcm9qZWN0UGF0aCA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcInByb2plY3REaXJPZkZpbGVcIjpcbiAgICAgICAgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoY3VycmVudFBhdGgpWzBdO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBrZXJuZWxTdGFydERpciA9IHByb2plY3RQYXRoICE9IG51bGwgPyBwcm9qZWN0UGF0aCA6IGN1cnJlbnRQYXRoO1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICBjd2Q6IGtlcm5lbFN0YXJ0RGlyLFxuICAgICAgc3RkaW86IFtcImlnbm9yZVwiLCBcInBpcGVcIiwgXCJwaXBlXCJdLFxuICAgIH07XG4gICAgY29uc3QgdHJhbnNwb3J0ID0gbmV3IFpNUUtlcm5lbChrZXJuZWxTcGVjLCBncmFtbWFyLCBvcHRpb25zLCAoKSA9PiB7XG4gICAgICBjb25zdCBrZXJuZWwgPSBuZXcgS2VybmVsKHRyYW5zcG9ydCk7XG4gICAgICBzdG9yZS5uZXdLZXJuZWwoa2VybmVsLCBmaWxlUGF0aCwgZWRpdG9yLCBncmFtbWFyKTtcbiAgICAgIGlmIChvblN0YXJ0ZWQpIHtcbiAgICAgICAgb25TdGFydGVkKGtlcm5lbCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoKTogUHJvbWlzZTxLZXJuZWxzcGVjTWV0YWRhdGFbXT4ge1xuICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gYXdhaXQga2VybmVsU3BlY3NGaW5kQWxsKCk7XG4gICAgdGhpcy5rZXJuZWxTcGVjcyA9IF8uc29ydEJ5KFxuICAgICAgXy5tYXAoXG4gICAgICAgIF8ubWFwS2V5cyhrZXJuZWxTcGVjcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICByZXR1cm4gKHZhbHVlLnNwZWMubmFtZSA9IGtleSk7XG4gICAgICAgIH0pLFxuICAgICAgICBcInNwZWNcIlxuICAgICAgKSxcbiAgICAgIChzcGVjKSA9PiBzcGVjLmRpc3BsYXlfbmFtZVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXMua2VybmVsU3BlY3M7XG4gIH1cblxuICBhc3luYyBnZXRBbGxLZXJuZWxTcGVjcyhncmFtbWFyOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmICh0aGlzLmtlcm5lbFNwZWNzKSB7XG4gICAgICByZXR1cm4gdGhpcy5rZXJuZWxTcGVjcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlS2VybmVsU3BlY3MoZ3JhbW1hcik7XG4gIH1cblxuICBhc3luYyBnZXRBbGxLZXJuZWxTcGVjc0ZvckdyYW1tYXIoXG4gICAgZ3JhbW1hcjogR3JhbW1hciB8IG51bGwgfCB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxLZXJuZWxzcGVjTWV0YWRhdGFbXT4ge1xuICAgIGlmICghZ3JhbW1hcikge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBrZXJuZWxTcGVjcyA9IGF3YWl0IHRoaXMuZ2V0QWxsS2VybmVsU3BlY3MoZ3JhbW1hcik7XG4gICAgcmV0dXJuIGtlcm5lbFNwZWNzLmZpbHRlcigoc3BlYykgPT5cbiAgICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoc3BlYywgZ3JhbW1hcilcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0S2VybmVsU3BlY0ZvckdyYW1tYXIoZ3JhbW1hcjogR3JhbW1hcikge1xuICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gYXdhaXQgdGhpcy5nZXRBbGxLZXJuZWxTcGVjc0ZvckdyYW1tYXIoZ3JhbW1hcik7XG5cbiAgICBpZiAoa2VybmVsU3BlY3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHJldHVybiBrZXJuZWxTcGVjc1swXTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5rZXJuZWxQaWNrZXIpIHtcbiAgICAgIHRoaXMua2VybmVsUGlja2VyLmtlcm5lbFNwZWNzID0ga2VybmVsU3BlY3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2VybmVsUGlja2VyID0gbmV3IEtlcm5lbFBpY2tlcihrZXJuZWxTcGVjcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEtlcm5lbHNwZWNNZXRhZGF0YT4oKHJlc29sdmUpID0+IHtcbiAgICAgIGlmICghdGhpcy5rZXJuZWxQaWNrZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMua2VybmVsUGlja2VyLm9uQ29uZmlybWVkID0gKGtlcm5lbFNwZWMpID0+IHJlc29sdmUoa2VybmVsU3BlYyk7XG5cbiAgICAgIHRoaXMua2VybmVsUGlja2VyLnRvZ2dsZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlS2VybmVsU3BlY3MoZ3JhbW1hcj86IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgY29uc3Qga2VybmVsU3BlY3MgPSBhd2FpdCB0aGlzLnVwZGF0ZSgpO1xuXG4gICAgaWYgKGtlcm5lbFNwZWNzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IFwiTm8gS2VybmVscyBJbnN0YWxsZWRcIjtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiTm8ga2VybmVscyBhcmUgaW5zdGFsbGVkIG9uIHlvdXIgc3lzdGVtIHNvIHlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGV4ZWN1dGUgY29kZSBpbiBhbnkgbGFuZ3VhZ2UuXCIsXG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJJbnN0YWxsIEluc3RydWN0aW9uc1wiLFxuICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT5cbiAgICAgICAgICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFxuICAgICAgICAgICAgICAgIFwiaHR0cHM6Ly9udGVyYWN0LmdpdGJvb2tzLmlvL2h5ZHJvZ2VuL2RvY3MvSW5zdGFsbGF0aW9uLmh0bWxcIlxuICAgICAgICAgICAgICApLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJQb3B1bGFyIEtlcm5lbHNcIixcbiAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHNoZWxsLm9wZW5FeHRlcm5hbChcImh0dHBzOi8vbnRlcmFjdC5pby9rZXJuZWxzXCIpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJBbGwgS2VybmVsc1wiLFxuICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT5cbiAgICAgICAgICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFxuICAgICAgICAgICAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL2p1cHl0ZXIvanVweXRlci93aWtpL0p1cHl0ZXIta2VybmVsc1wiXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH07XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBcIkh5ZHJvZ2VuIEtlcm5lbHMgdXBkYXRlZDpcIjtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGRldGFpbDogXy5tYXAoa2VybmVsU3BlY3MsIFwiZGlzcGxheV9uYW1lXCIpLmpvaW4oXCJcXG5cIiksXG4gICAgICB9O1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8obWVzc2FnZSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtlcm5lbFNwZWNzO1xuICB9XG59XG5leHBvcnQgZGVmYXVsdCBuZXcgS2VybmVsTWFuYWdlcigpO1xuXG4vLyB1c2VkIGluIHRoZSB0ZXN0c1xuaWYgKGF0b20uaW5TcGVjTW9kZSgpKSB7XG4gIGV4cG9ydHMua3MgPSByZXF1aXJlKFwia2VybmVsc3BlY3NcIik7XG59XG4iXX0=