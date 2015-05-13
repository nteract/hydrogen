# AtomReplView = require './atom-repl-view'
{CompositeDisposable} = require 'atom'

fs = require 'fs'
zmq = require 'zmq'
_ = require 'lodash'

KernelManager = require './kernel-manager'
ConfigManager = require './config-manager'
ResultView = require './result-view'
SignalListView = require './signal-list-view'

module.exports = AtomRepl =
    subscriptions: null
    statusBarElement: null
    statusBarTile: null
    editor: null
    bubbles: []

    activate: (state) ->
        @subscriptions = new CompositeDisposable

        @subscriptions.add atom.commands.add 'atom-text-editor',
            'atom-repl:run': => @run()
            'atom-repl:show-kernel-commands': => @showKernelCommands()

        @subscriptions.add atom.commands.add 'atom-workspace',
            'atom-repl:clear-results': =>
                _.forEach @bubbles, (bubble) -> bubble.destroy()


        @subscriptions.add atom.workspace.observeActivePaneItem(@updateCurrentEditor.bind(this))

    deactivate: ->
        @subscriptions.dispose()
        KernelManager.destroy()
        @statusBarTile.destroy()

    consumeStatusBar: (statusBar) ->
        console.log "making status bar"
        @statusBarElement = document.createElement('div')
        @statusBarElement.classList.add('atom-repl')
        @statusBarElement.classList.add('status-container')
        @statusBarElement.onclick = =>
            editor = atom.workspace.getActiveTextEditor()
            atom.commands.dispatch(atom.views.getView(editor), 'atom-repl:show-kernel-commands')
        @statusBarTile = statusBar.addLeftTile(item: @statusBarElement, priority: 100)

    updateCurrentEditor: (currentPaneItem) ->
        console.log "Updating current editor to:", currentPaneItem
        return if not currentPaneItem? or currentPaneItem is @editor
        @editor = currentPaneItem
        if @editor.getGrammar()?
            language = @editor.getGrammar().name.toLowerCase()

            kernel = KernelManager.getRunningKernelForLanguage(language)
            if kernel?
                @setStatusBarElement(kernel.statusView.getElement())
            else
                @removeStatusBarElement()
        else
            @removeStatusBarElement()

    showKernelCommands: ->
        unless @signalListView?
            @signalListView = new SignalListView()
            @signalListView.onConfirmed = @handleKernelCommand.bind(this)
        @signalListView.toggle()

    handleKernelCommand: (command) ->
        if command.value == 'interrupt-kernel'
            KernelManager.interruptKernelForLanguage(command.language)
        else if command.value == 'restart-kernel'
            KernelManager.destroyKernelForLanguage(command.language)
            @startKernelIfNeeded(command.language)

    insertResultBubble: (editor, row) ->
        buffer = editor.getBuffer()
        lineLength = buffer.lineLengthForRow(row)

        marker = editor.markBufferPosition {
                row: row
                column: lineLength
            }, {
                invalidate: 'touch'
            }

        view = new ResultView(marker)
        view.spin(true)
        element = view.getElement()

        lineHeight = editor.getLineHeightInPixels()
        topOffset = lineHeight + 1
        element.setAttribute('style', "top: -#{topOffset}px;")
        view.spinner.setAttribute('style', "width: #{lineHeight}px; height: #{lineHeight}px;")

        editor.decorateMarker marker, {
                type: 'overlay'
                item: element
                position: 'tail'
            }

        marker.onDidChange (event) ->
            console.log event
            if not event.isValid
                view.destroy()
                marker.destroy()

        @bubbles.push(view)
        return view

    getMessageContents: (msg) ->
        i = 0
        while msg[i].toString('utf8') != '<IDS|MSG>'
            i++
        return msg[i+5].toString('utf8')

    run: ->
        editor = atom.workspace.getActiveEditor()
        language = editor.getGrammar().name.toLowerCase()

        if KernelManager.languageHasKernel(language)
            @startKernelIfNeeded language, (kernel) =>
                statusView = kernel.statusView
                @setStatusBarElement(statusView.getElement())

                [code, row] = @findCodeBlock(editor)
                if code != null
                    view = @insertResultBubble editor, row
                    KernelManager.execute language, code, (result) ->
                        view.spin(false)
                        view.addResult(result)

    removeStatusBarElement: ->
        if @statusBarElement?
            while @statusBarElement.hasChildNodes()
                @statusBarElement.removeChild(@statusBarElement.lastChild)

    setStatusBarElement: (element) ->
        if @statusBarElement?
            @removeStatusBarElement()
            @statusBarElement.appendChild(element)
        else
            console.error "No status bar element. Can't set it."

    startKernelIfNeeded: (language, onStarted) ->
        runningKernel = KernelManager.getRunningKernelForLanguage(language)
        if not runningKernel?
            if KernelManager.languageHasKernel(language)
                kernelInfo = KernelManager.getKernelInfoForLanguage language
                ConfigManager.writeConfigFile (filepath, config) =>
                    kernel = KernelManager.startKernel(kernelInfo, config, filepath)
                    onStarted?(kernel)
            else
                console.error "No kernel for this language!"
        else
            onStarted?(runningKernel)

    findCodeBlock: (editor, row) ->
        buffer = editor.getBuffer()
        selectedText = editor.getSelectedText()

        if selectedText != ''
            selectedRange = editor.getSelectedBufferRange()
            return [selectedText, selectedRange.end.row]

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
        else if @blank(editor, row)
            console.log "blank"
            return @findPrecedingBlock(editor, row, indentLevel)
        else if @getRow(editor, row).trim() == "end"
            console.log "just an end"
            return @findPrecedingBlock(editor, row, indentLevel)
        else
            console.log "this row is it"
            return [@getRow(editor, row), row]

    findPrecedingBlock: (editor, row, indentLevel) ->
        buffer = editor.getBuffer()
        previousRow = row - 1
        while previousRow >= 0
            sameIndent = editor.indentationForBufferRow(previousRow) <= indentLevel
            blank = @blank(editor, previousRow)
            isEnd = @getRow(editor, previousRow).trim() == "end"
            # if blank
                # row = previousRow
            if @blank(editor, row)
                row = previousRow
            if sameIndent and not blank and not isEnd
                return [@getRows(editor, previousRow, row), row]
            previousRow--
        return null

    blank: (editor, row) ->
        return editor.getBuffer().isRowBlank(row) or
               editor.languageMode.isLineCommentedAtBufferRow(row)

    # findPrecedingFoldRange: (editor, row) ->
    #     buffer = editor.getBuffer()
    #     previousRow = row - 1
    #     while previousRow >= 0
    #         if editor.isFoldableAtBufferRow(previousRow)
    #             range = @getFoldRange(editor, previousRow)
    #             return [range[0], range[1] + 1]

    getRow: (editor, row) ->
        buffer = editor.getBuffer()
        return buffer.getTextInRange
                    start:
                        row: row
                        column: 0
                    end:
                        row: row
                        column: 9999999

    getRows: (editor, startRow, endRow) ->
        buffer = editor.getBuffer()
        return buffer.getTextInRange
                    start:
                        row: startRow
                        column: 0
                    end:
                        row: endRow
                        column: 9999999

    getFoldRange: (editor, row) ->
        range = editor.languageMode.rowRangeForCodeFoldAtBufferRow(row)
        if @getRow(editor, range[1] + 1).trim() == 'end'
            range[1] = range[1] + 1
        console.log "fold range:", range
        return range

    getFoldContents: (editor, row) ->
        buffer = editor.getBuffer()
        range = @getFoldRange(editor, row)
        return [
                @getRows(editor, range[0], range[1]),
                range[1]
            ]
