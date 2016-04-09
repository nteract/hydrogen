{CompositeDisposable} = require 'atom'

_ = require 'lodash'


Config = require './config'
KernelManager = require './kernel-manager'
ResultView = require './result-view'
SignalListView = require './signal-list-view'
WatchSidebar = require './watch-sidebar'
WatchLanguagePicker = require './watch-language-picker'
AutocompleteProvider = require './autocomplete-provider'
Inspector = require './inspector'

module.exports = Hydrogen =
    config: Config.schema

    subscriptions: null

    statusBarElement: null
    statusBarTile: null

    editor: null
    markerBubbleMap: {}

    activate: (state) ->
        @subscriptions = new CompositeDisposable

        @subscriptions.add atom.commands.add 'atom-text-editor',
            'hydrogen:run': => @run()
            'hydrogen:run-all': => @runAll()
            'hydrogen:run-all-above': => @runAllAbove()
            'hydrogen:run-and-move-down': => @runAndMoveDown()
            'hydrogen:show-kernel-commands': => @showKernelCommands()
            'hydrogen:toggle-watches': => @toggleWatchSidebar()
            'hydrogen:select-watch-kernel': => @showWatchLanguagePicker()
            'hydrogen:add-watch': => @watchSidebar.addWatchFromEditor()
            'hydrogen:remove-watch': => @watchSidebar.removeWatch()
            'hydrogen:update-kernels': -> KernelManager.updateKernels()
            'hydrogen:inspect': -> Inspector.inspect()

        @subscriptions.add atom.commands.add 'atom-workspace',
            'hydrogen:clear-results': => @clearResultBubbles()
            'hydrogen:toggle-inspector-size': -> Inspector.toggleInspectorSize()
            'hydrogen:close-inspector': -> Inspector.closeInspector()

        @subscriptions.add(atom.workspace.observeActivePaneItem(
            @updateCurrentEditor.bind(this)))

        @editor = atom.workspace.getActiveTextEditor()


    deactivate: ->
        @subscriptions.dispose()
        KernelManager.destroy()
        @statusBarTile.destroy()

    consumeStatusBar: (statusBar) ->
        console.log "making status bar"
        @statusBarElement = document.createElement('div')
        @statusBarElement.classList.add('hydrogen')
        @statusBarElement.classList.add('status-container')
        @statusBarElement.onclick = ->
            editorView = atom.views.getView atom.workspace.getActiveTextEditor()
            atom.commands.dispatch(editorView, 'hydrogen:show-kernel-commands')
        @statusBarTile = statusBar.addLeftTile(item: @statusBarElement,
                                               priority: 100)


    provide: ->
        if atom.config.get("Hydrogen.autocomplete") is true
            return AutocompleteProvider

    updateCurrentEditor: (currentPaneItem) ->
        if not currentPaneItem? or currentPaneItem is @editor
            return

        console.log "Updating current editor to:", currentPaneItem

        @editor = currentPaneItem

        language = @editor.getGrammar?()?.name.toLowerCase()
        if language?
            kernel = KernelManager.getRunningKernelForLanguage language

        if kernel?
            @setStatusBarElement kernel.statusView.getElement()
        else
            @removeStatusBarElement()

    showKernelCommands: ->
        unless @signalListView?
            @signalListView = new SignalListView()
            @signalListView.onConfirmed = @handleKernelCommand.bind(this)
        @signalListView.toggle()

    handleKernelCommand: (command) ->
        console.log "handleKernelCommand:", command
        request = command.value
        language = command.language
        grammar = command.grammar
        kernelInfo = command.kernelInfo
        kernel = KernelManager.getRunningKernelForLanguage language

        if request is 'interrupt-kernel'
            kernel?.interrupt()

        else if request is 'restart-kernel'
            KernelManager.destroyRunningKernelForLanguage language
            @clearResultBubbles()
            KernelManager.startKernelIfNeeded language

        else if request is 'switch-kernel'
            KernelManager.destroyRunningKernelForLanguage language
            @clearResultBubbles()

            mapping = {}
            mapping[grammar] = kernelInfo.display_name
            Config.setJson 'grammarToKernel', mapping, true

            KernelManager.startKernel kernelInfo

    createResultBubble: (code, row) ->
        language = @editor.getGrammar().name.toLowerCase()

        KernelManager.startKernelIfNeeded language, (kernel) =>
            unless @watchSidebar?
                @setWatchSidebar kernel.watchSidebar
            else if @watchSidebar.element.contains document.activeElement
                @watchSidebar.run()
                return

            @setStatusBarElement kernel.statusView.getElement()

            @clearBubblesOnRow row
            view = @insertResultBubble row
            kernel.execute code, (result) ->
                view.spin false
                view.addResult result


    insertResultBubble: (row) ->
        buffer = @editor.getBuffer()
        lineLength = buffer.lineLengthForRow(row)

        marker = @editor.markBufferPosition {
            row: row
            column: lineLength
        }, {
            invalidate: 'touch'
        }

        view = new ResultView(marker)
        view.spin(true)
        element = view.getElement()

        lineHeight = @editor.getLineHeightInPixels()
        view.spinner.setAttribute('style',
                "width: #{lineHeight + 2}px; height: #{lineHeight - 4}px;")
        view.statusContainer.setAttribute('style', "height: #{lineHeight}px")
        element.setAttribute('style',
                "margin-left: #{lineLength + 1}ch;
                margin-top: -#{lineHeight}px")

        @editor.decorateMarker marker,
            type: 'block'
            item: element
            position: 'after'

        @markerBubbleMap[marker.id] = view
        marker.onDidChange (event) =>
            console.log "Invoked onDidChange:", marker
            if not event.isValid
                view.destroy()
                marker.destroy()
                delete @markerBubbleMap[marker.id]
            else
                if not element.classList.contains('multiline')
                    lineLength = marker.getStartBufferPosition()['column']
                    element.setAttribute('style',
                            "margin-left: #{lineLength + 1}ch;
                            margin-top: -#{lineHeight}px")

        return view


    clearResultBubbles: ->
        _.forEach @markerBubbleMap, (bubble) -> bubble.destroy()
        @markerBubbleMap = {}


    clearBubblesOnRow: (row) ->
        buffer = @editor.getBuffer()
        _.forEach buffer.findMarkers({endRow: row}), (marker) =>
            if @markerBubbleMap[marker.id]?
                @markerBubbleMap[marker.id].destroy()
                delete @markerBubbleMap[marker.id]


    moveDown: (row) ->
        lastRow = @editor.getLastBufferRow()

        if row >= lastRow
            @editor.moveToBottom()
            @editor.insertNewline()
            return

        while row < lastRow
            row++
            break if not @blank(row)

        @editor.setCursorBufferPosition
            row: row
            column: 0


    run: () ->
        codeBlock = @findCodeBlock()
        unless codeBlock?
            return

        [code, row] = codeBlock
        if code? and row?
            @createResultBubble code, row


    runAll: () ->
        code = @editor.getText()
        row = @editor.getLastBufferRow()
        if row > 0
            for i in [0 .. row - 1] when @blank(row)
                row -= 1
        @createResultBubble code, row


    runAllAbove: () ->
        codeBlock = @findCodeBlock(true)
        unless codeBlock?
            return

        [code, row] = codeBlock
        if code? and row?
            @createResultBubble code, row


    runAndMoveDown: () ->
        codeBlock = @findCodeBlock()
        unless codeBlock?
            return

        [code, row] = codeBlock
        if code? and row?
            @createResultBubble code, row
            @moveDown row


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

    hideWatchSidebar: ->
        console.log "hiding watch sidebar"
        if @watchSidebar?
            console.log "there is a sidebar to hide"
            @watchSidebar.hide()

    showWatchSidebar: ->
        console.log "showing watch sidebar"
        if @watchSidebar?
            @watchSidebar.show()

    toggleWatchSidebar: ->
        if @watchSidebar? and @watchSidebar.visible
            @watchSidebar.hide()
        else
            @watchSidebar.show()

    setWatchSidebar: (sidebar) ->
        console.log "setting watch sidebar"
        if @watchSidebar? and @watchSidebar != sidebar and @watchSidebar.visible
            @watchSidebar.hide()
            @watchSidebar = sidebar
            @watchSidebar.show()
        else
            @watchSidebar = sidebar

    showWatchLanguagePicker: ->
        unless @watchLanguagePicker?
            @watchLanguagePicker = new WatchLanguagePicker()
            @watchLanguagePicker.onConfirmed =
                    @handleWatchLanguageCommand.bind(this)
        @watchLanguagePicker.toggle()

    handleWatchLanguageCommand: (command) ->
        kernel = KernelManager.getRunningKernelForLanguage(command.value)
        @setWatchSidebar(kernel.watchSidebar)

    # updateWatches: ->
    #     if @watchSidebar?
    #         @watchSidebar.run()

    findCodeBlock: (runAllAbove = false) ->
        buffer = @editor.getBuffer()
        selectedText = @editor.getSelectedText()

        if selectedText != ''
            selectedRange = @editor.getSelectedBufferRange()
            endRow = selectedRange.end.row
            if selectedRange.end.column is 0
                endRow = endRow - 1
            while @blank(endRow) and endRow > selectedRange.start.row
                endRow = endRow - 1
            return [selectedText, endRow]

        cursor = @editor.getLastCursor()

        row = cursor.getBufferRow()
        console.log "row:", row

        if runAllAbove
            if row > 0
                for i in [0 .. row - 1] when @blank(row)
                    row -= 1
            return [@getRows(0, row), row]

        indentLevel = cursor.getIndentLevel()
        # indentLevel = @editor.suggestedIndentForBufferRow row

        foldable = @editor.isFoldableAtBufferRow(row)
        foldRange = @editor.languageMode.rowRangeForCodeFoldAtBufferRow(row)
        if not foldRange? or not foldRange[0]? or not foldRange[1]?
            foldable = false

        if foldable
            return @getFoldContents(row)
        else if @blank(row)
            return @findPrecedingBlock(row, indentLevel)
        else if @getRow(row).trim() == "end"
            return @findPrecedingBlock(row, indentLevel)
        else
            return [@getRow(row), row]

    findPrecedingBlock: (row, indentLevel) ->
        buffer = @editor.getBuffer()
        previousRow = row - 1
        while previousRow >= 0
            previousIndentLevel = @editor.indentationForBufferRow previousRow
            sameIndent = previousIndentLevel <= indentLevel
            blank = @blank(previousRow)
            isEnd = @getRow(previousRow).trim() == "end"

            if @blank(row)
                row = previousRow
            if sameIndent and not blank and not isEnd
                return [@getRows(previousRow, row), row]
            previousRow--
        return null

    blank: (row) ->
        return @editor.getBuffer().isRowBlank(row) or
               @editor.languageMode.isLineCommentedAtBufferRow(row)

    getRow: (row) ->
        buffer = @editor.getBuffer()
        return buffer.getTextInRange
            start:
                row: row
                column: 0
            end:
                row: row
                column: 9999999

    getRows: (startRow, endRow) ->
        buffer = @editor.getBuffer()
        return buffer.getTextInRange
            start:
                row: startRow
                column: 0
            end:
                row: endRow
                column: 9999999

    getFoldRange: (editor, row) ->
        range = editor.languageMode.rowRangeForCodeFoldAtBufferRow(row)
        if @getRow(range[1] + 1).trim() == 'end'
            range[1] = range[1] + 1
        console.log "fold range:", range
        return range

    getFoldContents: (row) ->
        buffer = @editor.getBuffer()
        range = @getFoldRange(@editor, row)
        return [
                @getRows(range[0], range[1]),
                range[1]
            ]
