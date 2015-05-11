# atom = require 'atom'
_ = require 'lodash'

module.exports =
class ResultView extends HTMLElement
    @element = null

    constructor:  ->
        @element = document.createElement('div')
        @element.classList.add('atom-repl')
        @element.classList.add('output-bubble')

        atom.views.addViewProvider {
                modelConstructor: this
                viewConstructor: this
            }
        return this

    append: (text) ->
        @element.innerText = @element.innerText + text

    # setType: (type) ->
    #     if type == 'result'
    #         @element.classList.remove('error')
    #     else if type == 'error'
    #         @element.classList.add('error')
    #     else
    #         throw "Not a type this bubble can be!"

    destroy: ->
        @element.remove()

    getElement: ->
        @element
