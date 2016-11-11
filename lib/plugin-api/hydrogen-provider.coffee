###*
* @version 0.0.3
*
*
* The Plugin API allows you to make Hydrogen awesome.
* You will be able to interact with this class in your Hydrogen Plugin using
* Atom's [Service API](http://blog.atom.io/2015/03/25/new-services-API.html).
*
* Take a look at our [Example Plugin](https://github.com/lgeiger/hydrogen-example-plugin)
* and the [Atom Flight Manual](http://flight-manual.atom.io/hacking-atom/) for
* learning how to interact with Hydrogen in your own plugin.
*
* @class HydrogenProvider
###
module.exports =
class HydrogenProvider
    constructor: (@_hydrogen) ->
        @_happy = true

    ###
    * Calls your callback when the kernel has changed.
    * @param {Function} Callback
    ###
    onDidChangeKernel: (callback) ->
        @_hydrogen.emitter.on 'did-change-kernel', (kernel) ->
            if kernel?
                callback kernel.getPluginWrapper()
            else
                callback null

    ###
    * Get the `HydrogenKernel` of the currently active text editor.
    * @return {Class} `HydrogenKernel`
    ###
    getActiveKernel: ->
        unless @_hydrogen.kernel?
            grammar = @_hydrogen.editor.getGrammar()
            language = @_hydrogen.kernelManager.getLanguageFor grammar
            throw new Error "No running kernel for language `#{language}` found"

        return @_hydrogen.kernel.getPluginWrapper()
