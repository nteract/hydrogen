escapeStringRegexp = require 'escape-string-regexp'

module.exports = CellManager =
    getCurrentCell: ->
        editor = atom.workspace.getActiveTextEditor()
        buffer = editor.getBuffer()
        start = 0
        end = editor.getLastBufferRow()
        regexString = @getRegexString editor

        unless regexString?
            return [start, end]

        regex = new RegExp regexString
        {row, column} = editor.getLastCursor().getBufferPosition()

        if row > 0
            range = [[0, 0], [row - 1, 100]]
            buffer.backwardsScanInRange regex, range, ({range}) ->
                start = range.start.row
        else
            start = 0

        range = [[row, 0], [end, 100]]
        buffer.scanInRange regex, range, ({range}) ->
            end = range.start.row

        console.log 'CellManager: Cell [start, end]:', [start, end], 'row:', row

        return [start, end]


    getBreakpoints: ->
        editor = atom.workspace.getActiveTextEditor()
        buffer = editor.getBuffer()
        breakpoints = [0]

        regexString = @getRegexString editor
        if regexString?
            regex = new RegExp regexString, 'g'
            buffer.scan regex, ({range}) ->
                breakpoints.push range.start.row

        breakpoints.push editor.getLastBufferRow()

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
