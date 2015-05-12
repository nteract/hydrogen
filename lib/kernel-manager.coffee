fs = require 'fs'
path = require 'path'
_ = require 'lodash'
exec = require('child_process').exec

Kernel = require './kernel'

module.exports = KernelManager =
    kernelsDir: path.join(process.env['HOME'], '.ipython/kernels')
    runningKernels: {}

    getAvailableKernels: ->
        kernelNames = fs.readdirSync @kernelsDir
        kernels = _.map kernelNames, (name) =>
            kernelDirPath = path.join(@kernelsDir, name)

            if fs.statSync(kernelDirPath).isDirectory()
                kernelFilePath = path.join(kernelDirPath, 'kernel.json')
                info = JSON.parse fs.readFileSync(kernelFilePath)
                return info
            else
                return null

        kernels = _.filter(kernels)
        return kernels

    getKernelInfoForLanguage: (language) ->
        kernels = @getAvailableKernels()
        matchingKernels = _.filter kernels, (kernel) ->
            return language.toLowerCase() == kernel.language.toLowerCase()

        if matchingKernels.length == 0
            return null
        else
            return matchingKernels[0]

    getRunningKernelForLanguage: (language) ->
        if @runningKernels[language]?
            return @runningKernels[language]
        else
            return null

    startKernel: (kernelInfo, config, configFilePath) ->
        language = kernelInfo.language.toLowerCase()
        kernel = new Kernel(kernelInfo, config, configFilePath)
        @runningKernels[language] = kernel

    execute: (language, code, onResults) ->
        if @runningKernels[language]?
            @runningKernels[language].execute(code, onResults)
        else
            throw "No such kernel!"

    destroy: ->
        _.forEach @runningKernels, (kernel) -> kernel.destroy()
