module.exports = CellManager =
    getCurrentCell: ->
        editor = atom.workspace.getActiveTextEditor()
        buffer = editor.getBuffer()
        row = editor.getLastCursor().getBufferRow()
        scope = editor.getRootScopeDescriptor()

        start = 0
        end = editor.getLastBufferRow()

        {commentStartString, commentEndString} =
            editor.languageMode.commentStartAndEndStringsForScope(scope)

        if commentStartString
            regex = new RegExp(commentStartString.trimRight() + '%%| %%| <codecell>| In\[[0-9 ]+\]:')

            buffer.scanInRange regex, [[row + 1, 0], [end, 100]], ({range}) ->
                end = range.start.row

            buffer.backwardsScanInRange regex, [[0, 0], [row, 100]], ({range}) ->
                start = range.start.row

            console.log 'CellManager: Cell [start, end]:', [start, end], 'row:', row
        else
            console.log 'CellManager: No comment string available for this scope'

        return [start, end]
