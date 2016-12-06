### Installation fails on Linux 32-bit

At the moment we don't ship prebuilts for 32-bit Linux. Hence you'll need some additional toolling to build from source:

- `python` (`v2.7` recommended, `v3.x.x` is not supported for building Hydrogen)
- `make`
- A proper C/C++ compiler toolchain, like [GCC](https://gcc.gnu.org/)

Use your distribution's package manager to install.

If your default `python` is 3.x, you need to run instead `PYTHON=python2.7 apm install hydrogen` or change the default version for `apm` with `apm config set python $(which python2.7)` beforehand. You can still use 3.x versions of Python in Hydrogen, but it will only build with 2.x due to a [longstanding issue with `gyp`](https://bugs.chromium.org/p/gyp/issues/detail?id=36).

### No kernel for language X found, but I have a kernel for that language.

Currently, a recent version of Jupyter is required for Hydrogen to detect the
available kernels automatically. Users can set kernels manually using the
Hydrogen settings. See
[this section](https://github.com/nteract/hydrogen#debian-8-and-ubuntu-1604-lts)
in the [README](README.md) for more details.

Atom won't pick up kernels inside a virtualenv unless Atom is launched as `atom .` within the virtualenv. The alternative is to [create a kernel specifically for a virtualenv](http://www.alfredo.motta.name/create-isolated-jupyter-ipython-kernels-with-pyenv-and-virtualenv/).


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
