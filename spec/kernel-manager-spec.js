"use babel";

import kernelManager from "../lib/kernel-manager";

describe("Kernel manager", () => {
  describe("constructor", () => {
    it("should call initialize _kernelSpecs", () => {
      expect(kernelManager._kernelSpecs).toEqual({});
    });
  });

  describe("handle kernelspecs", () => {
    const firstKernelSpecString = `{
        "kernelspecs": {
          "ijavascript": {
            "spec": {
              "display_name": "IJavascript",
              "env": {},
              "argv": [
                "node",
                "/home/user/node_modules/ijavascript/lib/kernel.js",
                "--protocol=5.0",
                "{connection_file}"
              ],
              "language": "javascript"
            },
            "resource_dir": "/home/user/node_modules/ijavascript/images"
          }
        }
      }`;
    const secondKernelSpecString = `{
        "kernelspecs": {
          "python2": {
            "spec": {
              "language": "python",
              "display_name": "Python 2",
              "env": {},
              "argv": [
                "/usr/local/opt/python/bin/python2.7",
                "-m",
                "ipykernel",
                "-f",
                "{connection_file}"
              ]
            }
          }
        }
      }`;

    const firstKernelSpec = JSON.parse(firstKernelSpecString);
    const secondKernelSpec = JSON.parse(secondKernelSpecString);

    const kernelSpecs = JSON.parse(firstKernelSpecString);
    kernelSpecs.kernelspecs.python2 = secondKernelSpec.kernelspecs.python2;
    describe("getKernelSpecsFromSettings", () => {
      it("should parse kernelspecs from settings", () => {
        atom.config.set("Hydrogen.kernelspec", firstKernelSpecString);

        const parsed = kernelManager.getKernelSpecsFromSettings();

        expect(parsed).toEqual(firstKernelSpec.kernelspecs);
      });

      it("should return {} if no kernelspec is set", () => {
        atom.config.set("Hydrogen.kernelspec", "");
        expect(kernelManager.getKernelSpecsFromSettings()).toEqual({});
      });

      it("should return {} if invalid kernelspec is set", () => {
        atom.config.set("Hydrogen.kernelspec", "invalid");
        expect(kernelManager.getKernelSpecsFromSettings()).toEqual({});
      });
    });

    describe("mergeKernelSpecs", () =>
      it("should merge kernelspecs", () => {
        kernelManager._kernelSpecs = firstKernelSpec.kernelspecs;
        kernelManager.mergeKernelSpecs(secondKernelSpec.kernelspecs);

        const specs = kernelManager._kernelSpecs;
        expect(specs).toEqual(kernelSpecs.kernelspecs);
      }));

    describe("getAllKernelSpecs", () => {
      it("should return an array with specs", done => {
        kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
        kernelManager.getAllKernelSpecs(specs => {
          expect(specs.length).toEqual(2);
          expect(specs[0]).toEqual(kernelSpecs.kernelspecs.ijavascript.spec);
          expect(specs[1]).toEqual(kernelSpecs.kernelspecs.python2.spec);
          done();
        });
      });
    });

    describe("getAllKernelSpecsForGrammar", () => {
      it("should return an array with specs for given language", done => {
        kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
        kernelManager.getAllKernelSpecsForGrammar({ name: "python" }, specs => {
          expect(specs.length).toEqual(1);
          expect(specs[0]).toEqual(kernelSpecs.kernelspecs.python2.spec);
          done();
        });
      });

      it("should return an empty array", done => {
        kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
        kernelManager.getAllKernelSpecsForGrammar({ name: "julia" }, specs => {
          expect(specs).toEqual([]);
          done();
        });
      });
    });

    describe("getKernelSpecForGrammar", () => {
      it("should return spec for given language", done => {
        kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
        kernelManager.getKernelSpecForGrammar({ name: "python" }, spec => {
          expect(spec).toEqual(kernelSpecs.kernelspecs.python2.spec);
          done();
        });
      });

      it("should return undefined", done => {
        kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
        kernelManager.getKernelSpecForGrammar({ name: "julia" }, spec => {
          expect(spec).toBeUndefined();
          done();
        });
      });
    });

    it("should update kernelspecs", done => {
      kernelManager.getKernelSpecsFromJupyter((err, specs) => {
        if (!err) {
          expect(specs instanceof Object).toEqual(true);
        }
        done();
      });
    });
  });
});
