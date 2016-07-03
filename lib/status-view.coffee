module.exports =
class StatusView

    constructor: (@language) ->
        @element = document.createElement('div')
        @element.classList.add('hydrogen')
        @element.classList.add('status')

        @element.innerText = @language

        @status = ''
        @scope = ''
        return this


    setStatus: (status) ->
        @status = status
        @element.innerText = @language + ": " + status + " [#{@scope}]"

    setScope: (scope) ->
        @scope = scope
        @element.innerText = @language + ": " + @status + " [#{@scope}]"

    destroy: ->
        @element.innerHTML = ''
        @element.remove()

    getElement: ->
        @element
