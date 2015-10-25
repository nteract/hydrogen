{$} = require 'atom-space-pen-views'
_ = require 'lodash'

WatchView = require './watch-view'
WatchesPicker = require './watches-picker'

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


    createWatch: ->
        watch = _.last @watchViews
        if not watch or watch.getCode().replace /\s/g, '' != ''
            watch = new WatchView(@kernel, @grammar)
            @watchViews.push watch
            @watchesContainer.appendChild watch.element
        watch

    addWatch: ->
        @createWatch().inputElement.element.focus()

    addWatchFromEditor: ->
        unless watchText = atom.workspace.getActiveTextEditor().getSelectedText()
            @addWatch()
        else
            @createWatch().setCode(watchText).run()
        @show()

    removeWatch: ->
      watches = (for v,k in @watchViews
          name: v.getCode()
          value: k)
      WatchesPicker.onConfirmed = (item) =>
        @watchViews[item.value].destroy()
        @watchViews.splice item.value, 1
      WatchesPicker.setItems watches
      WatchesPicker.toggle()

    run: ->
        if @visible
            _.forEach @watchViews, (watchView) =>
                watchView.run()

    resizeStarted: =>
        $(document).on('mousemove', @resizeSidebar)
        $(document).on('mouseup', @resizeStopped)

    resizeStopped: =>
        $(document).off('mousemove', @resizeSidebar)
        $(document).off('mouseup', @resizeStopped)

    resizeSidebar: ({pageX, which}) =>
        return @resizeStopped() unless which is 1

        width = $(document.body).width() - pageX
        @element.style.width = "#{width - 10}px"

    show: ->
        @element.classList.remove('hidden')
        @visible = true

    hide: ->
        @element.classList.add('hidden')
        @visible = false
