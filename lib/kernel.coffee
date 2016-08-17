child_process = require 'child_process'
path = require 'path'

_ = require 'lodash'
jmp = require 'jmp'
uuid = require 'uuid'
zmq = jmp.zmq

StatusView = require './status-view'
WatchSidebar = require './watch-sidebar'

module.exports =
class Kernel
    constructor: (@kernelSpec, @grammar) ->
        @watchCallbacks = []

        @watchSidebar = new WatchSidebar this
        @statusView = new StatusView @kernelSpec.display_name


    addWatchCallback: (watchCallback) ->
        @watchCallbacks.push(watchCallback)


    _callWatchCallbacks: ->
        @watchCallbacks.forEach (watchCallback) ->
            watchCallback()


    interrupt: ->
        throw new Error 'Kernel: interrupt method not implemented'


    shutdown: ->
        throw new Error 'Kernel: shutdown method not implemented'


    execute: (code, onResults) ->
        throw new Error 'Kernel: execute method not implemented'


    executeWatch: (code, onResults) ->
        throw new Error 'Kernel: executeWatch method not implemented'


    complete: (code, onResults) ->
        throw new Error 'Kernel: complete method not implemented'


    inspect: (code, cursor_pos, onResults) ->
        throw new Error 'Kernel: inspect method not implemented'


    _parseIOMessage: (message) ->
        result = @_parseDisplayIOMessage message

        unless result?
            result = @_parseResultIOMessage message

        unless result?
            result = @_parseErrorIOMessage message

        unless result?
            result = @_parseStreamIOMessage message

        return result


    _parseDisplayIOMessage: (message) ->
        if message.header.msg_type is 'display_data'
            result = @_parseDataMime message.content.data

        return result


    _parseResultIOMessage: (message) ->
        msg_type = message.header.msg_type

        if msg_type is 'execute_result' or msg_type is 'pyout'
            result = @_parseDataMime message.content.data

        return result


    _parseDataMime: (data) ->
        unless data?
            return null

        mime = @_getMimeType data

        unless mime?
            return null

        if mime is 'text/plain'
            result =
                data:
                    'text/plain': data[mime]
                type: 'text'
                stream: 'pyout'
            result.data['text/plain'] = result.data['text/plain'].trim()

        else
            result =
                data: {}
                type: mime
                stream: 'pyout'
            result.data[mime] = data[mime]

        return result


    _getMimeType: (data) ->
        imageMimes = Object.getOwnPropertyNames(data).filter (mime) ->
            return mime.startsWith 'image/'

        if data.hasOwnProperty 'text/html'
            mime = 'text/html'

        else if data.hasOwnProperty 'image/svg+xml'
            mime = 'image/svg+xml'

        else if not (imageMimes.length is 0)
            mime = imageMimes[0]

        else if data.hasOwnProperty 'text/markdown'
            mime = 'text/markdown'

        else if data.hasOwnProperty 'application/pdf'
            mime = 'application/pdf'

        else if data.hasOwnProperty 'text/latex'
            mime = 'text/latex'

        else if data.hasOwnProperty 'text/plain'
            mime = 'text/plain'

        return mime


    _parseErrorIOMessage: (message) ->
        msg_type = message.header.msg_type

        if msg_type is 'error' or msg_type is 'pyerr'
            result = @_parseErrorMessage message

        return result


    _parseErrorMessage: (message) ->
        try
            errorString = message.content.traceback.join '\n'
        catch err
            ename = message.content.ename ? ''
            evalue = message.content.evalue ? ''
            errorString = ename + ': ' + evalue

        result =
            data:
                'text/plain': errorString
            type: 'text'
            stream: 'error'

        return result


    _parseStreamIOMessage: (message) ->
        if message.header.msg_type is 'stream'
            result =
                data:
                    'text/plain': message.content.text ? message.content.data
                type: 'text'
                stream: message.content.name

        # For kernels that do not conform to the messaging standard
        else if message.idents is 'stdout' or
                message.idents is 'stream.stdout' or
                message.content.name is 'stdout'
            result =
                data:
                    'text/plain': message.content.text ? message.content.data
                type: 'text'
                stream: 'stdout'

        # For kernels that do not conform to the messaging standard
        else if message.idents is 'stderr' or
                message.idents is 'stream.stderr' or
                message.content.name is 'stderr'
            result =
                data:
                    'text/plain': message.content.text ? message.content.data
                type: 'text'
                stream: 'stderr'

        if result?.data['text/plain']?
            result.data['text/plain'] = result.data['text/plain'].trim()

        return result


    destroy: ->
        console.log 'Kernel: Destroying base kernel'
