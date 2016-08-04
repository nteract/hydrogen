{$} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'
_ = require 'lodash'

WatchView = require './watch-view'
WatchesPicker = require './watches-picker'

module.exports =
class WatchSidebar
    constructor: (@kernel) ->
        @element = document.createElement('div')
        @element.classList.add('hydrogen', 'watch-sidebar')

        toolbar = document.createElement('div')
        toolbar.classList.add('toolbar', 'block')

        languageDisplay = document.createElement('div')
        languageDisplay.classList.add('language', 'icon', 'icon-eye')
        languageDisplay.innerText = @kernel.kernelSpec.display_name

        commands = document.createElement('div')
        commands.classList.add('btn-group')
        removeButton = document.createElement('button')
        removeButton.classList.add('btn', 'icon', 'icon-trashcan')
        removeButton.onclick = => @removeWatch()
        toggleButton = document.createElement('button')
        toggleButton.classList.add('btn', 'icon', 'icon-remove-close')
        toggleButton.onclick = ->
            editor = atom.workspace.getActiveTextEditor()
            editorView = atom.views.getView(editor)
            atom.commands.dispatch(editorView, 'hydrogen:toggle-watches')

        tooltips = new CompositeDisposable()
        tooltips.add atom.tooltips.add toggleButton,
            title: 'Toggle Watch Sidebar'
        tooltips.add atom.tooltips.add removeButton,
            title: 'Remove Watch'

        @watchesContainer = document.createElement('div')
        _.forEach @watchViews, (watch) =>
            @watchesContainer.appendChild(watch.element)

        addButton = document.createElement('button')
        addButton.classList.add('add-watch', 'btn', 'btn-primary',
                                 'icon', 'icon-plus', 'inline-block')
        addButton.innerText = 'Add watch'
        addButton.onclick = => @addWatch()

        resizeHandle = document.createElement('div')
        resizeHandle.classList.add('watch-resize-handle')
        $(resizeHandle).on 'mousedown', @resizeStarted

        toolbar.appendChild(languageDisplay)
        toolbar.appendChild(commands)
        commands.appendChild(removeButton)
        commands.appendChild(toggleButton)

        @element.appendChild(toolbar)
        @element.appendChild(@watchesContainer)
        @element.appendChild(addButton)
        @element.appendChild(resizeHandle)

        @kernel.addWatchCallback =>
            @run()

        @watchViews = []
        @addWatch()

        @hide()
        atom.workspace.addRightPanel(item: @element)


    createWatch: ->
        watch = _.last @watchViews
        if not watch or watch.getCode().replace /\s/g, '' isnt ''
            watch = new WatchView(@kernel)
            @watchViews.push watch
            @watchesContainer.appendChild watch.element
        watch

    addWatch: ->
        @createWatch().inputElement.element.focus()

    addWatchFromEditor: ->
        watchText = atom.workspace.getActiveTextEditor().getSelectedText()
        unless watchText
            @addWatch()
        else
            @createWatch().setCode(watchText).run()
        @show()

    removeWatch: ->
        watches = (for v, k in @watchViews
            name: v.getCode()
            value: k)
        WatchesPicker.onConfirmed = (item) =>
            @watchViews[item.value].destroy()
            @watchViews.splice item.value, 1
        WatchesPicker.setItems watches
        WatchesPicker.toggle()

    run: ->
        if @visible
            _.forEach @watchViews, (watchView) ->
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
