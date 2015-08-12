_ = require 'lodash'

KernelManager = require './kernel-manager'

module.exports = AutocompleteProvider = ( ->
    selectors = _.map KernelManager.getAvailableKernels(), ({language}) -> '.source.' + language
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

            # taken from https://github.com/n-riesco/nel/blob/master/lib/nel.js#L713
            javascript: /[_$a-zA-Z][_$a-zA-Z0-9]*$/

            # adapted from http://php.net/manual/en/language.variables.basics.php
            php: /[$a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/

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
                            if match.signatures?
                                console.log "match:", match
                                argText = ""
                                if match.signatures.length == 1
                                    if match.signatures[0].parameters? and
                                       match.signatures[0].parameters.length > 0
                                        # console.log match.signatures[0].parameters

                                        argText = _.reduce match.signatures[0].parameters, (prev, arg) ->
                                                argSignature = arg.name
                                                if arg.type? and arg.type.length > 0
                                                    argSignature = argSignature + "::#{arg.type}"
                                                prev = "#{prev}, " unless prev is ""
                                                return "#{prev}#{argSignature}"
                                            , ""
                                        argText = "(#{argText.trim()})"
                                    # else if match.signatures[0].parameters? and
                                    #    match.signatures[0].parameters.length > 1
                                    #    argText = " (#{} signatures)"

                                else if match.signatures.length > 1
                                    argText = "(#{match.signatures.length} signatures)"
                                return {
                                    text: match.text
                                    displayText: "#{match.text}#{argText}"
                                    type: match.type
                                    replacementPrefix: prefix
                                    leftLabel: match.type
                                }
                            else
                                return {
                                    text: match.text
                                    type: match.type
                                    replacementPrefix: prefix
                                    leftLabel: match.type
                                    rightLabel: match.value
                                }

                            # iconHTML: "<img
                                # src='#{__dirname}/../static/logo.svg'
                                # style='width: 100%;'>"
                        console.log matches
                        resolve(matches)
                # resolve([text: 'something'])

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
)()
