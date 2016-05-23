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
    it "should update kernelspecs", ->
        KernelManager.updateKernelSpecs()

        waits(1500)
        runs ->
            kernelspec = JSON.parse atom.config.get "Hydrogen.kernelspec"
            expect(kernelspec).not.toBeUndefined()
            expect(kernelspec.kernelspecs).not.toBeUndefined()
