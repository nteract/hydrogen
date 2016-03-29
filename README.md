# Hydrogen

[![slack in](http://slack.nteract.in/badge.svg)](http://slack.nteract.in)

This package lets you run your code directly in Atom using any [Jupyter](https://jupyter.org/) kernels you have installed.

Hydrogen was inspired by Bret Victor's ideas about the power of instantaneous feedback and the design of [Light Table](http://lighttable.com/). Running code inline and in real time is a more natural way to develop. By bringing the interactive style of Light Table to the rock-solid usability of Atom, Hydrogen makes it easy to write code the way you want to.

<img src="https://cloud.githubusercontent.com/assets/836375/14054128/bf86cf70-f2a4-11e5-8014-57840c9b7a30.gif" width=600>


## Features

- execute a line, selection, or block at a time
- rich media support for plots, images, and video
- watch expressions let you keep track of variables and re-run snippets after every change
- completions from the running kernel, just like autocomplete in the Chrome dev tools
- code can be inspected to show useful information provided by the running kernel
- one kernel per language (so you can run snippets from several files, all in the same namespace)
- interrupt or restart the kernel if anything goes wrong

<!-- <img src="http://i.imgur.com/KiHQFO4.png?1" width=300> -->

## Dependencies

For all systems, you'll need

- [Atom](https://atom.io/) `1.6.0+`
- [ZeroMQ](http://zeromq.org/intro:get-the-software)
- IPython notebook `pip install ipython[notebook]`
- Python 2 (for builds - you can still run Python 3 code)

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
For RedHat/CentOS/Fedora based variants, you'll need `zeromq` and `zeromq-devel`.

If you have Python and pip setup, install the notebook directly:

```
pip install ipython[notebook]
```

## Installation

Assuming you followed the dependencies steps above, you can now `apm install hydrogen` (recommended) or search for "hydrogen" in the Install pane of the Atom settings. Note that installing from within Atom will only work if you start Atom from the command line! See [Jank](#Jank).

If your default `python` is 3.x, you need to instead run `PYTHON=python2.7 apm install hydrogen`. You can still use 3.x versions of Python in Hydrogen, but it will only build with 2.x due to a [longstanding issue with `gyp`](https://bugs.chromium.org/p/gyp/issues/detail?id=36)


### Troubleshooting

We have a [troubleshooting guide](https://github.com/nteract/hydrogen/wiki/Troubleshooting) in the wiki! It's pretty sparse at the moment, so please share how the resolution to any rough spots that you find.

### Kernels

Tested and works with:

- [IPython](http://ipython.org/)
- [IJulia](https://github.com/JuliaLang/IJulia.jl)
- [iTorch](https://github.com/facebook/iTorch)
- [IJavascript](https://github.com/n-riesco/ijavascript)
- [jupyter-nodejs](https://github.com/notablemind/jupyter-nodejs)
- [IRkernel](https://github.com/IRkernel/IRkernel) (install the "Development" version from `master` — necessary changes haven't gotten released as binaries yet)

But it _should_ work with any [kernel](https://github.com/ipython/ipython/wiki/IPython-kernels-for-other-languages) — [post an issue](https://github.com/nteract/hydrogen/issues) if anything is broken!

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


### Watch Expressions

After you've run some code with Hydrogen, you can use the "Hydrogen: Toggle Watches" command from the Command Palette to open the watch expression sidebar. Whatever code you write in watch expressions will be re-run after each time you send that kernel any other code.

<img width=770 src="https://cloud.githubusercontent.com/assets/13285808/14125700/e5cb587a-f60c-11e5-9c28-5aef83088da2.gif">

**IMPORTANT:** Be careful what you put in your watch expressions. If you write code that mutates state in a watch expression, that code will get run after every execute command and likely result in some _extremely confusing_ bugs.


You can re-run the watch expressions by using the normal run shortcut (⌘-⌥-↩ by default) inside a watch expression's edit field.

If you have multiple kernels running, you can switch between their watch expressions with the "Hydrogen: Select Watch Kernel" command (or just click on the "Kernel: <language>" text).

### Completion

Receive completions from the running kernel.

<img width="416" src="https://cloud.githubusercontent.com/assets/13285808/14108987/35d17fae-f5c0-11e5-9c0b-ee899387f4d9.png">

### Code Introspection

You can use the "Hydrogen: Inspect" command from the Command Palette to get metadata from the kernel about the object under the cursor.

<img width="770" src="https://cloud.githubusercontent.com/assets/13285808/14108719/d72762bc-f5be-11e5-8188-32725e3d2726.png">

### Managing kernels

Sometimes things go wrong. Maybe you've written an infinite loop, maybe the kernel has crashed, or maybe you just want to clear the kernel's namespace. Use the command palette to open "Hydrogen: Show Kernel Commands" and select "Interrupt" to interrupt (think `Ctrl-C` in a REPL) the kernel or "Restart" to kill the kernel and start a new one, clearing the namespace.

You can also access these commands by clicking on the kernel status in the status bar. It looks like this:

<img src="http://i.imgur.com/oQB5mpB.png" width=300>

Additionally, if you have two or more kernels for a particular language (grammar), you can select which kernel to use with the "Switch to <kernel>" option in the Kernel Commands menu. This change is automatically saved into the Hydrogen configuration's ```grammarToKernel``` map. For example, if Hydrogen is using the kernel for Python 2 by default, you could switch to Python 3. Then next time you open a `.py` file, Hydrogen will remember your selection and use Python 3.

## How it works

Hydrogen implements the [messaging protocol](http://ipython.org/ipython-doc/stable/development/messaging.html) for [Jupyter](https://jupyter.org/). Jupyter (formerly IPython) uses ZeroMQ to connect a client (like Hydrogen) to a running kernel (like IJulia or iTorch). The client sends code to be executed to the kernel, which runs it and sends back results.


## Jank

- In order to have access to your `$PATH` to find where IPython and other binaries are, Atom has to be launched from the command line with `atom <location>`. If you launch Atom as an app, this package won't work.


## Why "Hydrogen"?

Hydrogen atoms make up 90% of Jupiter by volume.

Plus, it was easy to make a logo.

![hydrogen logo](https://cdn.rawgit.com/nteract/hydrogen/master/static/logo.svg)
