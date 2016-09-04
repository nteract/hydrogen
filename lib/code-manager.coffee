escapeStringRegexp = require 'escape-string-regexp'
_ = require 'lodash'

module.exports =
class CodeManager
    constructor: ->
        @editor = atom.workspace.getActiveTextEditor()


    findCodeBlock: ->
        buffer = @editor.getBuffer()
        selectedText = @editor.getSelectedText()

        if selectedText
            selectedRange = @editor.getSelectedBufferRange()
            endRow = selectedRange.end.row
            if selectedRange.end.column is 0
                endRow = endRow - 1
            endRow = @escapeBlankRows selectedRange.start.row, endRow
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
        else if @isBlank(row)
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
            blank = @isBlank(previousRow)
            isEnd = @getRow(previousRow).trim() is 'end'

            if @isBlank(row)
                row = previousRow
            if sameIndent and not blank and not isEnd
                return [@getRows(previousRow, row), row]
            previousRow--
        return null


    getRow: (row) ->
        return @editor.lineTextForBufferRow row


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


    getCurrentCell: ->
        buffer = @editor.getBuffer()
        start = buffer.getFirstPosition()
        end = buffer.getEndPosition()
        regexString = @getRegexString @editor

        unless regexString?
            return [start, end]

        regex = new RegExp regexString
        cursor = @editor.getLastCursor().getBufferPosition()

        while cursor.row < end.row and @isComment @editor, cursor
            cursor.row += 1
            cursor.column = 0

        if cursor.row > 0
            buffer.backwardsScanInRange regex, [start, cursor], ({range}) ->
                start = range.start

        buffer.scanInRange regex, [cursor, end], ({range}) ->
            end = range.start

        console.log 'CellManager: Cell [start, end]:', [start, end],
            'cursor:', cursor

        return [start, end]


    getBreakpoints: ->
        buffer = @editor.getBuffer()
        breakpoints = [buffer.getFirstPosition()]

        regexString = @getRegexString @editor
        if regexString?
            regex = new RegExp regexString, 'g'
            buffer.scan regex, ({range}) ->
                breakpoints.push range.start

        breakpoints.push buffer.getEndPosition()

        console.log 'CellManager: Breakpoints:', breakpoints

        return breakpoints


    getRegexString: ->
        scope = @editor.getRootScopeDescriptor()

        {commentStartString, commentEndString} = @getCommentStrings(scope)

        unless commentStartString
            console.log 'CellManager: No comment string defined in root scope'
            return

        escapedCommentStartString =
            escapeStringRegexp commentStartString.trimRight()

        regexString =
            escapedCommentStartString + '(%%| %%| <codecell>| In\[[0-9 ]*\]:?)'

        return regexString


    getCommentStrings: (scope) ->
        if parseFloat(atom.getVersion()) <= 1.1
            return @editor.languageMode.commentStartAndEndStringsForScope(scope)
        else
            return @editor.getCommentStrings(scope)


    isComment: (position) ->
        scope = @editor.scopeDescriptorForBufferPosition position
        scopeString = scope.getScopeChain()
        return _.includes scopeString, 'comment.line'


    isBlank: (row) ->
        return @editor.getBuffer().isRowBlank(row) or
               @editor.languageMode.isLineCommentedAtBufferRow(row)


    escapeBlankRows: (startRow, endRow) ->
        if endRow > startRow
            for i in [startRow .. endRow - 1] when @isBlank(endRow)
                endRow -= 1
        return endRow


    moveDown: (row) ->
        lastRow = @editor.getLastBufferRow()

        while row < lastRow
            row++
            break if not @isBlank(row)

        unless row < lastRow
            return

        @editor.setCursorBufferPosition
            row: row
            column: 0
