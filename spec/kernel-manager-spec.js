'use babel';

import _ from 'lodash';

import KernelManager from '../lib/kernel-manager';

describe('Kernel manager', () => {
  let kernelManager = null;

  beforeEach(() => {
    kernelManager = new KernelManager();
    atom.config.set('Hydrogen.kernelspec', '');
  });

  describe('constructor', () => {
    it('should initialize @_runningKernels', () => {
      expect(kernelManager._runningKernels).toEqual({});
    });

    it('should call @getKernelSpecsFromSettings', () => {
      spyOn(kernelManager, 'getKernelSpecsFromSettings');
      kernelManager.constructor();
      expect(kernelManager.getKernelSpecsFromSettings).toHaveBeenCalled();
    });
  });

  describe('handle running kernels', () => {
    const mockGrammar = { name: 'Kernel1' };

    const mockKernel = {
      kernelSpec: {
        language: 'kernel1',
      },
      destroy() {},
    };

    const mockKernel2 = {
      kernelSpec: {
        language: 'kernel2',
      },
      destroy() {},
    };

    const mockKernels = {
      kernel1: mockKernel,
      kernel2: mockKernel2,
    };

    describe('destroy', () =>
      it('should destroy all running kernels', () => {
        spyOn(mockKernels.kernel1, 'destroy');
        spyOn(mockKernels.kernel2, 'destroy');
        kernelManager._runningKernels = mockKernels;
        kernelManager.destroy();
        expect(mockKernels.kernel1.destroy).toHaveBeenCalled();
        expect(mockKernels.kernel2.destroy).toHaveBeenCalled();
        expect(kernelManager._runningKernels).toEqual({});
      }),
    );

    describe('setRunningKernelFor', () =>
      it('should set the running kernel for a grammar', () => {
        const grammar = { name: 'grammarLanguage' };

        const kernel = {
          kernelSpec: {
            language: 'kernelLanguage',
          },
          destroy() {},
        };
        kernelManager.setRunningKernelFor(grammar, kernel);
        expect(kernelManager._runningKernels.grammarlanguage)
          .not.toBeUndefined();
        expect(kernelManager._runningKernels.grammarlanguage
          .kernelSpec.language).toEqual('grammarlanguage');
      }),
    );

    describe('destroyRunningKernelFor', () =>
      it('should destroy a running kernel for a grammar', () => {
        spyOn(mockKernels.kernel1, 'destroy');
        spyOn(mockKernels.kernel2, 'destroy');
        kernelManager._runningKernels = _.clone(mockKernels);
        kernelManager.destroyRunningKernelFor(mockGrammar);

        expect(mockKernels.kernel1.destroy).toHaveBeenCalled();
        expect(mockKernels.kernel2.destroy).not.toHaveBeenCalled();
        expect(kernelManager._runningKernels.kernel2).not.toBeUndefined();
        expect(kernelManager._runningKernels.kernel1).toBeUndefined();
      }),
    );

    describe('getAllRunningKernels', () =>
      it('should get all running kernels', () => {
        kernelManager._runningKernels = mockKernels;
        expect(kernelManager.getAllRunningKernels()).toEqual(mockKernels);
      }),
    );

    describe('getRunningKernelFor', () =>
      it('should get the running kernel for a language', () => {
        kernelManager._runningKernels = mockKernels;
        expect(kernelManager.getRunningKernelFor('kernel1'))
          .toEqual(mockKernel);
      }),
    );

    describe('getLanguageFor', () =>
      it('should read lower case name from grammar', () =>
        expect(kernelManager.getLanguageFor(mockGrammar))
        .toEqual('kernel1'),
      ),
    );
  });

  describe('handle kernelspecs', () => {
    const firstKernelSpecString =
      `{
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
    const secondKernelSpecString =
      `{
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
    describe('getKernelSpecsFromSettings', () => {
      it('should parse kernelspecs from settings', () => {
        atom.config.set('Hydrogen.kernelspec', firstKernelSpecString);

        const parsed = kernelManager.getKernelSpecsFromSettings();

        expect(parsed).toEqual(firstKernelSpec.kernelspecs);
      });

      it('should return {} if no kernelspec is set', () => {
        expect(kernelManager.getKernelSpecsFromSettings()).toEqual({});
      });

      it('should return {} if invalid kernelspec is set', () => {
        atom.config.set('Hydrogen.kernelspec', 'invalid');
        expect(kernelManager.getKernelSpecsFromSettings()).toEqual({});
      });
    });

    describe('mergeKernelSpecs', () =>
      it('should merge kernelspecs', () => {
        kernelManager._kernelSpecs = firstKernelSpec.kernelspecs;
        kernelManager.mergeKernelSpecs(secondKernelSpec.kernelspecs);

        const specs = kernelManager._kernelSpecs;
        expect(specs).toEqual(kernelSpecs.kernelspecs);
      }),
    );

    describe('getAllKernelSpecs', () =>
      it('should return an array with specs', () =>
        waitsForPromise(() => new Promise((resolve) => {
          kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
          kernelManager.getAllKernelSpecs((specs) => {
            expect(specs.length).toEqual(2);
            expect(specs[0]).toEqual(
              kernelSpecs.kernelspecs.ijavascript.spec,
            );
            expect(specs[1]).toEqual(
              kernelSpecs.kernelspecs.python2.spec,
            );
            resolve();
          });
        })),
      ),
    );

    describe('getAllKernelSpecsFor', () => {
      it('should return an array with specs for given language', () =>
        waitsForPromise(() => new Promise((resolve) => {
          kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
          kernelManager.getAllKernelSpecsFor('python', (specs) => {
            expect(specs.length).toEqual(1);
            expect(specs[0]).toEqual(
              kernelSpecs.kernelspecs.python2.spec,
            );
            resolve();
          });
        })),
      );

      it('should return an empty array', () =>
        waitsForPromise(() => new Promise((resolve) => {
          kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
          kernelManager.getAllKernelSpecsFor('julia', (specs) => {
            expect(specs).toEqual([]);
            resolve();
          });
        })),
      );
    });

    describe('getKernelSpecFor', () => {
      it('should return spec for given language', () =>
        waitsForPromise(() => new Promise((resolve) => {
          kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
          kernelManager.getKernelSpecFor('python', (kernelSpec) => {
            expect(kernelSpec).toEqual(
              kernelSpecs.kernelspecs.python2.spec,
            );
            resolve();
          });
        })),
      );

      it('should return undefined', () =>
        waitsForPromise(() => new Promise((resolve) => {
          kernelManager._kernelSpecs = kernelSpecs.kernelspecs;
          kernelManager.getKernelSpecFor('julia', (kernelSpecForJulia) => {
            expect(kernelSpecForJulia).toBeUndefined();
            resolve();
          });
        })),
      );
    });

    it('should update kernelspecs', () =>
      waitsForPromise(() => new Promise((resolve) => {
        kernelManager.getKernelSpecsFromJupyter((err, specs) => {
          if (!err) {
            expect(specs instanceof Object).toEqual(true);
          }
          resolve();
        });
      })),
    );
  });
});
