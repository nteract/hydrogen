net = require 'net'
_ = require 'lodash'

module.exports = portfinder =
    find: (onFound) ->
        srv = net.createServer()

        srv.listen 0, () ->
            port = srv.address().port
            srv.close (err) ->
                if err?
                    throw err
                else
                    onFound port

    findMany: (numPorts, onFound) ->
        @findManyHelper numPorts, [], onFound

    findManyHelper: (numPorts, foundPorts, onFound) ->
        if numPorts == 0
            onFound(foundPorts)
        else
            @find (port) =>
                foundPortsClone = _.clone(foundPorts)
                foundPortsClone.push(port)
                @findManyHelper numPorts - 1, foundPortsClone, onFound
