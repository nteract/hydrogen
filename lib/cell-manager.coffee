escapeStringRegexp = require 'escape-string-regexp'

module.exports = CellManager =
    getCurrentCell: ->
        editor = atom.workspace.getActiveTextEditor()
        buffer = editor.getBuffer()
        start = buffer.getFirstPosition()
        end = buffer.getEndPosition()
        regexString = @getRegexString editor

        unless regexString?
            return [start, end]

        regex = new RegExp regexString
        cursor = editor.getLastCursor().getBufferPosition()

        while cursor.row < end.row and @isComment editor, cursor
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
        editor = atom.workspace.getActiveTextEditor()
        buffer = editor.getBuffer()
        breakpoints = [buffer.getFirstPosition()]

        regexString = @getRegexString editor
        if regexString?
            regex = new RegExp regexString, 'g'
            buffer.scan regex, ({range}) ->
                breakpoints.push range.start

        breakpoints.push buffer.getEndPosition()

        console.log 'CellManager: Breakpoints:', breakpoints

        return breakpoints


    getRegexString: (editor) ->
        scope = editor.getRootScopeDescriptor()

        {commentStartString, commentEndString} =
            editor.languageMode.commentStartAndEndStringsForScope(scope)

        unless commentStartString
            console.log 'CellManager: No comment string defined in root scope'
            return

        escapedCommentStartString =
            escapeStringRegexp commentStartString.trimRight()

        regexString =
            escapedCommentStartString + '(%%| %%| <codecell>| In\[[0-9 ]*\]:?)'

        return regexString


    isComment: (editor, position) ->
        scope = editor.scopeDescriptorForBufferPosition position
        scopeString = scope.getScopeChain()
        return _.includes scopeString, 'comment.line'
