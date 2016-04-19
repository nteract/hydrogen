{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

KernelManager = require './kernel-manager'

# View to display a list of grammars to apply to the current editor.
module.exports =
class SignalListView extends SelectListView
    initialize: ->
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
        @panel ?= atom.workspace.addModalPanel item: @
        @focusFilterEditor()
        grammar = @editor.getGrammar()
        grammarLanguage = KernelManager.getGrammarLanguageFor grammar

        # disable all commands if no kernel is running
        kernel = KernelManager.getRunningKernelFor grammarLanguage
        unless kernel?
            return @setItems []

        # add basic commands for the current grammar language
        basicCommands = @basicCommands.map (command) ->
            return {
                name: _.capitalize grammarLanguage + ' kernel: ' + command.name
                value: command.value
                grammar: grammar
                language: grammarLanguage
                kernel: kernel
            }

        # add commands to switch to other kernels
        kernelSpecs = KernelManager.getAllKernelSpecsFor grammarLanguage

        switchCommands = kernelSpecs.map (spec) ->
            spec.grammarLanguage = grammarLanguage
            return {
                name: 'Switch to ' + spec.display_name
                value: 'switch-kernel'
                grammar: grammar
                language: grammarLanguage
                kernelSpec: spec
            }

        @setItems _.union basicCommands, switchCommands


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
