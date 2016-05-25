Config = require '../lib/config'
ConfigManager = require '../lib/config-manager'
portfinder = require '../lib/find-port'
KernelManager = require '../lib/kernel-manager'

path = require 'path'
fs = require 'fs'

describe "Atom config", ->
    it "should set config value", ->
        Config.setJson "set", "foo"
        expect(JSON.parse atom.config.get "Hydrogen.set").toEqual("foo")

    it "should read config values", ->
        atom.config.set "Hydrogen.read", JSON.stringify "bar"
        expect(Config.getJson "read").toEqual("bar")

    it "should return {} for broken config", ->
        atom.config.set "Hydrogen.broken", "foo"
        expect(Config.getJson "broken").toEqual({})

describe "Port config manager", ->
    it "should build port config", ->
        ports = [60000...60004]
        config = ConfigManager.buildConfiguration ports
        expect(config.version).toEqual(5)
        expect(config.key.length).toEqual(36)
        expect(config.signature_scheme).toEqual("hmac-sha256")
        expect(config.transport).toEqual("tcp")
        expect(config.ip).toEqual("127.0.0.1")
        expect(config.hb_port).toEqual(ports[0])
        expect(config.control_port).toEqual(ports[1])
        expect(config.shell_port).toEqual(ports[2])
        expect(config.stdin_port).toEqual(ports[3])
        expect(config.iopub_port).toEqual(ports[4])

    it "should write a port config file", ->
        fileStoragePath = path.join(__dirname, '..', 'kernel-configs')
        try
            fileNumberBefore = fs.readdirSync(fileStoragePath).length
        catch
            fileNumberBefore = 0

        ConfigManager.writeConfigFile ->
            fileNumberAfter = fs.readdirSync(fileStoragePath).length
            expect(fileNumberAfter).toEqual(fileNumberBefore + 1)

describe "Port finder", ->
    it "should find a free port", ->
        portfinder.find (port) ->
            expect(port).toMatch(/\d{1,}/)
    it "should find 3 free ports", ->
        portfinder.findMany 3, (ports) ->
            expect(ports.length).toEqual(3)
            expect(ports[0]).toMatch(/\d{1,}/)
            expect(ports[1]).toMatch(/\d{1,}/)
            expect(ports[2]).toMatch(/\d{1,}/)
    it "should find 2 additional free ports", ->
        portfinder.findManyHelper 2, [60000], (ports) ->
            expect(ports.length).toEqual(3)
            expect(ports[0]).toEqual(60000)
            expect(ports[1]).toMatch(/\d{1,}/)
            expect(ports[2]).toMatch(/\d{1,}/)

describe "Kernel manager", ->
    firstKernelSpecString = """{
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
    }"""
    secondKernelSpecString = """{
        "kernelspecs": {
            "python2": {
                "resource_dir": "/usr/local/lib/python2.7/site-packages/ipykernel/resources",
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
    }"""

    firstKernelSpec = JSON.parse firstKernelSpecString
    secondKernelSpec = JSON.parse secondKernelSpecString

    kernelSpecs = JSON.parse firstKernelSpecString
    kernelSpecs.kernelspecs.python2 = secondKernelSpec.kernelspecs.python2

    beforeEach ->
        atom.config.set "Hydrogen.kernelspec", ""

    describe "parseKernelSpecSettings", ->
        it "should parse kernelspecs from settings", ->
            atom.config.set "Hydrogen.kernelspec", firstKernelSpecString

            parsed = KernelManager.parseKernelSpecSettings()

            expect(parsed).toEqual(firstKernelSpec.kernelspecs)

        it "should return {} if no kernelspec is set", ->
            expect(KernelManager.parseKernelSpecSettings()).toEqual({})

        it "should return {} if invalid kernelspec is set", ->
            atom.config.set "Hydrogen.kernelspec", "invalid"
            expect(KernelManager.parseKernelSpecSettings()).toEqual({})

    describe "saveKernelSpecs", ->
        it "should not write invalid json strings to settings", ->
            KernelManager.saveKernelSpecs("invalid")
            expect(atom.config.get "Hydrogen.kernelspec").toEqual("")

        it "should not write invalid kernelspecs to json", ->
            KernelManager.saveKernelSpecs('{"invalid": "kernel"}')
            expect(atom.config.get "Hydrogen.kernelspec").toEqual("")

        it "should save kernelspecs to settings", ->
            KernelManager.saveKernelSpecs(firstKernelSpecString)

            config = JSON.parse atom.config.get "Hydrogen.kernelspec"
            expect(config).toEqual(firstKernelSpec)

        it "should add kernelspecs to settings", ->
            atom.config.set "Hydrogen.kernelspec", firstKernelSpecString
            KernelManager.saveKernelSpecs(secondKernelSpecString)
            config = JSON.parse atom.config.get "Hydrogen.kernelspec"

            expect(config.kernelspecs.ijavascript).toEqual(firstKernelSpec.kernelspecs.ijavascript)
            expect(config.kernelspecs.python2).toEqual(secondKernelSpec.kernelspecs.python2)

    describe "getAllKernelSpecs", ->
        it "should return an array with specs", ->
            atom.config.set "Hydrogen.kernelspec", JSON.stringify kernelSpecs
            allKernelSpecs = KernelManager.getAllKernelSpecs()

            expect(allKernelSpecs.length).toEqual(2)
            expect(allKernelSpecs[0]).toEqual(kernelSpecs.kernelspecs.ijavascript.spec)
            expect(allKernelSpecs[1]).toEqual(kernelSpecs.kernelspecs.python2.spec)

    describe "getAllKernelSpecsFor", ->
        it "should return an array with specs for given language", ->
            atom.config.set "Hydrogen.kernelspec", JSON.stringify kernelSpecs
            allKernelSpecsForPython = KernelManager.getAllKernelSpecsFor("python")

            expect(allKernelSpecsForPython.length).toEqual(1)
            expect(allKernelSpecsForPython[0]).toEqual(kernelSpecs.kernelspecs.python2.spec)

        it "should return an empty array", ->
            atom.config.set "Hydrogen.kernelspec", JSON.stringify kernelSpecs
            allKernelSpecsForJulia = KernelManager.getAllKernelSpecsFor("julia")

            expect(allKernelSpecsForJulia).toEqual([])

    describe "getKernelSpecFor", ->
        it "should return spec for given language", ->
            atom.config.set "Hydrogen.kernelspec", JSON.stringify kernelSpecs
            kernelSpecForPython = KernelManager.getKernelSpecFor("python")

            console.log kernelSpecForPython
            expect(kernelSpecForPython).toEqual(kernelSpecs.kernelspecs.python2.spec)

        it "should return undefined", ->
            atom.config.set "Hydrogen.kernelspec", JSON.stringify kernelSpecs
            kernelSpecForJulia = KernelManager.getKernelSpecFor("julia")

            expect(kernelSpecForJulia).toBeUndefined()

    it "should read lower case name from grammar", ->
        grammar = atom.grammars.getGrammars()[0]
        expect(KernelManager.getGrammarLanguageFor grammar).toEqual("null grammar")

    it "should update kernelspecs", ->
        KernelManager.updateKernelSpecs()

        waits(3000)
        runs ->
            kernelspec = JSON.parse atom.config.get "Hydrogen.kernelspec"
            expect(kernelspec).not.toBeUndefined()
            expect(kernelspec.kernelspecs).not.toBeUndefined()
