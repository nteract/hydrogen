_ = require 'lodash'

KernelManager = require './kernel-manager'

module.exports = AutocompleteProvider = do ->
    selectors = _.map KernelManager.getAvailableKernels(), ({language}) ->
        '.source.' + language
            .replace 'coffeescript', 'coffee'
            .replace 'javascript', 'js'
    selector = selectors.join(', ')
    return {
        selector: selector
        disableForSelector: '.comment'

        defaultRegex: /([\w-][\.:\$]?)+$/
        regexes:

            # pretty dodgy, adapted from http://stackoverflow.com/questions/8396577/check-if-character-value-is-a-valid-r-object-name/8396658#8396658
            r: /([^\d\W]|[.])[\w.$]*$/

            # this is NOT correct. using the python one until I get an alternative
            julia: /([^\d\W]|[\u00A0-\uFFFF])[\w.!\u00A0-\uFFFF]*$/

            # adapted from http://stackoverflow.com/questions/5474008/regular-expression-to-confirm-whether-a-string-is-a-valid-identifier-in-python
            python: /([^\d\W]|[\u00A0-\uFFFF])[\w.\u00A0-\uFFFF]*$/

            # adapted from http://php.net/manual/en/language.variables.basics.php
            php: /[$a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/

        # This will take priority over the default provider, which has a priority of 0.
        # `excludeLowerPriority` will suppress any providers with a lower priority
        # i.e. The default provider will be suppressed
        inclusionPriority: 1

        # Required: Return a promise, an array of suggestions, or null.
        getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix}) ->
            console.log "getSuggestions: prefix:", prefix
            prefix = @getPrefix editor, bufferPosition
            console.log "getSuggestions: new prefix:", prefix
            if prefix.trim().length < 3
                return null

            language = editor.getGrammar().name.toLowerCase()
            kernel = KernelManager.getRunningKernelForLanguage language
            unless kernel?
                return null

            return new Promise (resolve) ->
                kernel.complete prefix, (matches) ->
                    matches = _.map matches, (match) ->
                        text: match
                        replacementPrefix: prefix
                        iconHTML: "<img
                            src='#{__dirname}/../static/logo.svg'
                            style='width: 100%;'>"
                    resolve(matches)

        getPrefix: (editor, bufferPosition) ->
            language = editor.getGrammar().name.toLowerCase()
            regex = @getRegexForLanguage(language)

            # Get the text for the line up to the triggered buffer position
            line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])

            # Match the regex to the line, and return the match
            line.match(regex)?[0] or ''

        getRegexForLanguage: (language) ->
            trueLanguage = KernelManager.getTrueLanguage(language)
            if @regexes[trueLanguage]?
                return @regexes[trueLanguage]
            else
                return @defaultRegex

        # (optional): called _after_ the suggestion `replacementPrefix` is replaced
        # by the suggestion `text` in the buffer
        onDidInsertSuggestion: ({editor, triggerPosition, suggestion}) ->

        # (optional): called when your provider needs to be cleaned up. Unsubscribe
        # from things, kill any processes, etc.
        dispose: ->
    }
