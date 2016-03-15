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
        @shellSocket = zmq.socket 'dealer'
        @controlSocket = zmq.socket 'dealer'
        @ioSocket    = zmq.socket 'sub'

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

    # send a signed Jupyter message (adapted from github.com/n-riesco/jmp)
    signedSend: (message, socket) ->
        encodedMessage =
            idents:        message.idents or []
            signature:     ''
            header:        JSON.stringify message.header
            parent_header: JSON.stringify (message.parent_header or {})
            metadata:      JSON.stringify (message.metadata or {})
            content:       JSON.stringify (message.content or {})

        if (@config.key)
            hmac = crypto.createHmac @config.signature_scheme.slice(5),
                @config.key
            toBuffer = (str) -> new Buffer str, "utf8"
            hmac.update toBuffer encodedMessage.header
            hmac.update toBuffer encodedMessage.parent_header
            hmac.update toBuffer encodedMessage.metadata
            hmac.update toBuffer encodedMessage.content
            encodedMessage.signature = hmac.digest "hex"

        console.log "signedMessage:", encodedMessage

        socket.send encodedMessage.idents.concat [
            '<IDS|MSG>'
            encodedMessage.signature
            encodedMessage.header
            encodedMessage.parent_header
            encodedMessage.metadata
            encodedMessage.content
        ]

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

        @signedSend message, @shellSocket

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

        @signedSend message, @shellSocket


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

        @signedSend message, @shellSocket


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
                else if message.type == 'inspect_reply'
                    callback {
                        data: message.contents.data
                        found: message.contents.found
                    }
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
        message = @parseMessage msgArray
        console.log "IO message:", message

        if message.type == 'error' #TODO; produces to much warning & errors, maybe filter?
            @stderr message.contents.evalue, message.contents.ename

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

        @signedSend message, @shellSocket

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
            throw "No grammar found for language #{language}"
        else
            return matchingGrammars[0]
