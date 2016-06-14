uuid = require 'uuid'
fs = require 'fs'
path = require 'path'
child_process = require 'child_process'

portfinder = require './find-port'

module.exports = ConfigManager =
    fileStoragePath: path.join(__dirname, '..', 'kernel-configs')

    writeConfigFile: (onCompleted) ->
        customKernelConnectionPath = path.join atom.project.rootDirectories[0].path, 'hydrogen', 'connection.json'
        fs.access customKernelConnectionPath, (err) =>
            if err?
                try
                    console.log "fileStoragePath: ", @fileStoragePath
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
                    console.log "Creating kernel connection: ", filepath
                    onCompleted filepath, config
            else
                fs.readFile customKernelConnectionPath, 'utf8', (err, data) ->
                    unless err?
                        config = JSON.parse data
                        console.log "Using custom kernel connection: ", customKernelConnectionPath
                        atom.notifications.addInfo 'Custom kernel connection:',
                            detail: "Make sure to manually start the custom kernel that serves the connection in #{customKernelConnectionPath}", dismissable: true
                        onCompleted customKernelConnectionPath, config, true

    buildConfiguration: (ports) ->
        config =
            version: 5
            key: uuid.v4()
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
