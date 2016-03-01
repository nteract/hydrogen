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
      this

    addHistorySwitch: ->
        @historySwitch = document.createElement 'div'
        @historySwitch.classList.add 'history-switch'


        @nextButton = document.createElement('block')
        @nextButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-right', 'next-btn')
        @nextButton.onclick = =>
            if @currentHistory.pos != @currentHistory.length - 1 and @currentHistory.pos?
                @currentHistory.pos = @currentHistory.pos + 1
                @clearResults()
                @resultView.addResult @currentHistory[@currentHistory.pos]

        @previousButton = document.createElement('block')
        @previousButton.classList.add('btn', 'btn-xs', 'icon', 'icon-chevron-left', 'previous-btn')
        @previousButton.onclick = =>
            if @currentHistory.pos != 0 and @currentHistory.pos?
                @currentHistory.pos = @currentHistory.pos - 1
                @clearResults()
                @resultView.addResult @currentHistory[@currentHistory.pos]

        @historySwitch.appendChild(@previousButton)
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
