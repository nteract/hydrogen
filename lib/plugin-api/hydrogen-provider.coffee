module.exports =
class HydrogenProvider
    constructor: (@_hydrogen) ->
        @_happy = true

    onDidChangeKernel: (callback) ->
        @_hydrogen.emitter.on 'did-change-kernel', (kernel) ->
            if kernel?
                callback kernel.getPluginWrapper()
            else
                callback null

    getActiveKernel: ->
        unless @_hydrogen.kernel?
            grammar = @_hydrogen.editor.getGrammar()
            language = @_hydrogen.kernelManager.getLanguageFor grammar
            throw new Error "No running kernel for language `#{language}` found"

        return @_hydrogen.kernel.getPluginWrapper()
