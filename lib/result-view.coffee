{CompositeDisposable} = require 'atom'
_ = require 'lodash'

module.exports =
class ResultView

    constructor: (@marker) ->
        @element = document.createElement('div')
        @element.classList.add('hydrogen', 'output-bubble', 'empty')

        @outputContainer = document.createElement('div')
        @outputContainer.classList.add('bubble-output-container')
        @element.appendChild(@outputContainer)

        @resultContainer = document.createElement('div')
        @resultContainer.classList.add('bubble-result-container')
        @outputContainer.appendChild(@resultContainer)

        @errorContainer = document.createElement('div')
        @errorContainer.classList.add('bubble-error-container')
        @outputContainer.appendChild(@errorContainer)

        @statusContainer = document.createElement('div')
        @statusContainer.classList.add('bubble-status-container')
        @spinner = @buildSpinner()
        @statusContainer.appendChild(@spinner)
        @outputContainer.appendChild(@statusContainer)

        @richCloseButton = document.createElement('div')
        @richCloseButton.classList.add('rich-close-button', 'icon', 'icon-x')
        @richCloseButton.onclick = => @destroy()
        @element.appendChild(@richCloseButton)

        @actionPanel = document.createElement('div')
        @actionPanel.classList.add('bubble-action-panel')
        @element.appendChild(@actionPanel)

        @closeButton = document.createElement('div')
        @closeButton.classList.add('action-button', 'close-button', 'icon', 'icon-x')
        @closeButton.onclick = => @destroy()
        @actionPanel.appendChild(@closeButton)


        padding = document.createElement('div')
        padding.classList.add('padding')
        @actionPanel.appendChild(padding)

        @copyButton = document.createElement('div')
        @copyButton.classList.add('action-button', 'copy-button', 'icon', 'icon-clippy')
        @copyButton.onclick = =>
            atom.clipboard.write(@getAllText())
            atom.notifications.addSuccess("Copied to clipboard")
        @actionPanel.appendChild(@copyButton)

        @openButton = document.createElement('div')
        @openButton.classList.add('action-button', 'open-button', 'icon', 'icon-file-symlink-file')
        # @openButton.classList.add('action-button', 'open-button', 'icon', 'icon-move-right')
        @openButton.onclick = =>
            bubbleText = @getAllText()
            atom.workspace.open().then (editor) ->
                editor.insertText(bubbleText)
        @actionPanel.appendChild(@openButton)

        @resultType = null
        @setMultiline(false)

        @tooltips = new CompositeDisposable()
        @tooltips.add atom.tooltips.add(@copyButton, {title: "Copy to clipboard"})
        @tooltips.add atom.tooltips.add(@openButton, {title: "Open in new editor"})

        return this

    addResult: (result) ->
        @element.classList.remove('empty')
        if result.stream == 'status'
            if result.data == 'ok'
                @statusContainer.classList.add('icon', 'icon-check')

        else
            if result.stream == 'stderr' or result.stream == 'error'
                container = @errorContainer
            else
                container = @resultContainer

            if result.type == 'text/html'
                console.log "rendering as HTML"
                @resultType = 'html'
                @element.classList.add('rich')
                container.classList.add('html')

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
                image.setAttribute('src', "data:image/svg+xml;base64," +
                                           buffer.toString('base64'))
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

            else if not @resultType or @resultType == 'text'
                console.log "rendering as text"
                @resultType = 'text'
                if container.innerText.length > 0
                    container.innerText = container.innerText + (" " + result.data)
                else
                    container.innerText = container.innerText + result.data

                if /\r|\n/.exec(container.innerText.trim())
                    @setMultiline(true)
            else
                console.error "Unrecognized result:", result

        console.log "resultType after update:", @resultType
        @updateStatusVisibility()

    getAllText: ->
        resultText = @resultContainer.innerText
        errorText = @errorContainer.innerText
        return resultText + "\n" + errorText

    setMultiline: (multiline) ->
        @multiline = multiline
        if @multiline
            @element.classList.add('multiline')
            # @closeButton.style.display = 'block'
        else
            @element.classList.remove('multiline')
            # @closeButton.style.display = 'none'


    updateStatusVisibility: ->
        if not @resultType?
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
            @element.classList.remove('empty')
            @spinner.style.display = 'block'
        else
            @spinner.style.display = 'none'


    destroy: ->
        @tooltips.dispose()
        if @marker?
            @marker.destroy()
        @element.innerHTML = ''
        @element.remove()

    getElement: ->
        @element
