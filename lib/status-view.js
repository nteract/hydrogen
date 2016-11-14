module.exports =
class StatusView

    constructor: (@language) ->
        @element = document.createElement('div')
        @element.classList.add('hydrogen')
        @element.classList.add('status')

        @element.innerText = @language + ': starting'


    setStatus: (status) ->
        @element.innerText = @language + ': ' + status


    destroy: ->
        @element.innerHTML = ''
        @element.remove()
