# AtomReplView = require './atom-repl-view'
{CompositeDisposable} = require 'atom'

fs = require 'fs'
zmq = require 'zmq'
_ = require 'lodash'

KernelManager = require './kernel-manager'
ConfigManager = require './config-manager'
ResultView = require './result-view'

module.exports = AtomRepl =
    subscriptions: null
    views: null

    activate: (state) ->
        # Events subscribed to in atom's system can be easily cleaned up
        # with a CompositeDisposable
        @subscriptions = new CompositeDisposable

        # Register command that toggles this view
        @subscriptions.add atom.commands.add 'atom-workspace',
                                             'atom-repl:run': => @run()


    deactivate: ->
        @subscriptions.dispose()
        _.forEach @views, (view) -> view.destroy()

    insertResultBubble: (editor, row) ->

        view = new ResultView()
        element = view.getElement()

        buffer = editor.getBuffer()
        lineLength = buffer.lineLengthForRow(row)

        topOffset = editor.getLineHeightInPixels() + 2
        element.setAttribute('style', 'top: -' + topOffset + 'px;')

        marker = editor.markBufferPosition {
                row: row
                column: lineLength
            }, {
                invalidate: 'touch'
            }
        # marker = editor.markBufferRange {
        #     start:
        #         row: row
        #         column: lineLength
        #     end:
        #         row: row
        #         column: lineLength + 1
        #     }, {
        #         invalidate: 'inside'
        #     }

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

        return view

    getMessageContents: (msg) ->
        i = 0
        while msg[i].toString('utf8') != '<IDS|MSG>'
            i++
        return msg[i+5].toString('utf8')

    run: ->
        editor = atom.workspace.getActiveEditor()
        language = editor.getGrammar().name.toLowerCase()

        @startKernelIfNeeded language, =>
            [code, row] = @findCodeBlock(editor)
            if code != null
                view = @insertResultBubble editor, row
                KernelManager.execute language, code, (result) ->
                    view.addResult(result)

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
