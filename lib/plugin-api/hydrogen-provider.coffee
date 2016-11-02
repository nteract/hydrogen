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
            message = "No running kernel for language `#{language}` found"
            atom.notifications.addError message
            return null

        return @_hydrogen.kernel.getPluginWrapper()
