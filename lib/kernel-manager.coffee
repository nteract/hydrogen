_ = require 'lodash'
child_process = require 'child_process'
fs = require 'fs'
path = require 'path'

Config = require './config'
ZMQKernel = require './zmq-kernel'
KernelPicker = require './kernel-picker'

module.exports =
class KernelManager
    constructor: ->
        @_runningKernels = {}
        @_kernelSpecs = @getKernelSpecsFromSettings()


    destroy: ->
        _.forEach @_runningKernels, (kernel) => @destroyRunningKernel kernel


    destroyRunningKernel: (kernel) ->
        delete @_runningKernels[kernel.kernelSpec.language]
        kernel.destroy()


    startKernelFor: (grammar, onStarted) ->
        language = @getLanguageFor grammar
        @getKernelSpecFor language, (kernelSpec) =>

            unless kernelSpec?
                message = "No kernel for language `#{language}` found"
                detail = 'Check that the language for this file is set in Atom
                         and that you have a Jupyter kernel installed for it.'
                atom.notifications.addError message, detail: detail
                return

            console.log 'startKernelFor:', language
            @startKernel kernelSpec, grammar, onStarted


    startKernel: (kernelSpec, grammar, onStarted) ->
        language = @getLanguageFor grammar

        kernelSpec.language = language

        rootDirectory = atom.project.rootDirectories[0].path
        connectionFile = path.join rootDirectory, 'hydrogen', 'connection.json'

        finishKernelStartup = (kernel) =>
            @_runningKernels[language] = kernel

            startupCode = Config.getJson('startupCode')[kernelSpec.display_name]
            if startupCode?
                console.log 'executing startup code'
                startupCode = startupCode + ' \n'
                kernel.execute startupCode

            onStarted?(kernel)

        try
            data = fs.readFileSync connectionFile, 'utf8'
            config = JSON.parse data
            console.log 'KernelManager: Using connection file: ', connectionFile
            kernel = new ZMQKernel(
                kernelSpec, grammar, config, connectionFile, true
            )
            finishKernelStartup kernel

        catch e
            unless e.code is 'ENOENT'
                throw e
            ZMQKernel.createConnectionFile (filepath, config) ->
                kernel = new ZMQKernel(
                    kernelSpec, grammar, config, filepath, onlyConnect = false
                )
                finishKernelStartup kernel

    attachKernel: (grammar, kernel) ->
        # Attaches an already constructed Kernel instance to a grammar
        # (designed to be used for remote kernels)
        # No startup code is run in this case
        language = @getLanguageFor grammar
        @_runningKernels[language] = kernel


    getAllRunningKernels: ->
        return _.clone @_runningKernels


    getRunningKernelFor: (language) ->
        return @_runningKernels[language]


    getLanguageFor: (grammar) ->
        return grammar?.name.toLowerCase()


    getAllKernelSpecs: (callback) =>
        if _.isEmpty @_kernelSpecs
            @updateKernelSpecs =>
                callback _.map @_kernelSpecs, 'spec'
        else
            callback _.map @_kernelSpecs, 'spec'


    getAllKernelSpecsFor: (language, callback) ->
        if language?
            @getAllKernelSpecs (kernelSpecs) =>
                specs = kernelSpecs.filter (spec) =>
                    @kernelSpecProvidesLanguage spec, language

                callback specs
        else
            callback []


    getKernelSpecFor: (language, callback) ->
        unless language?
            return null

        @getAllKernelSpecsFor language, (kernelSpecs) =>
            if kernelSpecs.length <= 1
                callback kernelSpecs[0]
            else
                unless @kernelPicker?
                    @kernelPicker = new KernelPicker (onUpdated) ->
                        onUpdated kernelSpecs
                    @kernelPicker.onConfirmed = ({kernelSpec}) ->
                        callback kernelSpec
                @kernelPicker.toggle()


    kernelSpecProvidesLanguage: (kernelSpec, language) ->
        kernelLanguage = kernelSpec.language
        mappedLanguage = Config.getJson('languageMappings')[kernelLanguage]

        if mappedLanguage
            return mappedLanguage is language

        return kernelLanguage.toLowerCase() is language


    getKernelSpecsFromSettings: ->
        settings = Config.getJson 'kernelspec'

        unless settings.kernelspecs
            return {}

        # remove invalid entries
        return _.pickBy settings.kernelspecs, ({spec}) ->
            return spec?.language and spec.display_name and spec.argv


    mergeKernelSpecs: (kernelSpecs) ->
        _.assign @_kernelSpecs, kernelSpecs


    updateKernelSpecs: (callback) ->
        @_kernelSpecs = @getKernelSpecsFromSettings
        @getKernelSpecsFromJupyter (err, kernelSpecsFromJupyter) =>
            unless err
                @mergeKernelSpecs kernelSpecsFromJupyter

            if _.isEmpty @_kernelSpecs
                message = 'No kernel specs found'
                options =
                    detail: 'Use kernelSpec option in Hydrogen or update
                    IPython/Jupyter to a version that supports: `jupyter
                    kernelspec list --json` or `ipython kernelspec list --json`'
                    dismissable: true
                atom.notifications.addError message, options
            else
                err = null
                message = 'Hydrogen Kernels updated:'
                options =
                    detail:
                        (_.map @_kernelSpecs, 'spec.display_name').join('\n')
                atom.notifications.addInfo message, options

            callback? err, @_kernelSpecs


    getKernelSpecsFromJupyter: (callback) =>
        jupyter = 'jupyter kernelspec list --json --log-level=CRITICAL'
        ipython = 'ipython kernelspec list --json --log-level=CRITICAL'

        @getKernelSpecsFrom jupyter, (jupyterError, kernelSpecs) =>
            unless jupyterError
                callback? jupyterError, kernelSpecs
                return

            @getKernelSpecsFrom ipython, (ipythonError, kernelSpecs) ->
                unless ipythonError
                    callback? ipythonError, kernelSpecs
                else
                    callback? jupyterError, kernelSpecs


    getKernelSpecsFrom: (command, callback) ->
        options = killSignal: 'SIGINT'
        child_process.exec command, options, (err, stdout, stderr) ->
            unless err
                try
                    kernelSpecs = JSON.parse(stdout).kernelspecs
                catch error
                    err = error
                    console.log 'Could not parse kernelspecs:', err

            callback? err, kernelSpecs
