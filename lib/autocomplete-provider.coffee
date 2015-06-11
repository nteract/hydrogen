_ = require 'lodash'

KernelManager = require './kernel-manager'

module.exports = AutocompleteProvider = ( ->
    selectors = _.map KernelManager.getAvailableKernels(), ({language}) -> '.source.' + language
    selector = selectors.join(', ')
    return {
        # This will work on JavaScript and CoffeeScript files, but not in js comments.
        selector: selector
        disableForSelector: '.comment'

        # This will take priority over the default provider, which has a priority of 0.
        # `excludeLowerPriority` will suppress any providers with a lower priority
        # i.e. The default provider will be suppressed
        inclusionPriority: 1

        # Required: Return a promise, an array of suggestions, or null.
        getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix}) ->
            console.log "suggestions requested for prefix:", prefix
            prefix = @getPrefix(editor, bufferPosition)
            console.log "new prefix:", prefix
            language = editor.getGrammar().name.toLowerCase()

            hasKernel = KernelManager.languageHasRunningKernel(language)
            if prefix.trim().length < 3 or not hasKernel
                return null
            else
                new Promise (resolve) ->
                    KernelManager.complete language, prefix, (matches) ->
                        matches = _.map matches, (match) ->
                            text: match
                            replacementPrefix: prefix
                            iconHTML: "<img
                                src='#{__dirname}/../static/logo.svg'
                                style='width: 100%;'>"
                        resolve(matches)
                # resolve([text: 'something'])

        getPrefix: (editor, bufferPosition) ->
            # Whatever your prefix regex might be
            regex = /([\w0-9_-][\.:\$]?)+$/

            # Get the text for the line up to the triggered buffer position
            line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])

            # Match the regex to the line, and return the match
            line.match(regex)?[0] or ''

        # (optional): called _after_ the suggestion `replacementPrefix` is replaced
        # by the suggestion `text` in the buffer
        onDidInsertSuggestion: ({editor, triggerPosition, suggestion}) ->

        # (optional): called when your provider needs to be cleaned up. Unsubscribe
        # from things, kill any processes, etc.
        dispose: ->
    }
)()
