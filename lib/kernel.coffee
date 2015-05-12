fs = require 'fs'
path = require 'path'
zmq = require 'zmq'
_ = require 'lodash'
exec = require('child_process').exec
uuid = require 'uuid'

module.exports =
class Kernel
    constructor: (@kernelInfo, @config, @configPath) ->
        @language = @kernelInfo.language.toLowerCase()
        @executionCallbacks = {}

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

        @ioSocket.on 'message', @onIOMessage.bind(this)

    onIOMessage: (msgArray...) ->
        message = @parseMessage msgArray
        console.log message
        if message.parent_header.msg_id?
            if @executionCallbacks[message.parent_header.msg_id]?
                messageString = @getResultObject message
                if messageString?
                    @executionCallbacks[message.parent_header.msg_id](messageString)

    getResultObject: (message) ->
        if message.type == 'pyout'
            if message.contents.data['text/html']?
                return {
                    # data: message.contents.data['image/svg+xml']
                    data: message.contents.data['text/html']
                    type: 'html'
                    stream: 'pyout'
                }
            else
                return {
                    data: message.contents.data['text/plain']
                    type: 'text'
                    stream: 'pyout'
                }
        else if message.type == 'stdout'
            return {
                data: message.contents.data
                type: 'text'
                stream: 'stdout'
            }
        else if message.type == 'pyerr'
            stack = message.contents.traceback
            stack = _.map stack, (item) -> item.trim()
            stack = stack.join('\n')
            return {
                data: stack
                type: 'text'
                stream: 'pyerr'
            }


    parseMessage: (msg) ->
        i = 0
        while msg[i].toString('utf8') != '<IDS|MSG>'
            i++

        return {
                type: msg[0].toString('utf8')
                header: JSON.parse msg[i+2].toString('utf8')
                parent_header: JSON.parse msg[i+3].toString('utf8')
                metadata: JSON.parse msg[i+4].toString('utf8')
                contents: JSON.parse msg[i+5].toString('utf8')
            }

    # onResults is a callback that may be called multiple times
    # as results come in from the kernel
    execute: (code, onResults) ->
        requestId = uuid.v4()

        console.log "sending execute"
        header = JSON.stringify({
                msg_id: requestId,
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

        message =  [
                '<IDS|MSG>',
                '',
                header,
                '{}',
                '{}',
                contents
            ]
        console.log message

        @executionCallbacks[requestId] = onResults
        @shellSocket.send message
