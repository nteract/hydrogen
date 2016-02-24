_ = require 'lodash'
child_process = require 'child_process'

Kernel = require './kernel'

module.exports = KernelManager =
    availableKernels:  []
    runningKernels: {}
    
    getAvailableKernels: ->
        @availableKernels = @getConfigJson 'kernelspecs', @availableKernels
        @updateKernels() unless @availableKernels.length
        @availableKernels
               
    updateKernels: ->
        save = (out) =>
            @availableKernels = _.pluck JSON.parse(out).kernelspecs, 'spec'
            @setConfigJson 'kernelspecs', @availableKernels
            atom.notifications.addInfo 'Hydrogen Kernels updated:',
              detail: (_.pluck @availableKernels, 'display_name').join('\n')
      
        child_process.exec 'jupyter kernelspec list --json', (e, stdout, stderr) ->
            return save stdout unless e
            child_process.exec 'ipython kernelspec list --json', (e, stdout, stderr) ->
                save stdout
       
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
