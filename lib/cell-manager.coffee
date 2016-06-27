_ = require 'lodash'

module.exports = CellManager =
    _setBreakpointDecorationAt: (editor, row) ->
        marker = editor.markBufferPosition
            row: row
            column: 0
        ,
            invalidate: 'never'

        editor.decorateMarker marker,
            type: 'line-number'
            class: 'breakpoint'

    _getBreakprointDecorationAt: (editor, row) ->
        decorations = editor
            .getLineNumberDecorations({class: 'breakpoint'})
            .filter (decoration) ->
                return decoration.marker.getStartBufferPosition().row is row
        return decorations[0]

    removeAllBreakpoints: ->
        editor = atom.workspace.getActiveTextEditor()
        decorations = editor.getLineNumberDecorations({class: 'breakpoint'})
        for decoration in decorations
            decoration.marker.destroy()

    toggleBreakpoint: ->
        editor = atom.workspace.getActiveTextEditor()
        row = editor.getLastCursor().getBufferRow()
        decoration = CellManager._getBreakprointDecorationAt editor, row

        if decoration
            decoration.marker.destroy()
            return

        CellManager._setBreakpointDecorationAt editor, row

    getCurrentCell: ->
        editor = atom.workspace.getActiveTextEditor()
        row = editor.getLastCursor().getBufferRow()
        decorations = editor.getLineNumberDecorations({class: 'breakpoint'})

        start = 0
        end = editor.getLastBufferRow()
        for decoration in decorations
            decorationRow = decoration.marker.getStartBufferPosition().row

            if decorationRow >= row
                if (decorationRow < end)
                    end = decorationRow
            else
                if (decorationRow >= start)
                    start = decorationRow + 1

        console.log 'CellManager: Cell [start, end]:', [start, end], 'row:', row
        return [start, end]
