{CompositeDisposable} = require 'atom'

module.exports =
class ResultView

    constructor: (@marker) ->
        @element = document.createElement('div')
        @element.classList.add('hydrogen', 'output-bubble', 'empty')

        outputContainer = document.createElement('div')
        outputContainer.classList.add('bubble-output-container')
        outputContainer.onmousewheel = (e) -> e.stopPropagation()
        @element.appendChild(outputContainer)

        @resultContainer = document.createElement('div')
        @resultContainer.classList.add('bubble-result-container')
        outputContainer.appendChild(@resultContainer)

        @errorContainer = document.createElement('div')
        @errorContainer.classList.add('bubble-error-container')
        outputContainer.appendChild(@errorContainer)

        @statusContainer = document.createElement('div')
        @statusContainer.classList.add('bubble-status-container')
        @spinner = @buildSpinner()
        @statusContainer.appendChild(@spinner)
        outputContainer.appendChild(@statusContainer)

        richCloseButton = document.createElement('div')
        richCloseButton.classList.add('rich-close-button', 'icon', 'icon-x')
        richCloseButton.onclick = => @destroy()
        @element.appendChild(richCloseButton)

        actionPanel = document.createElement('div')
        actionPanel.classList.add('bubble-action-panel')
        @element.appendChild(actionPanel)

        closeButton = document.createElement('div')
        closeButton.classList.add 'action-button',
            'close-button', 'icon', 'icon-x'
        closeButton.onclick = => @destroy()
        actionPanel.appendChild(closeButton)


        padding = document.createElement('div')
        padding.classList.add('padding')
        actionPanel.appendChild(padding)

        copyButton = document.createElement('div')
        copyButton.classList.add 'action-button',
            'copy-button', 'icon', 'icon-clippy'
        copyButton.onclick = =>
            atom.clipboard.write(@getAllText())
            atom.notifications.addSuccess('Copied to clipboard')
        actionPanel.appendChild(copyButton)

        openButton = document.createElement('div')
        openButton.classList.add 'action-button',
            'open-button', 'icon', 'icon-file-symlink-file'
        openButton.onclick = =>
            bubbleText = @getAllText()
            atom.workspace.open().then (editor) ->
                editor.insertText(bubbleText)
        actionPanel.appendChild(openButton)

        @setMultiline false

        @tooltips = new CompositeDisposable()
        @tooltips.add atom.tooltips.add copyButton,
            title: 'Copy to clipboard'
        @tooltips.add atom.tooltips.add openButton,
            title: 'Open in new editor'

        @_hasResult = false

        return this

    addResult: (result) ->
        console.log 'ResultView: Add result', result

        @element.classList.remove('empty')

        if result.stream is 'status'
            if not @_hasResult and result.data is 'ok'
                console.log 'ResultView: Show status container'
                @statusContainer.classList.add 'icon', 'icon-check'
                @statusContainer.style.display = 'inline-block'
            return

        if result.stream is 'stderr'
            container = @errorContainer
        else if result.stream is 'stdout'
            container = @resultContainer
        else if result.stream is 'error'
            container = @errorContainer
        else
            container = @resultContainer

        onSuccess = ({mimetype, el}) =>
            console.log 'ResultView: Hide status container'
            @_hasResult = true
            @statusContainer.style.display = 'none'

            mimeType = mimetype
            htmlElement = el

            if mimeType is 'text/plain'
                @element.classList.remove 'rich'

                previousText = @getAllText()
                text = result.data['text/plain']
                if previousText is '' and text.length < 50 and
                text.indexOf('\n') is -1
                    @setMultiline false

                    @tooltips.add atom.tooltips.add container,
                        title: 'Copy to clipboard'

                    container.onclick = =>
                        atom.clipboard.write @getAllText()
                        atom.notifications.addSuccess 'Copied to clipboard'
                else
                    @setMultiline true

            else
                @element.classList.add 'rich'
                @setMultiline true

            if mimeType is 'application/pdf'
                webview = document.createElement('webview')
                webview.src = htmlElement.href
                htmlElement = webview

            console.log 'ResultView: Rendering as MIME ', mimeType
            console.log 'ResultView: Rendering as ', htmlElement
            # @getAllText must be called after appending the htmlElement
            # in order to obtain innerText
            container.appendChild htmlElement

            if mimeType is 'text/html'
                if @getAllText() isnt ''
                    @element.classList.remove 'rich'

            if mimeType is 'image/svg+xml'
                container.classList.add('svg')

            if mimeType is 'text/markdown'
                @element.classList.add 'markdown'
                @element.classList.remove 'rich'

            if mimeType is 'text/latex'
                @element.classList.add 'latex'

            if @errorContainer.getElementsByTagName('span').length is 0
                @errorContainer.classList.add('plain-error')
            else
                @errorContainer.classList.remove('plain-error')

        onError = (error) ->
            console.error 'ResultView: Rendering error:', error

        transform(result.data).then onSuccess, onError


    getAllText: ->
        text = ''

        resultText = @resultContainer.innerText.trim()
        if resultText.length > 0
            text += resultText

        errorText = @errorContainer.innerText.trim()
        if errorText.length > 0
            text += '\n' + errorText

        return text


    setMultiline: (multiline) ->
        if multiline
            @element.classList.add 'multiline'
        else
            @element.classList.remove 'multiline'


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


transformime = require 'transformime'
MarkdownTransform = require 'transformime-marked'

transform = transformime.createTransform([MarkdownTransform])
