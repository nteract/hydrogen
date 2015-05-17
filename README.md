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


### Kernels

Tested and works with:

- [IPython](http://ipython.org/)
- [IJulia](https://github.com/JuliaLang/IJulia.jl)
- [iTorch](https://github.com/facebook/iTorch)

But it _should_ work with any kernel — [post an issue](https://github.com/willwhitney/hydrogen/issues) if anything is broken!

## Usage

### Running code

Hydrogen adds a command "Hydrogen: Run" to the command palette when you're in any text editor. Press ⌘-⇧-P to open the command palette and type "hydrogen" — it'll come up.

The "Hydrogen: Run" command is bound to the keyboard shortcut ⌘-⌥-↩ by default.

There are two ways to tell Hydrogen which code in your file to run.

1. **Selected code:** If you have code selected when you hit Run, Hydrogen will run exactly that code.
2. **Current block:** With no code selected, Hydrogen will try to find the complete block that's on or before the current line. It's easiest to see this visually:

TODO: running code gifs


If your code starts getting cluttered up with results, run "Hydrogen: Clear Results" to remove them all at once.

### Managing kernels

Sometimes things go wrong. Maybe you've written an infinite loop, maybe the kernel has crashed, or maybe you just want to clear the kernel's namespace. Use the command palette to open "Hydrogen: Show Kernel Commands" and select "Interrupt" to interrupt (think `Ctrl-C` in a REPL) the kernel or "Restart" to kill the kernel and start a new one, clearing the namespace.



## Jank

- In order to have access to your `$PATH` to find where IPython and other binaries are, Atom has to be launched from the command line with `atom <location>`. If you launch Atom as an app, this package won't work.
