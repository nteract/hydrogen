{SelectListView} = require 'atom-space-pen-views'

class SignalListView extends SelectListView
    initialize: ->
        super
        @onConfirmed = null
        @list.addClass('mark-active')

    getFilterKey: -> 'name'

    destroy: ->
        @cancel()

    viewForItem: (item) ->
        element = document.createElement('li')
        element.textContent = item.name
        element

    cancelled: ->
        @panel?.destroy()
        @panel = null
        @editor = null

    confirmed: (item) ->
        console.log 'Selected command:', item

        if @onConfirmed?
            @onConfirmed(item)
        @cancel()

    attach: ->
        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel(item: this)
        @focusFilterEditor()

    getEmptyMessage: ->
        'No watches found.'

    toggle: ->
        if @panel?
            @cancel()
        else if @editor = atom.workspace.getActiveTextEditor()
            @attach()

module.exports = new SignalListView
