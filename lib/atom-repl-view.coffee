module.exports =
class AtomReplView
  constructor: (serializedState) ->
    # Create root element
    @element = document.createElement('div')
    @element.classList.add('atom-repl')

    # Create message element
    message = document.createElement('div')
    message.textContent = "The AtomRepl package is Alive! It's ALIVE!"
    message.classList.add('message')
    @element.appendChild(message)

    # @editor = currentPaneItem
    # @editorView = atom.views.getView(@editor)
    # @buffer = @editor.getBuffer()

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    @element
