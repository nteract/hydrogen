_ = require 'lodash'

module.exports = CellManager =
    removeAllBreakpoints: ->
        editor = atom.workspace.getActiveTextEditor()
        decorations = editor.getLineNumberDecorations({class: 'breakpoint'})
        for decoration in decorations
            decoration.marker.destroy()

    removeLatestBreakpoint: ->
        editor = atom.workspace.getActiveTextEditor()
        decorations = editor.getLineNumberDecorations({class: 'breakpoint'})
        if decorations.length isnt 0
            _.last(decorations).marker.destroy()

    addBreakpoint: ->
        editor = atom.workspace.getActiveTextEditor()
        row = editor.getLastCursor().getBufferRow()

        marker = editor.markBufferPosition
            row: row
            column: 0
        ,
            invalidate: 'never'

        editor.decorateMarker marker,
            type: 'line-number'
            class: 'breakpoint'

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
