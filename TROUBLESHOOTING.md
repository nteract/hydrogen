# Troubleshooting

## Debugging Guide

Sometimes unexpected things happen.
In this case please open an [Issue](https://github.com/nteract/hydrogen/issues) and be sure to include the version of Hydrogen and Atom you are running. You can get this information from copy and pasting the output of `atom --version`  from the command line.

Please also include the output or a screenshot of the debug logs. To access the debug logs follow these steps:

1. Open atom in dev mode (`View --> Developer --> Open in Dev Mode` or from the commandline via `atom --dev`):
![dev-mode](https://cloud.githubusercontent.com/assets/13285808/22128693/30a564b6-dea2-11e6-88d3-f431a5e95aae.png)

2. Open the developer tools (`View --> Developer --> Toggle Developer Tools` or via `shift-ctrl-i`/`cmd-alt-i`):
![open-dev-tools](https://cloud.githubusercontent.com/assets/13285808/22128694/30b959d0-dea2-11e6-8b44-9c969a0b8b31.png)

3. Select the console tab to see the debug logs:
![dev-tools](https://cloud.githubusercontent.com/assets/13285808/22128692/30a4ae2c-dea2-11e6-99e7-7d7376d7ee76.png)

## Common Issues

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
  [#88](https://github.com/nteract/hydrogen/issues/88)):

  - solved by upgrading the `jupyter` version (see [this
    comment](https://github.com/nteract/hydrogen/issues/88#issuecomment-136761769) );

- If Hydrogen doesn't output any results for Atom version < 1.13 (see issue
  [#326](https://github.com/nteract/hydrogen/issues/326)), check that you haven't disabled
  `Use Shadow DOM` under `Settings > Editor`. This option should be enabled.

- If the spinner in the result bubble never stops (see issue
  [#53](https://github.com/nteract/hydrogen/issues/53)): This is issue hasn't
  been seen recently. Please, post in issue
  [#53](https://github.com/nteract/hydrogen/issues/53) the details of your
  installation.
