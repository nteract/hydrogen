_ = require 'lodash'
child_process = require 'child_process'

Config = require './config'
ConfigManager = require './config-manager'
Kernel = require './kernel'

module.exports = KernelManager =
    runningKernels: {}
    kernelsUpdatedOnce: false

    getAvailableKernels: ->
        kernelspec = Config.getJson 'kernelspec', { kernelspecs:{} }
        kernels = _.pluck kernelspec.kernelspecs, 'spec'
        @updateKernels() unless @kernelsUpdatedOnce
        return kernels

    updateKernels: ->
        saveKernelsToConfig = (out) =>
            try
                kernelspec = JSON.parse(out)
            catch e
                unless @getAvailableKernels().length
                    atom.notifications.addError """
              Can't parse neither 'ipython kernelspecs nor 'jupyter kernelspecs'
              """, detail: """Use kernelspec option in Hydrogen options OR update
              your ipython/jupyter to version that supports kernelspec option:
              $ jupyter kernelspec list --json || ipython kernelspec list --json
              """
            if kernelspec?
                Config.setJson 'kernelspec', kernelspec
                atom.notifications.addInfo 'Hydrogen Kernels updated:',
                    detail: (_.pluck @getAvailableKernels(), 'display_name').join('\n')

        @kernelsUpdatedOnce = true
        child_process.exec 'jupyter kernelspec list --json --log-level=CRITICAL', (e, stdout, stderr) ->
            return saveKernelsToConfig stdout unless e
            child_process.exec 'ipython kernelspec list --json --log-level=CRITICAL', (e, stdout, stderr) ->
                saveKernelsToConfig stdout

    getRunningKernels: ->
        return _.clone(@runningKernels)

    getTrueLanguage: (language) ->
        if language?
            languageMappings = Config.getJson 'languageMappings'
            languageMatches = _.filter languageMappings,
                (trueLanguage, languageKey) ->
                    return languageKey?.toLowerCase() is language.toLowerCase()

            if languageMatches[0]?
                return languageMatches[0].toLowerCase()

        return language

    getKernelInfoForLanguage: (grammarLanguage) ->
        kernels = @getAvailableKernels()
        console.log "Available kernels:", kernels
        if not kernels?
            return null

        language = @getTrueLanguage(grammarLanguage)
        console.log "Grammar language:", grammarLanguage
        console.log "True language:", language
        if not language?
            return null

        matchingKernels = _.filter kernels, (kernel) ->
            kernelLanguage = kernel.language
            kernelLanguage ?= kernel.display_name
            return language is kernelLanguage?.toLowerCase()

        if matchingKernels[0]?
            kernelInfo = matchingKernels[0]

        if display_name = Config.getJson('grammarToKernel')[grammarLanguage]
            kernelInfo = _.filter(
                matchingKernels,
                (kernel) -> kernel.display_name is display_name
            )[0]

        return _.assign kernelInfo, grammarLanguage: grammarLanguage

    getRunningKernelForLanguage: (language) ->
        runningKernel = null

        trueLanguage = @getTrueLanguage language
        if trueLanguage?
            runningKernel = @runningKernels[trueLanguage]

        return runningKernel

    startKernel: (kernelInfo, onStarted) ->
        console.log "startKernel:", kernelInfo

        unless kernelInfo?
            message = "No kernel info for language `#{language}` found"
            options =
                detail: "Check that the language for this file is set in Atom
                         and that you have a Jupyter kernel installed for it."
            atom.notifications.addError message, options
            return

        ConfigManager.writeConfigFile (filepath, config) =>
            kernel = new Kernel(kernelInfo, config, filepath)
            @runningKernels[kernelInfo.language.toLowerCase()] = kernel
            startupCode = Config.getJson('startupCode')[kernelInfo.display_name]
            if startupCode?
                console.log "executing startup code"
                startupCode = startupCode + ' \n'
                kernel.execute startupCode
            onStarted?(kernel)

    startKernelIfNeeded: (language, onStarted) ->
        console.log "startKernelIfNeeded:", language

        kernelInfo = @getKernelInfoForLanguage language
        unless kernelInfo?
            message = "No kernel for language `#{language}` found"
            options =
                detail: "Check that the language for this file is set in Atom
                         and that you have a Jupyter kernel installed for it."
            atom.notifications.addError message, options
            return

        runningKernel = @getRunningKernelForLanguage language
        if runningKernel?
            onStarted?(runningKernel)
            return

        @startKernel kernelInfo, onStarted

    destroyRunningKernelForLanguage: (language) ->
        kernel = @getRunningKernelForLanguage language
        if kernel?
            kernel.destroy()
            delete @runningKernels[kernel.language]

    destroy: ->
        _.forEach @runningKernels, (kernel) -> kernel.destroy()
