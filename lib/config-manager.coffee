uuid = require 'uuid'
fs = require 'fs'
path = require 'path'
child_process = require 'child_process'

portfinder = require './find-port'

module.exports = ConfigManager =
    fileStoragePath: path.join(__dirname, '..', 'kernel-configs')

    writeConfigFile: (onCompleted) ->
        try
            fs.mkdirSync(@fileStoragePath)
        catch e
            if e.code != 'EEXIST'
                throw e
        filename = 'kernel-' + uuid.v4() + '.json'
        portfinder.findMany 5, (ports) =>
            config = @buildConfiguration ports
            configString = JSON.stringify config
            filepath = path.join(@fileStoragePath, filename)
            fs.writeFileSync filepath, configString
            onCompleted filepath, config

    buildConfiguration: (ports) ->
        config =
            version: 5
            key: ""
            signature_scheme: "hmac-sha256"
            transport: "tcp"
            ip: "127.0.0.1"
            hb_port: ports[0]
            control_port: ports[1]
            shell_port: ports[2]
            stdin_port: ports[3]
            iopub_port: ports[4]

        @startingPort = @startingPort + 5
        return config
