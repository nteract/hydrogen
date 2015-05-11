AtomReplView = require './atom-repl-view'
{CompositeDisposable} = require 'atom'

fs = require 'fs'
zmq = require 'zmq'
_ = require 'lodash'

KernelManager = require './kernel-manager'
ConfigManager = require './config-manager'

module.exports = AtomRepl =
    atomReplView: null
    subscriptions: null
    shellSocket: null
    ioSocket: null

    activate: (state) ->
        # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        @subscriptions = new CompositeDisposable

        # Register command that toggles this view
        @subscriptions.add atom.commands.add 'atom-workspace', 'atom-repl:run': => @run()

        # @shellSocket = zmq.socket 'dealer'
        # @ioSocket    = zmq.socket 'sub'
        #
        # @shellSocket.identity = 'dealer' + process.pid
        # @ioSocket.identity = 'sub' + process.pid
        #
        # console.log "made sockets"
        #
        # kernel_file_name = 'kernel-5666.json'
        # kernel_file_path = '/Users/will/Library/Jupyter/runtime/' + kernel_file_name
        # kernel_info = JSON.parse fs.readFileSync(kernel_file_path)
        #
        # console.log "parsed config"
        #
        # shell_port = kernel_info.shell_port
        # io_port = kernel_info.iopub_port
        #
        # @shellSocket.connect('tcp://127.0.0.1:' + shell_port)
        # @ioSocket.connect('tcp://127.0.0.1:' + io_port)
        # @ioSocket.subscribe('')
        # console.log "done activating"

        # language = "julia"
        #
        # if not KernelManager.runningKernels[language]?
        #     kernelInfo = KernelManager.getKernelInfoForLanguage language
        #     if kernelInfo?
        #         [filepath, config] = ConfigManager.writeConfigFile()
        #         KernelManager.startKernel(kernelInfo, config, filepath)
        #     else
        #         throw "No kernel for this language!"


    sendExecuteRequest: (code) ->
        console.log "sending execute"
        header = JSON.stringify({
                msg_id: 0,
                username: "will",
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

    deactivate: ->
        @subscriptions.dispose()
        @atomReplView.destroy()

    serialize: ->
        atomReplViewState: @atomReplView.serialize()

    insertResult: (editor, result) ->
        @ioSocket.removeAllListeners()
        cursor = editor.getCursor()
        row = cursor.getBufferRow()
        editor.insertNewlineBelow()
        editor.insertText('# ' + result)
        editor.insertNewlineBelow()

    getMessageContents: (msg) ->
        i = 0
        while msg[i].toString('utf8') != '<IDS|MSG>'
            i++
        return msg[i+5].toString('utf8')

    run: ->
        editor = atom.workspace.getActiveEditor()
        language = editor.getGrammar().name.toLowerCase()

        @startKernelIfNeeded language, =>
            code = @findCodeBlock(editor)
            if code != null
                KernelManager.execute language, code

            # @ioSocket.on 'message', (msg...) =>
            #     if msg[0].toString('utf8') == 'pyout'
            #         responseMessage = @getMessageContents(msg)
            #         response = JSON.parse responseMessage
            #         @insertResult editor, response.data['text/plain']
            #     else if msg[0].toString('utf8') == 'stdout'
            #         responseMessage = @getMessageContents(msg)
            #         response = JSON.parse responseMessage
            #         @insertResult editor, response.data

            # @sendExecuteRequest(text)

    startKernelIfNeeded: (language, onStarted) ->
        if not KernelManager.runningKernels[language]?
            kernelInfo = KernelManager.getKernelInfoForLanguage language
            if kernelInfo?
                ConfigManager.writeConfigFile (filepath, config) ->
                    KernelManager.startKernel(kernelInfo, config, filepath)
                    onStarted()
            else
                throw "No kernel for this language!"
        else
            onStarted()

    findCodeBlock: (editor, row)->
        buffer = editor.getBuffer()
        selectedText = editor.getSelectedText()

        if selectedText != ''
            return selectedText

        cursor = editor.getCursor()

        row ?= cursor.marker.bufferMarker.range.start.row
        console.log "row:", row

        indentLevel = editor.suggestedIndentForBufferRow row

        foldable = editor.isFoldableAtBufferRow(row)
        foldRange = editor.languageMode.rowRangeForCodeFoldAtBufferRow(row)
        if not foldRange? or not foldRange[0]? or not foldRange[1]?
            foldable = false

        if foldable
            console.log "foldable"
            return @getFoldContents(editor, row)
        else if buffer.isRowBlank(row) or editor.languageMode.isLineCommentedAtBufferRow(row)
            console.log "blank"
            return @findPrecedingBlock(editor, row, indentLevel)
        else if @getRow(editor, row).trim() == "end"
            console.log "just an end"
            return @findPrecedingBlock(editor, row, indentLevel)
        else
            console.log "this row is it"
            return @getRow(editor, row)

    findPrecedingBlock: (editor, row, indentLevel) ->
        buffer = editor.getBuffer()
        previousRow = row - 1
        while previousRow >= 0
            sameIndent = editor.indentationForBufferRow(previousRow) <= indentLevel
            console.log "previousRow:", previousRow
            blank = buffer.isRowBlank(previousRow) or editor.languageMode.isLineCommentedAtBufferRow(previousRow)
            console.log "previousRow blank:", blank
            isEnd = @getRow(editor, previousRow).trim() == "end"
            if sameIndent and not blank and not isEnd
                return @getRows(editor, previousRow, row)
            previousRow--
        return null

    # findPrecedingFoldRange: (editor, row) ->
    #     buffer = editor.getBuffer()
    #     previousRow = row - 1
    #     while previousRow >= 0
    #         if editor.isFoldableAtBufferRow(previousRow)
    #             range = @getFoldRange(editor, previousRow)
    #             return [range[0], range[1] + 1]

    getRow: (editor, row) ->
        buffer = editor.getBuffer()
        return buffer.getTextInRange {
                start:
                    row: row
                    column: 0
                end:
                    row: row + 1
                    column: 0
            }

    getRows: (editor, startRow, endRow) ->
        buffer = editor.getBuffer()
        return buffer.getTextInRange {
                start:
                    row: startRow
                    column: 0
                end:
                    row: endRow + 1
                    column: 0
            }

    getFoldRange: (editor, row) ->
        range = editor.languageMode.rowRangeForCodeFoldAtBufferRow(row)
        if @getRow(editor, range[1] + 1).trim == 'end'
            range[1] = range[1] + 1
        return range

    getFoldContents: (editor, row) ->
        buffer = editor.getBuffer()
        range = @getFoldRange(editor, row)
        return @getRows(range[0], range[1])
