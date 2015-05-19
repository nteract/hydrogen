_ = require 'lodash'

module.exports =
class ResultView

    constructor: (@marker) ->
        @element = document.createElement('div')
        @element.classList.add('atom-repl')
        @element.classList.add('output-bubble')

        @spinner = @buildSpinner()
        @element.appendChild(@spinner)

        @resultContainer = document.createElement('div')
        @resultContainer.classList.add('bubble-result-container')
        @element.appendChild(@resultContainer)

        @errorContainer = document.createElement('div')
        @errorContainer.classList.add('bubble-error-container')
        @element.appendChild(@errorContainer)

        @statusContainer = document.createElement('div')
        @statusContainer.classList.add('bubble-status-container')
        @element.appendChild(@statusContainer)

        @closeButton = document.createElement('div')
        @closeButton.classList.add('close-button')
        @closeButton.onclick = => @destroy()
        @element.appendChild(@closeButton)

        @resultType = null
        @setMultiline(false)

        return this

    addResult: (result) ->
        if result.stream == 'status'
            hasResults = @resultContainer.innerHTML.length == 0
            @shouldIndicateStatus(hasResults)
            @statusContainer.innerText = result.data

        else
            @shouldIndicateStatus(false)
            if result.stream == 'stderr' or result.stream == 'error'
                container = @errorContainer
            else
                container = @resultContainer

            if result.type == 'text/html'
                console.log "rendering as HTML"
                @resultType = 'html'
                @element.classList.add('rich')

                # if result.data.trim().startsWith('<br>')
                #     result.data = result.data.trim().replace('<br>', '')


                # container = document.createElement('div')
                # container.innerHTML = result.data
                # @resultContainer.appendChild(container)
                container.innerHTML = result.data
                @setMultiline(true)

            else if result.type == 'image/svg+xml'
                console.log "rendering as SVG"


                container.innerHTML = container.innerHTML.trim().replace('<br>', '')

                @resultType = 'image'
                @element.classList.add('rich')
                @element.classList.add('svg')
                buffer = new Buffer(result.data)
                image = document.createElement('img')
                image.setAttribute('src', "data:image/svg+xml;base64," + buffer.toString('base64'))
                container.appendChild(image)
                @setMultiline(true)

            else if result.type.startsWith('image')
                console.log "rendering as image"

                container.innerHTML = container.innerHTML.trim().replace('<br>', '')

                @resultType = 'image'
                @element.classList.add('rich')
                image = document.createElement('img')
                image.setAttribute('src', "data:#{result.type};base64," + result.data)
                container.appendChild(image)
                @setMultiline(true)

            else
                console.log "rendering as text"

                if not @resultType or @resultType == 'text'
                    @resultType = 'text'
                    if container.innerText.length > 0
                        container.innerText = container.innerText + (" " + result.data)
                    else
                        container.innerText = container.innerText + result.data

                    if /\r|\n/.exec(container.innerText.trim())
                        @setMultiline(true)

    # setType: (type) ->
    #     if type == 'result'
    #         @resultContainer.classList.remove('error')
    #     else if type == 'error'
    #         @resultContainer.classList.add('error')
    #     else
    #         throw "Not a type this bubble can be!"

    setMultiline: (multiline) ->
        @multiline = multiline
        if @multiline
            @element.classList.add('multiline')
            # @closeButton.style.display = 'block'
        else
            @element.classList.remove('multiline')
            # @closeButton.style.display = 'none'


    shouldIndicateStatus: (shouldIndicate) ->
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
        @marker.destroy()
        @element.innerHTML = ''
        @element.remove()

    getElement: ->
        @element
