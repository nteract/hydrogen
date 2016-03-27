_ = require 'lodash'

module.exports = CellManager =
    editor: atom.workspace.getActiveTextEditor()

    removeAllBreakPoints: ->
        decorations = @editor.getLineNumberDecorations({class: 'break-point'})
        for decoration in decorations
            decoration.marker.destroy()

    removeLatestBreakPoint: ->
        decorations = @editor.getLineNumberDecorations({class: 'break-point'})
        if decorations.length isnt 0
            _.last(decorations).marker.destroy()

    addBreakPoint: ->
        row = @editor.getLastCursor().getBufferRow()

        marker = @editor.markBufferPosition {
            row: row
            column: 0
        }, {
            invalidate: 'never'
        }
        @editor.decorateMarker marker,
            type: 'line-number'
            class: 'break-point'

    getCurrentCell: ->
        row = @editor.getLastCursor().getBufferRow()
        decorations = @editor.getLineNumberDecorations({class: 'break-point'})
        breakPoints = []
        for decoration in decorations
            breakPoints.push(decoration.marker.getStartBufferPosition()['row'])

        endArr = breakPoints.filter (x) -> x >= row
        startArr = breakPoints.filter (x) -> x < row

        if startArr.length is 0
            start = 0
        else
            start = Math.max(startArr...) + 1

        if endArr.length is 0
            end = @editor.getLastBufferRow()
        else
            end = Math.min(endArr...)

        console.log "CellManager: Cell [start, end]:", [start, end]
        return [start, end]
