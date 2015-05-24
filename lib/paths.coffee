# Port of jupyter_core.paths

fs = require('fs')
path = require('path')

# Access `sys.prefix` from Python, to handle particular conda and virtualenv setups
# TODO: Think of something more sensible here, possibly doing this asynchronously elsewhere
# TODO: Provide a timeout, handle error
child_process = require('child_process')
response = child_process.spawnSync 'python', ['-c', 'import sys; print(sys.prefix)']
sysPrefix = response.stdout.toString().replace /^\s+|\s+$/g, ""

# Compute default system configurations
if process.platform == 'win32'
  programData = process.env['PROGRAMDATA']
  if programData
    SYSTEM_JUPYTER_PATH = [path.join(programData, 'jupyter')]
  else
    SYSTEM_JUPYTER_PATH = [path.join(sysPrefix, 'share', 'jupyter')]
else
  SYSTEM_JUPYTER_PATH = [
    "/usr/local/share/jupyter",
    "/usr/share/jupyter"
  ]

ENV_JUPYTER_PATH = [path.join(sysPrefix, 'share', 'jupyter')]

# Returns the home specified by environment variable or
# node's built in path.resolve('~')
userHome = ->
  homeDir = process.env['HOME'] or process.env['USERPROFILE'] or path.resolve('~')
  homeDir = fs.realpathSync(homeDir)
  return homeDir

# Get the Jupyter config directory for this platform and user.
# Reutrns env[JUPYTER_CONFIG_DIR] if defined, else ~/.jupyter
jupyterConfigDir = ->
  homeDir = userHome()
  if process.env['JUPYTER_CONFIG_DIR']
    return process.env['JUPYTER_CONFIG_DIR']
  return path.join(homeDir, '.jupyter')

# Get the config directory for Jupyter data files.
#
# These are non-transient, non-configuration files.
#
# Returns process.env[JUPYTER_DATA_DIR] if defined,
# else a platform-appropriate path.
jupyterDataDir = ->
  if process.env['JUPYTER_DATA_DIR']
    return process.env['JUPYTER_DATA_DIR']
  else if process.platform == 'win32'
    appData = process.env['APPDATA']
    if appData
      return path.join appData, 'jupyter'
    else
      return path.join jupyterConfigDir(), 'data'
  else if process.platform == 'darwin'
    return path.join(userHome(), 'Library', 'Jupyter')
  else
    # Linux, non-OS X Unix, AIX, etc.
    xdg = process.env['XDG_DATA_HOME']
    if not xdg
      xdg = path.join(userHome(), '.local', 'share')
    return path.join(xdg, 'jupyter')


# Returns the path for ~/.ipython
ipythonDataDir = ->
  return path.join(userHome(), '.ipython')

# Return the runtime dir for transient jupyter files.
#
# Returns process.env[JUPYTER_RUNTIME_DIR] if defined.
#
# Respects XDG_RUNTIME_DIR on non-OS X, non-Windows,
#   falls back on data_dir/runtime otherwise.
jupyterRuntimeDir = ->
  if process.env['JUPYTER_RUNTIME_DIR']
    return process.env['JUPYTER_RUNTIME_DIR']

  if process.platform == 'darwin' or process.platform == 'win32'
    return path.join(jupyterDataDir(), 'runtime')
  else
    # Linux, non-OS X Unix, AIX, etc.
    xdg = process.env['XDG_RUNTIME_DIR']
    if xdg
      # Ref https://github.com/jupyter/jupyter_core/commit/176b7a9067bfc20bfa97be5dae93912e2930a427#commitcomment-11331375
      return path.join(xdg, 'jupyter')
    return path.join(jupyterDataDir, 'runtime')

# Return the list of directories to search
#
# JUPYTER_PATH environment variable has highest priority.
#
# If subdirs are given, that subdirectory path will be added to each element.
# Examples:
#
# > jupyterPath()
# ['/Users/rgbkrk/.local/jupyter', '/usr/local/share/jupyter']
#
# >jupyterPath
# ['/Users/rgbkrk/.local/jupyter/kernels', '/usr/local/share/jupyter/kernels']
jupyterPath = (subdirs...) ->
  paths = []

  # highest priority is env
  if process.env['JUPYTER_PATH']
    jupyterPathEnvSplit = process.env['JUPYTER_PATH'].split(path.delimiter)
    for p in jupyterPathEnvSplit
      # Strip off the path separator from the right
      normalizedP = p.replace ///#{path.sep}+$///g, ""
      paths.push normalizedP
  # Next up, user directory
  paths.push jupyterDataDir()

  # Oh boy, it's sys.prefix
  for p in ENV_JUPYTER_PATH
    if p not in SYSTEM_JUPYTER_PATH
      paths.push p

  # Last is SYSTEM_JUPYTER_PATH
  for p in SYSTEM_JUPYTER_PATH
    paths.push p

  paths.push ipythonDataDir()

  # Append the subdir
  if subdirs
    paths = (path.join(p, subdirs...) for p in paths)
  return paths

module.exports = {
  jupyterPath: jupyterPath,
  jupyterConfigDir: jupyterConfigDir,
  jupyterDataDir: jupyterDataDir,
  jupyterRuntimeDir: jupyterRuntimeDir,
  userHome: userHome
}
