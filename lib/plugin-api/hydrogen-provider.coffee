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
        unless @_hydrogen.kernel
            return null

        return @_hydrogen.kernel.getPluginWrapper()
