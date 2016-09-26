KernelManager = require '../lib/kernel-manager'

path = require 'path'
fs = require 'fs'
_ = require 'lodash'

describe 'Kernel manager', ->
    kernelManager = null

    beforeEach ->
        kernelManager = new KernelManager()
        atom.config.set 'Hydrogen.kernelspec', ''

    describe 'constructor', ->
        it 'should initialize @_runningKernels', ->
            expect(kernelManager._runningKernels).toEqual({})
        it 'should call @getKernelSpecsFromSettings', ->
            spyOn(kernelManager, 'getKernelSpecsFromSettings')
            kernelManager.constructor()
            expect(kernelManager.getKernelSpecsFromSettings).toHaveBeenCalled()

    describe 'handle running kernels', ->
        mockGrammar =
            name: 'grammarLanguage'

        mockKernel =
            kernelSpec:
                language: 'kernelLanguage'
            destroy: ->

        describe 'destroy', ->
            it 'should destroy all running kernels', ->
                mockKernels =
                    kernel1: _.clone mockKernel
                    kernel2: _.clone mockKernel
                spyOn(mockKernels.kernel1, 'destroy')
                spyOn(mockKernels.kernel2, 'destroy')
                kernelManager._runningKernels = mockKernels
                kernelManager.destroy()
                expect(mockKernels.kernel1.destroy).toHaveBeenCalled()
                expect(mockKernels.kernel2.destroy).toHaveBeenCalled()
                expect(kernelManager._runningKernels).toEqual({})

        describe 'setRunningKernelFor', ->
            it 'should set the running kernel for a grammar', ->
                kernelManager.setRunningKernelFor mockGrammar, mockKernel
                expect(kernelManager._runningKernels.grammarlanguage)
                    .not.toBeUndefined()
                expect(kernelManager._runningKernels.grammarlanguage
                    .kernelSpec.language).toEqual('grammarlanguage')

        describe 'destroyRunningKernelFor', ->
            it 'should destroy a running kernel for a grammar', ->
                mockKernels =
                    grammarlanguage: _.clone mockKernel
                    kernel2: _.clone mockKernel

                spyOn(mockKernels.grammarlanguage, 'destroy')
                spyOn(mockKernels.kernel2, 'destroy')
                kernelManager._runningKernels = _.clone mockKernels
                kernelManager.destroyRunningKernelFor mockGrammar

                expect(mockKernels.grammarlanguage.destroy).toHaveBeenCalled()
                expect(mockKernels.kernel2.destroy).not.toHaveBeenCalled()
                expect(kernelManager._runningKernels.kernel2).not.toBeUndefined()
                expect(kernelManager._runningKernels.grammarlanguage).toBeUndefined()


        it 'should read lower case name from grammar', ->
            expect(kernelManager.getLanguageFor mockGrammar)
                .toEqual('grammarlanguage')

    describe 'handle kernelspecs', ->
        firstKernelSpecString = '''{
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
        }'''
        secondKernelSpecString = '''{
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
        }'''

        firstKernelSpec = JSON.parse firstKernelSpecString
        secondKernelSpec = JSON.parse secondKernelSpecString

        kernelSpecs = JSON.parse firstKernelSpecString
        kernelSpecs.kernelspecs.python2 = secondKernelSpec.kernelspecs.python2
        kernelSpecsString = JSON.stringify kernelSpecs
        describe 'getKernelSpecsFromSettings', ->
            it 'should parse kernelspecs from settings', ->
                atom.config.set 'Hydrogen.kernelspec', firstKernelSpecString

                parsed = kernelManager.getKernelSpecsFromSettings()

                expect(parsed).toEqual(firstKernelSpec.kernelspecs)

            it 'should return {} if no kernelspec is set', ->
                expect(kernelManager.getKernelSpecsFromSettings()).toEqual({})

            it 'should return {} if invalid kernelspec is set', ->
                atom.config.set 'Hydrogen.kernelspec', 'invalid'
                expect(kernelManager.getKernelSpecsFromSettings()).toEqual({})

        describe 'mergeKernelSpecs', ->
            it 'should merge kernelspecs', ->
                kernelManager._kernelSpecs = firstKernelSpec.kernelspecs
                kernelManager.mergeKernelSpecs secondKernelSpec.kernelspecs

                specs = kernelManager._kernelSpecs
                expect(specs).toEqual(kernelSpecs.kernelspecs)

        describe 'getAllKernelSpecs', ->
            it 'should return an array with specs', ->
                waitsForPromise -> new Promise (resolve, reject) ->
                    kernelManager._kernelSpecs = kernelSpecs.kernelspecs
                    kernelManager.getAllKernelSpecs (specs) ->
                        expect(specs.length).toEqual(2)
                        expect(specs[0]).toEqual(
                            kernelSpecs.kernelspecs.ijavascript.spec
                        )
                        expect(specs[1]).toEqual(
                            kernelSpecs.kernelspecs.python2.spec
                        )
                        resolve()

        describe 'getAllKernelSpecsFor', ->
            it 'should return an array with specs for given language', ->
                waitsForPromise -> new Promise (resolve, reject) ->
                    kernelManager._kernelSpecs = kernelSpecs.kernelspecs
                    kernelManager.getAllKernelSpecsFor 'python', (specs) ->
                        expect(specs.length).toEqual(1)
                        expect(specs[0]).toEqual(
                            kernelSpecs.kernelspecs.python2.spec
                        )
                        resolve()

            it 'should return an empty array', ->
                waitsForPromise -> new Promise (resolve, reject) ->
                    kernelManager._kernelSpecs = kernelSpecs.kernelspecs
                    kernelManager.getAllKernelSpecsFor 'julia', (specs) ->
                        expect(specs).toEqual([])
                        resolve()

        describe 'getKernelSpecFor', ->
            it 'should return spec for given language', ->
                waitsForPromise -> new Promise (resolve, reject) ->
                    kernelManager._kernelSpecs = kernelSpecs.kernelspecs
                    kernelManager.getKernelSpecFor 'python', (kernelSpec) ->
                        expect(kernelSpec).toEqual(
                            kernelSpecs.kernelspecs.python2.spec
                        )
                        resolve()

            it 'should return undefined', ->
                waitsForPromise -> new Promise (resolve, reject) ->
                    kernelManager._kernelSpecs = kernelSpecs.kernelspecs
                    kernelManager.getKernelSpecFor 'julia', (kernelSpecForJulia) ->
                        expect(kernelSpecForJulia).toBeUndefined()
                        resolve()

        it 'should update kernelspecs', ->
            waitsForPromise -> new Promise (resolve, reject) ->
                kernelManager.getKernelSpecsFromJupyter (err, specs) ->
                    unless err
                        expect(specs instanceof Object).toEqual(true)
                    resolve()
