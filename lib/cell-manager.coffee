escapeStringRegexp = require 'escape-string-regexp'

module.exports = CellManager =
    getCurrentCell: ->
        editor = atom.workspace.getActiveTextEditor()
        buffer = editor.getBuffer()
        scope = editor.getRootScopeDescriptor()

        {row, column} = editor.getLastCursor().getBufferPosition()
        start = 0
        end = editor.getLastBufferRow()

        {commentStartString, commentEndString} =
            editor.languageMode.commentStartAndEndStringsForScope(scope)

        unless commentStartString
            console.log 'CellManager: No comment string defined in root scope'
            return

        escapedCommentStartString =
            escapeStringRegexp commentStartString.trimRight()
        regex = new RegExp(
            escapedCommentStartString + '(%%| %%| <codecell>| In\[[0-9 ]+\]:)'
        )

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
