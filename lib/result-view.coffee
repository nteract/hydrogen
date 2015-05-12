_ = require 'lodash'

module.exports =
class ResultView
    @element = null

    constructor:  ->
        @element = document.createElement('div')
        @element.classList.add('atom-repl')
        @element.classList.add('output-bubble')

        @spinner = @buildSpinner()
        @element.appendChild(@spinner)

        @resultContainer = document.createElement('div')
        @element.appendChild(@resultContainer)
        # @element.classList.add('native-key-bindings')
        # @element.setAttribute('tabindex', -1)

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
        else if result.type.startsWith('image')
            console.log "rendering as image"
            @element.classList.add('rich')
            image = document.createElement('img')
            image.setAttribute('src', "data:#{result.type};base64," + result.data)
            @element.appendChild(image)
        else
            console.log "rendering as text"
            if @element.innerText.length > 0
                @element.innerText = @element.innerText + (" " + result.data)
            else
                @element.innerText = @element.innerText + result.data

    setType: (type) ->
        if type == 'result'
            @element.classList.remove('error')
        else if type == 'error'
            @element.classList.add('error')
        else
            throw "Not a type this bubble can be!"


    buildSpinner: ->
        container = document.createElement('div')
        container.classList.add('spinner')

        bounce1 = document.createElement('div')
        bounce1.classList.add('double-bounce1')
        bounce2 = document.createElement('div')
        bounce2.classList.add('double-bounce2')

        container.appendChild(bounce1)
        container.appendChild(bounce2)

        return container

    spin: (shouldSpin) ->
        if shouldSpin
            @spinner.style.display = 'block'
        else
            @spinner.style.display = 'none'


    destroy: ->
        @element.innerHTML = ''
        @element.remove()

    getElement: ->
        @element
