{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

AtomRepl = require './atom-repl'
KernelManager = require './kernel-manager'

# View to display a list of grammars to apply to the current editor.
module.exports =
class SignalListView extends SelectListView
    initialize: ->
        super

        @basicCommands = [
            {
                name: "Interrupt"
                value: 'interrupt-kernel'
                language: null
            },
            {
                name: "Restart"
                value: 'restart-kernel'
                language: null
            },
        ]

        @onConfirmed = null
        @addClass('kernel-signal-selector')
        @list.addClass('mark-active')
        @setItems([])

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
        @currentGrammar = null

    confirmed: (item) ->
        console.log "Selected command:", item

        if @onConfirmed?
            @onConfirmed(item)
        @cancel()

    attach: ->
        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel(item: this)
        @focusFilterEditor()
        language = @editor.getGrammar().name.toLowerCase()
        kernel = KernelManager.getRunningKernelForLanguage(language)

        if kernel?
            commands = _.map _.cloneDeep(@basicCommands), (command) ->
                command.name = _.capitalize(language) + ' kernel: ' + command.name
                command.language = language
                return command
            @setItems(commands)
        else
            @setItems([])

    getEmptyMessage: ->
        "No running kernels for this file type."

    toggle: ->
        if @panel?
            @cancel()
        else if @editor = atom.workspace.getActiveTextEditor()
            @attach()
