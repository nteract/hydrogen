_ = require 'lodash'

module.exports =
class StatusView

    constructor:  ->
        @title = "kernel"
        @element = document.createElement('div')
        @element.classList.add('atom-repl')
        @element.classList.add('status')

        # @element.innerText = "repl"

        return this


    setStatus: (status) ->
        @element.innerText = @title + ": " + status

    destroy: ->
        @element.innerHTML = ''
        @element.remove()

    getElement: ->
        @element
