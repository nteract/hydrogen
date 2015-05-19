fs = require 'fs'
path = require 'path'
_ = require 'lodash'
exec = require('child_process').exec

Kernel = require './kernel'

module.exports = KernelManager =
    kernelsDirOptions: [
        path.join(process.env['HOME'], '.ijupyter/kernels'),
        path.join(process.env['HOME'], '.ipython/kernels')
    ]
    runningKernels: {}
    pythonInfo:
        display_name: "Python"
        language: "python"

    getAvailableKernels: ->
        try
            kernelsDir = _.find @kernelsDirOptions, fs.existsSync
            kernelNames = fs.readdirSync kernelsDir
            kernels = _.map kernelNames, (name) =>
                kernelDirPath = path.join(kernelsDir, name)

                if fs.statSync(kernelDirPath).isDirectory()
                    kernelFilePath = path.join(kernelDirPath, 'kernel.json')
                    info = JSON.parse fs.readFileSync(kernelFilePath)
                    return info
                else
                    return null

            kernels = _.filter(kernels)
            pythonKernels = _.filter kernels, (kernel) ->
                return kernel.language == 'python'
            if pythonKernels.length == 0
                kernels.push(@pythonInfo)
        catch error
            kernels = [@pythonInfo]
        return kernels

    getKernelInfoForLanguage: (language) ->
        kernels = @getAvailableKernels()
        console.log "Available kernels:", kernels
        matchingKernels = _.filter kernels, (kernel) ->
            kernelLanguage = kernel.language
            kernelLanguage ?= kernel.display_name

            return kernelLanguage? and
                   language.toLowerCase() == kernelLanguage.toLowerCase()

        if matchingKernels.length == 0
            return null
        else
            return matchingKernels[0]

    languageHasKernel: (language) ->
        return @getKernelInfoForLanguage(language)?

    getRunningKernelForLanguage: (language) ->
        if @runningKernels[language]?
            return @runningKernels[language]
        else
            return null

    languageHasRunningKernel: (language) ->
        return @getRunningKernelForLanguage(language)?

    interruptKernelForLanguage: (language) ->
        if @runningKernels[language]?
            @runningKernels[language].interrupt()

    destroyKernelForLanguage: (language) ->
        if @runningKernels[language]?
            @runningKernels[language].destroy()
            delete @runningKernels[language]

    startKernel: (kernelInfo, config, configFilePath) ->
        language = kernelInfo.language.toLowerCase()
        kernel = new Kernel(kernelInfo, config, configFilePath)
        @runningKernels[language] = kernel
        return kernel

    execute: (language, code, onResults) ->
        if @runningKernels[language]?
            @runningKernels[language].execute(code, onResults)
        else
            throw "No such kernel!"

    complete: (language, code, onResults) ->
        if @runningKernels[language]?
            @runningKernels[language].complete(code, onResults)
        else
            throw "No such kernel!"

    destroy: ->
        _.forEach @runningKernels, (kernel) -> kernel.destroy()
