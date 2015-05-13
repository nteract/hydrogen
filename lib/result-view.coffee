_ = require 'lodash'

module.exports =
class ResultView

    constructor:  ->
        @element = document.createElement('div')
        @element.classList.add('atom-repl')
        @element.classList.add('output-bubble')

        @spinner = @buildSpinner()
        @element.appendChild(@spinner)

        @resultContainer = document.createElement('div')
        @element.appendChild(@resultContainer)

        @statusContainer = document.createElement('div')
        @element.appendChild(@statusContainer)

        @resultType = null

        return this

    addResult: (result) ->
        if result.stream == 'status'
            hasResults = @resultContainer.innerHTML.length == 0
            @indicateStatus(hasResults)
            @statusContainer.innerText = result.data



        else
            @indicateStatus(false)
            if result.stream == 'stderr' or result.stream == 'error'
                @setType 'error'

            if result.type == 'text/html'
                console.log "rendering as HTML"
                @resultType = 'html'
                @resultContainer.classList.add('rich')
                @resultContainer.innerHTML = @resultContainer.innerHTML + result.data

            else if result.type == 'image/svg+xml'
                console.log "rendering as SVG"

                @resultType = 'image'
                @resultContainer.classList.add('rich')
                buffer = new Buffer(result.data)
                image = document.createElement('img')
                image.setAttribute('src', "data:image/svg+xml;base64," + buffer.toString('base64'))
                @resultContainer.appendChild(image)

            else if result.type.startsWith('image')
                console.log "rendering as image"

                @resultType = 'image'
                @resultContainer.classList.add('rich')
                image = document.createElement('img')
                image.setAttribute('src', "data:#{result.type};base64," + result.data)
                @resultContainer.appendChild(image)

            else
                console.log "rendering as text"

                if not @resultType or @resultType == 'text'
                    @resultType = 'text'
                    if @resultContainer.innerText.length > 0
                        @resultContainer.innerText = @resultContainer.innerText + (" " + result.data)
                    else
                        @resultContainer.innerText = @resultContainer.innerText + result.data

    setType: (type) ->
        if type == 'result'
            @resultContainer.classList.remove('error')
        else if type == 'error'
            @resultContainer.classList.add('error')
        else
            throw "Not a type this bubble can be!"

    indicateStatus: (shouldIndicate) ->
        if shouldIndicate
            @statusContainer.style.display = 'inline-block'
        else
            @statusContainer.style.display = 'none'

    buildSpinner: ->
        container = document.createElement('div')
        container.classList.add('spinner')

        rect1 = document.createElement('div')
        rect1.classList.add('rect1')
        rect2 = document.createElement('div')
        rect2.classList.add('rect2')
        rect3 = document.createElement('div')
        rect3.classList.add('rect3')
        rect4 = document.createElement('div')
        rect4.classList.add('rect4')
        rect5 = document.createElement('div')
        rect5.classList.add('rect5')

        container.appendChild(rect1)
        container.appendChild(rect2)
        container.appendChild(rect3)
        container.appendChild(rect4)
        container.appendChild(rect5)

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
