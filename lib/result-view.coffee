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
        if result.stream == 'pyerr' or result.stream == 'stderr'
            @setType 'error'

        if result.type == 'text/html'
            console.log "rendering as HTML"
            @element.classList.add('rich')
            @element.innerHTML = @element.innerHTML + result.data
        else if result.type == 'image/svg+xml'
            console.log "rendering as SVG"
            @element.classList.add('rich')
            buffer = new Buffer(result.data)
            image = document.createElement('img')
            image.setAttribute('src', "data:image/svg+xml;base64," + buffer.toString('base64'))
            @element.appendChild(image)
        else if result.type == 'image/png' or
            console.log "rendering as PNG"
            @element.classList.add('rich')
            image = document.createElement('img')
            image.setAttribute('src', "data:image/png;base64," + result.data)
            @element.appendChild(image)
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
