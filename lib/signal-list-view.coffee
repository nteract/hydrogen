{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

# View to display a list of grammars to apply to the current editor.
module.exports =
class SignalListView extends SelectListView
    initialize: (@kernelManager) ->
        super

        @basicCommands = [
            {
                name: 'Interrupt'
                value: 'interrupt-kernel'
                language: null
            },
            {
                name: 'Restart'
                value: 'restart-kernel'
                language: null
            },
        ]

        @onConfirmed = null
        @addClass('kernel-signal-selector')
        @list.addClass('mark-active')
        @setItems([])


    toggle: ->
        if @panel?
            @cancel()
        else if @editor = atom.workspace.getActiveTextEditor()
            @attach()


    attach: ->
        # get language from editor
        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel item: this
        @focusFilterEditor()
        grammar = @editor.getGrammar()
        language = @kernelManager.getLanguageFor grammar

        # disable all commands if no kernel is running
        kernel = @kernelManager.getRunningKernelFor language
        unless kernel?
            return @setItems []

        # add basic commands for the current grammar language
        basicCommands = @basicCommands.map (command) ->
            name =
                command.name + ' ' + kernel.kernelSpec.display_name + ' kernel'
            return {
                name: name
                value: command.value
                grammar: grammar
                language: language
                kernel: kernel
            }

        # add commands to switch to other kernels
        kernelSpecs = @kernelManager.getAllKernelSpecsFor language

        switchCommands = kernelSpecs.map (spec) ->
            return {
                name: 'Switch to ' + spec.display_name
                value: 'switch-kernel'
                grammar: grammar
                language: language
                kernelSpec: spec
            }

        @setItems _.union basicCommands, switchCommands


    confirmed: (item) ->
        console.log 'Selected command:', item
        item.command = item.value
        @onConfirmed?(item)
        @cancel()


    getEmptyMessage: ->
        'No running kernels for this file type.'


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
