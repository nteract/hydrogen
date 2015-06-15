{$} = require 'atom-space-pen-views'
_ = require 'lodash'

WatchView = require './watch-view'

module.exports =
class WatchSidebar
    constructor: (@kernel, @grammar) ->
        KernelManager = require './kernel-manager'
        @language = KernelManager.getTrueLanguage(@grammar.name)

        @element = document.createElement('div')
        @element.classList.add('hydrogen', 'watch-sidebar')

        title = document.createElement('h1')
        title.classList.add('watch-sidebar-title')
        title.innerText = "Hydrogen Watch"

        languageDisplay = document.createElement('h3')
        languageDisplay.classList.add('watch-sidebar-language')
        languageDisplay.innerText = "Kernel: #{@language}"
        languageDisplay.onclick = =>
            editor = atom.workspace.getActiveTextEditor()
            editorView = atom.views.getView(editor)
            atom.commands.dispatch(editorView, 'hydrogen:select-watch-kernel')

        # watch = new WatchView(@kernel, @grammar)


        @watchesContainer = document.createElement('div')
        _.forEach @watchViews, (watch) =>
            @watchesContainer.appendChild(watch.element)

        @addButton = document.createElement('button')
        @addButton.classList.add('add-watch', 'btn', 'btn-primary',
                                 'icon', 'icon-plus', 'inline-block')
        @addButton.innerText = "Add watch"
        @addButton.onclick = => @addWatch()

        @resizeHandle = document.createElement('div')
        @resizeHandle.classList.add('watch-resize-handle')
        $(@resizeHandle).on 'mousedown', @resizeStarted

        @element.appendChild(title)
        @element.appendChild(languageDisplay)
        @element.appendChild(@watchesContainer)
        @element.appendChild(@addButton)
        @element.appendChild(@resizeHandle)

        @kernel.addWatchCallback =>
            @run()

        @watchViews = []
        @addWatch()

        @hide()
        atom.workspace.addRightPanel(item: @element)


    addWatch: ->
        watch = new WatchView(@kernel, @grammar)
        @watchViews.push(watch)
        @watchesContainer.appendChild(watch.element)
        _.last(@watchViews).inputElement.element.focus()

    run: ->
        if @visible
            _.forEach @watchViews, (watchView) =>
                watchView.run()

    resizeStarted: =>
        $(document).on('mousemove', @resizeTreeView)
        $(document).on('mouseup', @resizeStopped)

    resizeStopped: =>
        $(document).off('mousemove', @resizeTreeView)
        $(document).off('mouseup', @resizeStopped)

    resizeTreeView: ({pageX, which}) =>
        return @resizeStopped() unless which is 1

        width = $(document.body).width() - pageX
        @element.style.width = "#{width - 10}px"

    show: ->
        @element.classList.remove('hidden')
        @visible = true

    hide: ->
        @element.classList.add('hidden')
        @visible = false
