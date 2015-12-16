child_process = require 'child_process'
os = require 'os'
spawn = (command) ->
    [c,a...] = command.split ' '
    o = child_process.spawnSync c, a
    o.stdout = o.stdout.toString().trim()
    o.stderr = o.stderr.toString().trim()
    o

unless (/\ 2\./.test(spawn('python --version').stderr) ||
  /\ 2\./.test(spawn('python2 --version').stderr))
    throw new Error 'Python2 is required to build Hydrogen'

unless spawn('pip show notebook').stdout
  throw new Error 'Please install notebook with "pip install ipython[notebook]"'

# TODO: add code to get if ZMQ is installed:
# FIXME: Is ```pip list pyzmq``` enough?

# if os.platform() == 'linux'
# if os.platform() == 'win32'

if os.platform() == 'darwin'
  unless spawn("brew list | grep 'pkg-config'").stdout.length
    throw new Error 'You need pkg-config to install zmq: brew install pkg-config'
  unless spawn("brew list | grep 'zeromq'").stdout.length
    throw new Error 'You need ZMQ to use Hydrogen: brew install zeromq'
