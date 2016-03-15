_ = require 'lodash'
child_process = require 'child_process'

ConfigManager = require './config-manager'
Kernel = require './kernel'

module.exports = KernelManager =
    runningKernels: {}
    kernelsUpdatedOnce: false

    getAvailableKernels: ->
        kernels = _.pluck @getConfigJson('kernelspec', {kernelspecs:{}}).kernelspecs, 'spec'
        @updateKernels() unless @kernelsUpdatedOnce
        kernels

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
          @setConfigJson 'kernelspec', kernelspec
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
            languageMappings = @getLanguageMappings()
            languageMatches = _.filter languageMappings,
                (trueLanguage, languageKey) ->
                    return languageKey?.toLowerCase() is language.toLowerCase()

            if languageMatches[0]?
                return languageMatches[0].toLowerCase()

        return language

    getConfigJson: (key, _default = {}) ->
        return _default unless value = atom.config.get "Hydrogen.#{key}"
        try
          return JSON.parse value
        catch error
          atom.notifications.addError "Your Hydrogen config is broken: #{key}", detail: error

    setConfigJson: (key, value, merge=false) ->
        value = _.merge @getConfigJson(key), value if merge
        atom.config.set "Hydrogen.#{key}", JSON.stringify value

    getLanguageMappings: -> @getConfigJson('languageMappings')

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

        if display_name = @getConfigJson('grammarToKernel')[grammarLanguage]
            kernelInfo = _.filter(
                matchingKernels,
                (kernel) -> kernel.display_name is display_name
            )[0]

        return _.assign kernelInfo, grammarLanguage: grammarLanguage

    languageHasKernel: (language) ->
        return @getKernelInfoForLanguage(language)?

    getRunningKernelForLanguage: (language) ->
        runningKernel = null

        trueLanguage = @getTrueLanguage language
        if trueLanguage?
            runningKernel = @runningKernels[trueLanguage]

        return runningKernel

    languageHasRunningKernel: (language) ->
        return @getRunningKernelForLanguage(language)?

    interruptKernelForLanguage: (language) ->
        kernel = @getRunningKernelForLanguage language
        if kernel?
            kernel.interrupt()

    destroyKernelForLanguage: (language) ->
        kernel = @getRunningKernelForLanguage language
        if kernel?
            kernel.destroy()
            delete @runningKernels[kernel.language]

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
            @runningKernels[kernelInfo.language] = kernel
            startupCode = @getConfigJson('startupCode')[kernelInfo.display_name]
            if startupCode?
                console.log "executing startup code"
                startupCode = startupCode + ' \n'
                @execute kernelInfo.language, startupCode
            onStarted?(kernel)

    startKernelIfNeeded: (language, onStarted) ->
        console.log "startKernelIfNeeded:", language

        unless @languageHasKernel(language)
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

        kernelInfo = @getKernelInfoForLanguage language
        @startKernel kernelInfo, onStarted

    execute: (language, code, onResults) ->
        kernel = @getRunningKernelForLanguage(language)
        if kernel?
            kernel.execute(code, onResults)
        else
            throw "No such kernel!"

    complete: (language, code, onResults) ->
        kernel = @getRunningKernelForLanguage(language)
        if kernel?
            kernel.complete(code, onResults)
        else
            throw "No such kernel!"

    inspect: (language, code, cursor_pos, onResults) ->
        kernel = @getRunningKernelForLanguage(language)
        if kernel?
            kernel.inspect(code, cursor_pos, onResults)
        else
            throw "No such kernel!"

    destroy: ->
        _.forEach @runningKernels, (kernel) -> kernel.destroy()
