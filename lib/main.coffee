{CompositeDisposable} = require 'atom'

_ = require 'lodash'

ResultView = require './result-view'
SignalListView = require './signal-list-view'
KernelPicker = require './kernel-picker'
CellManager = require './cell-manager'

Config = require './config'
KernelManager = require './kernel-manager'
Inspector = require './inspector'
AutocompleteProvider = require './autocomplete-provider'

module.exports = Hydrogen =
    config: Config.schema
    subscriptions: null

    kernelManager: null
    inspector: null

    editor: null
    markerBubbleMap: null

    statusBarElement: null
    statusBarTile: null

    activate: (state) ->
        @kernelManager = new KernelManager()
        @inspector = new Inspector @kernelManager

        @editor = atom.workspace.getActiveTextEditor()
        @markerBubbleMap = {}

        @statusBarElement = document.createElement('div')
        @statusBarElement.classList.add('hydrogen')
        @statusBarElement.classList.add('status-container')
        @statusBarElement.onclick = @showKernelCommands.bind this

        @subscriptions = new CompositeDisposable

        @subscriptions.add atom.commands.add 'atom-text-editor',
            'hydrogen:run': => @run()
            'hydrogen:run-all': => @runAll()
            'hydrogen:run-all-above': => @runAllAbove()
            'hydrogen:run-and-move-down': => @run(true)
            'hydrogen:run-cell': => @runCell()
            'hydrogen:run-cell-and-move-down': => @runCell(true)
            'hydrogen:toggle-watches': => @toggleWatchSidebar()
            'hydrogen:select-watch-kernel': => @showWatchKernelPicker()
            'hydrogen:select-kernel': => @showKernelPicker()
            'hydrogen:add-watch': => @watchSidebar.addWatchFromEditor()
            'hydrogen:remove-watch': => @watchSidebar.removeWatch()
            'hydrogen:update-kernels': => @kernelManager.updateKernelSpecs()
            'hydrogen:toggle-inspector': => @inspector.toggle()
            'hydrogen:interrupt-kernel': =>
                @handleKernelCommand command: 'interrupt-kernel'
            'hydrogen:restart-kernel': =>
                @handleKernelCommand command: 'restart-kernel'

        @subscriptions.add atom.commands.add 'atom-workspace',
            'hydrogen:clear-results': => @clearResultBubbles()

        @subscriptions.add atom.workspace.observeActivePaneItem (item) =>
            if item and item is atom.workspace.getActiveTextEditor()
                @editor = item
                @setStatusBarElement()


    deactivate: ->
        @subscriptions.dispose()
        @kernelManager.destroy()
        @statusBarTile.destroy()


    consumeStatusBar: (statusBar) ->
        @statusBarTile = statusBar.addLeftTile
            item: @statusBarElement, priority: 100


    provide: ->
        if atom.config.get('Hydrogen.autocomplete') is true
            return AutocompleteProvider @kernelManager


    showKernelCommands: ->
        unless @signalListView?
            @signalListView = new SignalListView @kernelManager
            @signalListView.onConfirmed = (kernelCommand) =>
                @handleKernelCommand kernelCommand
        @signalListView.toggle()


    handleKernelCommand: ({kernel, command, grammar, language, kernelSpec}) ->
        console.log 'handleKernelCommand:', arguments

        unless grammar
            grammar = @editor.getGrammar()
        unless language
            language = @kernelManager.getLanguageFor grammar
        unless kernel
            kernel = @kernelManager.getRunningKernelFor language

        errorMessage = "No running kernel for language `#{language}` found"

        if command is 'interrupt-kernel'
            unless kernel
                atom.notifications.addError errorMessage
                return
            kernel.interrupt()

        else if command is 'restart-kernel'
            unless kernel
                atom.notifications.addError errorMessage
                return
            kernelSpec = kernel.kernelSpec
            @kernelManager.destroyRunningKernel kernel
            @clearResultBubbles()
            @kernelManager.startKernel kernelSpec, grammar, =>
                @setStatusBarElement()

        else if command is 'switch-kernel'
            if kernel
                @kernelManager.destroyRunningKernel kernel
            @clearResultBubbles()
            @kernelManager.startKernel kernelSpec, grammar, =>
                @setStatusBarElement()


    getCurrentKernel: ->
        grammar = @editor.getGrammar()
        language = @kernelManager.getLanguageFor grammar
        kernel = @kernelManager.getRunningKernelFor language

        return {grammar, language, kernel}


    createResultBubble: (code, row) ->
        {kernel, grammar} = @getCurrentKernel()

        if kernel
            @_createResultBubble kernel, code, row
            return

        @kernelManager.startKernelFor grammar, (kernel) =>
            @setStatusBarElement()
            @_createResultBubble kernel, code, row


    _createResultBubble: (kernel, code, row) ->
        unless @watchSidebar?
            @setWatchSidebar kernel.watchSidebar
        else if @watchSidebar.element.contains document.activeElement
            @watchSidebar.run()
            return

        @clearBubblesOnRow row
        view = @insertResultBubble row
        kernel.execute code, (result) ->
            view.spin false
            view.addResult result


    insertResultBubble: (row) ->
        buffer = @editor.getBuffer()
        lineLength = buffer.lineLengthForRow(row)

        marker = @editor.markBufferPosition
            row: row
            column: lineLength
        ,
            invalidate: 'touch'

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
            console.log 'marker.onDidChange:', marker
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

    run: (moveDown = false) ->
        codeBlock = @findCodeBlock()
        unless codeBlock?
            return

        [code, row] = codeBlock
        if code? and row?
            if moveDown is true
                @moveDown row
            @createResultBubble code, row

    runAll: ->
        code = @editor.getText()
        row = @escapeBlankRows 0, @editor.getLastBufferRow()
        @createResultBubble code, row


    runAllAbove: ->
        cursor = @editor.getLastCursor()
        row = @escapeBlankRows 0, cursor.getBufferRow()
        code = @getRows(0, row)

        if code? and row?
            @createResultBubble code, row

    runCell: (moveDown = false) ->
        [startRow, endRow] = CellManager.getCurrentCell()
        endRow = @escapeBlankRows startRow, endRow
        code = @getRows(startRow, endRow)

        if code?
            if moveDown is true
                @moveDown endRow
            @createResultBubble code, endRow

    escapeBlankRows: (startRow, endRow) ->
        if endRow > startRow
            for i in [startRow .. endRow - 1] when @blank(endRow)
                endRow -= 1
        return endRow

    removeStatusBarElement: ->
        unless @statusBarElement?
            console.error 'removeStatusBarElement: there is no status bar'
            return

        while @statusBarElement.hasChildNodes()
            @statusBarElement.removeChild @statusBarElement.lastChild

    setStatusBarElement: ->
        unless @statusBarElement?
            console.error 'setStatusBarElement: there is no status bar'
            return

        @removeStatusBarElement()

        {kernel} = @getCurrentKernel()

        if kernel?
            @statusBarElement.appendChild kernel.statusView.getElement()

    hideWatchSidebar: ->
        unless @watchSidebar?
            console.log 'hideWatchSidebar: there is no sidebar'
            return

        @watchSidebar.hide()

    showWatchSidebar: ->
        unless @watchSidebar?
            console.log 'showWatchSidebar: there is no sidebar'
            return

        @watchSidebar.show()

    toggleWatchSidebar: ->
        if @watchSidebar?.visible
            console.log 'toggleWatchSidebar: hiding sidebar'
            @watchSidebar.hide()
        else
            console.log 'toggleWatchSidebar: showing sidebar'
            @watchSidebar.show()

    setWatchSidebar: (sidebar) ->
        console.log 'setting watch sidebar'
        if @watchSidebar isnt sidebar and @watchSidebar?.visible
            @watchSidebar.hide()
            @watchSidebar = sidebar
            @watchSidebar.show()
        else
            @watchSidebar = sidebar

    showKernelPicker: ->
        unless @kernelPicker?
            @kernelPicker = new KernelPicker @kernelManager, (callback) =>
                grammar = @editor.getGrammar()
                language = @kernelManager.getLanguageFor grammar
                @kernelManager.getAllKernelSpecsFor language, (kernelSpecs) ->
                    callback kernelSpecs
            @kernelPicker.onConfirmed = ({kernelSpec}) =>
                @handleKernelCommand
                    command: 'switch-kernel'
                    grammar: grammar
                    language: language
                    kernelSpec: kernelSpec
        @kernelPicker.toggle()


    showWatchKernelPicker: ->
        unless @watchKernelPicker?
            @watchKernelPicker = new KernelPicker null, (callback) =>
                kernels = @kernelManager.getAllRunningKernels()
                kernelSpecs = _.map kernels, 'kernelSpec'
                callback kernelSpecs
            @watchKernelPicker.onConfirmed = (command) =>
                kernelSpec = command.kernelSpec
                kernels = _.filter @kernelManager.getAllRunningKernels(), (k) ->
                    k.kernelSpec is kernelSpec
                kernel = kernels[0]
                if kernel
                    @setWatchSidebar kernel.watchSidebar
                    @watchSidebar.show()
        @watchKernelPicker.toggle()

    findCodeBlock: ->
        buffer = @editor.getBuffer()
        selectedText = @editor.getSelectedText()

        if selectedText
            selectedRange = @editor.getSelectedBufferRange()
            endRow = selectedRange.end.row
            if selectedRange.end.column is 0
                endRow = endRow - 1
            while @blank(endRow) and endRow > selectedRange.start.row
                endRow = endRow - 1
            return [selectedText, endRow]

        cursor = @editor.getLastCursor()

        row = cursor.getBufferRow()
        console.log 'findCodeBlock:', row

        indentLevel = cursor.getIndentLevel()

        foldable = @editor.isFoldableAtBufferRow(row)
        foldRange = @editor.languageMode.rowRangeForCodeFoldAtBufferRow(row)
        if not foldRange? or not foldRange[0]? or not foldRange[1]?
            foldable = false

        if foldable
            return @getFoldContents(row)
        else if @blank(row)
            return @findPrecedingBlock(row, indentLevel)
        else if @getRow(row).trim() is 'end'
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
            isEnd = @getRow(previousRow).trim() is 'end'

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
        if @getRow(range[1] + 1).trim() is 'end'
            range[1] = range[1] + 1
        console.log 'getFoldRange:', range
        return range

    getFoldContents: (row) ->
        buffer = @editor.getBuffer()
        range = @getFoldRange(@editor, row)
        return [
                @getRows(range[0], range[1]),
                range[1]
            ]
