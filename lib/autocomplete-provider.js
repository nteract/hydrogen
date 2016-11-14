_ = require 'lodash'
iconHTML = "<img src='#{__dirname}/../static/logo.svg' style='width: 100%;'>"

regexes =
    # pretty dodgy, adapted from http://stackoverflow.com/a/8396658
    r: /([^\d\W]|[.])[\w.$]*$/

    # adapted from http://stackoverflow.com/q/5474008
    python: /([^\d\W]|[\u00A0-\uFFFF])[\w.\u00A0-\uFFFF]*$/

    # adapted from http://php.net/manual/en/language.variables.basics.php
    php: /[$a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/


module.exports = (kernelManager) ->
    autocompleteProvider =
        selector: '.source'
        disableForSelector: '.comment, .string'

        # `excludeLowerPriority: false` won't suppress providers with lower
        # priority.
        # The default provider has a priority of 0.
        inclusionPriority: 1
        excludeLowerPriority: false

        # Required: Return a promise, an array of suggestions, or null.
        getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix}) ->
            grammar = editor.getGrammar()
            language = kernelManager.getLanguageFor grammar
            kernel = kernelManager.getRunningKernelFor language
            unless kernel?
                return null

            line = editor.getTextInRange [
                [bufferPosition.row, 0],
                bufferPosition
            ]

            regex = regexes[language]
            if regex
                prefix = line.match(regex)?[0] or ''
            else
                prefix = line

            # return if cursor is at whitespace
            if prefix.trimRight().length < prefix.length
                return null

            if prefix.trim().length < 3
                return null

            console.log 'autocompleteProvider: request:',
                line, bufferPosition, prefix

            return new Promise (resolve) ->
                kernel.complete prefix, ({matches, cursor_start, cursor_end}) ->
                    replacementPrefix = prefix.slice cursor_start, cursor_end

                    matches = _.map matches, (match) ->
                        text: match
                        replacementPrefix: replacementPrefix
                        iconHTML: iconHTML

                    resolve(matches)

    return autocompleteProvider
