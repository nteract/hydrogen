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
        const currentPath = (0, utils_1.getEditorDirectory)(editor);
        let projectPath;
        (0, utils_1.log)("KernelManager: startKernel:", displayName);
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
        const kernelSpecs = await (0, kernelspecs_1.findAll)();
        const kernelResourcesDict = (0, mapKeys_1.default)(kernelSpecs, function (value, key) {
            return (value.spec.name = key);
        });
        this.kernelSpecs = (0, sortBy_1.default)((0, map_1.default)(kernelResourcesDict, "spec"), (spec) => spec.display_name);
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
        return kernelSpecs.filter((spec) => (0, utils_1.kernelSpecProvidesGrammar)(spec, grammar));
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
            const displayNames = (0, map_1.default)(kernelSpecs, "display_name");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VybmVsLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIva2VybmVsLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EscURBQTZCO0FBQzdCLDZEQUFxQztBQUNyQywyREFBbUM7QUFDbkMsNkNBQTREO0FBQzVELHVDQUFpQztBQUNqQyw4REFBcUM7QUFDckMsc0RBQThCO0FBQzlCLG9FQUEyQztBQUMzQyxvREFBNEI7QUFDNUIsbUNBQTZFO0FBRzdFLE1BQWEsYUFBYTtJQUExQjtRQUNFLGdCQUFXLEdBQWlELElBQUksQ0FBQztJQXVLbkUsQ0FBQztJQXBLQyxjQUFjLENBQ1osT0FBZ0IsRUFDaEIsTUFBa0IsRUFDbEIsUUFBZ0IsRUFDaEIsU0FBbUM7UUFFbkMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQ3hELElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ2YsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQztnQkFDbEUsTUFBTSxpQkFBaUIsR0FDckIsT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztvQkFDMUMsQ0FBQyxDQUFDLCtJQUErSTtvQkFDakosQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDVCxNQUFNLFdBQVcsR0FBRyxvTEFBb0wsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNU4sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO29CQUNuQyxXQUFXO29CQUNYLFdBQVcsRUFBRSxpQkFBaUIsS0FBSyxFQUFFO2lCQUN0QyxDQUFDLENBQUM7Z0JBQ0gsT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsV0FBVyxDQUNULFVBQThCLEVBQzlCLE9BQWdCLEVBQ2hCLE1BQWtCLEVBQ2xCLFFBQWdCLEVBQ2hCLFNBQXlEO1FBRXpELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUM7UUFFNUMsSUFBSSxlQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUMxQyxPQUFPO1NBQ1I7UUFDRCxlQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sV0FBVyxHQUFHLElBQUEsMEJBQWtCLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0MsSUFBSSxXQUFXLENBQUM7UUFDaEIsSUFBQSxXQUFHLEVBQUMsNkJBQTZCLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFaEQsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFO1lBQzVDLEtBQUssaUJBQWlCO2dCQUNwQixXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekMsTUFBTTtZQUVSLEtBQUssa0JBQWtCO2dCQUNyQixXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELE1BQU07U0FDVDtRQUVELE1BQU0sY0FBYyxHQUFHLFdBQVcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQ3ZFLE1BQU0sT0FBTyxHQUFHO1lBQ2QsR0FBRyxFQUFFLGNBQWM7WUFDbkIsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUM7U0FDbEMsQ0FBQztRQUNGLE1BQU0sU0FBUyxHQUFHLElBQUksb0JBQVMsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDakUsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLGVBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkQsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ25CO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEscUJBQWtCLEdBQUUsQ0FBQztRQUUvQyxNQUFNLG1CQUFtQixHQUFHLElBQUEsaUJBQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxLQUFLLEVBQUUsR0FBRztZQUNuRSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUEsZ0JBQU0sRUFDdkIsSUFBQSxhQUFHLEVBQUMsbUJBQW1CLEVBQUUsTUFBTSxDQUFDLEVBQ2hDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUM1QixDQUFDO1FBQ0YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFFRCxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBbUM7UUFDekQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUN6QjtRQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCxLQUFLLENBQUMsMkJBQTJCLENBQy9CLE9BQW1DO1FBRW5DLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUQsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDakMsSUFBQSxpQ0FBeUIsRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQ3pDLENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxDQUFDLHVCQUF1QixDQUFDLE9BQWdCO1FBQzVDLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXBFLElBQUksV0FBVyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDM0IsT0FBTyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdkI7UUFFRCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1NBQzdDO2FBQU07WUFDTCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksdUJBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNuRDtRQUVELE9BQU8sSUFBSSxPQUFPLENBQXFCLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ3RCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3RCO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUVwRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUFvQztRQUMxRCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUV4QyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzVCLE1BQU0sT0FBTyxHQUFHLHNCQUFzQixDQUFDO1lBQ3ZDLE1BQU0sT0FBTyxHQUFHO2dCQUNkLFdBQVcsRUFDVCxrR0FBa0c7Z0JBQ3BHLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixPQUFPLEVBQUU7b0JBQ1A7d0JBQ0UsSUFBSSxFQUFFLHNCQUFzQjt3QkFDNUIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUNmLGdCQUFLLENBQUMsWUFBWSxDQUNoQiw2REFBNkQsQ0FDOUQ7cUJBQ0o7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLGlCQUFpQjt3QkFDdkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGdCQUFLLENBQUMsWUFBWSxDQUFDLDRCQUE0QixDQUFDO3FCQUNuRTtvQkFDRDt3QkFDRSxJQUFJLEVBQUUsYUFBYTt3QkFDbkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUNmLGdCQUFLLENBQUMsWUFBWSxDQUNoQix5REFBeUQsQ0FDMUQ7cUJBQ0o7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQy9DO2FBQU07WUFDTCxNQUFNLE9BQU8sR0FBRywyQkFBMkIsQ0FBQztZQUM1QyxNQUFNLFlBQVksR0FBRyxJQUFBLGFBQUcsRUFBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDdEQsTUFBTSxPQUFPLEdBQUc7Z0JBQ2QsTUFBTSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ2hDLENBQUM7WUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDOUM7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUF4S0Qsc0NBd0tDO0FBR0QsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUU7SUFDckIsT0FBTyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7Q0FDckMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RWRpdG9yLCBHcmFtbWFyIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBtYXAgZnJvbSBcImxvZGFzaC9tYXBcIjtcbmltcG9ydCBtYXBLZXlzIGZyb20gXCJsb2Rhc2gvbWFwS2V5c1wiO1xuaW1wb3J0IHNvcnRCeSBmcm9tIFwibG9kYXNoL3NvcnRCeVwiO1xuaW1wb3J0IHsgZmluZEFsbCBhcyBrZXJuZWxTcGVjc0ZpbmRBbGwgfSBmcm9tIFwia2VybmVsc3BlY3NcIjtcbmltcG9ydCB7IHNoZWxsIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgWk1RS2VybmVsIGZyb20gXCIuL3ptcS1rZXJuZWxcIjtcbmltcG9ydCBLZXJuZWwgZnJvbSBcIi4va2VybmVsXCI7XG5pbXBvcnQgS2VybmVsUGlja2VyIGZyb20gXCIuL2tlcm5lbC1waWNrZXJcIjtcbmltcG9ydCBzdG9yZSBmcm9tIFwiLi9zdG9yZVwiO1xuaW1wb3J0IHsgZ2V0RWRpdG9yRGlyZWN0b3J5LCBrZXJuZWxTcGVjUHJvdmlkZXNHcmFtbWFyLCBsb2cgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBLZXJuZWxzcGVjTWV0YWRhdGEgfSBmcm9tIFwiQG50ZXJhY3QvdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEtlcm5lbE1hbmFnZXIge1xuICBrZXJuZWxTcGVjczogQXJyYXk8S2VybmVsc3BlY01ldGFkYXRhPiB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xuICBrZXJuZWxQaWNrZXI6IEtlcm5lbFBpY2tlciB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgc3RhcnRLZXJuZWxGb3IoXG4gICAgZ3JhbW1hcjogR3JhbW1hcixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICBvblN0YXJ0ZWQ6IChrZXJuZWw6IEtlcm5lbCkgPT4gdm9pZFxuICApIHtcbiAgICB0aGlzLmdldEtlcm5lbFNwZWNGb3JHcmFtbWFyKGdyYW1tYXIpLnRoZW4oKGtlcm5lbFNwZWMpID0+IHtcbiAgICAgIGlmICgha2VybmVsU3BlYykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gYE5vIGtlcm5lbCBmb3IgZ3JhbW1hciBcXGAke2dyYW1tYXIubmFtZX1cXGAgZm91bmRgO1xuICAgICAgICBjb25zdCBweXRob25EZXNjcmlwdGlvbiA9XG4gICAgICAgICAgZ3JhbW1hciAmJiAvcHl0aG9uL2cudGVzdChncmFtbWFyLnNjb3BlTmFtZSlcbiAgICAgICAgICAgID8gXCJcXG5cXG5UbyBkZXRlY3QgeW91ciBjdXJyZW50IFB5dGhvbiBpbnN0YWxsIHlvdSB3aWxsIG5lZWQgdG8gcnVuOjxwcmU+cHl0aG9uIC1tIHBpcCBpbnN0YWxsIGlweWtlcm5lbFxcbnB5dGhvbiAtbSBpcHlrZXJuZWwgaW5zdGFsbCAtLXVzZXI8L3ByZT5cIlxuICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGBDaGVjayB0aGF0IHRoZSBsYW5ndWFnZSBmb3IgdGhpcyBmaWxlIGlzIHNldCBpbiBBdG9tLCB0aGF0IHlvdSBoYXZlIGEgSnVweXRlciBrZXJuZWwgaW5zdGFsbGVkIGZvciBpdCwgYW5kIHRoYXQgeW91IGhhdmUgY29uZmlndXJlZCB0aGUgbGFuZ3VhZ2UgbWFwcGluZyBpbiBIeWRyb2dlbiBwcmVmZXJlbmNlcy4ke3B5dGhvbkRlc2NyaXB0aW9ufWA7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlLCB7XG4gICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHB5dGhvbkRlc2NyaXB0aW9uICE9PSBcIlwiLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YXJ0S2VybmVsKGtlcm5lbFNwZWMsIGdyYW1tYXIsIGVkaXRvciwgZmlsZVBhdGgsIG9uU3RhcnRlZCk7XG4gICAgfSk7XG4gIH1cblxuICBzdGFydEtlcm5lbChcbiAgICBrZXJuZWxTcGVjOiBLZXJuZWxzcGVjTWV0YWRhdGEsXG4gICAgZ3JhbW1hcjogR3JhbW1hcixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICBvblN0YXJ0ZWQ/OiAoKGtlcm5lbDogS2VybmVsKSA9PiB2b2lkKSB8IG51bGwgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgY29uc3QgZGlzcGxheU5hbWUgPSBrZXJuZWxTcGVjLmRpc3BsYXlfbmFtZTtcbiAgICAvLyBpZiBrZXJuZWwgc3RhcnR1cCBhbHJlYWR5IGluIHByb2dyZXNzIGRvbid0IHN0YXJ0IGFkZGl0aW9uYWwga2VybmVsXG4gICAgaWYgKHN0b3JlLnN0YXJ0aW5nS2VybmVscy5nZXQoZGlzcGxheU5hbWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0b3JlLnN0YXJ0S2VybmVsKGRpc3BsYXlOYW1lKTtcbiAgICBjb25zdCBjdXJyZW50UGF0aCA9IGdldEVkaXRvckRpcmVjdG9yeShlZGl0b3IpO1xuICAgIGxldCBwcm9qZWN0UGF0aDtcbiAgICBsb2coXCJLZXJuZWxNYW5hZ2VyOiBzdGFydEtlcm5lbDpcIiwgZGlzcGxheU5hbWUpO1xuXG4gICAgc3dpdGNoIChhdG9tLmNvbmZpZy5nZXQoXCJIeWRyb2dlbi5zdGFydERpclwiKSkge1xuICAgICAgY2FzZSBcImZpcnN0UHJvamVjdERpclwiOlxuICAgICAgICBwcm9qZWN0UGF0aCA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcInByb2plY3REaXJPZkZpbGVcIjpcbiAgICAgICAgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoY3VycmVudFBhdGgpWzBdO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBrZXJuZWxTdGFydERpciA9IHByb2plY3RQYXRoICE9IG51bGwgPyBwcm9qZWN0UGF0aCA6IGN1cnJlbnRQYXRoO1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICBjd2Q6IGtlcm5lbFN0YXJ0RGlyLFxuICAgICAgc3RkaW86IFtcImlnbm9yZVwiLCBcInBpcGVcIiwgXCJwaXBlXCJdLFxuICAgIH07XG4gICAgY29uc3QgdHJhbnNwb3J0ID0gbmV3IFpNUUtlcm5lbChrZXJuZWxTcGVjLCBncmFtbWFyLCBvcHRpb25zLCAoKSA9PiB7XG4gICAgICBjb25zdCBrZXJuZWwgPSBuZXcgS2VybmVsKHRyYW5zcG9ydCk7XG4gICAgICBzdG9yZS5uZXdLZXJuZWwoa2VybmVsLCBmaWxlUGF0aCwgZWRpdG9yLCBncmFtbWFyKTtcbiAgICAgIGlmIChvblN0YXJ0ZWQpIHtcbiAgICAgICAgb25TdGFydGVkKGtlcm5lbCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoKTogUHJvbWlzZTxLZXJuZWxzcGVjTWV0YWRhdGFbXT4ge1xuICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gYXdhaXQga2VybmVsU3BlY3NGaW5kQWxsKCk7XG5cbiAgICBjb25zdCBrZXJuZWxSZXNvdXJjZXNEaWN0ID0gbWFwS2V5cyhrZXJuZWxTcGVjcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIHJldHVybiAodmFsdWUuc3BlYy5uYW1lID0ga2V5KTtcbiAgICB9KTtcbiAgICB0aGlzLmtlcm5lbFNwZWNzID0gc29ydEJ5KFxuICAgICAgbWFwKGtlcm5lbFJlc291cmNlc0RpY3QsIFwic3BlY1wiKSxcbiAgICAgIChzcGVjKSA9PiBzcGVjLmRpc3BsYXlfbmFtZVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXMua2VybmVsU3BlY3M7XG4gIH1cblxuICBhc3luYyBnZXRBbGxLZXJuZWxTcGVjcyhncmFtbWFyOiBHcmFtbWFyIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmICh0aGlzLmtlcm5lbFNwZWNzKSB7XG4gICAgICByZXR1cm4gdGhpcy5rZXJuZWxTcGVjcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlS2VybmVsU3BlY3MoZ3JhbW1hcik7XG4gIH1cblxuICBhc3luYyBnZXRBbGxLZXJuZWxTcGVjc0ZvckdyYW1tYXIoXG4gICAgZ3JhbW1hcjogR3JhbW1hciB8IG51bGwgfCB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxLZXJuZWxzcGVjTWV0YWRhdGFbXT4ge1xuICAgIGlmICghZ3JhbW1hcikge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBrZXJuZWxTcGVjcyA9IGF3YWl0IHRoaXMuZ2V0QWxsS2VybmVsU3BlY3MoZ3JhbW1hcik7XG4gICAgcmV0dXJuIGtlcm5lbFNwZWNzLmZpbHRlcigoc3BlYykgPT5cbiAgICAgIGtlcm5lbFNwZWNQcm92aWRlc0dyYW1tYXIoc3BlYywgZ3JhbW1hcilcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0S2VybmVsU3BlY0ZvckdyYW1tYXIoZ3JhbW1hcjogR3JhbW1hcikge1xuICAgIGNvbnN0IGtlcm5lbFNwZWNzID0gYXdhaXQgdGhpcy5nZXRBbGxLZXJuZWxTcGVjc0ZvckdyYW1tYXIoZ3JhbW1hcik7XG5cbiAgICBpZiAoa2VybmVsU3BlY3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHJldHVybiBrZXJuZWxTcGVjc1swXTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5rZXJuZWxQaWNrZXIpIHtcbiAgICAgIHRoaXMua2VybmVsUGlja2VyLmtlcm5lbFNwZWNzID0ga2VybmVsU3BlY3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2VybmVsUGlja2VyID0gbmV3IEtlcm5lbFBpY2tlcihrZXJuZWxTcGVjcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEtlcm5lbHNwZWNNZXRhZGF0YT4oKHJlc29sdmUpID0+IHtcbiAgICAgIGlmICghdGhpcy5rZXJuZWxQaWNrZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMua2VybmVsUGlja2VyLm9uQ29uZmlybWVkID0gKGtlcm5lbFNwZWMpID0+IHJlc29sdmUoa2VybmVsU3BlYyk7XG5cbiAgICAgIHRoaXMua2VybmVsUGlja2VyLnRvZ2dsZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlS2VybmVsU3BlY3MoZ3JhbW1hcj86IEdyYW1tYXIgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgY29uc3Qga2VybmVsU3BlY3MgPSBhd2FpdCB0aGlzLnVwZGF0ZSgpO1xuXG4gICAgaWYgKGtlcm5lbFNwZWNzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IFwiTm8gS2VybmVscyBJbnN0YWxsZWRcIjtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiTm8ga2VybmVscyBhcmUgaW5zdGFsbGVkIG9uIHlvdXIgc3lzdGVtIHNvIHlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGV4ZWN1dGUgY29kZSBpbiBhbnkgbGFuZ3VhZ2UuXCIsXG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJJbnN0YWxsIEluc3RydWN0aW9uc1wiLFxuICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT5cbiAgICAgICAgICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFxuICAgICAgICAgICAgICAgIFwiaHR0cHM6Ly9udGVyYWN0LmdpdGJvb2tzLmlvL2h5ZHJvZ2VuL2RvY3MvSW5zdGFsbGF0aW9uLmh0bWxcIlxuICAgICAgICAgICAgICApLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJQb3B1bGFyIEtlcm5lbHNcIixcbiAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHNoZWxsLm9wZW5FeHRlcm5hbChcImh0dHBzOi8vbnRlcmFjdC5pby9rZXJuZWxzXCIpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJBbGwgS2VybmVsc1wiLFxuICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT5cbiAgICAgICAgICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFxuICAgICAgICAgICAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL2p1cHl0ZXIvanVweXRlci93aWtpL0p1cHl0ZXIta2VybmVsc1wiXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH07XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBcIkh5ZHJvZ2VuIEtlcm5lbHMgdXBkYXRlZDpcIjtcbiAgICAgIGNvbnN0IGRpc3BsYXlOYW1lcyA9IG1hcChrZXJuZWxTcGVjcywgXCJkaXNwbGF5X25hbWVcIik7IC8vIGtlcm5lbFNwZWNzLm1hcCgoa2VybmVsU3BlYykgPT4ga2VybmVsU3BlYy5kaXNwbGF5X25hbWUpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBkZXRhaWw6IGRpc3BsYXlOYW1lcy5qb2luKFwiXFxuXCIpLFxuICAgICAgfTtcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiBrZXJuZWxTcGVjcztcbiAgfVxufVxuXG4vLyB1c2VkIGluIHRoZSB0ZXN0c1xuaWYgKGF0b20uaW5TcGVjTW9kZSgpKSB7XG4gIGV4cG9ydHMua3MgPSByZXF1aXJlKFwia2VybmVsc3BlY3NcIik7XG59XG4iXX0=