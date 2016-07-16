child_process = require 'child_process'
path = require 'path'

_ = require 'lodash'
uuid = require 'uuid'
services = require('./jupyter-js-services-shim')

Kernel = require './kernel'

module.exports =
class WSKernel extends Kernel
    constructor: (kernelSpec, @session) ->
        super kernelSpec

        @session.statusChanged.connect => @_onStatusChange()
        @_onStatusChange() # Set initial status correctly

    interrupt: ->
        @session.kernel.interrupt()

    restart: ->
        @session.kernel.restart()

    _onStatusChange: ->
        @statusView.setStatus @session.status

    _onIOPub: (message, onResults) ->
        msg_type = message.header.msg_type

        # TODO(nikita): implement support for watches

        if onResults?
            console.log 'WSKernel: _onIOPub:', message
            result = @_parseIOMessage(message)
            if result?
                onResults result


    execute: (code, onResults) ->
        future = @session.kernel.execute(
            code: code
        )

        future.onIOPub = (message) =>
            @_onIOPub(message, onResults)

        future.onReply = (message) ->
            if message.content.status is 'error'
                return
            result =
                data: 'ok'
                type: 'text'
                stream: 'status'
            onResults?(result)

    executeWatch: (code, onResults) ->
        # TODO(nikita): implement watches
        console.log 'WARNING: Watches are not supported by remote kernels'

    complete: (code, onResults) ->
        @session.kernel.complete
            code: code
            cursor_pos: code.length
        .then (message) ->
            onResults?(message.content)

    inspect: (code, cursor_pos, onResults) ->
        @session.kernel.inspect
            code: code
            cursor_pos: cursor_pos
            detail_level: 0
        .then (message) ->
            onResults?(
                data: message.content.data
                found: message.content.found
            )

    destroy: ->
        console.log 'WSKernel: destroying jupyter-js-services Session'
        @session.dispose()
        super
