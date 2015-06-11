{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

KernelManager = require './kernel-manager'

# View to display a list of grammars to apply to the current editor.
module.exports =
class SignalListView extends SelectListView
    initialize: ->
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
        console.log "Selected command:", item

        if @onConfirmed?
            @onConfirmed(item)
        @cancel()

    attach: ->


        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel(item: this)
        @focusFilterEditor()

        kernels = KernelManager.getRunningKernels()
        @languageOptions = _.map kernels, (kernel) ->
            return {
                name: kernel.language
                value: kernel.language
            }
            
        @setItems(@languageOptions)
        # language = @editor.getGrammar().name.toLowerCase()
        # language = KernelManager.getTrueLanguage(language)
        # kernel = KernelManager.getRunningKernelForLanguage(language)
        #
        # if kernel?
        #     commands = _.map _.cloneDeep(@basicCommands), (command) ->
        #         command.name = _.capitalize(language) + ' kernel: ' + command.name
        #         command.language = language
        #         return command
        #     @setItems(commands)
        # else
        #     @setItems([])

    getEmptyMessage: ->
        "No running kernels found."

    toggle: ->
        if @panel?
            @cancel()
        else if @editor = atom.workspace.getActiveTextEditor()
            @attach()
