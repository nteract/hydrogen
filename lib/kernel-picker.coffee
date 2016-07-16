{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

# View to display a list of grammars to apply to the current editor.
module.exports =
class SignalListView extends SelectListView
    initialize: (@kernelManager, @getKernelSpecs) ->
        super

        @selectNonStandardKernel =
            name: 'Select non standard kernel'
            command: 'select-non-standard-kernel'

        @onConfirmed = null
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
        if item.command is 'select-non-standard-kernel'
            @kernelManager.getAllKernelSpecs (kernelSpecs) =>
                allKernelCommands = @parseCommands kernelSpecs

                @setItems _.differenceWith allKernelCommands, @kernelCommands, _.isEqual
        else
            @onConfirmed?(item)
            @cancel()

    attach: ->
        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel(item: this)
        @focusFilterEditor()

        @getKernelSpecs (kernelSpecs) =>
            @kernelCommands = @parseCommands kernelSpecs
            if @kernelManager?
                items = _.concat @kernelCommands, @selectNonStandardKernel
            else
                items = @kernelCommands
            @setItems items

    getEmptyMessage: ->
        'No running kernels found.'

    toggle: ->
        if @panel?
            @cancel()
        else if @editor = atom.workspace.getActiveTextEditor()
            @attach()

    parseCommands: (kernelSpecs) ->
        return _.map kernelSpecs, (kernelSpec) ->
            return {
                name: kernelSpec.display_name
                kernelSpec: kernelSpec
            }
