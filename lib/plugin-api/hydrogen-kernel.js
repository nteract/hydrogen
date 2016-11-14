###
* The `HydrogenKernel` class wraps Hydrogen's internal representation of kernels
* and exposes a small set of methods that should be usable by plugins.
* @class HydrogenKernel
###

module.exports =
class HydrogenKernel
    constructor: (@_kernel) ->
        @destroyed = false

    _assertNotDestroyed: ->
        # Internal: plugins might hold references to long-destroyed kernels, so
        # all API calls should guard against this case
        if @destroyed
            throw new Error 'HydrogenKernel: operation not allowed because the kernel has been destroyed'

    ###
    * Calls your callback when the kernel has been destroyed.
    * @param {Function} Callback
    ###
    onDidDestroy: (callback) ->
        @_assertNotDestroyed()
        return @_kernel.emitter.on 'did-destroy', callback

    ###
    * Get the [connection file](http://jupyter-notebook.readthedocs.io/en/latest/examples/Notebook/Connecting%20with%20the%20Qt%20Console.html) of the kernel.
    * @return {String} Path to connection file.
    ###
    getConnectionFile: ->
        @_assertNotDestroyed()
        connectionFile = @_kernel.connectionFile
        unless connectionFile?
            throw new Error "No connection file for #{@_kernel.kernelSpec.display_name} kernel found"

        return connectionFile
