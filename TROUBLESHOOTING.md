### Hydrogen installation fails reporting an error running `node-gyp`

There are a number of possible causes and solutions:

- Atom is installed in a path that contains spaces (see issues
  [#318](https://github.com/nteract/hydrogen/issues/318) and
  [#292](https://github.com/nteract/hydrogen/issues/292)).

- Missing `pkg-config` in OS X. Please, ensure you've installed `pkg-config` by
  running `brew install pkg-config`.

- Missing Visual Studio in Windows. `node-gyp` requires a compiler. See
  [here](https://github.com/nodejs/node-gyp#installation) for installation
  instructions.

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
