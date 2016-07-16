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
                command: 'interrupt-kernel'
                language: null
            },
            {
                name: 'Restart'
                command: 'restart-kernel'
                language: null
            }
        ]

        @switchToNonStandardKernel = [
            name: 'Switch to non standard kernel'
            command: 'switch-to-non-standard-kernel'
        ]

        @onConfirmed = null
        @list.addClass('mark-active')


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
        @grammar = @editor.getGrammar()
        @language = @kernelManager.getLanguageFor @grammar

        # disable all commands if no kernel is running
        kernel = @kernelManager.getRunningKernelFor @language
        unless kernel?
            return @setItems []

        # add basic commands for the current grammar language
        basicCommands = @basicCommands.map (cmd) ->
            name =
                cmd.name + ' ' + kernel.kernelSpec.display_name + ' kernel'
            return {
                name: name
                command: cmd.value
                grammar: @grammar
                language: @language
                kernel: kernel
            }

        # add commands to switch to other kernels
        @kernelManager.getAllKernelSpecsFor @language, (kernelSpecs) =>
            @switchCommands = @parseCommands kernelSpecs

            @setItems _.union basicCommands, @switchCommands, @switchToNonStandardKernel

    confirmed: (item) ->
        console.log 'Selected command:', item
        if item.command is 'switch-to-non-standard-kernel'
            @kernelManager.getAllKernelSpecs (kernelSpecs) =>
                allKernelCommands = @parseCommands kernelSpecs

                @setItems _.differenceWith allKernelCommands, @switchCommands, _.isEqual
        else
            @onConfirmed?(item)
            @cancel()

    parseCommands: (kernelSpecs) ->
        return _.map kernelSpecs, (kernelSpec) ->
            return {
                name: 'Switch to ' + kernelSpec.display_name
                command: 'switch-kernel'
                grammar: @grammar
                language: @language
                kernelSpec: kernelSpec
            }


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
