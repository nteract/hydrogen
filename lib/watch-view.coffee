_ = require 'lodash'

ResultView = require './result-view'

module.exports =
class WatchView

    constructor: (@kernel) ->
        @element = document.createElement('div')
        @element.classList.add('watch-view')

        @input = document.createElement('textarea')
        @input.classList.add('watch-input')

        @resultView = new ResultView()
        @resultView.setMultiline(true)

        @element.appendChild(@input)
        @element.appendChild(@resultView.element)

    getCode: ->
        return @input.value

    clearResults: ->
        @element.removeChild(@resultView.element)
        @resultView.destroy()
        
        @resultView = new ResultView()
        @resultView.setMultiline(true)
        @element.appendChild(@resultView.element)
