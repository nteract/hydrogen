{SelectListView} = require 'atom-space-pen-views'
_ = require 'lodash'
tildify = require 'tildify'

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

    toggle: (@_grammar, @_kernelSpecFilter) ->
        gateways = Config.getJson('gateways', [])
        if _.isEmpty gateways
            atom.notifications.addError 'No remote kernel gateways available',
                description: 'Use the Hydrogen package settings to specify the list
                of remote servers. Hydrogen can use remote kernels on either a
                Jupyter Kernel Gateway or Jupyter notebook server.'
            return

        @_path = atom.workspace.getActiveTextEditor().getPath() + '-' + uuid.v4()
        gatewayListing = new CustomListView('No gateways available', @onGateway.bind this)
        @previouslyFocusedElement = gatewayListing.previouslyFocusedElement
        gatewayListing.setItems gateways
        gatewayListing.setError 'Select a gateway' # TODO(nikita): maybe don't misuse error

    onGateway: (gatewayInfo) ->
        services.getKernelSpecs(gatewayInfo.options)
        .then (specModels) =>
            kernelSpecs = _.filter specModels.kernelspecs, (specModel) =>
                @_kernelSpecFilter specModel.spec

            kernelNames = _.map kernelSpecs, (specModel) ->
                specModel.name

            sessionListing = new CustomListView('No sessions available', @onSession.bind this)
            sessionListing.previouslyFocusedElement = @previouslyFocusedElement
            sessionListing.setLoading 'Loading sessions...'

            services.listRunningSessions(gatewayInfo.options)
            .then (sessionModels) ->
                sessionModels = sessionModels.filter (model) ->
                    name = model.kernel?.name
                    if name?
                        return name in kernelNames
                    else
                        return true
                items = sessionModels.map (model) ->
                    if model.notebook?.path?
                        name = tildify model.notebook.path
                    else
                        name = "Session #{model.id}"
                    return {
                        name: name
                        model: model
                        options: gatewayInfo.options
                    }
                items.unshift
                    name: '[new session]'
                    model: null
                    options: gatewayInfo.options
                    kernelSpecs: kernelSpecs
                sessionListing.setItems(items)

            , (err) =>
                # Gateways offer the option of never listing sessions, for security
                # reasons.
                # Assume this is the case and proceed to creating a new session.
                @onSession
                    name: '[new session]'
                    model: null
                    options: gatewayInfo.options
                    kernelSpecs: kernelSpecs
        , (err) ->
            atom.notifications.addError 'Connection to gateway failed'


    onSession: (sessionInfo) ->
        unless sessionInfo.model?
            kernelListing = new CustomListView('No kernel specs available', @startSession.bind this)
            kernelListing.previouslyFocusedElement = @previouslyFocusedElement

            items = _.map sessionInfo.kernelSpecs, (specModel) =>
                options = Object.assign({}, sessionInfo.options)
                options.kernelName = specModel.name
                options.path = @_path
                return {
                    name: specModel.spec.display_name
                    options: options
                }
            kernelListing.setItems items
            unless sessionInfo.name?
                kernelListing.setError 'This gateway does not support listing sessions'
        else
            services.connectToSession(sessionInfo.model.id, sessionInfo.options).then(@onSessionChosen.bind this)

    startSession: (sessionInfo) ->
        services.startNewSession(sessionInfo.options).then(@onSessionChosen.bind this)

    onSessionChosen: (session) ->
        session.kernel.getKernelSpec().then (kernelSpec) =>
            kernel = new WSKernel(kernelSpec, @_grammar, session)
            @_onChosen(kernel)
