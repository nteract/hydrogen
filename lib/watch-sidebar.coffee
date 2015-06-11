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
        languageDisplay.innerText = "Language: #{@language}"
        languageDisplay.onclick = =>
            editor = atom.workspace.getActiveTextEditor()
            editorView = atom.views.getView(editor)
            atom.commands.dispatch(editorView, 'hydrogen:select-watch-language')

        # watch = new WatchView(@kernel, @grammar)


        @watchesContainer = document.createElement('div')
        _.forEach @watchViews, (watch) =>
            @watchesContainer.appendChild(watch.element)

        @addButton = document.createElement('button')
        @addButton.classList.add('add-watch', 'btn', 'btn-primary',
                                 'icon', 'icon-plus', 'inline-block')
        @addButton.innerText = "Add watch"
        @addButton.onclick = => @addWatch()

        @element.appendChild(title)
        @element.appendChild(languageDisplay)
        @element.appendChild(@watchesContainer)
        @element.appendChild(@addButton)

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
        _.forEach @watchViews, (watchView) =>
            watchView.run()

    show: ->
        @element.classList.remove('hidden')
        @visible = true

    hide: ->
        @element.classList.add('hidden')
        @visible = false
