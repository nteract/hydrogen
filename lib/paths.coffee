_ = require('lodash')
fs = require('fs')
path = require('path')
child_process = require('child_process')

ipythonDataDir = ->
    child_process.spawnSync('ipython',['locate']).stdout.toString().replace '\n',''

jupyterResolve = _.memoize (category) ->
    match = child_process.spawnSync('jupyter', ['--paths']).stdout.toString()
    _.map ///#{category}:\n(\s+.*\n)+///gim.exec(match)[0].split('\n')[1...-1], (x) -> x.trim()


jupyterPath = _.memoize (subdirs...) ->
    paths = _.map process.env['JUPYTER_PATH']?.split(path.delimiter), (x) ->
        x.replace ///#{path.sep}+$///g, ""
    paths.push ipythonDataDir()
    paths.push p for p in jupyterResolve 'data'

    paths = (path.join(p, subdirs...) for p in paths)
    _.filter paths, (x) -> try fs.statSync(x).isDirectory() catch e

kernels = _.memoize ->
    stdout =  child_process.spawnSync('ipython',['kernelspec','list']).stdout.toString()
    _.map /Available kernels:(\s+.+\s+.+\n)+/.exec(stdout)[0].split('\n')[1...-1], (x) ->
        /\/.*/.exec(x)[0]

module.exports =
  jupyterResolve: jupyterResolve
  jupyterPath: jupyterPath
  availableKernels: kernels
