{TextEditorView} = require 'atom-space-pen-views'
_ = require 'lodash'

ResultView = require './result-view'

module.exports =
class WatchView

    constructor: (@kernel, @grammar) ->
        @element = document.createElement('div')
        @element.classList.add('hydrogen', 'watch-view')

        @inputElement = new TextEditorView()
        @inputElement.element.classList.add('watch-input')

        @inputEditor = @inputElement.getModel()
        @inputEditor.setGrammar(@grammar)
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
      @historyInfo.innerText = "#{@currentHistory.length} / #{@currentHistory.length}"
      this

    addHistorySwitch: ->
        @historySwitch = document.createElement 'div'
        @historySwitch.classList.add 'history-switch'

        @historyInfo = document.createElement('div')
        @historyInfo.classList.add('history-info')
        @historyInfo.innerText = "0 / 0"

        @nextButton = document.createElement('button')
        @nextButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-right', 'next-btn')
        @nextButton.onclick = =>
            if @currentHistory.pos != @currentHistory.length - 1 and @currentHistory.pos?
                @currentHistory.pos += 1

                txt = "#{@currentHistory.pos + 1} / #{@currentHistory.length}"
                @historyInfo.innerText = txt

                @clearResults()
                @resultView.addResult @currentHistory[@currentHistory.pos]

        @prevButton = document.createElement('button')
        @prevButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-left')
        @prevButton.onclick = =>
            if @currentHistory.pos != 0 and @currentHistory.pos?
                @currentHistory.pos -= 1

                txt = "#{@currentHistory.pos + 1} / #{@currentHistory.length}"
                @historyInfo.innerText = txt
                
                @clearResults()
                @resultView.addResult @currentHistory[@currentHistory.pos]

        @historySwitch.appendChild(@prevButton)
        @historySwitch.appendChild(@historyInfo)
        @historySwitch.appendChild(@nextButton)
        @element.appendChild @historySwitch
        this

    run: ->
        code = @getCode()
        @clearResults()
        console.log "watchview running:", code
        if code? and code.length? and code.length > 0
            @kernel.executeWatch code, (result) =>
                console.log "watchview got result:", result
                @resultView.addResult(result)
                @addToHistory result

    setCode: (code)->
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
