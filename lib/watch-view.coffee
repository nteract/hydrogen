{TextEditorView} = require 'atom-space-pen-views'

ResultView = require './result-view'

module.exports =
class WatchView

    constructor: (@kernel) ->
        @element = document.createElement('div')
        @element.classList.add('hydrogen', 'watch-view')

        @inputElement = new TextEditorView()
        @inputElement.element.classList.add('watch-input')

        @inputEditor = @inputElement.getModel()
        @inputEditor.setGrammar(@kernel.grammar)
        @inputEditor.setSoftWrapped(true)
        @inputEditor.setLineNumberGutterVisible(false)
        @inputEditor.moveToTop()

        @resultView = new ResultView()
        @resultView.setMultiline(true)

        @element.appendChild(@inputElement.element)
        @element.appendChild(@resultView.element)

        @addHistorySwitch().clearHistory()

    clearHistory: (@currentHistory=[]) -> this
    addToHistory: (result) ->
        return if result.data is 'ok'
        @currentHistory.push(result)
        @currentHistory.pos = @currentHistory.length - 1
        @counter.innerText = "#{@currentHistory.length} / #{@currentHistory.length}"
        @scrollbar.querySelector('.hidden').style.width =
            (total = @currentHistory.length * @scrollbar.offsetWidth) + 'px'
        @scrollbar.scrollLeft = total
        @historySwitch.classList.add 'show'
        this

    addHistorySwitch: ->
        @historySwitch = document.createElement 'div'
        @historySwitch.classList.add('history-switch', 'hide')

        @scrollbar = document.createElement 'div'
        filler = document.createElement 'div'
        @scrollbar.classList.add 'scrollbar'
        filler.classList.add 'hidden'
        @scrollbar.appendChild filler
        @scrollbar.onscroll = =>
            @currentHistory.pos = Math.ceil(@scrollbar.scrollLeft / (@scrollbar.offsetWidth+1))
            @counter.innerText = "#{@currentHistory.pos+1} / #{@currentHistory.length}"
            @clearResults()
            @resultView.addResult @currentHistory[@currentHistory.pos]

        @counter = document.createElement('div')
        @counter.classList.add('counter')

        nextButton = document.createElement('button')
        nextButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-right', 'next-btn')
        nextButton.onclick = =>
            if @currentHistory.pos isnt @currentHistory.length - 1 and @currentHistory.pos?
                @currentHistory.pos += 1
                @counter.innerText = "#{@currentHistory.pos+1} / #{@currentHistory.length}"
                @scrollbar.scrollLeft = @currentHistory.pos * (@scrollbar.offsetWidth+1)
                @clearResults()
                @resultView.addResult @currentHistory[@currentHistory.pos]

        prevButton = document.createElement('button')
        prevButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-left')
        prevButton.onclick = =>
            if @currentHistory.pos isnt 0 and @currentHistory.pos?
                @currentHistory.pos -= 1
                @counter.innerText = "#{@currentHistory.pos+1} / #{@currentHistory.length}"
                @scrollbar.scrollLeft = @currentHistory.pos * (@scrollbar.offsetWidth+1)
                @clearResults()
                @resultView.addResult @currentHistory[@currentHistory.pos]

        @historySwitch.appendChild(prevButton)
        @historySwitch.appendChild(@counter)
        @historySwitch.appendChild(nextButton)
        @historySwitch.appendChild(@scrollbar)
        @element.appendChild @historySwitch
        this

    run: ->
        code = @getCode()
        @clearResults()
        console.log 'watchview running:', code
        if code? and code.length? and code.length > 0
            @kernel.executeWatch code, (result) =>
                console.log 'watchview got result:', result
                @resultView.addResult(result)
                @addToHistory result

    setCode: (code) ->
        @inputEditor.setText code
        this

    getCode: ->
        return @inputElement.getText()

    clearResults: ->
        try
            @element.removeChild(@resultView.element)
            @resultView.destroy()
        catch e
            console.error e

        @resultView = new ResultView()
        @resultView.setMultiline(true)
        @element.appendChild(@resultView.element)

    destroy: ->
        @clearResults()
        @element.parentNode.removeChild @element
