_ = require 'lodash'
child_process = require 'child_process'
fs = require 'fs'
path = require 'path'

Config = require './config'
ConfigManager = require './config-manager'
Kernel = require './kernel'

module.exports =
class KernelManager
    constructor: ->
        @_runningKernels = {}
        @_kernelSpecs = []


    destroy: ->
        _.forEach @_runningKernels, (kernel) => @destroyRunningKernel kernel


    destroyRunningKernel: (kernel) ->
        delete @_runningKernels[kernel.kernelSpec.language]
        kernel.destroy()


    startKernelFor: (grammar, onStarted) ->
        language = @getLanguageFor grammar

        console.log 'startKernelFor:', language

        kernelSpec = @getKernelSpecFor language

        unless kernelSpec?
            message = "No kernel for language `#{language}` found"
            options =
                detail: 'Check that the language for this file is set in Atom
                         and that you have a Jupyter kernel installed for it.'
            atom.notifications.addError message, options
            return

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
            kernel = new Kernel(
                kernelSpec, grammar, config, connectionFile, true
            )
            finishKernelStartup kernel

        catch e
            unless e.code is 'ENOENT'
                throw e
            ConfigManager.writeConfigFile (filepath, config) ->
                kernel = new Kernel(
                    kernelSpec, grammar, config, filepath, onlyConnect = false
                )
                finishKernelStartup kernel


    getAllRunningKernels: ->
        return _.clone @_runningKernels


    getRunningKernelFor: (language) ->
        return @_runningKernels[language]


    getLanguageFor: (grammar) ->
        return grammar?.name.toLowerCase()


    getAllKernelSpecs: ->
        return _.clone @_kernelSpecs


    getAllKernelSpecsFor: (language) ->
        unless language?
            return []

        kernelSpecs = @getAllKernelSpecs().filter (spec) =>
            @kernelSpecProvidesLanguage spec, language

        return kernelSpecs


    getKernelSpecFor: (language) ->
        unless language?
            return null

        kernelMapping = Config.getJson('kernelMappings')?[language]
        if kernelMapping?
            kernelSpecs = @getAllKernelSpecs().filter (spec) ->
                return spec.display_name is kernelMapping
        else
            kernelSpecs = @getAllKernelSpecsFor language

        return kernelSpecs[0]


    kernelSpecProvidesLanguage: (kernelSpec, language) ->
        kernelLanguage = kernelSpec.language
        mappedLanguage = Config.getJson('languageMappings')[kernelLanguage]

        if mappedLanguage
            return mappedLanguage is language

        return kernelLanguage.toLowerCase() is language


    parseKernelSpecSettings: ->
        settings = Config.getJson 'kernelspec'

        unless settings.kernelspecs
            return {}

        # remove invalid entries
        return _.pickBy settings.kernelspecs, ({spec}) ->
            return spec?.language and spec.display_name and spec.argv


    saveKernelSpecs: (jsonString) ->
        console.log 'saveKernelSpecs:', jsonString

        try
            newKernelSpecs = JSON.parse(jsonString).kernelspecs

        catch e
            message =
                'Cannot parse `ipython kernelspecs` or `jupyter kernelspecs`'
            options = detail:
                'Use kernelSpec option in Hydrogen or update IPython/Jupyter to
                a version that supports: `jupyter kernelspec list --json` or
                `ipython kernelspec list --json`'
            atom.notifications.addError message, options
            return

        unless newKernelSpecs?
            return

        kernelSpecs = @parseKernelSpecSettings()
        _.assign kernelSpecs, newKernelSpecs

        @_kernelSpecs = _.map kernelSpecs, 'spec'

        message = 'Hydrogen Kernels updated:'
        options = detail: (_.map @_kernelSpecs, 'display_name').join('\n')
        atom.notifications.addInfo message, options


    updateKernelSpecs: ->
        commands = [
            'jupyter kernelspec list --json --log-level=CRITICAL',
            'ipython kernelspec list --json --log-level=CRITICAL',
        ]

        child_process.exec commands[0], (err, stdout, stderr) =>
            unless err
                @saveKernelSpecs stdout
                return

            console.log 'updateKernelSpecs: `jupyter kernelspec` failed', err

            child_process.exec commands[1], (err, stdout, stderr) =>
                unless err
                    @saveKernelSpecs stdout
                    return

                console.log 'updateKernelSpecs: `ipython kernelspec` failed',
                    err


    setKernelMapping: (kernel, grammar) ->
        language = @getLanguageFor grammar

        mapping = {}
        mapping[language] = kernel.display_name

        Config.setJson 'kernelMappings', mapping, true
