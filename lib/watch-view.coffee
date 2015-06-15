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
        # @inputEditor.setText("\n\n")
        @inputEditor.moveToTop()

        @resultView = new ResultView()
        @resultView.setMultiline(true)

        @element.appendChild(@inputElement.element)
        @element.appendChild(@resultView.element)

    run: ->
        code = @getCode()
        @clearResults()
        console.log "watchview running:", code
        if code? and code.length? and code.length > 0
            @kernel.executeWatch code, (result) =>
                console.log "watchview got result:", result
                @resultView.addResult(result)

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
