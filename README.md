# deuterium

A Python3-only fork of [Hydrogen](http://github.com/nteract/hydrogen) designed to be used together with [xdbg](http://github.com/nikitakit/xdbg).

This package builds on stock Hydrogen to provide even more powerful introspection capabilites, specific to Python (only Python 3.5+ is currently supported). It integrates with the [xdbg](http://github.com/nikitakit/xdbg) extensions for IPython to allow live-coding at any scope within your program, including inside modules and functions.

**WARNING**: this package is _incompatible_ with Hydrogen proper, because it does not define its own namespaces!

<img src="https://cloud.githubusercontent.com/assets/13285808/14598778/1cff1b32-0554-11e6-8181-504307ca6b56.gif" width=600>


## Features

- execute a line, selection, or block at a time
- execute code in multiple modules' namespaces, by simply switching to a module's source file in Atom
- set breakpoints inside functions and execute code interactively inside the function's scope
- autocomplete based on inspecting live objects
- rich media support for plots, images, and video
- code can be inspected to show useful information provided by the running kernel

## Why a fork?

Given that this package is still very early in development, forking the Hydrogen code is the easiest way to experiment with new features. The changes here are not a good candidate for merging into mainline Hydrogen because they includes Python3-specific features that may interfere with correct functionality of other Jupyter kernels.

Once the interaction design for this package is more mature, it will be ported to a Hydrogen extension instead.

## Dependencies

For all systems, you'll need

- [Atom](https://atom.io/) `1.6.0+`
- [ZeroMQ](http://zeromq.org/intro:get-the-software)
- IPython notebook `pip install ipython[notebook]`
- Python 2 (for builds) and Python 3 (for actually running code)
- [xdbg](http://github.com/nikitakit/xdbg)

Each operating system has their own instruction set. Please read on down to save yourself time.

#### OS X

##### homebrew on OS X

- [`pkg-config`](https://www.freedesktop.org/wiki/Software/pkg-config/): `brew install pkg-config`
- [ZeroMQ](http://zeromq.org/intro:get-the-software): `brew install zeromq`
- [IPython (Jupyter)](http://ipython.org/install.html): needs to be installed and on your `$PATH`. `pip install "ipython[notebook]"`

#### Windows

- You'll need a compiler! [Visual Studio 2013 Community Edition](https://www.visualstudio.com/en-us/downloads/download-visual-studio-vs.aspx) is required to build zmq.node.
- Python (tread on your own or install [Anaconda](https://www.continuum.io/downloads))
- [IPython notebook](http://ipython.org/install.html) - If you installed Anaconda, you're already done

After these are installed, you'll likely need to restart your machine (especially after Visual Studio).

#### Linux

For Debian/Ubuntu based variants, you'll need `libzmq3-dev` (preferred) or alternatively `libzmq-dev`.   
For RedHat/CentOS/Fedora/openSUSE based variants, you'll need `zeromq` and `zeromq-devel`.
For Arch Linux based variants, you'll need `zeromq` or `zeromq3` (which has to be built from the <abbr title="Arch User Repository">AUR</abbr>).
For Gentoo Linux based variants, you'll need `net-libs/zeromq`.

If you have Python and pip setup, install the notebook directly, via running (as root):

```
pip install ipython[notebook]
```

## Installation

Assuming you followed the dependencies steps above, you can now `apm install deuterium` (recommended) or search for "hydrogen" in the Install pane of the Atom settings. Note that installing from within Atom will only work if you start Atom from the command line! See [Jank](#Jank).

If your default `python` is 3.x, you need to run instead `PYTHON=python2.7 apm install deuterium` or change the default version for `apm` with `apm config set python $(which python2.7)` beforehand. You can still use 3.x versions of Python in Hydrogen, but it will only build with 2.x due to a [longstanding issue with `gyp`](https://bugs.chromium.org/p/gyp/issues/detail?id=36).


## Usage

Please consult the [original Hydrogen documentation](http://github.com/nteract/hydrogen#readme) and the [xdbg readme](http://github.com/nikitakit/xdbg#readme)
