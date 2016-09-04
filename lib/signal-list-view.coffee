{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

WSKernel = require './ws-kernel'

# View to display a list of grammars to apply to the current editor.
module.exports =
class SignalListView extends SelectListView
    initialize: (@kernelManager) ->
        super

        @basicCommands = [
            name: 'Interrupt'
            value: 'interrupt-kernel'
        ,
            name: 'Restart'
            value: 'restart-kernel'
        ,
            name: 'Shut Down'
            value: 'shutdown-kernel'
        ]

        @wsKernelCommands = [
            name: 'Rename session for'
            value: 'rename-kernel'
        ,
            name: 'Disconnect from'
            value: 'disconnect-kernel'
        ]

        @onConfirmed = null
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
        basicCommands = @basicCommands.map (command) =>
            return {
                name: @_getCommandName command.name, kernel.kernelSpec
                command: command.value
                grammar: grammar
                language: language
                kernel: kernel
            }

        if kernel instanceof WSKernel
            wsKernelCommands = @wsKernelCommands.map (command) =>
                return {
                    name: @_getCommandName command.name, kernel.kernelSpec
                    command: command.value
                    grammar: grammar
                    language: language
                    kernel: kernel
                }
            @setItems _.union basicCommands, wsKernelCommands
        else
            # add commands to switch to other kernels
            @kernelManager.getAllKernelSpecsFor language, (kernelSpecs) =>
                _.pull kernelSpecs, kernel.kernelSpec

                switchCommands = kernelSpecs.map (kernelSpec) =>
                    return {
                        name: @_getCommandName 'Switch to', kernelSpec
                        command: 'switch-kernel'
                        grammar: grammar
                        language: language
                        kernelSpec: kernelSpec
                    }

                @setItems _.union basicCommands, switchCommands


    _getCommandName: (name, kernelSpec) ->
        return name + ' ' + kernelSpec.display_name + ' kernel'


    confirmed: (item) ->
        console.log 'Selected command:', item
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
