Config = require '../lib/config'
KernelManager = require '../lib/kernel-manager'

path = require 'path'
fs = require 'fs'

describe 'Atom config', ->
    it 'should read config values', ->
        atom.config.set 'Hydrogen.read', JSON.stringify 'bar'
        expect(Config.getJson 'read').toEqual('bar')

    it 'should return {} for broken config', ->
        atom.config.set 'Hydrogen.broken', 'foo'
        expect(Config.getJson 'broken').toEqual({})

describe 'Kernel manager', ->
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

    kernelManager = null

    beforeEach ->
        kernelManager = new KernelManager()
        atom.config.set 'Hydrogen.kernelspec', ''

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

    it 'should read lower case name from grammar', ->
        grammar = atom.grammars.getGrammars()[0]
        expect(kernelManager.getLanguageFor grammar).toEqual('null grammar')

    it 'should update kernelspecs', ->
        waitsForPromise -> new Promise (resolve, reject) ->
            kernelManager.getKernelSpecsFromJupyter (err, specs) ->
                unless err
                    expect(specs instanceof Object).toEqual(true)
                resolve()
