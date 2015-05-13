fs = require 'fs'
path = require 'path'
zmq = require 'zmq'
_ = require 'lodash'
exec = require('child_process').exec
uuid = require 'uuid'

StatusView = require './status-view'

module.exports =
class Kernel
    constructor: (@kernelInfo, @config, @configPath) ->
        @language = @kernelInfo.language.toLowerCase()
        @executionCallbacks = {}
        # @status = ""
        @statusView = new StatusView()

        commandString = ""
        for arg in @kernelInfo.argv
            if arg == '{connection_file}'
                commandString = commandString + @configPath + ' '
            else
                commandString = commandString + arg + ' '

        console.log "launching kernel:", commandString
        @connect()
        exec commandString

        # exec commandString, (error, stdout, stderr) ->
        #     console.log 'stdout: ', stdout
        #     console.log 'stderr: ', stderr
        #     if error != null
        #         console.log 'exec error: ', error

    connect: () ->
        @shellSocket = zmq.socket 'dealer'
        @ioSocket    = zmq.socket 'sub'

        @shellSocket.identity = 'dealer' + @language + process.pid
        @ioSocket.identity = 'sub' + @language + process.pid

        @shellSocket.connect('tcp://127.0.0.1:' + @config.shell_port)
        @ioSocket.connect('tcp://127.0.0.1:' + @config.iopub_port)
        @ioSocket.subscribe('')


        @shellSocket.on 'message', @onShellMessage.bind(this)

        @ioSocket.on 'message', @onIOMessage.bind(this)

    onShellMessage: (msgArray...) ->
        message = @parseMessage msgArray
        console.log "shell message:", message

        if _.has(message, ['parent_header', 'msg_id'])
            callback = @executionCallbacks[message.parent_header.msg_id]
        if callback? and _.has(message, ['contents', 'status'])
            if message.contents.status == 'ok'
                callback {
                    data: "✓"
                    type: 'text'
                    stream: 'status'
                }
            else if message.contents.status == 'error'
                errorString = message.contents.ename
                if message.contents.evalue.length > 0
                    errorString = errorString + "\n" + message.contents.evalue
                callback {
                    data: errorString
                    type: 'text'
                    stream: 'error'
                }


    onIOMessage: (msgArray...) ->
        console.log "IO message"
        _.forEach msgArray, (msg) -> console.log "io:", msg.toString('utf8')

        message = @parseMessage msgArray
        console.log message

        if message.type == 'status'
            status = message.contents.execution_state
            @statusView.setStatus(status)

        if _.has(message, ['parent_header', 'msg_id'])
            callback = @executionCallbacks[message.parent_header.msg_id]
        if callback? and message.parent_header.msg_id?
            resultObject = @getResultObject message
            if resultObject?
                callback(resultObject)

    getResultObject: (message) ->
        if message.type == 'pyout' or message.type == 'display_data'
            if message.contents.data['text/html']?
                return {
                    # data: message.contents.data['image/svg+xml']
                    data: message.contents.data['text/html']
                    type: 'text/html'
                    stream: 'pyout'
                }
            if message.contents.data['image/svg+xml']?
                return {
                    data: message.contents.data['image/svg+xml']
                    type: 'image/svg+xml'
                    stream: 'pyout'
                }

            imageKeys = _.filter _.keys(message.contents.data), (key) ->
                return key.startsWith('image')
            imageKey = imageKeys[0]

            if imageKey?
                return {
                    data: message.contents.data[imageKey]
                    type: imageKey
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
        else if message.type == 'pyerr' or message.type == 'error'
            stack = message.contents.traceback
            stack = _.map stack, (item) -> item.trim()
            stack = stack.join('\n')
            return {
                data: stack
                type: 'text'
                stream: 'error'
            }

    parseMessage: (msg) ->
        i = 0
        while msg[i].toString('utf8') != '<IDS|MSG>'
            i++

        msgObject = {
                # type: msg[0].toString('utf8')
                header: JSON.parse msg[i+2].toString('utf8')
                parent_header: JSON.parse msg[i+3].toString('utf8')
                metadata: JSON.parse msg[i+4].toString('utf8')
                contents: JSON.parse msg[i+5].toString('utf8')
            }
        msgObject.type = msgObject.header.msg_type
        return msgObject

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

    destroy: ->
        requestId = uuid.v4()

        console.log "sending shutdown"
        header = JSON.stringify({
                msg_id: requestId,
                username: "",
                session: 0,
                msg_type: "shutdown_request",
                version: "5.0"
            })

        contents = JSON.stringify({
                restart: false
            })

        message =  [
                '<IDS|MSG>',
                '',
                header,
                '{}',
                '{}',
                contents
            ]
        @shellSocket.send message
        @shellSocket.close()
        @ioSocket.close()
