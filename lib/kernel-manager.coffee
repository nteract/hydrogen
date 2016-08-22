_ = require 'lodash'
child_process = require 'child_process'
{launchSpec} = require 'spawnteract'
fs = require 'fs'
path = require 'path'

Config = require './config'
WSKernel = require './ws-kernel'
ZMQKernel = require './zmq-kernel'
KernelPicker = require './kernel-picker'

module.exports =
class KernelManager
    constructor: ->
        @_runningKernels = {}
        @_kernelSpecs = @getKernelSpecsFromSettings()


    destroy: ->
        _.forEach @_runningKernels, (kernel) -> kernel.destroy()
        @_runningKernels = {}


    setRunningKernelFor: (grammar, kernel) ->
        language = @getLanguageFor grammar

        kernel.kernelSpec.language = language

        @_runningKernels[language] = kernel


    destroyRunningKernelFor: (grammar) ->
        language = @getLanguageFor grammar
        kernel = @_runningKernels[language]
        delete @_runningKernels[language]
        kernel?.destroy()


    restartRunningKernelFor: (grammar, onRestarted) ->
        language = @getLanguageFor grammar
        kernel = @_runningKernels[language]

        if kernel instanceof WSKernel
            kernel.restart().then -> onRestarted?(kernel)
            return

        if kernel instanceof ZMQKernel and kernel.kernelProcess
            kernelSpec = kernel.kernelSpec
            @destroyRunningKernelFor grammar
            @startKernel kernelSpec, grammar, (kernel) -> onRestarted?(kernel)
            return

        console.log 'KernelManager: restartRunningKernelFor: ignored', kernel
        atom.notifications.addWarning 'Cannot restart this kernel'
        onRestarted?(kernel)


    startKernelFor: (grammar, onStarted) ->
        try
            rootDirectory = atom.project.rootDirectories[0].path or
                path.dirname atom.workspace.getActiveTextEditor().getPath()
            connectionFile = path.join(
                rootDirectory, 'hydrogen', 'connection.json'
            )
            connectionString = fs.readFileSync connectionFile, 'utf8'
            connection = JSON.parse connectionString
            @startExistingKernel grammar, connection, connectionFile, onStarted
            return

        catch e
            unless e.code is 'ENOENT'
                console.log 'KernelManager: Cannot start existing kernel:\n', e

        language = @getLanguageFor grammar
        @getKernelSpecFor language, (kernelSpec) =>
            unless kernelSpec?
                message = "No kernel for language `#{language}` found"
                description = 'Check that the language for this file is set in Atom
                         and that you have a Jupyter kernel installed for it.'
                atom.notifications.addError message, description: description
                return

            @startKernel kernelSpec, grammar, onStarted


    startExistingKernel: (grammar, connection, connectionFile, onStarted) ->
        language = @getLanguageFor grammar

        console.log 'KernelManager: startExistingKernel: Assuming', language

        kernelSpec =
            display_name: 'Existing Kernel'
            language: language
            argv: []
            env: {}

        kernel = new ZMQKernel kernelSpec, grammar, connection, connectionFile

        @setRunningKernelFor grammar, kernel

        @_executeStartupCode kernel

        onStarted?(kernel)


    startKernel: (kernelSpec, grammar, onStarted) ->
        language = @getLanguageFor grammar

        console.log 'KernelManager: startKernelFor:', language

        projectPath = path.dirname(
            atom.workspace.getActiveTextEditor().getPath()
        )
        spawnOptions =
            cwd: projectPath
        launchSpec(kernelSpec, spawnOptions).
            then ({config, connectionFile, spawn}) =>
                kernel = new ZMQKernel(
                    kernelSpec, grammar,
                    config, connectionFile,
                    spawn
                )
                @setRunningKernelFor grammar, kernel

                @_executeStartupCode kernel

                onStarted?(kernel)


    _executeStartupCode: (kernel) ->
        displayName = kernel.kernelSpec.display_name
        startupCode = Config.getJson('startupCode')[displayName]
        if startupCode?
            console.log 'KernelManager: Executing startup code:', startupCode
            startupCode = startupCode + ' \n'
            kernel.execute startupCode


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
                    description: 'Use kernelSpec option in Hydrogen or update
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
