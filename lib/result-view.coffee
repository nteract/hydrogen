# atom = require 'atom'
_ = require 'lodash'

module.exports =
class ResultView extends HTMLElement
    @element = null

    constructor:  ->
        @element = document.createElement('div')
        @element.classList.add('atom-repl')
        @element.classList.add('output-bubble')
        @element.classList.add('native-key-bindings')
        @element.setAttribute('tabindex', -1)

        atom.views.addViewProvider {
                modelConstructor: this
                viewConstructor: this
            }
        return this

    addResult: (result) ->
        if result.stream == 'pyerr'
            @setType 'error'

        if result.type == "html"
            @element.classList.add('html')
            # buffer = new Buffer(result.data)
            # image = document.createElement('img')
            # image.setAttribute('src', "data:image/svg+xml;base64," + buffer.toString('base64'))
            # @element.appendChild(image)
            # @element.innerHTML = "<img src='data:image/svg+xml;base64,#{buffer.toString('base64')}'>"
            @element.innerHTML = @element.innerHTML + result.data
        else
            @element.innerText = @element.innerText + result.data

    setType: (type) ->
        if type == 'result'
            @element.classList.remove('error')
        else if type == 'error'
            @element.classList.add('error')
        else
            throw "Not a type this bubble can be!"

    destroy: ->
        @element.innerHTML = ''
        @element.remove()

    getElement: ->
        @element
