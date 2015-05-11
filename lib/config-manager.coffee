uuid = require 'uuid'
fs = require 'fs'
path = require 'path'

module.exports = ConfigManager =
    startingPort: 4587
    fileStoragePath: __dirname

    writeConfigFile: ->
        filename = 'kernel-' + uuid.v4() + '.json'
        config = @buildConfiguration()
        configString = JSON.stringify config
        filepath = path.join(@fileStoragePath, filename)
        fs.writeFileSync filepath, configString
        return [filepath, config]

    buildConfiguration: ->
        config =
            key: ""
            transport: "tcp"
            ip: "127.0.0.1"
            hb_port: @startingPort
            control_port: @startingPort + 1
            shell_port: @startingPort + 2
            stdin_port: @startingPort + 3
            iopub_port: @startingPort + 4

        @startingPort = @startingPort + 5
        return config
