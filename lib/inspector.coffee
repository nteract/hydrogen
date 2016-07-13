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

        @view ?= new MessagePanelView
            title: 'Hydrogen Inspector'
            closeMethod: 'destroy'

        [code, cursor_pos] = @getCodeToInspect()

        kernel.inspect code, cursor_pos, (result) =>
            @showInspectionResult result

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

    showInspectionResult: (result) ->
        console.log 'Inspector: Result:', result

        unless result.found
            atom.notifications.addInfo 'No introspection available!'
            @view?.close()
            return

        onInspectResult = ({mimetype, el}) =>
            if mimetype is 'text/plain'
                lines = el.innerHTML.split('\n')
                firstline = lines[0]
                lines.splice(0, 1)
                message = lines.join('\n')

                if @_lastInspectionResult is message and @view.panel?
                    @view?.close()
                    return

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

                @_lastInspectionResult = message
                return

            else if mimetype is 'text/html'
                container = document.createElement('div')
                container.appendChild(el)
                message = container.innerHTML
                if @_lastInspectionResult is message and @view.panel?
                    @view?.close()
                    return

                @view.clear()
                @view.attach()
                @view.add new PlainMessageView
                    message: message
                    className: 'inspect-message'
                    raw: true

                @_lastInspectionResult = message
                return

            console.error 'Inspector: Rendering error:', mimetype, el
            atom.notifications.addInfo 'Cannot render introspection result!'
            @view?.close()
            return

        onError = (error) =>
            console.error 'Inspector: Rendering error:', error
            atom.notifications.addInfo 'Cannot render introspection result!'
            @view?.close()

        transform(result.data).then onInspectResult, onError

transform = transformime.createTransform()
