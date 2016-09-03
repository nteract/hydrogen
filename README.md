# Hydrogen

[![slack in](http://slack.nteract.in/badge.svg)](http://slack.nteract.in)
[![Build Status](https://travis-ci.org/nteract/hydrogen.svg?branch=master)](https://travis-ci.org/nteract/hydrogen)

This package lets you run your code directly in Atom using any [Jupyter](https://jupyter.org/) kernels you have installed.

Hydrogen was inspired by Bret Victor's ideas about the power of instantaneous feedback and the design of [Light Table](http://lighttable.com/). Running code inline and in real time is a more natural way to develop. By bringing the interactive style of Light Table to the rock-solid usability of Atom, Hydrogen makes it easy to write code the way you want to.

<img src="https://cloud.githubusercontent.com/assets/13285808/14598778/1cff1b32-0554-11e6-8181-504307ca6b56.gif" width=600>


## Features

- execute a line, selection, or block at a time
- rich media support for plots, images, and video
- watch expressions let you keep track of variables and re-run snippets after every change
- completions from the running kernel, just like autocomplete in the Chrome dev tools
- code can be inspected to show useful information provided by the running kernel
- one kernel per language (so you can run snippets from several files, all in the same namespace)
- interrupt or restart the kernel if anything goes wrong
- use a custom kernel connection (for example to run code inside Docker), read more in the "Custom kernel connection (inside Docker)" section

## Dependencies

For all systems, you'll need

- [Atom](https://atom.io/) `1.6.0+`
- [ZeroMQ](http://zeromq.org/intro:get-the-software)
- [Jupyter notebook](http://jupyter.org): `pip install jupyter`
- Python 2 for builds (you can still run Python 3 code)

Each operating system has their own instruction set. Please read on down to save yourself time.

#### OS X

##### homebrew on OS X

- [`pkg-config`](https://www.freedesktop.org/wiki/Software/pkg-config/): `brew install pkg-config`
- [ZeroMQ](http://zeromq.org/intro:get-the-software): `brew install zeromq`
- [Jupyter notebook](http://jupyter.org) (needs to be installed and on your `$PATH`): `pip install jupyter`

#### Windows

- You'll need a compiler! [Visual Studio 2013 Community Edition](https://www.visualstudio.com/en-us/downloads/download-visual-studio-vs.aspx) is required to build zmq.node.
- Python (tread on your own or install [Anaconda](https://www.continuum.io/downloads))
- [Jupyter notebook](http://jupyter.org) (if you installed Anaconda, you're already done)

After these are installed, you'll likely need to restart your machine (especially after Visual Studio).

#### Linux

For **Debian/Ubuntu** based variants, you'll need `libzmq3-dev` (preferred) or alternatively `libzmq-dev`.

For **RedHat/CentOS/Fedora/openSUSE** based variants, you'll need `zeromq` and `zeromq-devel`.

For **Arch** Linux based variants, you'll need `zeromq` or `zeromq3` (which has to be built from the <abbr title="Arch User Repository">AUR</abbr>).

For **Gentoo** Linux based variants, you'll need `net-libs/zeromq`.

If you have Python and pip setup, install the notebook directly, via running (as root):

```
pip install jupyter
```

## Installation

Assuming you followed the dependencies steps above, you can now `apm install hydrogen` (recommended) or search for "hydrogen" in the Install pane of the Atom settings.

If your default `python` is 3.x, you need to run instead `PYTHON=python2.7 apm install hydrogen` or change the default version for `apm` with `apm config set python $(which python2.7)` beforehand. You can still use 3.x versions of Python in Hydrogen, but it will only build with 2.x due to a [longstanding issue with `gyp`](https://bugs.chromium.org/p/gyp/issues/detail?id=36).


### Kernels

Tested and works with:

- [IPython](http://ipython.org/)
- [IJulia](https://github.com/JuliaLang/IJulia.jl)
- [iTorch](https://github.com/facebook/iTorch)
- [IJavascript](https://github.com/n-riesco/ijavascript)
- [jupyter-nodejs](https://github.com/notablemind/jupyter-nodejs)
- [IRkernel](https://github.com/IRkernel/IRkernel) `0.4+`
- [IElixir](https://github.com/pprzetacznik/IElixir)

But it _should_ work with any [kernel](https://github.com/ipython/ipython/wiki/IPython-kernels-for-other-languages). If you are using hydrogen with another kernel please add it to this list or [post an issue](https://github.com/nteract/hydrogen/issues) if anything is broken!

<img src="https://cloud.githubusercontent.com/assets/13285808/16931386/048f056e-4d41-11e6-8563-3baa8ed84371.png">

Note that if you install a new kernel, you'll need to reload Atom (search in the Command Palette for "reload") for Hydrogen to find it. For performance reasons, Hydrogen only looks for available kernels when it first starts.

#### Debian 8 and Ubuntu 16.04 LTS

Unfortunately, the versions of IPython provided in Debian's and Ubuntu's
repositories are rather old and Hydrogen is unable to detect the kernel specs
installed in your machine. To workaround this issue, Hydrogen provides the
setting `KernelSpec`, where the user can declare the kernel specs manually.
Find the `KernelSpec` setting in the Atom GUI by going to the Settings pane,
click Packages, search for Hydrogen, and click the Hydrogen Settings button.

Below is an example `KernelSpec` for IPython 2 and 3:

```json
{
  "kernelspecs": {
    "python2": {
      "spec": {
        "display_name": "Python 2",
        "language": "python",
        "argv": ["python2.7", "-m", "ipykernel", "-f", "{connection_file}"],
        "env": {}
      }
    },
    "python3": {
      "spec": {
        "display_name": "Python 3",
        "language": "python",
        "argv": ["python3.4", "-m", "ipykernel", "-f", "{connection_file}"],
        "env": {}
      }
    }
  }
}
```

## Troubleshooting

We have a [troubleshooting guide](TROUBLESHOOTING.md)! It's pretty sparse at the
moment, so please share with us the resolution to any rough spots that you find.


## Usage

Hydrogen provides a selection of commands for running code. Press ⌘-⇧-P to open the command palette and type "hydrogen" and they will come up.

### "Hydrogen: Run"
There are two ways to tell Hydrogen which code in your file to run.

1. **Selected code:** If you have code selected when you hit Run, Hydrogen will run exactly that code.
2. **Current block:** With no code selected, Hydrogen will try to find the complete block that's on or before the current line.

    - If the line you're on is already a complete expression (like `s = "abracadabra"`), Hydrogen will run just that line.

    - If the line you're on is the start of a block like a `for` loop, Hydrogen will run the whole block.

    - If the line you're on is blank, Hydrogen will run the first block above that line.

It's easiest to see these interactions visually:

<img src="http://g.recordit.co/4ViVmKtKAr.gif">

**"Hydrogen: Run And Move Down"** will run the the code as described above and move the cursor to the next executable line.

If your code starts getting cluttered up with results, run **"Hydrogen: Clear Results"** to remove them all at once. You can also run this command with ⌘-⌥-⌫.

### "Hydrogen: Run Cell"
A "code cell" is a block of lines to be executed at once. You can define them using inline comments. Hydrogen supports a
multitude of ways to define cells. Pick the one you like best.
The following is an example for `python` but it will work in any language, just replace `#` with the comment symbol for your desired language:

<img width=280 src="https://cloud.githubusercontent.com/assets/13285808/17094174/e8ec17b8-524d-11e6-9140-60b43e073619.png">

When you place the cursor inside a cell and hit **"Run Cell"**, Hydrogen will execute this cell. The command **"Hydrogen: Run Cell And Move Down"** will move the cursor to the next cell after execution.

### "Hydrogen: Run All" and "Hydrogen: Run All Above"
These commands will run all code inside the editor or all code above the cursor.


### Watch Expressions

After you've run some code with Hydrogen, you can use the **"Hydrogen: Toggle Watches"** command from the Command Palette to open the watch expression sidebar. Whatever code you write in watch expressions will be re-run after each time you send that kernel any other code.

<img width=770 src="https://cloud.githubusercontent.com/assets/13285808/14125700/e5cb587a-f60c-11e5-9c28-5aef83088da2.gif">

**IMPORTANT:** Be careful what you put in your watch expressions. If you write code that mutates state in a watch expression, that code will get run after every execute command and likely result in some _extremely confusing_ bugs.


You can re-run the watch expressions by using the normal run shortcut (⌘-⌥-↩ by default) inside a watch expression's edit field.

If you have multiple kernels running, you can switch between their watch expressions with the **"Hydrogen: Select Watch Kernel"** command (or just click on the "Kernel: <language>" text).

### Completion

Receive completions from the running kernel.

<img width="416" src="https://cloud.githubusercontent.com/assets/13285808/14108987/35d17fae-f5c0-11e5-9c0b-ee899387f4d9.png">

### Code Introspection

You can use the **"Hydrogen: Toggle Inspector"** command from the Command Palette to get metadata from the kernel about the object under the cursor.

<img width="770" src="https://cloud.githubusercontent.com/assets/13285808/14108719/d72762bc-f5be-11e5-8188-32725e3d2726.png">

### Managing kernels

Sometimes things go wrong. Maybe you've written an infinite loop, maybe the kernel has crashed, or maybe you just want to clear the kernel's namespace. Use the command palette to **interrupt** (think `Ctrl-C` in a REPL) or **restart** the kernel.

You can also access these commands by clicking on the kernel status in the status bar or via the command palette. It looks like this:

<img src="https://cloud.githubusercontent.com/assets/13285808/16894732/e4e5b4de-4b5f-11e6-8b8e-facf17a7c6c4.png" width=300>

Additionally, if you have two or more kernels for a particular language (grammar), you can select which kernel to use with the "Switch to <kernel>" option in the Kernel Commands menu.

## How it works

Hydrogen implements the [messaging protocol](http://jupyter-client.readthedocs.io/en/latest/messaging.html) for [Jupyter](https://jupyter.org/). Jupyter (formerly IPython) uses ZeroMQ to connect a client (like Hydrogen) to a running kernel (like IJulia or iTorch). The client sends code to be executed to the kernel, which runs it and sends back results.

## Remote kernels via kernel gateways

In addition to managing local kernels and connecting to them over ZeroMQ, Hydrogen is also able to connect to Jupyter Kernel Gateways and Jupyter Notebook servers. This is most useful for running code remotely (e.g. in the cloud).

To connect to a gateway server, you must first add the connection information to the Hydrogen `gateways` setting. An example settings entry might be:

```json
[{
    "name": "Remote notebook",
    "options": {
            "baseUrl": "http://example.com:8888"
    }
}]
```

Each entry in the gateways list needs at minimum a `name` (for displaying in the UI), and a value for `options.baseUrl`. The `options` are passed directly to the `jupyter-js-services` npm package, which includes documentation for additional fields.

After gateways have been configured, you can use the **"Hydrogen: Connect to Remote Kernel"** command. You will be prompted to select a gateway, and then given the choice to either create a new session or connect to an existing one.

Unlike with local kernels, when Hydrogen does not kill remote kernels when it disconnects from them. This allows sharing remote kernels between Hydrogen and the Notebook UI, as well as using them for long-running processes. To clean up unused kernels, you must explicitly call the **"Hydrogen: Shutdown Kernel"** command while connected to a kernel.

**Note:** Unlike a notebook server, the jupyter kernel gateway by default disables listing already-running kernels. This means that once disconnected from a kernel, you will not be able to reconnect to it. You can set `c.KernelGatewayApp.list_kernels = True` in your kernel gateway configuration to change this behavior.

## Custom kernel connection (inside Docker)

You can use a custom kernel connection file to connect to a previously created kernel.

For example, you can run a kernel inside a Docker container and make Hydrogen connect to it automatically. If you are using Docker this would allow you to develop from Atom but with all the dependencies, autocompletion, environment, etc of a Docker container.

Hydrogen will look for a kernel JSON connection file under `./hydrogen/connection.json` inside your project. If that file exists, Hydrogen will try to connect to the kernel specified by that connection file.

Here's a simple recipe for doing and testing that with Python:

* In your project directory, create a `Dockerfile` with:

```
FROM python:2.7

RUN pip install markdown

RUN pip install ipykernel
RUN echo "alias hydrokernel='python -m ipykernel "'--ip=$(hostname -I)'" -f /tmp/hydrogen/connection.json'" >> /etc/bash.bashrc
```

You will test using the Python package `markdown` from inside the Docker container in your local Atom editor, with autocompletion, etc.

The last two lines are the only (temporal) addition to your `Dockerfile` that will allow you to develop locally using the remote Python kernel. If you already have a Python project with a `Dockerfile` you only need to copy those 2 lines and add them to it:

```
RUN pip install ipykernel
RUN echo "alias hydrokernel='python -m ipykernel "'--ip=$(hostname -I)'" -f /tmp/hydrogen/connection.json'" >> /etc/bash.bashrc
```

The first of those two lines will install the Python package `ipykernel`, which is the only requisite to run the remote Python kernel.

The second line creates a handy shortcut named `hydrokernel` to run a Python kernel that listens on the container's IP address and writes the connection file to `/tmp/hydrogen/connection.json`.

* Build your container with:

```
docker build -t python-docker .
```

* Run your container mounting a volume that maps `./hydrogen/` in your local project directory to `/tmp/hydrogen/` in your container. That's the trick that will allow Hydrogen to connect to the kernel running inside your container automatically. It's probably better to run it with the command `bash` and start the kernel manually, so that you can restart it if you need to (or if it dies).

```
docker run -it --name python-docker -v $(pwd)/hydrogen:/tmp/hydrogen python-docker bash
```

* Next, you just have to call the alias command we created in the `Dockerfile`, that will start the kernel with all the parameters needed:

```
hydrokernel
```

* You will see an output similar to:

```
root@24ae5d04ef3c:/# hydrokernel
NOTE: When using the `ipython kernel` entry point, Ctrl-C will not work.

To exit, you will have to explicitly quit this process, by either sending
"quit" from a client, or using Ctrl-\ in UNIX-like environments.

To read more about this, see https://github.com/ipython/ipython/issues/2049


To connect another client to this kernel, use:
    --existing /tmp/hydrogen/connection.json
```

* And you will see that a file was created in `./hydrogen/connection.json` inside your project directory.

* Now you can create a file `test.py` with:

```
import markdown
markdown.version
```

* Select the contents and run them with Hydrogen ("`cmd-shift-P`" and "`Hydrogen: run`").

* You will see the inline execution and output that just ran from your kernel, even if you don't have the Python package `mardown` installed locally, because it's running inside your container.

```
import markdown [✓]
markdown.version ['2.6.6']
```



## Why "Hydrogen"?

Hydrogen atoms make up 90% of Jupiter by volume.

Plus, it was easy to make a logo.

![hydrogen logo](https://cdn.rawgit.com/nteract/hydrogen/master/static/logo.svg)

## Development
#### Quick and dirty setup

`apm develop hydrogen`

This will clone the `hydrogen` repository to `~/github` unless you set the
`ATOM_REPOS_HOME` environment variable.

#### I already cloned it!

If you cloned it somewhere else, you'll want to use `apm link --dev` within the
package directory, followed by `apm install` to get dependencies.

### Workflow

After pulling upstream changes, make sure to run `apm update`.

To start hacking, make sure to run `atom --dev` from the package directory.
Cut a branch while you're working then either submit a Pull Request when done
or when you want some feedback!

#### Running specs

You can run specs by triggering the `window:run-package-specs` command in Atom. To run tests on the command line use `apm test` within the package directory.

You can learn more about how to write specs [here](http://flight-manual.atom.io/hacking-atom/sections/writing-specs/).
