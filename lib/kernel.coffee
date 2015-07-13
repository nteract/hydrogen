fs = require 'fs'
path = require 'path'
zmq = require 'zmq'
_ = require 'lodash'
child_process = require 'child_process'
uuid = require 'uuid'

StatusView = require './status-view'
WatchSidebar = require './watch-sidebar'

module.exports =
class Kernel
    constructor: (@kernelInfo, @config, @configPath) ->
        console.log "Kernel info:", @kernelInfo
        console.log "Kernel configuration:", @config
        console.log "Kernel configuration file path:", @configPath
        @language = @kernelInfo.language.toLowerCase()
        @executionCallbacks = {}
        @watchCallbacks = []

        grammar = @getGrammarForLanguage(@language)
        @watchSidebar = new WatchSidebar(this, grammar)
        @statusView = new StatusView(@language)

        projectPath = path.dirname(atom.workspace.getActiveTextEditor().getPath())

        @connect()
        if @language == 'python' and not @kernelInfo.argv?
            commandString = "ipython"
            args = [
                "kernel",
                "--no-secure",
                "--hb=#{@config.hb_port}",
                "--control=#{@config.control_port}",
                "--shell=#{@config.shell_port}",
                "--stdin=#{@config.stdin_port}",
                "--iopub=#{@config.iopub_port}",
                "--colors=NoColor"
                ]

        else
            commandString = _.first(@kernelInfo.argv)
            args = _.rest(@kernelInfo.argv)
            args = _.map args, (arg) =>
                if arg == '{connection_file}'
                    return @configPath
                else
                    return arg

        console.log "launching kernel:", commandString, args
        @kernelProcess = child_process.spawn(commandString, args, {
                cwd: projectPath
            })

        @kernelProcess.stdout.on 'data', (data) ->
            console.log "kernel process received on stdout:", data.toString()
        @kernelProcess.stderr.on 'data', (data) ->
            console.error "kernel process received on stderr:", data.toString()

            # console.log "launching:", commandString
            # @kernelProcess = child_process.exec commandString, (error, stdout, stderr) ->
            #     console.log 'stdout: ', stdout
            #     console.log 'stderr: ', stderr
            #     if error != null
            #         console.log 'exec error: ', error

    connect: ->
        @shellSocket = zmq.socket 'dealer'
        @controlSocket = zmq.socket 'dealer'
        @ioSocket    = zmq.socket 'sub'

        @shellSocket.identity = 'dealer' + @language + process.pid
        @controlSocket.identity = 'control' + @language + process.pid
        @ioSocket.identity = 'sub' + @language + process.pid

        @shellSocket.connect('tcp://127.0.0.1:' + @config.shell_port)
        @controlSocket.connect('tcp://127.0.0.1:' + @config.control_port)
        @ioSocket.connect('tcp://127.0.0.1:' + @config.iopub_port)
        @ioSocket.subscribe('')

        @shellSocket.on 'message', @onShellMessage.bind(this)
        @ioSocket.on 'message', @onIOMessage.bind(this)

    interrupt: ->
        console.log "sending SIGINT"
        @kernelProcess.kill('SIGINT')

    # onResults is a callback that may be called multiple times
    # as results come in from the kernel
    _execute: (code, requestId, onResults) ->
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

    execute: (code, onResults) ->
        requestId = "execute_" + uuid.v4()
        @_execute(code, requestId, onResults)

    executeWatch: (code, onResults) ->
        requestId = "watch_" + uuid.v4()
        @_execute(code, requestId, onResults)

    complete: (code, onResults) ->
        requestId = "complete_" + uuid.v4()

        column = code.length

        console.log "sending completion"
        header = JSON.stringify({
                msg_id: requestId,
                username: "",
                session: 0,
                msg_type: "complete_request",
                version: "5.0"
            })

        contents = JSON.stringify({
                code: code
                text: code
                line: code
                cursor_pos: column
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

    addWatchCallback: (watchCallback) ->
        @watchCallbacks.push(watchCallback)

    onShellMessage: (msgArray...) ->
        message = @parseMessage msgArray
        console.log "shell message:", message

        if _.has(message, ['parent_header', 'msg_id'])
            callback = @executionCallbacks[message.parent_header.msg_id]
        if callback? and _.has(message, ['contents', 'status'])

            if message.contents.status == 'ok'
                if message.type == 'complete_reply'
                    matches = message.contents.matches
                    # matches = _.map matches, (match) -> {text: match}
                    callback(matches)
                else
                    callback {
                        data: 'ok'
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

            if status == 'idle' and _.has(message, ['parent_header', 'msg_id'])
                if message.parent_header.msg_id.startsWith('execute')
                    _.forEach @watchCallbacks, (watchCallback) ->
                        watchCallback()

        if _.has(message, ['parent_header', 'msg_id'])
            callback = @executionCallbacks[message.parent_header.msg_id]
        if callback? and message.parent_header.msg_id?
            resultObject = @getResultObject message
            if resultObject?
                callback(resultObject)

    getResultObject: (message) ->
        if message.type == 'pyout' or
           message.type == 'display_data' or
           message.type == 'execute_result'
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
        else if message.type == 'stdout' or
                message.prefix == 'stdout' or
                message.prefix == 'stream.stdout' or
                message.contents.name == 'stdout'
            return {
                data: message.contents.text ? message.contents.data
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
                prefix: msg[0].toString('utf8')
                header: JSON.parse msg[i+2].toString('utf8')
                parent_header: JSON.parse msg[i+3].toString('utf8')
                metadata: JSON.parse msg[i+4].toString('utf8')
                contents: JSON.parse msg[i+5].toString('utf8')
            }
        msgObject.type = msgObject.header.msg_type
        return msgObject

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

        @kernelProcess.kill('SIGKILL')

    getGrammarForLanguage: (language) ->
        matchingGrammars = atom.grammars.getGrammars().filter (grammar) ->
            grammar != atom.grammars.nullGrammar and
                grammar.name.toLowerCase() == language

        return matchingGrammars[0]
