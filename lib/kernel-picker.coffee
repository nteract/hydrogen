{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

# View to display a list of grammars to apply to the current editor.
module.exports =
class SignalListView extends SelectListView
    initialize: (@getKernels)->
        super



        @onConfirmed = null
        @addClass('watch-language-picker')
        @list.addClass('mark-active')


    getFilterKey: ->
        'name'

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
        @onConfirmed?(item)
        @cancel()

    attach: ->
        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel(item: @)
        @focusFilterEditor()

        @languageOptions = _.map @getKernels(), (kernel) ->
            return {
                name: kernel.display_name or kernel.kernelSpec.display_name
                value: kernel.language
                kernel: kernel
            }

        @setItems(@languageOptions)

    getEmptyMessage: ->
        'No running kernels found.'

    toggle: ->
        if @panel?
            @cancel()
        else if @editor = atom.workspace.getActiveTextEditor()
            @attach()
