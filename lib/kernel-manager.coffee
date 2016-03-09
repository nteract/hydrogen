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
        languageMappings = @getLanguageMappings()
        matchingLanguageKeys = _.filter languageMappings, (trueLanguage, languageKey) ->
            return languageKey.toLowerCase() == language.toLowerCase()

        if matchingLanguageKeys[0]?
            return matchingLanguageKeys[0].toLowerCase()
        else
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

        language = @getTrueLanguage(grammarLanguage)

        matchingKernels = _.filter kernels, (kernel) ->
            kernelLanguage = kernel.language
            kernelLanguage ?= kernel.display_name

            return kernelLanguage? and
                   language.toLowerCase() == kernelLanguage.toLowerCase()

        if matchingKernels.length != 0
            kernelInfo = matchingKernels[0]
        if display_name = @getConfigJson('grammarToKernel')[grammarLanguage]
            kernelInfo = _.filter(matchingKernels, (k) -> k.display_name == display_name)[0]
        return _.assign kernelInfo, {grammarLanguage: grammarLanguage}

    languageHasKernel: (language) ->
        return @getKernelInfoForLanguage(language)?

    getRunningKernelForLanguage: (language) ->
        language = @getTrueLanguage(language)
        if @runningKernels[language]?
            return @runningKernels[language]
        else
            return null

    languageHasRunningKernel: (language) ->
        return @getRunningKernelForLanguage(language)?

    interruptKernelForLanguage: (language) ->
        kernel = @getRunningKernelForLanguage(language)
        if kernel?
            kernel.interrupt()

    destroyKernelForLanguage: (language) ->
        language = @getTrueLanguage(language)
        if @runningKernels[language]?
            @runningKernels[language].destroy()
            delete @runningKernels[language]

    startKernel: (kernelInfo, config, configFilePath) ->
        language = @getTrueLanguage(kernelInfo.language.toLowerCase())
        kernel = new Kernel(kernelInfo, config, configFilePath)
        @runningKernels[language] = kernel
        return kernel

    startKernelIfNeeded: (language, onStarted) ->
        runningKernel = @getRunningKernelForLanguage(language)
        if not runningKernel?
            if @languageHasKernel(language)
                kernelInfo = @getKernelInfoForLanguage language
                ConfigManager.writeConfigFile (filepath, config) =>
                    kernel = @startKernel(kernelInfo, config, filepath)
                    onStarted?(kernel)
            else
                console.error "No kernel for this language!"
        else
            if onStarted?
                onStarted(runningKernel)

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

    destroy: ->
        _.forEach @runningKernels, (kernel) -> kernel.destroy()
