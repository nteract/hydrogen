child_process = require 'child_process'
crypto = require 'crypto'
fs = require 'fs'
path = require 'path'

_ = require 'lodash'
jmp = require 'jmp'
uuid = require 'uuid'
zmq = jmp.zmq

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

        grammar = @getGrammarForLanguage(@kernelInfo.grammarLanguage)
        @watchSidebar = new WatchSidebar(this, grammar)
        @statusView = new StatusView(@language)

        projectPath = path.dirname(
            atom.workspace.getActiveTextEditor().getPath()
        )

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
        @kernelProcess = child_process.spawn commandString, args,
            cwd: projectPath

        @kernelProcess.stdout.on 'data', (data) ->
            console.log "kernel process received on stdout:", data.toString()
        @kernelProcess.stderr.on 'data', @stderr

    stderr: (data, caption) ->
        detail = data.toString()
        method = 'addInfo'
        if /warning/gi.test detail
            method = 'addWarning'
        if /error/gi.test detail
            method = 'addError'

        console.error "kernel process received on stderr:", detail
        atom.notifications[method] "#{@language} Kernel: #{caption}",
         detail: detail, dismissable: /error/i.test method

    connect: ->
        scheme = @config.signature_scheme.slice 'hmac-'.length
        key = @config.key

        @shellSocket = new jmp.Socket 'dealer', scheme, key
        @controlSocket = new jmp.Socket 'dealer', scheme, key
        @ioSocket    = new jmp.Socket 'sub', scheme, key

        @shellSocket.identity = 'dealer' + @language + process.pid
        @controlSocket.identity = 'control' + @language + process.pid
        @ioSocket.identity = 'sub' + @language + process.pid

        address = "#{ @config.transport }://#{ @config.ip }:"
        @shellSocket.connect(address + @config.shell_port)
        @controlSocket.connect(address + @config.control_port)
        @ioSocket.connect(address + @config.iopub_port)
        @ioSocket.subscribe('')

        @shellSocket.on 'message', @onShellMessage.bind(this)
        @ioSocket.on 'message', @onIOMessage.bind(this)

        @shellSocket.on 'connect', () -> console.log "shellSocket connected"
        @controlSocket.on 'connect', () -> console.log "controlSocket connected"
        @ioSocket.on 'connect', () -> console.log "ioSocket connected"

        @shellSocket.monitor()
        @controlSocket.monitor()
        @ioSocket.monitor()

    interrupt: ->
        console.log "sending SIGINT"
        @kernelProcess.kill('SIGINT')

    # onResults is a callback that may be called multiple times
    # as results come in from the kernel
    _execute: (code, requestId, onResults) ->
        console.log "sending execute"

        header =
                msg_id: requestId,
                username: "",
                session: "00000000-0000-0000-0000-000000000000",
                msg_type: "execute_request",
                version: "5.0"

        content =
                code: code
                silent: false
                store_history: true
                user_expressions: {}
                allow_stdin: false

        message =
                header: header
                content: content

        @executionCallbacks[requestId] = onResults

        @shellSocket.send new jmp.Message message

    execute: (code, onResults) ->
        requestId = "execute_" + uuid.v4()
        @_execute(code, requestId, onResults)

    executeWatch: (code, onResults) ->
        requestId = "watch_" + uuid.v4()
        @_execute(code, requestId, onResults)

    complete: (code, onResults) ->
        console.log "sending completion"

        requestId = "complete_" + uuid.v4()

        column = code.length

        header =
                msg_id: requestId
                username: ""
                session: "00000000-0000-0000-0000-000000000000"
                msg_type: "complete_request"
                version: "5.0"

        content =
                code: code
                text: code
                line: code
                cursor_pos: column

        message =
                header: header
                content: content

        @executionCallbacks[requestId] = onResults

        @shellSocket.send new jmp.Message message


    inspect: (code, cursor_pos, onResults) ->
        console.log "sending inspect"

        requestId = "inspect_" + uuid.v4()

        header =
                msg_id: requestId
                username: ""
                session: "00000000-0000-0000-0000-000000000000"
                msg_type: "inspect_request"
                version: "5.0"

        content =
                code: code
                cursor_pos: cursor_pos
                detail_level : 0

        message =
                header: header
                content: content

        @executionCallbacks[requestId] = onResults

        @shellSocket.send new jmp.Message message


    addWatchCallback: (watchCallback) ->
        @watchCallbacks.push(watchCallback)

    onShellMessage: (message) ->
        message.type = message.header.msg_type

        console.log "shell message:", message

        if _.has(message, ['parent_header', 'msg_id'])
            callback = @executionCallbacks[message.parent_header.msg_id]
        if callback? and _.has(message, ['content', 'status'])

            if message.content.status == 'ok'
                if message.type == 'complete_reply'
                    matches = message.content.matches
                    # matches = _.map matches, (match) -> {text: match}
                    callback(matches)
                else if message.type == 'inspect_reply'
                    callback {
                        data: message.content.data
                        found: message.content.found
                    }
                else
                    callback {
                        data: 'ok'
                        type: 'text'
                        stream: 'status'
                    }

            else if message.content.status == 'error'
                errorString = message.content.ename
                if message.content.evalue.length > 0
                    errorString = errorString + "\n" + message.content.evalue
                callback {
                    data: errorString
                    type: 'text'
                    stream: 'error'
                }


    onIOMessage: (message) ->
        message.type = message.header.msg_type

        console.log "IO message:", message

        if message.type == 'error'
            #TODO; produces to much warning & errors, maybe filter?
            @stderr message.content.evalue, message.content.ename

        if message.type == 'status'
            status = message.content.execution_state
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
            if message.content.data['text/html']?
                return {
                    data: message.content.data['text/html']
                    type: 'text/html'
                    stream: 'pyout'
                }
            if message.content.data['image/svg+xml']?
                return {
                    data: message.content.data['image/svg+xml']
                    type: 'image/svg+xml'
                    stream: 'pyout'
                }

            imageKeys = _.filter _.keys(message.content.data), (key) ->
                return key.startsWith('image')
            imageKey = imageKeys[0]

            if imageKey?
                return {
                    data: message.content.data[imageKey]
                    type: imageKey
                    stream: 'pyout'
                }
            else
                return {
                    data: message.content.data['text/plain']
                    type: 'text'
                    stream: 'pyout'
                }
        else if message.type == 'stdout' or
                message.prefix == 'stdout' or
                message.prefix == 'stream.stdout' or
                message.content.name == 'stdout'
            return {
                data: message.content.text ? message.content.data
                type: 'text'
                stream: 'stdout'
            }
        else if message.type == 'pyerr' or message.type == 'error'
            stack = message.content.traceback
            stack = _.map stack, (item) -> item.trim()
            stack = stack.join('\n')
            return {
                data: stack
                type: 'text'
                stream: 'error'
            }

    destroy: ->
        console.log "sending shutdown"

        requestId = uuid.v4()

        header =
                msg_id: requestId,
                username: "",
                session: 0,
                msg_type: "shutdown_request",
                version: "5.0"

        content =
                restart: false

        message =
                header: header
                content: content

        @shellSocket.send new jmp.Message message

        @shellSocket.close()
        @ioSocket.close()

        @kernelProcess.kill('SIGKILL')

    getGrammarForLanguage: (language) ->
        matchingGrammars = atom.grammars.getGrammars().filter (grammar) ->
            grammar != atom.grammars.nullGrammar and
                grammar.name? and
                grammar.name.toLowerCase? and
                grammar.name.toLowerCase() == language

        if !matchingGrammars[0]?
            throw new Error "No grammar found for language #{language}"
        else
            return matchingGrammars[0]
