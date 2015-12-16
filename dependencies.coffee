child_process = require 'child_process'
os = require 'os'
MINIMAL_WIN_CL_VERSION = 15
spawn = (command) ->
    [c,a...] = command.split ' '
    o = child_process.spawnSync c, a
    o.stdout = o.stdout.toString().trim()
    o.stderr = o.stderr.toString().trim()
    o

if os.platform() == 'win32'
  #http://stackoverflow.com/questions/1233312/finding-version-of-microsoft-c-compiler-from-command-line-for-makefiles#1233332
  #TODO: test on windows
  spawn("cl").stdout.replace /Version \d+/, (x) ->
    if parseInt(x.split(' ')[1]) < MINIMAL_WIN_CL_VERSION
      throw new Error 'You need Visual Studio 2013 Community Edition to compile ZMQ'


# if os.platform() == 'linux'

if os.platform() == 'darwin'
  unless spawn("brew list | grep 'pkg-config'").stdout.length
    throw new Error 'You need pkg-config to install zmq: brew install pkg-config'
  unless spawn("brew list | grep 'zeromq'").stdout.length
    throw new Error 'You need ZMQ to use Hydrogen: brew install zeromq'


unless (/\ 2\./.test(spawn('python --version').stderr) ||
  /\ 2\./.test(spawn('python2 --version').stderr))
    throw new Error 'Python2 is required to build Hydrogen'

if child_process.spawnSync("python", ["-c", "import zmq"]).stderr.toString()
  throw new Error "You need to install ZMQ. Please refer: http://zeromq.org/intro:get-the-software"


unless spawn('pip show notebook').stdout
  throw new Error 'Please install notebook with "pip install ipython[notebook]"'
