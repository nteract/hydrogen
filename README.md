# Hydrogen

This package lets you run your code directly in Atom using any [Jupyter](https://jupyter.org/) kernels you have installed.

Remember how exciting [Light Table](http://lighttable.com/) was when it was first announced? Executing code inline and in real time is a better way to develop. By combining the interactive style of Light Table with the stable, actively-developed platform of Atom, Hydrogen makes it easy to write code the way you want to.

## Features

- execute of a line, selection, or block at a time
- rich media support for plots, images, and video
- autocomplete from the running kernel, so it only suggests things that are really defined

Check out the [todo](https://github.com/willwhitney/atom-ipython/blob/master/todo.md) for more info about the current state of the project.


## Installation

### Dependencies

- ZeroMQ: `brew install zeromq`; this may complain if you don't have `pkg-config`, but you can `brew install pkg-config` to fix that.
- IPython (Jupyter): needs to be installed and on your `$PATH`. `pip install "ipython[notebook]"`

### Install

`apm install hydrogen`


## Jank

- In order to have access to your `$PATH` to find where IPython and other binaries are, Atom has to be launched from the command line with `atom <location>`. If you launch Atom as an app, this package won't work.
