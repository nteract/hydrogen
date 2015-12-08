fs = require 'fs'
path = require 'path'
_ = require 'lodash'

{jupyterPath} = require './paths'

Kernel = require './kernel'

module.exports = KernelManager =
    kernelsDirOptions: jupyterPath('kernels')
    runningKernels: {}
    pythonInfo:
        display_name: "Python"
        language: "python"
    availableKernels: null

    getAvailableKernels: ->
        if @availableKernels?
            return @availableKernels
        else
            kernelLists = _.map @kernelsDirOptions, @getKernelsFromDirectory
            kernels = []
            kernels = kernels.concat.apply(kernels, kernelLists)
            kernels = _.map kernels, (kernel) =>
                kernel.language = @getTrueLanguage(kernel.language)
                return kernel

            pythonKernels = _.filter kernels, (kernel) ->
                return kernel.language == 'python'
            if pythonKernels.length == 0
                kernels.push(@pythonInfo)
            return kernels

    getRunningKernels: ->
        return _.clone(@runningKernels)

    getKernelsFromDirectory: (directory) ->
        try
            kernelNames = fs.readdirSync directory
            kernels = _.map kernelNames, (name) =>
                kernelDirPath = path.join(directory, name)

                if fs.statSync(kernelDirPath).isDirectory()
                    kernelFilePath = path.join(kernelDirPath, 'kernel.json')
                    info = JSON.parse fs.readFileSync(kernelFilePath)
                    info.language ?= info.display_name.toLowerCase()
                    return info
                else
                    return null

            kernels = _.filter(kernels)
        catch error
            kernels = []
        return kernels

    getTrueLanguage: (language) ->
        languageMappings = @getLanguageMappings()
        matchingLanguageKeys = _.filter languageMappings, (trueLanguage, languageKey) ->
            return languageKey.toLowerCase() == language.toLowerCase()

        if matchingLanguageKeys[0]?
            return matchingLanguageKeys[0].toLowerCase()
        else
            return language

    getConfigJson: (key) ->
        return {} unless value = atom.config.get "Hydrogen.#{key}"
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

        if matchingKernels.length == 0
            return null
        else
            kernelInfo = matchingKernels[0]
            if display_name = @getConfigJson('grammarToKernel')[grammarLanguage]
                kernelInfo = _.filter(matchingKernels, (k) -> k.display_name == display_name)[0]
            kernelInfo.grammarLanguage = grammarLanguage
            return kernelInfo

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
