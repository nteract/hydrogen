{$, TextEditorView, View} = require 'atom-space-pen-views'

module.exports =
class InputView extends View
    @content: (@prompt) ->
        if @prompt is ''
            @prompt = 'Kernel requires input'
        @div =>
            @label @prompt, class: 'icon icon-arrow-right', outlet: 'promptText'
            @subview 'miniEditor', new TextEditorView(mini: true)

    initialize: (@prompt, @onConfirmed) ->
        atom.commands.add @element,
            'core:confirm': @confirm


    storeFocusedElement: ->
        @previouslyFocusedElement = $(document.activeElement)

    restoreFocus: ->
        @previouslyFocusedElement?.focus()

    confirm: =>
        text = @miniEditor.getText()
        @onConfirmed?(text)
        @close()

    close: =>
        @panel?.destroy()
        @panel = null
        @restoreFocus()

    attach: ->
        @storeFocusedElement()
        @panel = atom.workspace.addModalPanel(item: @element)
        @miniEditor.focus()
        @miniEditor.getModel().scrollToCursorPosition()
