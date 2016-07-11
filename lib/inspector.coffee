{MessagePanelView, PlainMessageView} = require 'atom-message-panel'
transformime = require 'transformime'

module.exports =
class Inspector
    constructor: (@kernelManager) ->
        @editor = atom.workspace.getActiveTextEditor()
        @_lastInspectionResult = ''

    toggle: ->
        @editor = atom.workspace.getActiveTextEditor()
        grammar = @editor.getGrammar()
        language = @kernelManager.getLanguageFor grammar
        kernel = @kernelManager.getRunningKernelFor language
        unless kernel?
            atom.notifications.addInfo 'No kernel running!'
            @view?.close()
            return

        [code, cursor_pos] = @getCodeToInspect()

        kernel.inspect code, cursor_pos, (result) =>
            console.log 'Inspector: Result:', result
            found = result.found
            if found is true
                onInspectResult = ({mimetype, el}) =>
                    lines = el.innerHTML.split('\n')
                    firstline = lines[0]
                    lines.splice(0, 1)
                    message = lines.join('\n')

                    @view ?= new MessagePanelView
                        title: 'Hydrogen Inspector'
                        closeMethod: 'destroy'

                    if @_lastInspectionResult is message and @view.panel?
                        @view?.close()
                    else
                        @addInspectResult(firstline, message)
                        @_lastInspectionResult = message


                onError = (error) ->
                    console.error 'Inspector: Rendering error:', error

                transform(result.data).then onInspectResult, onError

            else
                atom.notifications.addInfo 'No introspection available!'
                @view?.close()

    getCodeToInspect: ->
        if @editor.getSelectedText()
            code = @editor.getSelectedText()
            cursor_pos = code.length
        else
            cursor = @editor.getLastCursor()
            row = cursor.getBufferRow()
            code = @editor.lineTextForBufferRow(row)
            cursor_pos = cursor.getBufferColumn()
        return [code, cursor_pos]

    addInspectResult: (firstline, message) ->
        @view.clear()
        @view.attach()
        @view.add new PlainMessageView
            message: firstline
            className: 'inspect-message'
            raw: true
        @view.add new PlainMessageView
            message: message
            className: 'inspect-message'
            raw: true

transform = transformime.createTransform()
