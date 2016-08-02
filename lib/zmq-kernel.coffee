child_process = require 'child_process'
fs = require 'fs'
path = require 'path'

_ = require 'lodash'
jmp = require 'jmp'
uuid = require 'uuid'
zmq = jmp.zmq

Kernel = require './kernel'
InputView = require './input-view'

portfinder = require './find-port'

fileStoragePath = path.join __dirname, '..', 'kernel-configs'
try
    fs.mkdirSync fileStoragePath
catch e
    if e.code isnt 'EEXIST'
        throw e

module.exports =
class ZMQKernel extends Kernel
    @createConnectionFile: (onCreated) ->
        filename = 'kernel-' + uuid.v4() + '.json'
        filepath = path.join fileStoragePath, filename

        portfinder.findMany 5, (ports) ->
            config =
                version: 5
                key: uuid.v4()
                signature_scheme: 'hmac-sha256'
                transport: 'tcp'
                ip: '127.0.0.1'
                hb_port: ports[0]
                control_port: ports[1]
                shell_port: ports[2]
                stdin_port: ports[3]
                iopub_port: ports[4]

            configString = JSON.stringify config
            fs.writeFile filepath, configString, ->
                onCreated filepath, config

    constructor: (kernelSpec, @grammar, @config, @configPath, @onlyConnect = false) ->
        super kernelSpec

        @executionCallbacks = {}

        projectPath = path.dirname(
            atom.workspace.getActiveTextEditor().getPath()
        )

        @_connect()
        if @onlyConnect
            atom.notifications.addInfo 'Using custom kernel connection:',
                detail: @configPath
        else
            commandString = _.head(@kernelSpec.argv)
            args = _.tail(@kernelSpec.argv)
            args = _.map args, (arg) =>
                if arg is '{connection_file}'
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
                    atom.notifications.addInfo @kernelSpec.display_name,
                        detail: data, dismissable: true

            @kernelProcess.stderr.on 'data', (data) =>
                data = data.toString()

                console.log 'Kernel: stderr:', data

                regexp = getKernelNotificationsRegExp()
                if regexp?.test data
                    atom.notifications.addError @kernelSpec.display_name,
                        detail: data, dismissable: true

    _connect: ->
        scheme = @config.signature_scheme.slice 'hmac-'.length
        key = @config.key

        @shellSocket = new jmp.Socket 'dealer', scheme, key
        @controlSocket = new jmp.Socket 'dealer', scheme, key
        @stdinSocket = new jmp.Socket 'dealer', scheme, key
        @ioSocket    = new jmp.Socket 'sub', scheme, key

        id = uuid.v4()
        @shellSocket.identity = 'dealer' + id
        @controlSocket.identity = 'control' + id
        @stdinSocket.identity = 'dealer' + id
        @ioSocket.identity = 'sub' + id

        address = "#{ @config.transport }://#{ @config.ip }:"
        @shellSocket.connect(address + @config.shell_port)
        @controlSocket.connect(address + @config.control_port)
        @ioSocket.connect(address + @config.iopub_port)
        @ioSocket.subscribe('')
        @stdinSocket.connect(address + @config.stdin_port)

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
        console.log 'sending SIGINT'
        unless @onlyConnect
            @kernelProcess.kill('SIGINT')

    # onResults is a callback that may be called multiple times
    # as results come in from the kernel
    _execute: (code, requestId, onResults) ->
        header =
                msg_id: requestId,
                username: '',
                session: '00000000-0000-0000-0000-000000000000',
                msg_type: 'execute_request',
                version: '5.0'

        content =
                code: code
                silent: false
                store_history: true
                user_expressions: {}
                allow_stdin: true

        message =
                header: header
                content: content

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

        column = code.length

        header =
                msg_id: requestId
                username: ''
                session: '00000000-0000-0000-0000-000000000000'
                msg_type: 'complete_request'
                version: '5.0'

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
        console.log 'Kernel.inspect:', code, cursor_pos

        requestId = 'inspect_' + uuid.v4()

        header =
                msg_id: requestId
                username: ''
                session: '00000000-0000-0000-0000-000000000000'
                msg_type: 'inspect_request'
                version: '5.0'

        content =
                code: code
                cursor_pos: cursor_pos
                detail_level: 0

        message =
                header: header
                content: content

        @executionCallbacks[requestId] = onResults

        @shellSocket.send new jmp.Message message

    inputReply: (input) ->
        requestId = 'input_reply_' + uuid.v4()

        header =
                msg_id: requestId
                username: ''
                session: '00000000-0000-0000-0000-000000000000'
                msg_type: 'input_reply'
                version: '5.0'

        content =
                value: input

        message =
                header: header
                content: content

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
                @watchCallbacks.forEach (watchCallback) ->
                    watchCallback()

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
        super
        console.log 'sending shutdown'

        requestId = uuid.v4()

        header =
                msg_id: requestId,
                username: '',
                session: 0,
                msg_type: 'shutdown_request',
                version: '5.0'

        content =
                restart: false

        message =
                header: header
                content: content

        @shellSocket.send new jmp.Message message

        @shellSocket.close()
        @ioSocket.close()

        if @onlyConnect
            detail = 'Shutdown request sent to custom kernel connection in ' +
                @configPath
            atom.notifications.addInfo 'Custom kernel connection:',
                detail: detail

        unless @onlyConnect
            @kernelProcess.kill 'SIGKILL'
