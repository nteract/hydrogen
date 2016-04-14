child_process = require 'child_process'
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

        console.log 'Kernel: Spawning:', commandString, args
        @kernelProcess = child_process.spawn commandString, args,
            cwd: projectPath

        getKernelNotificationsRegExp = ->
            try
                pattern = atom.config.get 'Hydrogen.kernelNotifications'
                flags = 'im'
                return new RegExp pattern, flags
            catch err
                return null

        @kernelProcess.stdout.on 'data', (data) =>
            data = data.toString()

            console.log 'Kernel: stdout:', data

            regexp = getKernelNotificationsRegExp()
            if regexp?.test data
                kernelName = @kernelInfo.display_name ? @language
                atom.notifications.addInfo kernelName + ' kernel:',
                    detail: data, dismissable: true

        @kernelProcess.stderr.on 'data', (data) =>
            data = data.toString()

            console.log 'Kernel: stderr:', data

            regexp = getKernelNotificationsRegExp()
            if regexp?.test data
                kernelName = @kernelInfo.display_name ? @language
                atom.notifications.addError kernelName + ' kernel:',
                    detail: data, dismissable: true

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

        try
            @shellSocket.monitor()
            @controlSocket.monitor()
            @ioSocket.monitor()
        catch err
            console.log "Kernel:", err

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
        console.log "shell message:", message

        unless @_isValidMessage message
            return

        msg_id = message.parent_header.msg_id
        if msg_id?
            callback = @executionCallbacks[msg_id]

        unless callback?
            return

        status = message.content.status
        if status is 'error'
            # Drop 'status: error' shell messages, wait for IO messages instead
            return

        if status is 'ok'
            msg_type = message.header.msg_type

            if msg_type is 'execution_reply'
                callback
                    data:   'ok'
                    type:   'text'
                    stream: 'status'

            else if msg_type is 'complete_reply'
                callback message.content.matches

            else if msg_type is 'inspect_reply'
                callback
                    data: message.content.data
                    found: message.content.found

            else
                callback
                    data:   'ok'
                    type:   'text'
                    stream: 'status'


    onIOMessage: (message) ->
        console.log "IO message:", message

        unless @_isValidMessage message
            return

        msg_type = message.header.msg_type

        if msg_type is 'status'
            status = message.content.execution_state
            @statusView.setStatus status

            msg_id = message.parent_header?.msg_id
            if status is 'idle' and msg_id?.startsWith 'execute'
                @watchCallbacks.forEach (watchCallback) ->
                    watchCallback()

        msg_id = message.parent_header.msg_id
        if msg_id?
            callback = @executionCallbacks[msg_id]

        unless callback?
            return

        result = @_parseDisplayIOMessage message

        unless result?
            result = @_parseResultIOMessage message

        unless result?
            result = @_parseErrorIOMessage message

        unless result?
            result = @_parseStreamIOMessage message

        if result?
            callback result


    _isValidMessage: (message) ->
        unless message?
            console.log "Invalid message: null"
            return false

        unless message.content?
            console.log "Invalid message: Missing content"
            return false

        unless message.parent_header?
            console.log "Invalid message: Missing parent_header"
            return false

        unless message.parent_header.msg_id?
            console.log "Invalid message: Missing parent_header.msg_id"
            return false

        unless message.parent_header.msg_type?
            console.log "Invalid message: Missing parent_header.msg_type"
            return false

        unless message.header?
            console.log "Invalid message: Missing header"
            return false

        unless message.header.msg_id?
            console.log "Invalid message: Missing header.msg_id"
            return false

        unless message.header.msg_type?
            console.log "Invalid message: Missing header.msg_type"
            return false

        return true


    _parseDisplayIOMessage: (message) ->
        if message.header.msg_type is 'display_data'
            result = @_parseDataMime message.content.data

        return result


    _parseResultIOMessage: (message) ->
        msg_type = message.header.msg_type

        if msg_type is 'execute_result' or msg_type is 'pyout'
            result = @_parseDataMime message.content.data

        return result


    _parseDataMime: (data) ->
        if data?
            imageMimes = Object.getOwnPropertyNames(data).filter (mime) ->
                return mime.startsWith 'image/'

            if data.hasOwnProperty 'text/html'
                mime = 'text/html'

            else if data.hasOwnProperty 'image/svg+xml'
                mime = 'image/svg+xml'

            else if not (imageMimes.length is 0)
                mime = imageMimes[0]

            else if data.hasOwnProperty 'text/markdown'
                mime = 'text/markdown'

            else if data.hasOwnProperty 'text/latex'
                mime = 'text/latex'

            else if data.hasOwnProperty 'text/plain'
                mime = 'text/plain'

        if mime is 'text/plain'
            result =
                data:
                    'text/plain': data[mime]
                type:   'text'
                stream: 'pyout'
            result.data['text/plain'] = result.data['text/plain'].trim()

        else if mime?
            result =
                data:   {}
                type:   mime
                stream: 'pyout'
            result.data[mime] = data[mime]

        return result


    _parseErrorIOMessage: (message) ->
        msg_type = message.header.msg_type

        if msg_type is 'error' or msg_type == 'pyerr'
            result = @_parseErrorMessage message

        return result


    _parseErrorMessage: (message) ->
        try
            errorString = message.content.traceback.join '\n'
        catch err
            ename = message.content.ename ? ''
            evalue = message.content.evalue ? ''
            errorString = ename + ': ' + evalue

        result =
            data:
                'text/plain': errorString
            type:   'text'
            stream: 'error'

        return result


    _parseStreamIOMessage: (message) ->
        if message.header.msg_type is 'stream'
            result =
                data:
                    'text/plain': message.content.text ? message.content.data
                type:   'text'
                stream: message.content.name

        # For kernels that do not conform to the messaging standard
        else if message.idents is 'stdout' or
                message.idents is 'stream.stdout' or
                message.content.name is 'stdout'
            result =
                data:
                    'text/plain': message.content.text ? message.content.data
                type:   'text'
                stream: 'stdout'

        # For kernels that do not conform to the messaging standard
        else if message.idents is 'stderr' or
                message.idents is 'stream.stderr' or
                message.content.name is 'stderr'
            result =
                data:
                    'text/plain': message.content.text ? message.content.data
                type:   'text'
                stream: 'stderr'

        if result?.data['text/plain']?
            result.data['text/plain'] = result.data['text/plain'].trim()

        return result


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
