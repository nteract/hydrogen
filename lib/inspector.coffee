convertAnsi = require 'ansi-to-html'
{MessagePanelView, PlainMessageView} = require 'atom-message-panel'

KernelManager = require './kernel-manager'

module.exports = Inspector =
    inspect: ->
        @editor = atom.workspace.getActiveTextEditor()
        language = @editor.getGrammar().name.toLowerCase()

        [code, cursor_pos] = @getCodeToInspect()

        KernelManager.inspect language, code, cursor_pos, (result) =>
            console.log 'inspect result:', result
            found = result['found']
            if found is true
                if not @convert?
                    @convert = new convertAnsi()
                data = result['data']
                lines = data['text/plain'].split('\n')
                firstline = @convert.toHtml(lines[0])
                lines.splice(0,1)
                message = @convert.toHtml(lines.join('\n'))

                if not @inspector?
                    console.log "Opening Inspector"
                    @inspector = new MessagePanelView
                        title: 'Hydrogen Inspector'
                else
                    @inspector.clear()

                @inspector.attach()
                @inspector.add new PlainMessageView
                    message: firstline
                    className: 'inspect-message'
                    raw: true
                @inspector.add new PlainMessageView
                    message: message
                    className: 'inspect-message'
                    raw: true

            else
                atom.notifications.addInfo("No introspection available!")
                if @inspector
                    @inspector.close()

    getCodeToInspect: ->
        if @editor.getSelectedText() != ''
            code = @editor.getSelectedText()
            cursor_pos = code.length
        else
            cursor = @editor.getLastCursor()
            row = cursor.getBufferRow()
            code = @editor.lineTextForBufferRow(row)
            cursor_pos = cursor.getBufferColumn()
        return [code, cursor_pos]

    toggleInspectorSize: ->
        if @inspector?
            @inspector.toggle()

    closeInspector: ->
        if @inspector?
            @inspector.close()
