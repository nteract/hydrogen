{$, TextEditorView, View} = require 'atom-space-pen-views'

module.exports =
class RenameView extends View
    @content: (@prompt) ->
        @div =>
            @label @prompt, class: 'icon icon-arrow-right', outlet: 'promptText'
            @subview 'miniEditor', new TextEditorView(mini: true)

    initialize: (@prompt, @default, @onConfirmed) ->
        atom.commands.add @element,
            'core:confirm': @confirm
            'core:cancel': @cancel

        @miniEditor.on 'blur', (e) =>
            @cancel() unless not document.hasFocus()

        @miniEditor.setText(@default)

    storeFocusedElement: ->
        @previouslyFocusedElement = $(document.activeElement)

    restoreFocus: ->
        @previouslyFocusedElement?.focus()

    confirm: =>
        text = @miniEditor.getText()
        @onConfirmed?(text)
        @cancel()

    cancel: =>
        @panel?.destroy()
        @panel = null
        @restoreFocus()

    attach: ->
        @storeFocusedElement()
        @panel = atom.workspace.addModalPanel(item: @element)
        @miniEditor.focus()
        @miniEditor.getModel().scrollToCursorPosition()
