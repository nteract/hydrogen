_ = require 'lodash'
child_process = require 'child_process'

Config = require './config'
ConfigManager = require './config-manager'
Kernel = require './kernel'

module.exports = KernelManager =
    _runningKernels: {}


    parseKernelSpecSettings: ->
        settings = Config.getJson 'kernelspec'

        unless settings.kernelspecs
            return {}

        # remove invalid entries
        return _.pick settings.kernelspecs, ({spec}) ->
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
        options = detail: (_.pluck kernelSpecs, 'spec.display_name').join('\n')
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


    getGrammarLanguageFor: (grammar) ->
        return grammar?.name.toLowerCase()


    kernelSpecProvidesGrammarLanguage: (kernelSpec, grammarLanguage) ->
        kernelLanguage = kernelSpec.language
        mappedLanguage = Config.getJson('languageMappings')[kernelLanguage]

        if mappedLanguage
            return mappedLanguage is grammarLanguage

        return kernelLanguage.toLowerCase() is grammarLanguage


    getAllKernelSpecs: ->
        kernelSpecs = _.pluck @parseKernelSpecSettings(), 'spec'
        return kernelSpecs


    getAllKernelSpecsFor: (grammarLanguage) ->
        unless grammarLanguage?
            return []

        kernelSpecs = @getAllKernelSpecs().filter (spec) =>
            return @kernelSpecProvidesGrammarLanguage spec, grammarLanguage

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


    getAllRunningKernels: ->
        return _.clone(@_runningKernels)


    getRunningKernelFor: (grammarLanguage) ->
        return @_runningKernels[grammarLanguage]


    startKernelFor: (grammar, onStarted) ->
        grammarLanguage = KernelManager.getGrammarLanguageFor grammar

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
        grammarLanguage = KernelManager.getGrammarLanguageFor grammar

        kernelSpec.grammarLanguage = grammarLanguage

        ConfigManager.writeConfigFile (filepath, config) =>
            kernel = new Kernel kernelSpec, grammar, config, filepath

            @_runningKernels[grammarLanguage] = kernel

            startupCode = Config.getJson('startupCode')[kernelSpec.display_name]
            if startupCode?
                console.log 'executing startup code'
                startupCode = startupCode + ' \n'
                kernel.execute startupCode

            onStarted?(kernel)


    destroyRunningKernel: (kernel) ->
        delete @_runningKernels[kernel.kernelSpec.grammarLanguage]
        kernel.destroy()


    destroy: ->
        _.forEach @_runningKernels, (kernel) -> kernel.destroy()
