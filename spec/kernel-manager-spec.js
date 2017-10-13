"use babel";

import { KernelManager, ks } from "../lib/kernel-manager";

const JAVASCRIPT_SPEC = {
  display_name: "IJavascript",
  env: {},
  argv: [
    "node",
    "/home/user/node_modules/ijavascript/lib/kernel.js",
    "--protocol=5.0",
    "{connection_file}"
  ],
  language: "javascript"
};
const PYTHON_SPEC = {
  language: "python",
  display_name: "Python 2",
  env: {},
  argv: [
    "/usr/local/opt/python/bin/python2.7",
    "-m",
    "ipykernel",
    "-f",
    "{connection_file}"
  ]
};

const PYTHON3_SPEC = Object.assign({}, PYTHON_SPEC, {
  display_name: "Python 3"
});

const KERNEL_SPECS = {
  ijavascript: { spec: JAVASCRIPT_SPEC },
  python2: { spec: PYTHON_SPEC },
  python3: { spec: PYTHON3_SPEC }
};
const SPECS = [JAVASCRIPT_SPEC, PYTHON_SPEC, PYTHON3_SPEC];

describe("Kernel manager", () => {
  let manager;
  beforeEach(() => {
    spyOn(ks, "findAll").and.returnValue(Promise.resolve(KERNEL_SPECS));
    manager = new KernelManager();
  });
  describe("constructor", () => {
    it("should call initialize kernelSpecs", () => {
      expect(manager.kernelSpecs).toEqual(null);
    });
  });
  describe("update", () => {
    it("should update kernelspecs", async () => {
      const specs = await manager.update();
      expect(specs).toEqual(SPECS);
      expect(manager.kernelSpecs).toEqual(SPECS);
      expect(ks.findAll).toHaveBeenCalled();
    });
  });

  describe("getAllKernelSpecs", () => {
    it("should update kernelspecs if no kernelspecs are stored", async () => {
      spyOn(manager, "update").and.returnValue("specs");
      expect(await manager.getAllKernelSpecs()).toBe("specs");
      expect(manager.update).toHaveBeenCalled();
    });

    it("should return stored kernelspecs", async () => {
      spyOn(manager, "update").and.returnValue("specs");
      manager.kernelSpecs = SPECS;
      expect(await manager.getAllKernelSpecs()).toEqual(SPECS);
      expect(manager.update).not.toHaveBeenCalled();
    });
  });

  describe("getAllKernelSpecsForGrammar", () => {
    it("should return empty array if no grammar", async () => {
      expect(await manager.getAllKernelSpecsForGrammar()).toEqual([]);
      expect(await manager.getAllKernelSpecsForGrammar(null)).toEqual([]);
    });

    it("should return matching specs for grammar", async () => {
      spyOn(manager, "getAllKernelSpecs").and.returnValue(SPECS);
      expect(
        await manager.getAllKernelSpecsForGrammar({ name: "python" })
      ).toEqual([PYTHON_SPEC, PYTHON3_SPEC]);
    });
  });

  describe("getKernelSpecForGrammar", () => {
    it("should return undefined if not kernelspecs found", async () => {
      spyOn(manager, "getAllKernelSpecsForGrammar").and.returnValue([]);
      expect(await manager.getKernelSpecForGrammar()).toBeUndefined();
    });

    it("should return single kernelspec", async () => {
      spyOn(manager, "getAllKernelSpecsForGrammar").and.returnValue([
        JAVASCRIPT_SPEC
      ]);
      expect(await manager.getKernelSpecForGrammar()).toEqual(JAVASCRIPT_SPEC);
    });

    it("should toggle kernel picker", async () => {
      const specs = [PYTHON_SPEC, PYTHON3_SPEC];
      spyOn(manager, "getAllKernelSpecsForGrammar").and.returnValue(specs);
      manager.kernelPicker = {
        toggle: () => {}
      };
      spyOn(manager.kernelPicker, "toggle");
      const spec = manager.getKernelSpecForGrammar();
      setTimeout(() => {
        manager.kernelPicker.onConfirmed(PYTHON3_SPEC);
      }, 0);

      expect(await spec).toEqual(PYTHON3_SPEC);
      expect(manager.kernelPicker.kernelSpecs).toEqual(specs);
      expect(manager.kernelPicker.toggle).toHaveBeenCalled();
    });
  });

  describe("updateKernelSpecs", () => {
    it("should show error if no kernelspecs are found", async () => {
      spyOn(manager, "update").and.returnValue(Promise.resolve([]));
      spyOn(atom.notifications, "addError");
      expect(await manager.updateKernelSpecs()).toEqual([]);
      expect(manager.update).toHaveBeenCalled();
      expect(atom.notifications.addError).toHaveBeenCalled();
    });

    it("should show info if kernelspecs are found", async () => {
      spyOn(manager, "update").and.returnValue(Promise.resolve(SPECS));
      spyOn(atom.notifications, "addInfo");
      expect(await manager.updateKernelSpecs()).toEqual(SPECS);
      expect(manager.update).toHaveBeenCalled();
      expect(atom.notifications.addInfo).toHaveBeenCalled();
    });
  });

  describe("startKernelFor", () => {
    it("should notify if no kernel specs are found", done => {
      spyOn(atom.notifications, "addError");
      spyOn(manager, "getKernelSpecForGrammar").and.returnValue(
        Promise.resolve(null)
      );
      spyOn(manager, "startKernel");
      const grammar = { name: "python" };

      manager.startKernelFor(grammar);
      expect(manager.getKernelSpecForGrammar).toHaveBeenCalledWith(grammar);
      expect(manager.startKernel).not.toHaveBeenCalled();
      // Hacky
      setTimeout(() => {
        expect(atom.notifications.addError).toHaveBeenCalled();
        done();
      }, 0);
    });
  });
});
