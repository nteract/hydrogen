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


    destroy: ->
        _.forEach @_runningKernels, (kernel) => @destroyRunningKernel kernel


    destroyRunningKernel: (kernel) ->
        delete @_runningKernels[kernel.kernelSpec.grammarLanguage]
        kernel.destroy()


    startKernelFor: (grammar, onStarted) ->
        grammarLanguage = @getGrammarLanguageFor grammar

        console.log 'startKernelFor:', grammarLanguage

        kernelSpec = @getKernelSpecFor grammarLanguage

        unless kernelSpec?
            message = "No kernel for language `#{grammarLanguage}` found"
            options =
                detail: 'Check that the language for this file is set in Atom
                         and that you have a Jupyter kernel installed for it.'
            atom.notifications.addError message, options
            return

        @startKernel kernelSpec, grammar, onStarted


    startKernel: (kernelSpec, grammar, onStarted) ->
        grammarLanguage = @getGrammarLanguageFor grammar

        kernelSpec.grammarLanguage = grammarLanguage

        rootDirectory = atom.project.rootDirectories[0].path
        connectionFile = path.join rootDirectory, 'hydrogen', 'connection.json'

        finishKernelStartup = (kernel) =>
            @_runningKernels[grammarLanguage] = kernel

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


    getRunningKernelFor: (grammarLanguage) ->
        return @_runningKernels[grammarLanguage]


    getGrammarLanguageFor: (grammar) ->
        return grammar?.name.toLowerCase()


    getAllKernelSpecs: ->
        kernelSpecs = _.map @parseKernelSpecSettings(), 'spec'
        return kernelSpecs


    getAllKernelSpecsFor: (grammarLanguage) ->
        unless grammarLanguage?
            return []

        kernelSpecs = @getAllKernelSpecs().filter (spec) =>
            @kernelSpecProvidesLanguage spec, grammarLanguage

        return kernelSpecs


    getKernelSpecFor: (grammarLanguage) ->
        unless grammarLanguage?
            return null

        kernelMapping = Config.getJson('kernelMappings')?[grammarLanguage]
        if kernelMapping?
            kernelSpecs = @getAllKernelSpecs().filter (spec) ->
                return spec.display_name is kernelMapping
        else
            kernelSpecs = @getAllKernelSpecsFor grammarLanguage

        return kernelSpecs[0]


    kernelSpecProvidesLanguage: (kernelSpec, grammarLanguage) ->
        kernelLanguage = kernelSpec.language
        mappedLanguage = Config.getJson('languageMappings')[kernelLanguage]

        if mappedLanguage
            return mappedLanguage is grammarLanguage

        return kernelLanguage.toLowerCase() is grammarLanguage


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

        Config.setJson 'kernelspec', kernelspecs: kernelSpecs

        message = 'Hydrogen Kernels updated:'
        options = detail: (_.map kernelSpecs, 'spec.display_name').join('\n')
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
        language = @getGrammarLanguageFor grammar

        mapping = {}
        mapping[language] = kernel.display_name

        Config.setJson 'kernelMappings', mapping, true
