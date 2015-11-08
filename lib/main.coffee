{CompositeDisposable, Range} = require 'atom'

fs = require 'fs'
zmq = require 'zmq'
_ = require 'lodash'

KernelManager = require './kernel-manager'
ConfigManager = require './config-manager'
ResultView = require './result-view'
SignalListView = require './signal-list-view'
WatchSidebar = require './watch-sidebar'
WatchLanguagePicker = require './watch-language-picker'
AutocompleteProvider = require './autocomplete-provider'

module.exports = Hydrogen =
    config:
        languageMappings:
            title: "Language Mappings"
            description: 'Some packages may change the name of the grammar for
                          a language (e.g. "Python" -> "Python Django"). That
                          leaves Hydrogen unable to figure out what kernel to
                          use for your code.

                          This field should be valid JSON mapping a nonstandard
                          language name to a standard one, e.g.

                          {"Python Django": "python", "Ruby (Rails)": "ruby"}'
            type: 'string'
            default: '{}'
          highlightExecuted:
            title: 'Highlight Executed Code Until Modified'
            description: 'Highlight lines of code that have been executed. The
                          highlight will be removed automatically when the code
                          is modified so you will know your Jupyter context is
                          out of date.'
            type: 'boolean'
            default: false

    subscriptions: null
    statusBarElement: null
    statusBarTile: null
    editor: null
    markerBubbleMap: {}
    highlightMarkerMap: {}

    activate: (state) ->
        @subscriptions = new CompositeDisposable

        @subscriptions.add atom.commands.add 'atom-text-editor',
            'hydrogen:run': => @run()
            'hydrogen:show-kernel-commands': => @showKernelCommands()
            'hydrogen:toggle-watches': => @toggleWatchSidebar()
            'hydrogen:select-watch-kernel': => @showWatchLanguagePicker()
            'hydrogen:add-watch': => @watchSidebar.addWatchFromEditor()
            'hydrogen:remove-watch': => @watchSidebar.removeWatch()

        @subscriptions.add atom.commands.add 'atom-workspace',
            'hydrogen:clear-results': => @clearResultBubbles()

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
        @statusBarElement.onclick = =>
            editorView = atom.views.getView(atom.workspace.getActiveTextEditor())
            atom.commands.dispatch(editorView, 'hydrogen:show-kernel-commands')
        @statusBarTile = statusBar.addLeftTile(item: @statusBarElement,
                                               priority: 100)

    provide: ->
        return AutocompleteProvider

    updateCurrentEditor: (currentPaneItem) ->
        console.log "Updating current editor to:", currentPaneItem
        return if not currentPaneItem? or currentPaneItem is @editor
        @editor = currentPaneItem

        if @editor? and @editor.getGrammar? and @editor.getGrammar()?
            language = @editor.getGrammar().name.toLowerCase()

            kernel = KernelManager.getRunningKernelForLanguage(language)
            if kernel?
                @setStatusBarElement(kernel.statusView.getElement())
                # @setWatchSidebar(kernel.watchSidebar)
            else
                # @hideWatchSidebar()
                # @watchSidebar = null
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
            @clearHighlights()
            @clearResultBubbles()
            @startKernelIfNeeded(command.language)

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
        topOffset = lineHeight
        element.setAttribute('style', "top: -#{topOffset}px;")
        view.spinner.setAttribute('style',
                "width: #{lineHeight + 2}px; height: #{lineHeight - 4}px;")
        view.statusContainer.setAttribute('style', "height: #{lineHeight}px")

        @editor.decorateMarker marker, {
                type: 'overlay'
                item: element
                position: 'tail'
            }

        @markerBubbleMap[marker.id] = view
        marker.onDidChange (event) =>
            console.log event
            if not event.isValid
                view.destroy()
                marker.destroy()
                delete @markerBubbleMap[marker.id]

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

    highlightRange: (range) ->
        marker = @editor.markBufferRange(range, { persistant: false, invalidate: 'touch' })
        decoration = @editor.decorateMarker(marker, { type: 'line', class: 'hydrogen-run' })

        @highlightMarkerMap[marker.id] = marker

        marker.onDidChange (event) =>
            if not event.isValid
                marker.destroy()
                delete @highlightMarkerMap[marker.id]

    clearHighlights: ->
        _.forEach @highlightMarkerMap, (highlight) -> highlight.destroy()
        @highlightMarkerMap = {}

    run: ->
        grammar = @editor.getGrammar()
        language = grammar.name.toLowerCase()

        if language? and KernelManager.languageHasKernel(language)
            @startKernelIfNeeded language, (kernel) =>
                if @watchSidebar? and
                        @watchSidebar.element.contains(document.activeElement)
                    @watchSidebar.run()
                else
                    statusView = kernel.statusView
                    @setStatusBarElement(statusView.getElement())
                    if not @watchSidebar?
                        @setWatchSidebar(kernel.watchSidebar)

                    # if not @watchSidebar?
                        # @watchSidebar = new WatchSidebar(kernel, grammar)
                    # @showWatchSidebar()

                    codeBlock = @findCodeBlock()

                    if codeBlock?
                        [code, range] = codeBlock
                        console.log(range)

                    if code?
                        if atom.config.get('Hydrogen.highlightExecuted')?
                            @highlightRange(range)

                        @clearBubblesOnRow(range.end.row)
                        view = @insertResultBubble(range.end.row)

                        KernelManager.execute language, code, (result) =>
                            view.spin(false)
                            view.addResult(result)
        else
            atom.notifications.addError(
                "No kernel for language `#{language}` found",
                {
                    detail: "Check that the language for this file is set in Atom
                             and that you have a Jupyter kernel installed for it."
                })

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
            if onStarted?
                onStarted(runningKernel)

    findCodeBlock: ->
        buffer = @editor.getBuffer()
        selectedText = @editor.getSelectedText()

        if selectedText != ''
            selectedRange = @editor.getSelectedBufferRange()
            # endRow = selectedRange.end.row
            # if selectedRange.end.column is 0
            #     endRow = endRow - 1
            # while @blank(endRow)
            #     endRow = endRow - 1
            return [selectedText, selectedRange]

        cursor = @editor.getLastCursor()

        row = cursor.getBufferRow()
        console.log "row:", row

        indentLevel = cursor.getIndentLevel()
        # indentLevel = @editor.suggestedIndentForBufferRow row

        foldable = @editor.isFoldableAtBufferRow(row)
        foldRange = @editor.languageMode.rowRangeForCodeFoldAtBufferRow(row)

        if not foldRange? or not foldRange[0]? or not foldRange[1]?
            foldable = false

        if foldable
            console.log('foldable')
            range = @rowRangeToBufferRange(foldRange)
            return [buffer.getTextInRange(range), range]
        else if @blank(row)
            console.log('blank')
            return @findPrecedingBlock(row, indentLevel)
        else if @isEnd(row)
            console.log('end')
            rowRange = @findContainingFoldRange(row)
            range = @rowRangeToBufferRange(rowRange)
            return [buffer.getTextInRange(range), range]
        else
            console.log('other')
            return [@getRowText(row), cursor.getCurrentLineBufferRange()]

    findPrecedingBlock: (row, indentLevel) ->
        buffer = @editor.getBuffer()
        previousRow = row - 1

        while previousRow >= 0
            sameIndent = @editor.indentationForBufferRow(previousRow) <= indentLevel
            blank = @blank(previousRow)
            isEnd = @isEnd(previousRow)

            if @blank(row)
                row = previousRow

            if sameIndent and not blank and not isEnd
                range = new Range([previousRow, 0], [row, 9999999])
                return [buffer.getTextInRange(range), range]

            previousRow--
        return null

    blank: (row) ->
        return @editor.getBuffer().isRowBlank(row) or
               @editor.languageMode.isLineCommentedAtBufferRow(row)

    isEnd: (row) ->
        return @getRowText(row).trim() == "end"

    rowRangeToBufferRange: (rowRange) ->
        return new Range([rowRange[0], 0], [rowRange[1], 9999999])

    getRowText: (row) ->
        return @editor.getBuffer().getTextInRange(new Range([row, 0], [row, 9999999]))

    findContainingFoldRange: (row) ->
        for i in [0..row]
            fold_range = @editor.languageMode.rowRangeForFoldAtBufferRow(row - i)

            return fold_range if fold_range and fold_range[1] >= row

        return null
