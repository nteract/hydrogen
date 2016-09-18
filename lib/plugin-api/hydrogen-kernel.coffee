# The HydrogenKernel class wraps hydrogen's internal representation of kernels
# and exposes a small set of methods that should be usable by plugins.

module.exports =
class HydrogenKernel
    constructor: (@_kernel) ->
        @destroyed = false

    _assertNotDestroyed: ->
        # Internal: plugins might hold references to long-destroyed kernels, so
        # all API calls should guard against this case
        if @destroyed
            throw new Error 'HydrogenKernel: operation not allowed because the kernel has been destroyed'

    onDidDestroy: (callback) ->
        @_assertNotDestroyed()
        return @_kernel.emitter.on 'did-destroy', callback

    getConnectionFile: ->
        @_assertNotDestroyed()
        connectionFile = @_kernel.connectionFile
        unless connectionFile?
            # Standardize on returning null if there is no connection file
            # (e.g. for WSKernel)
            return null
        return connectionFile
