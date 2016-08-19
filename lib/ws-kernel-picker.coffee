{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'

Config = require './config'
services = require './jupyter-js-services-shim'
WSKernel = require './ws-kernel'
uuid = require 'uuid'

class CustomListView extends SelectListView
    initialize: (@emptyMessage, @onConfirmed) ->
        super
        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel(item: this)
        @panel.show()
        @focusFilterEditor()

    getFilterKey: ->
        'name'

    destroy: ->
        @cancel()

    viewForItem: (item) ->
        element = document.createElement('li')
        element.textContent = item.name
        element

    cancelled: ->
        @panel?.destroy()
        @panel = null

    confirmed: (item) ->
        @onConfirmed?(item)
        @cancel()

    getEmptyMessage: ->
        @emptyMessage

module.exports =
class WSKernelPicker
    constructor: (onChosen) ->
        @_onChosen = onChosen

    toggle: (grammar) ->
        gateways = Config.getJson('gateways', [])
        if _.isEmpty gateways
            atom.notifications.addError 'No remote kernel gateways available',
                description: 'Use the Hydrogen package settings to specify the list
                of remote servers. Hydrogen can use remote kernels on either a
                Jupyter Kernel Gateway or Jupyter notebook server.'
            return

        @_grammar = grammar
        @_path = atom.workspace.getActiveTextEditor().getPath() + '-' + uuid.v4()
        gatewayListing = new CustomListView('No gateways available', @onGateway.bind this)
        @previouslyFocusedElement = gatewayListing.previouslyFocusedElement
        gatewayListing.setItems gateways
        gatewayListing.setError 'Select a gateway' # TODO(nikita): maybe don't misuse error

    onGateway: (spec) ->
        console.log('Picked a gateway')
        sessionListing = new CustomListView('No sessions available', @onSession.bind this)
        sessionListing.previouslyFocusedElement = @previouslyFocusedElement
        sessionListing.setLoading 'Loading sessions...'

        services.listRunningSessions(spec.options)
        .then (sessionModels) ->
            items = sessionModels.map (model) ->
                if model.notebook?.path?
                    name = model.notebook.path
                else
                    name = "Session #{model.id}"
                return {
                    name: name
                    model: model
                    options: spec.options
                }
            items.unshift
                name: '[new session]'
                model: null
                options: spec.options
            sessionListing.setItems(items)

        , (err) =>
            # Gateways offer the option of never listing sessions, for security
            # reasons.
            # Assume this is the case and proceed to creating a new session.
            @onSession
                name: '[new session]'
                model: null
                options: spec.options

    onSession: (spec) ->
        unless spec.model?
            kernelListing = new CustomListView('No kernel specs available', @startSession.bind this)
            kernelListing.previouslyFocusedElement = @previouslyFocusedElement
            kernelListing.setLoading 'Loading kernel specs...'

            services.getKernelSpecs(spec.options)
            .then (specmodels) =>
                items = _.map specmodels.kernelspecs, (specmodel) =>
                    options = Object.assign({}, spec.options)
                    options.kernelName = specmodel.name
                    options.path = @_path
                    return {
                        name: specmodel.spec.display_name
                        options: options
                    }
                kernelListing.setItems items
                unless spec.name?
                    kernelListing.setError 'This gateway does not support listing sessions'
            , (err) ->
                kernelListing.setError 'Connection to gateway failed'
        else
            services.connectToSession(spec.model.id, spec.options).then(@onSessionChosen.bind this)

    startSession: (spec) ->
        services.startNewSession(spec.options).then(@onSessionChosen.bind this)

    onSessionChosen: (session) ->
        session.kernel.getKernelSpec().then (kernelSpec) =>
            kernel = new WSKernel(kernelSpec, @_grammar, session)
            @_onChosen(kernel)
