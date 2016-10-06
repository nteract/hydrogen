### Hydrogen installation fails reporting an error running `node-gyp`

**For Windows (Tested with Windows 10)**
If you have a `node-gyp` error, before you read through the troubleshooting
section below, I suggest you repeat my latest steps here as many of the information
in the following troubleshooting section may be out of date.

- Install Git (Bash) and restore all settings (.gitconfig)
- [Optional] Install Git Credential Winstore (for remembering git username and password)
- [Optional] Install Cmder and restore all settings (cmder_exinit.sh in C:\Program Files\Git\etc\profile.d\, and user-profile.sh in D:\Cmder\config) (for a nice customisable terminal)
- Install Anaconda 3
- Run -> `conda update conda`
- Run -> `conda update Anaconda`
- Install packages -> `pip install -r requirements.txt`
- Install Anaconda 2 in virtual environment -> `conda create -n python2 python=2.7 anaconda`
- [Optional] ***For Python installer user:***
  `virtualenv -p <path/to/your/python2> <envname>` (you'll need to install Jupyter via `pip install jupyter` if you choose this option)
- Install packages in virtual environment python2 -> `source activate python2` -> `pip install -r requirements.txt` -> `source deactivate`
- Install Node.js and restore .npmrc (latest 6.7.0 is fine!)
- Install Visuall C++ compiler -> `npm install --global --production windows-build-tools` (including C++ components and Python 2)
- ***If somehow you failed installing your compiler before, and your visual studio
  version can't be recognised by `apm -v`, use
  [Visual Studio Uninstaller](https://github.com/Microsoft/VisualStudioUninstaller/releases)
  here to cleanup/scorch, and cleanup remaining items and registry for fresh start
  (this process can take hours, but worth it) as traditional uninstallation
  may not solve the issue due to remaining registry and package cache there.***
- Update node-gyp -> `npm install -g node-gyp`
- Install ZeroMQ.node -> `npm -g install zmq`
- Make sure npm's version is matched between local and global (if you have local npm installed. Unmatched npm version will give you `MSBuild error failed with exit code: 1`) -> `npm -g install npm@latest`
- [Optional] Install IJavacript Kernel -> `npm -g install ijavascript`
- [Optional] Register IJavascript globally -> `ijs --ijs-install=global` -> `ijs`
- [Optional] Install JP-Babel Kernel globally-> `npm install -g jp-babel`
- [Optional] Register JP-Babel -> `jp-babel --jp-install=global` -> `jp-babel`
- Install Atom (Run installer as adminstrator) and restore .atom/.apmrc
- Set python 2 for npm -> `npm config edit` and add in:
```
python=D:\Anaconda3\envs\python2\python.exe (or whatever your python2 is)
msvs_version=2015
GYP_MSVS_VERSION=2015
```
- Set Python 2 for apm -> `apm config edit` and add in the same parameters above


- At this stage, all of the dependencies we need should all be installed.
  Run `apm -v` to check if they are all recognised. You should see something
  like this:
```
apm  1.12.5
npm  3.10.5
node 4.4.5
python 2.7.12
git 2.10.0.windows.1
visual studio 2015 (VS 2015 is fine!)
```
- [Optional if you have backup for Atom] Assuming you followed exactly the steps above, you can now `apm install hydrogen`
  or search for "hydrogen" in the Install pane of the Atom settings.
- If you have everything backed up in atom, just install sync-settings in Atom, and restore all settings via your Personal Access Token and Gist ID (restart Atom several times until no error pops up, installed theme requires at least restarts twice)
- Change the grammar settings in Hydrogen to cope with jp-babel kernel -> `{ "babel": "babel es6 javascript", "python": "python django" }` (otherwise hydrogen won't be able to recognise babel files and python django files)
- Now you have a perfectly functioning Hydrogen with Python 2, Python 3, IJavascript and Babel kernel, running at their full potential. ENJOY!


***
***For previous troubleshooting section, please continue reading***

There are a number of possible causes and solutions:

- Atom is installed in a path that contains spaces (see issues
  [#318](https://github.com/nteract/hydrogen/issues/318) and
  [#292](https://github.com/nteract/hydrogen/issues/292)).

- Missing `pkg-config` in OS X. Please, ensure you've installed `pkg-config` by
  running `brew install pkg-config`.

- Missing Visual Studio in Windows. `node-gyp` requires a compiler. See
  [here](https://github.com/nodejs/node-gyp#installation) for installation
  instructions.

- Atom uses incorrect version of Visual Studio (on Windows). Installing hydrogen
  on windows works best with Visual Studio 2013, but Atom may see a different
  version. You can check this by running `apm --version`, if it looks like this:
  
  ```
  apm  1.12.5
  npm  3.10.5
  node 4.4.5
  python 2.7.12
  git 2.8.1.windows.1
  visual studio 2015
  ```
  
  then it means Atom is seeing visual studio 2015, not 2013.
  These commands should help:
  ```
  apm config set msvs_version 2013 -g
  set GYP_MSVS_VERSION=2013
  ```

- Atom is unable to use your installation of Python 2 (see issues
  [#301](https://github.com/nteract/hydrogen/issues/301) and 
  [#358](https://github.com/nteract/hydrogen/issues/358)). To confirm this is
  the cause, please, run `apm --version`. Here's an example for the case when
  Atom cannot find any installation of Python, the output could look like this:

  ```
  apm  1.9.2
  npm  2.13.3
  node 0.10.40
  python
  git 2.8.1.windows.1
  visual studio 2013
  ```

  And here, when Atom finds the installation of Python 3 instead of Python 2:

  ```
  apm 1.9.2
  npm 2.13.3
  node 0.10.40
  python 3.5.1
  git
  visual studio
  ```

  To fix this problem, you need to locate the executable for Python 2. Running
  the following script prints out the path for this executable:

  ```python
  import sys
  print sys.executable
  ```

  Let's say this script prints out `c:\Anaconda2\python.exe`. You can configure
  Atom to use this executable by running
  `apm config set python c:\Anaconda2\python.exe`. Then, Hydrogen can be
  installed by running `apm install hydrogen`.


### No kernel for language X found, but I have a kernel for that language.

Currently, a recent version of Jupyter is required for Hydrogen to detect the
available kernels automatically. Users can set kernels manually using the
Hydrogen settings. See
[this section](https://github.com/nteract/hydrogen#debian-8-and-ubuntu-1604-lts)
in the [README](README.md) for more details.

Atom won't pick up kernels inside a virualenv unless Atom is launched as `atom .` within the virtualenv. The alternative is to [create a kernel specifically for a virtualenv](http://www.alfredo.motta.name/create-isolated-jupyter-ipython-kernels-with-pyenv-and-virtualenv/).


### Hydrogen doesn't show my results.

Again, there are a number of possible causes and solutions:

- If the result bubble only shows check marks (see issues
  [#61](https://github.com/nteract/hydrogen/issues/61),
  [#68](https://github.com/nteract/hydrogen/issues/68),
  [#73](https://github.com/nteract/hydrogen/issues/73),
  [#88](https://github.com/nteract/hydrogen/issues/88),
  [#298](https://github.com/nteract/hydrogen/issues/298)):

  - caused by missing `libzmq3-dev` and solved by running
    `sudo apt-get install libzmq3-dev` (see [this
    comment](https://github.com/nteract/hydrogen/issues/298#issuecomment-226405723));

  - solved by upgrading the `jupyter` version (see [this
    comment](https://github.com/nteract/hydrogen/issues/88#issuecomment-136761769) );

- If Hydrogen doesn't output any results (see issue
  [#326](https://github.com/nteract/hydrogen/issues/326)), check that you haven't disabled 
  `Use Shadow DOM` under `Settings > Editor`. This option should be enabled.

- If the spinner in the result bubble never stops (see issue
  [#53](https://github.com/nteract/hydrogen/issues/53)): This is issue hasn't
  been seen recently. Please, post in issue
  [#53](https://github.com/nteract/hydrogen/issues/53) the details of your
  installation.
