child_process = require 'child_process'
path = require 'path'

_ = require 'lodash'
fs = require 'fs'
jmp = require 'jmp'
uuid = require 'uuid'
zmq = jmp.zmq

Kernel = require './kernel'
InputView = require './input-view'

module.exports =
class ZMQKernel extends Kernel
    constructor: (kernelSpec, grammar, @connection, @connectionFile, @kernelProcess) ->
        super kernelSpec, grammar

        @executionCallbacks = {}

        @_connect()

        if @kernelProcess?
            console.log 'ZMQKernel: @kernelProcess:', @kernelProcess

            getKernelNotificationsRegExp = ->
                try
                    pattern = atom.config.get 'Hydrogen.kernelNotifications'
                    flags = 'im'
                    return new RegExp pattern, flags
                catch err
                    return null

            @kernelProcess.stdout.on 'data', (data) =>
                data = data.toString()

                console.log 'ZMQKernel: stdout:', data

                regexp = getKernelNotificationsRegExp()
                if regexp?.test data
                    atom.notifications.addInfo @kernelSpec.display_name,
                        description: data, dismissable: true

            @kernelProcess.stderr.on 'data', (data) =>
                data = data.toString()

                console.log 'ZMQKernel: stderr:', data

                regexp = getKernelNotificationsRegExp()
                if regexp?.test data
                    atom.notifications.addError @kernelSpec.display_name,
                        description: data, dismissable: true
        else
            console.log 'ZMQKernel: connectionFile:', @connectionFile
            atom.notifications.addInfo 'Using an existing kernel connection'


    _connect: ->
        scheme = @connection.signature_scheme.slice 'hmac-'.length
        key = @connection.key

        @shellSocket = new jmp.Socket 'dealer', scheme, key
        @controlSocket = new jmp.Socket 'dealer', scheme, key
        @stdinSocket = new jmp.Socket 'dealer', scheme, key
        @ioSocket = new jmp.Socket 'sub', scheme, key

        id = uuid.v4()
        @shellSocket.identity = 'dealer' + id
        @controlSocket.identity = 'control' + id
        @stdinSocket.identity = 'dealer' + id
        @ioSocket.identity = 'sub' + id

        address = "#{ @connection.transport }://#{ @connection.ip }:"
        @shellSocket.connect(address + @connection.shell_port)
        @controlSocket.connect(address + @connection.control_port)
        @ioSocket.connect(address + @connection.iopub_port)
        @ioSocket.subscribe('')
        @stdinSocket.connect(address + @connection.stdin_port)

        @shellSocket.on 'message', @onShellMessage.bind this
        @ioSocket.on 'message', @onIOMessage.bind this
        @stdinSocket.on 'message', @onStdinMessage.bind this

        @shellSocket.on 'connect', -> console.log 'shellSocket connected'
        @controlSocket.on 'connect', -> console.log 'controlSocket connected'
        @ioSocket.on 'connect', -> console.log 'ioSocket connected'
        @stdinSocket.on 'connect', -> console.log 'stdinSocket connected'

        try
            @shellSocket.monitor()
            @controlSocket.monitor()
            @ioSocket.monitor()
            @stdinSocket.monitor()
        catch err
            console.error 'Kernel:', err


    interrupt: ->
        if @kernelProcess?
            console.log 'ZMQKernel: sending SIGINT'
            @kernelProcess.kill 'SIGINT'
        else
            console.log 'ZMQKernel: cannot interrupt an existing kernel'
            atom.notifications.addWarning 'Cannot interrupt this kernel'


    _kill: ->
        if @kernelProcess?
            console.log 'ZMQKernel: sending SIGKILL'
            @kernelProcess.kill 'SIGKILL'
        else
            console.log 'ZMQKernel: cannot kill an existing kernel'
            atom.notifications.addWarning 'Cannot kill this kernel'


    shutdown: (restart = false) ->
        requestId = 'shutdown_' + uuid.v4()
        message = @_createMessage 'shutdown_request', requestId

        message.content =
            restart: restart

        @shellSocket.send new jmp.Message message


    # onResults is a callback that may be called multiple times
    # as results come in from the kernel
    _execute: (code, requestId, onResults) ->
        message = @_createMessage 'execute_request', requestId

        message.content =
            code: code
            silent: false
            store_history: true
            user_expressions: {}
            allow_stdin: true

        @executionCallbacks[requestId] = onResults

        @shellSocket.send new jmp.Message message


    execute: (code, onResults) ->
        console.log 'Kernel.execute:', code

        requestId = 'execute_' + uuid.v4()
        @_execute(code, requestId, onResults)


    executeWatch: (code, onResults) ->
        console.log 'Kernel.executeWatch:', code

        requestId = 'watch_' + uuid.v4()
        @_execute(code, requestId, onResults)


    complete: (code, onResults) ->
        console.log 'Kernel.complete:', code

        requestId = 'complete_' + uuid.v4()

        message = @_createMessage 'complete_request', requestId

        message.content =
            code: code
            text: code
            line: code
            cursor_pos: code.length

        @executionCallbacks[requestId] = onResults

        @shellSocket.send new jmp.Message message


    inspect: (code, cursor_pos, onResults) ->
        console.log 'Kernel.inspect:', code, cursor_pos

        requestId = 'inspect_' + uuid.v4()

        message = @_createMessage 'inspect_request', requestId

        message.content =
            code: code
            cursor_pos: cursor_pos
            detail_level: 0

        @executionCallbacks[requestId] = onResults

        @shellSocket.send new jmp.Message message

    inputReply: (input) ->
        requestId = 'input_reply_' + uuid.v4()

        message = @_createMessage 'input_reply', requestId

        message.content =
            value: input

        @stdinSocket.send new jmp.Message message


    onShellMessage: (message) ->
        console.log 'shell message:', message

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
                    data: 'ok'
                    type: 'text'
                    stream: 'status'

            else if msg_type is 'complete_reply'
                callback message.content

            else if msg_type is 'inspect_reply'
                callback
                    data: message.content.data
                    found: message.content.found

            else
                callback
                    data: 'ok'
                    type: 'text'
                    stream: 'status'


    onStdinMessage: (message) ->
        console.log 'stdin message:', message

        unless @_isValidMessage message
            return

        msg_type = message.header.msg_type

        if msg_type is 'input_request'
            prompt = message.content.prompt

            inputView = new InputView prompt, (input) =>
                @inputReply input

            inputView.attach()


    onIOMessage: (message) ->
        console.log 'IO message:', message

        unless @_isValidMessage message
            return

        msg_type = message.header.msg_type

        if msg_type is 'status'
            status = message.content.execution_state
            @statusView.setStatus status

            msg_id = message.parent_header?.msg_id
            if status is 'idle' and msg_id?.startsWith 'execute'
                @_callWatchCallbacks()

        msg_id = message.parent_header.msg_id
        if msg_id?
            callback = @executionCallbacks[msg_id]

        unless callback?
            return

        result = @_parseIOMessage message

        if result?
            callback result


    _isValidMessage: (message) ->
        unless message?
            console.log 'Invalid message: null'
            return false

        unless message.content?
            console.log 'Invalid message: Missing content'
            return false

        if message.content.execution_state is 'starting'
            # Kernels send a starting status message with an empty parent_header
            console.log 'Dropped starting status IO message'
            return false

        unless message.parent_header?
            console.log 'Invalid message: Missing parent_header'
            return false

        unless message.parent_header.msg_id?
            console.log 'Invalid message: Missing parent_header.msg_id'
            return false

        unless message.parent_header.msg_type?
            console.log 'Invalid message: Missing parent_header.msg_type'
            return false

        unless message.header?
            console.log 'Invalid message: Missing header'
            return false

        unless message.header.msg_id?
            console.log 'Invalid message: Missing header.msg_id'
            return false

        unless message.header.msg_type?
            console.log 'Invalid message: Missing header.msg_type'
            return false

        return true


    destroy: ->
        console.log 'ZMQKernel: destroy:', this

        @shutdown()

        if @kernelProcess?
            @_kill()
            fs.unlink @connectionFile

        @shellSocket.close()
        @controlSocket.close()
        @ioSocket.close()
        @stdinSocket.close()

        super


    _getUsername: ->
        return process.env.LOGNAME or
            process.env.USER or
            process.env.LNAME or
            process.env.USERNAME


    _createMessage: (msg_type, msg_id = uuid.v4()) ->
        message =
            header:
                username: @_getUsername()
                session: '00000000-0000-0000-0000-000000000000'
                msg_type: msg_type
                msg_id: msg_id
                date: new Date()
                version: '5.0'
            metadata: {}
            parent_header: {}
            content: {}

        return message
