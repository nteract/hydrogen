# coffeelint: disable = missing_fat_arrows
{CompositeDisposable} = require 'atom'

_ = require 'lodash'

ResultView = require './result-view'
SignalListView = require './signal-list-view'
KernelPicker = require './kernel-picker'
WSKernelPicker = require './ws-kernel-picker'
CodeManager = require './code-manager'

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
    kernel: null
    markerBubbleMap: null

    statusBarElement: null
    statusBarTile: null

    watchSidebar: null
    watchSidebarIsVisible: false

    activate: (state) ->
        @kernelManager = new KernelManager()
        @inspector = new Inspector @kernelManager
        @codeManager = new CodeManager()

        @markerBubbleMap = {}

        @statusBarElement = document.createElement('div')
        @statusBarElement.classList.add('hydrogen')
        @statusBarElement.classList.add('status-container')
        @statusBarElement.onclick = @showKernelCommands.bind this

        @onEditorChanged atom.workspace.getActiveTextEditor()

        @subscriptions = new CompositeDisposable

        @subscriptions.add atom.commands.add 'atom-text-editor',
            'hydrogen:run': => @run()
            'hydrogen:run-all': => @runAll()
            'hydrogen:run-all-above': => @runAllAbove()
            'hydrogen:run-and-move-down': => @run(true)
            'hydrogen:run-cell': => @runCell()
            'hydrogen:run-cell-and-move-down': => @runCell(true)
            'hydrogen:toggle-watches': => @toggleWatchSidebar()
            'hydrogen:select-kernel': => @showKernelPicker()
            'hydrogen:connect-to-remote-kernel': => @showWSKernelPicker()
            'hydrogen:add-watch': =>
                unless @watchSidebarIsVisible
                    @toggleWatchSidebar()
                @watchSidebar?.addWatchFromEditor()
            'hydrogen:remove-watch': =>
                unless @watchSidebarIsVisible
                    @toggleWatchSidebar()
                @watchSidebar?.removeWatch()
            'hydrogen:update-kernels': => @kernelManager.updateKernelSpecs()
            'hydrogen:toggle-inspector': => @inspector.toggle()
            'hydrogen:interrupt-kernel': =>
                @handleKernelCommand command: 'interrupt-kernel'
            'hydrogen:restart-kernel': =>
                @handleKernelCommand command: 'restart-kernel'
            'hydrogen:shutdown-kernel': =>
                @handleKernelCommand command: 'shutdown-kernel'
            'hydrogen:copy-path-to-connection-file': =>
                @copyPathToConnectionFile()

        @subscriptions.add atom.commands.add 'atom-workspace',
            'hydrogen:clear-results': => @clearResultBubbles()

        @subscriptions.add atom.workspace.observeActivePaneItem (item) =>
            if item and item is atom.workspace.getActiveTextEditor()
                @onEditorChanged item


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


    onEditorChanged: (@editor) ->
        if @editor
            grammar = @editor.getGrammar()
            language = @kernelManager.getLanguageFor grammar
            kernel = @kernelManager.getRunningKernelFor language
            @codeManager.editor = @editor

        unless @kernel is kernel
            @onKernelChanged kernel


    onKernelChanged: (@kernel) ->
        @setStatusBar()
        @setWatchSidebar @kernel


    setStatusBar: ->
        unless @statusBarElement?
            console.error 'setStatusBar: there is no status bar'
            return

        @clearStatusBar()

        if @kernel?
            @statusBarElement.appendChild @kernel.statusView.element


    clearStatusBar: ->
        unless @statusBarElement?
            console.error 'clearStatusBar: there is no status bar'
            return

        while @statusBarElement.hasChildNodes()
            @statusBarElement.removeChild @statusBarElement.lastChild


    setWatchSidebar: (kernel) ->
        console.log 'setWatchSidebar:', kernel

        sidebar = kernel?.watchSidebar
        if @watchSidebar is sidebar
            return

        if @watchSidebar?.visible
            @watchSidebar.hide()

        @watchSidebar = sidebar

        if @watchSidebarIsVisible
            @watchSidebar?.show()


    toggleWatchSidebar: ->
        if @watchSidebarIsVisible
            console.log 'toggleWatchSidebar: hiding sidebar'
            @watchSidebarIsVisible = false
            @watchSidebar?.hide()
        else
            console.log 'toggleWatchSidebar: showing sidebar'
            @watchSidebarIsVisible = true
            @watchSidebar?.show()


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

        unless kernel
            message = "No running kernel for language `#{language}` found"
            atom.notifications.addError message
            return

        if command is 'interrupt-kernel'
            kernel.interrupt()

        else if command is 'restart-kernel'
            @clearResultBubbles()
            @kernelManager.restartRunningKernelFor grammar, (kernel) =>
                @onKernelChanged kernel

        else if command is 'shutdown-kernel'
            @clearResultBubbles()
            # Note that destroy alone does not shut down a WSKernel
            kernel.shutdown()
            @kernelManager.destroyRunningKernelFor grammar
            @onKernelChanged()

        else if command is 'switch-kernel'
            @clearResultBubbles()
            @kernelManager.destroyRunningKernelFor grammar
            @kernelManager.startKernel kernelSpec, grammar, (kernel) =>
                @onKernelChanged kernel

        else if command is 'rename-kernel'
            kernel.promptRename?()

        else if command is 'disconnect-kernel'
            @clearResultBubbles()
            @kernelManager.destroyRunningKernelFor grammar
            @onKernelChanged()


    createResultBubble: (code, row) ->
        if @kernel
            @_createResultBubble @kernel, code, row
            return

        @kernelManager.startKernelFor @editor.getGrammar(), (kernel) =>
            @onKernelChanged kernel
            @_createResultBubble kernel, code, row


    _createResultBubble: (kernel, code, row) ->
        if @watchSidebar.element.contains document.activeElement
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
        element = view.element

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
        console.log 'clearBubblesOnRow:', row
        _.forEach @markerBubbleMap, (bubble) =>
            marker = bubble.marker
            range = marker.getBufferRange()
            if range.start.row <= row <= range.end.row
                console.log 'clearBubblesOnRow:', row, bubble
                bubble.destroy()
                delete @markerBubbleMap[marker.id]


    run: (moveDown = false) ->
        codeBlock = @codeManager.findCodeBlock()
        unless codeBlock?
            return

        [code, row] = codeBlock
        if code? and row?
            if moveDown is true
                @codeManager.moveDown row
            @createResultBubble code, row


    runAll: ->
        if @kernel
            @_runAll @kernel
            return

        @kernelManager.startKernelFor @editor.getGrammar(), (kernel) =>
            @onKernelChanged kernel
            @_runAll kernel


    _runAll: (kernel) ->
        breakpoints = @codeManager.getBreakpoints()
        buffer = @editor.getBuffer()
        for i in [1...breakpoints.length]
            start = breakpoints[i - 1]
            end = breakpoints[i]
            code = buffer.getTextInRange [start, end]
            endRow = @codeManager.escapeBlankRows start.row, end.row
            @_createResultBubble kernel, code, endRow


    runAllAbove: ->
        cursor = @editor.getLastCursor()
        row = @codeManager.escapeBlankRows 0, cursor.getBufferRow()
        code = @codeManager.getRows(0, row)

        if code? and row?
            @createResultBubble code, row


    runCell: (moveDown = false) ->
        [start, end] = @codeManager.getCurrentCell()
        buffer = @editor.getBuffer()
        code = buffer.getTextInRange [start, end]
        endRow = @codeManager.escapeBlankRows start.row, end.row

        if code?
            if moveDown is true
                @codeManager.moveDown endRow
            @createResultBubble code, endRow


    showKernelPicker: ->
        unless @kernelPicker?
            @kernelPicker = new KernelPicker (callback) =>
                grammar = @editor.getGrammar()
                language = @kernelManager.getLanguageFor grammar
                @kernelManager.getAllKernelSpecsFor language, (kernelSpecs) ->
                    callback kernelSpecs
            @kernelPicker.onConfirmed = ({kernelSpec}) =>
                @handleKernelCommand
                    command: 'switch-kernel'
                    kernelSpec: kernelSpec
        @kernelPicker.toggle()


    showWSKernelPicker: ->
        unless @wsKernelPicker?
            @wsKernelPicker = new WSKernelPicker (kernel) =>
                @clearResultBubbles()

                grammar = kernel.grammar
                @kernelManager.destroyRunningKernelFor grammar

                @kernelManager.setRunningKernelFor grammar, kernel
                @onKernelChanged kernel

        grammar = @editor.getGrammar()
        language = @kernelManager.getLanguageFor grammar

        @wsKernelPicker.toggle grammar, (kernelSpec) =>
            @kernelManager.kernelSpecProvidesLanguage(kernelSpec, language)


    copyPathToConnectionFile: ->
        grammar = @editor.getGrammar()
        language = @kernelManager.getLanguageFor grammar

        unless @kernel?
            message = "No running kernel for language `#{language}` found"
            atom.notifications.addError message
            return

        connectionFile = @kernel.connectionFile
        unless connectionFile?
            atom.notifications.addError "No connection file for
                #{@kernel.kernelSpec.display_name} kernel found"
            return

        atom.clipboard.write connectionFile
        message = 'Path to connection file copied to clipboard.'
        description = "Use `jupyter console --existing #{connectionFile}` to
            connect to the running kernel."
        atom.notifications.addSuccess message, description: description
