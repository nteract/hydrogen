fs = require 'fs'
path = require 'path'
zmq = require 'zmq'
_ = require 'lodash'
exec = require('child_process').exec

class Kernel
    constructor: (@kernelInfo, @config, @configPath) ->
        @language = @kernelInfo.language.toLowerCase()

        commandString = ""
        for arg in @kernelInfo.argv
            if arg == '{connection_file}'
                commandString = commandString + @configPath + ' '
            else
                commandString = commandString + arg + ' '

        console.log "launching kernel:", commandString
        @connect()
        exec commandString, (error, stdout, stderr) ->
            console.log 'stdout: ', stdout
            console.log 'stderr: ', stderr
            if error != null
                console.log 'exec error: ', error

    connect: () ->
        @shellSocket = zmq.socket 'dealer'
        @ioSocket    = zmq.socket 'sub'

        @shellSocket.identity = 'dealer' + @language + process.pid
        @ioSocket.identity = 'sub' + @language + process.pid

        @shellSocket.connect('tcp://127.0.0.1:' + @config.shell_port)
        @ioSocket.connect('tcp://127.0.0.1:' + @config.iopub_port)
        @ioSocket.subscribe('')

        @ioSocket.on('message', (msg...) ->
            console.log "new IO message"
            _.forEach(msg, (item) ->
                console.log "io received:", item.toString('utf8')))

    execute: (code) ->
        console.log "sending execute"
        header = JSON.stringify({
                msg_id: 0,
                username: "",
                session: 0,
                msg_type: "execute_request",
                version: "5.0"
            })

        contents = JSON.stringify({
                code: code
                silent: false
                store_history: true
                user_expressions: {}
                allow_stdin: false
            })

        console.log contents
        @shellSocket.send(
            [
                '<IDS|MSG>',
                '',
                header,
                '{}',
                '{}',
                contents
            ])

module.exports = Kernel
