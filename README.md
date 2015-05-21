# Hydrogen

This package lets you run your code directly in Atom using any [Jupyter](https://jupyter.org/) kernels you have installed.

Hydrogen was inspired by Bret Victor's ideas about the power of instantaneous feedback and the design of [Light Table](http://lighttable.com/). Running code inline and in real time is a more natural way to develop. By bringing the interactive style of Light Table to the rock-solid usability of Atom, Hydrogen makes it easy to write code the way you want to.

<img src="http://i.imgur.com/RFPD1c9.gif" width=600>


## Features

- execute a line, selection, or block at a time
- rich media support for plots, images, and video
- completions from the running kernel, just like autocomplete in the Chrome dev tools
- one kernel per language (so you can run snippets from several files, all in the same namespace)
- interrupt or restart the kernel if anything goes wrong

<!-- Check out the [todo](https://github.com/willwhitney/atom-ipython/blob/master/todo.md) for more info about the current state of the project. -->


## Installation

### Dependencies

- ZeroMQ: `brew install zeromq`; this may complain if you don't have `pkg-config`, but you can `brew install pkg-config` to fix that.
- IPython (Jupyter): needs to be installed and on your `$PATH`. `pip install "ipython[notebook]"`

### Install

`apm install hydrogen` or search for "hydrogen" in the Install pane of the Atom settings.


### Kernels

Tested and works with:

- [IPython](http://ipython.org/)
- [IJulia](https://github.com/JuliaLang/IJulia.jl)
- [iTorch](https://github.com/facebook/iTorch)

But it _should_ work with any kernel — [post an issue](https://github.com/willwhitney/hydrogen/issues) if anything is broken!

<img src="http://i.imgur.com/1cGSHzo.png" width=350>
<img src="http://i.imgur.com/I5kO69B.png" width=350>

Note that if you install a new kernel, you'll need to reload Atom (search in the Command Palette for "reload") for Hydrogen to find it. For performance reasons, Hydrogen only looks for available kernels when it first starts.

## Usage

Make sure to start Atom from the command line (with `atom <directory or file>`) for this package to work! See [Jank](#Jank).

### Running code

Hydrogen adds a command "Hydrogen: Run" to the command palette when you're in any text editor. Press ⌘-⇧-P to open the command palette and type "hydrogen" — it'll come up.

The "Hydrogen: Run" command is bound to the keyboard shortcut ⌘-⌥-↩ by default.

There are two ways to tell Hydrogen which code in your file to run.

1. **Selected code:** If you have code selected when you hit Run, Hydrogen will run exactly that code.
2. **Current block:** With no code selected, Hydrogen will try to find the complete block that's on or before the current line.

    - If the line you're on is already a complete expression (like `s = "abracadabra"`), Hydrogen will run just that line.

    - If the line you're on is the start of a block like a `for` loop, Hydrogen will run the whole block.

    - If the line you're on is blank, Hydrogen will run the first block above that line.

It's easiest to see these interactions visually:

<img src="http://g.recordit.co/4ViVmKtKAr.gif">

If your code starts getting cluttered up with results, run "Hydrogen: Clear Results" to remove them all at once. You can also run this command with ⌘-⌥-⌫.

### Managing kernels

Sometimes things go wrong. Maybe you've written an infinite loop, maybe the kernel has crashed, or maybe you just want to clear the kernel's namespace. Use the command palette to open "Hydrogen: Show Kernel Commands" and select "Interrupt" to interrupt (think `Ctrl-C` in a REPL) the kernel or "Restart" to kill the kernel and start a new one, clearing the namespace.

You can also access these commands by clicking on the kernel status in the status bar. It looks like this:

<img src="http://i.imgur.com/oQB5mpB.png" width=300>


## How it works

Hydrogen implements the [messaging protocol](http://ipython.org/ipython-doc/stable/development/messaging.html) for [Jupyter](https://jupyter.org/). Jupyter (formerly IPython) uses ZeroMQ to connect a client (like Hydrogen) to a running kernel (like IJulia or iTorch). The client sends code to be executed to the kernel, which runs it and sends back results.


## Jank

- In order to have access to your `$PATH` to find where IPython and other binaries are, Atom has to be launched from the command line with `atom <location>`. If you launch Atom as an app, this package won't work.


## Why "Hydrogen"?

Hydrogen atoms make up 90% of Jupiter by volume.

Plus, it was easy to make a logo.

![hydrogen logo](http://cl.ly/2z3B3M1F0t1v/logo.svg)
