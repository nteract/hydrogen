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
        breakpoints = []
        for decoration in decorations
            breakpoints.push(decoration.marker.getStartBufferPosition()['row'])

        endArr = breakpoints.filter (x) -> x >= row
        startArr = breakpoints.filter (x) -> x < row

        if startArr.length is 0
            start = 0
        else
            start = Math.max(startArr...) + 1

        if endArr.length is 0
            end = editor.getLastBufferRow()
        else
            end = Math.min(endArr...)

        console.log "CellManager: Cell [start, end]:", [start, end]
        return [start, end]
