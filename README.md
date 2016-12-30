# Hydrogen

[![slack in](http://slack.nteract.in/badge.svg)](http://slack.nteract.in)
[![Build Status](https://travis-ci.org/nteract/hydrogen.svg?branch=master)](https://travis-ci.org/nteract/hydrogen)

This package lets you run your code directly in Atom using any [Jupyter](https://jupyter.org/) kernels you have installed.

Hydrogen was inspired by Bret Victor's ideas about the power of instantaneous feedback and the design of [Light Table](http://lighttable.com/). Running code inline and in real time is a more natural way to develop. By bringing the interactive style of Light Table to the rock-solid usability of Atom, Hydrogen makes it easy to write code the way you want to.

You also may be interested in our latest project – [nteract](https://github.com/nteract/nteract) – a desktop application that wraps up the best of the web based Jupyter notebook.

Checkout our [Medium blog post](https://medium.com/nteract/hydrogen-interactive-computing-in-atom-89d291bcc4dd) to see what you can do with Hydrogen.

![hero](https://cloud.githubusercontent.com/assets/13285808/20360886/7e03e524-ac03-11e6-9176-37677f226619.gif)

## Features

- execute a line, selection, or block at a time
- rich media support for plots, images, and video
- watch expressions let you keep track of variables and re-run snippets after every change
- completions from the running kernel, just like autocomplete in the Chrome dev tools
- code can be inspected to show useful information provided by the running kernel
- one kernel per language (so you can run snippets from several files, all in the same namespace)
- interrupt or restart the kernel if anything goes wrong
- use a custom kernel connection (for example to run code inside Docker), read more in the "Custom kernel connection (inside Docker)" section

## Installation

For all systems, you'll need

- [Atom](https://atom.io/) `1.6.0+`
- [Jupyter](http://jupyter.org): If you have Python and conda or pip setup, install the notebook directly with `conda install jupyter` or `pip install jupyter`.

You can now run `apm install hydrogen` or search for *Hydrogen* in the Install pane of the Atom settings.

If you are using Linux 32-bit follow the installation instructions [here](TROUBLESHOOTING.md).

### Kernels

Tested and works with:

- [IPython](http://ipython.org/)
- [IJulia](https://github.com/JuliaLang/IJulia.jl)
- [iTorch](https://github.com/facebook/iTorch)
- [IJavascript](https://github.com/n-riesco/ijavascript)
- [jupyter-nodejs](https://github.com/notablemind/jupyter-nodejs)
- [IRkernel](https://github.com/IRkernel/IRkernel) `0.4+`
- [IElixir](https://github.com/pprzetacznik/IElixir)
- [jupyter-scala](https://github.com/alexarchambault/jupyter-scala)

But it _should_ work with any [kernel](https://github.com/ipython/ipython/wiki/IPython-kernels-for-other-languages). If you are using Hydrogen with another kernel please add it to this list or [post an issue](https://github.com/nteract/hydrogen/issues) if anything is broken!

<img src="https://cloud.githubusercontent.com/assets/13285808/16931386/048f056e-4d41-11e6-8563-3baa8ed84371.png">

Note that if you install a new kernel, you'll need to run **Hydrogen: Update Kernels** for Hydrogen to find it. For performance reasons, Hydrogen only looks for available kernels when it first starts.

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

![execute](https://cloud.githubusercontent.com/assets/13285808/20360915/a16efcba-ac03-11e6-9d5c-3489b3c3c85f.gif)

**"Hydrogen: Run And Move Down"** will run the the code as described above and move the cursor to the next executable line.

If your code starts getting cluttered up with results, run **"Hydrogen: Clear Results"** to remove them all at once.

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

![watch](https://cloud.githubusercontent.com/assets/13285808/20361086/4434ab3e-ac04-11e6-8298-1fb925de4e78.gif)

**IMPORTANT:** Be careful what you put in your watch expressions. If you write code that mutates state in a watch expression, that code will get run after every execute command and likely result in some _extremely confusing_ bugs.


You can re-run the watch expressions by using the normal run shortcut (⌘-↩ by default) inside a watch expression's edit field.

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

## Plugins for Hydrogen

Hydrogen has support for plugins. Feel free to add your own to the list:
- [Hydrogen Launcher](https://github.com/lgeiger/hydrogen-launcher)

If you are interested in building a plugin take a look at our [plugin API documentation](PLUGIN_API.md).

## How it works

Hydrogen implements the [messaging protocol](http://jupyter-client.readthedocs.io/en/latest/messaging.html) for [Jupyter](https://jupyter.org/). Jupyter (formerly IPython) uses ZeroMQ to connect a client (like Hydrogen) to a running kernel (like IJulia or iTorch). The client sends code to be executed to the kernel, which runs it and sends back results.

## Remote kernels via kernel gateways

In addition to managing local kernels and connecting to them over ZeroMQ, Hydrogen is also able to connect to Jupyter Notebook (or Jupyter Kernel Gateway) servers. This is most useful for running code remotely (e.g. in the cloud).

To connect to a server, you must first add the connection information to the Hydrogen `gateways` setting. An example settings entry might be:

```json
[{
  "name": "Remote notebook",
  "options": {
    "baseUrl": "http://example.com:8888",
    "token": "my_secret_token"
  }
}]
```

Each entry in the gateways list needs at minimum a `name` (for displaying in the UI), and a value for `options.baseUrl`. The `options.token` should only be present if your server requires token authentication, in which case it should contain the specific token issued by your server. (Token authentication is enabled by default for Jupyter Notebook 4.3 or later). The `options` are passed directly to the [`@jupyterlab/services`](https://github.com/jupyterlab/services) npm package, which includes documentation for additional fields.

After gateways have been configured, you can use the **"Hydrogen: Connect to Remote Kernel"** command. You will be prompted to select a gateway, and then given the choice to either create a new session or connect to an existing one.

Unlike with local kernels, Hydrogen does not kill remote kernels when it disconnects from them. This allows sharing remote kernels between Hydrogen and the Notebook UI, as well as using them for long-running processes. To clean up unused kernels, you must explicitly call the **"Hydrogen: Shutdown Kernel"** command while connected to a kernel.

### Example with notebook server

To set up a server on the remote machine, you could

- Install Jupyter Notebook:

```bash
pip install jupyter
```

- Check to see if you have the notebook configuration file, `jupyter_notebook_config.py`. By default, it is located in `~/.jupyter`. If you don't already have one, create one by running the command:

```bash
jupyter notebook --generate-config
```

- Edit `jupyter_notebook_config.py` and find the line that says `#c.NotebookApp.token = ''`. Change it to say `c.NotebookApp.token = 'my_secret_token'`, substituting your choice of token string. (If you skip this step, the token will change every time the notebook server restarts).

- To run a server that listens on localhost, use the command:

```bash
jupyter notebook --port=8888
```

- To run a public server, consult the [official instructions](http://jupyter-notebook.readthedocs.io/en/latest/public_server.html) for setting up certificates. Skip the steps for setting up a password: hydrogen only supports token-based authentication. Also note that hydrogen does not support self-signed certificates -- we recommend that you use Let's Encrypt or consider alternatives such as listening on localhost followed by SSH port forwarding.

### Example with kernel gateway server

As of December 2016, we recommend that you use a notebook server (version 4.3 or greater) instead of the Jupyter Kernel Gateway. We expect this to change in the future, and will update this README when that occurs.

## Docker execution via kernel gateways

You can use the same technique to create a kernel gateway in a Docker container. That would allow you to develop from Atom but with all the dependencies, autocompletion, environment, etc. of a Docker container.

**Note**: due to the way that the kernel gateway creates sub-processes for each kernel, you have to use it in a special way, you can't run the `jupyter kernelgateway` directly in your `Dockerfile` `CMD` section. You need to call it with an init manager such as [**tini**](https://github.com/krallin/tini) or run it from an interactive console.

If all you need is a Docker Python environment to execute your code, you can read the section [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway) (this method uses **tini** under the hood).

If you want to add a temporal Kernel Gateway (for development) to your current Docker images or need to modify an existing image to add the Kernel Gateway functionality, read the section [**Example Docker kernel gateway**](#example-docker-kernel-gateway) (this method runs the kernel gateway from an interactive console).

### Example Jupyter Docker Stack kernel gateway

Follow this if you only need to have a simple environment to run commands inside a Docker container and nothing more.

If you need to customize a Docker image (e.g. for web development) follow the section below: [**Example Docker kernel gateway**](#example-docker-kernel-gateway).

#### Dockerfile

- Create a `Dockerfile` based on one of the [Jupyter Docker Stacks](https://github.com/jupyter/docker-stacks).
- Install `jupyter_kernel_gateway` in your `Dockerfile`
- Expose the gateway port, in this example it will be `8888`
- Make the command to run be the Kernel Gateway:

```Dockerfile
FROM jupyter/minimal-notebook

RUN pip install jupyter_kernel_gateway

EXPOSE 8888
CMD ["jupyter", "kernelgateway", "--KernelGatewayApp.ip=0.0.0.0", "--KernelGatewayApp.port=8888"]
```

#### Run Docker Container with Docker commands

**Note**: alternatively, see below for `docker-compose` instructions.

- Build your container:

```bash
docker build -t hydro-kernel-gateway .
```

- Run your container mapping the port of the gateway
- Give your container a name

```bash
docker run -it --rm --name hydro-kernel-gateway -p 8888:8888 hydro-kernel-gateway
```

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

#### Run Docker Container with Docker Compose

- Create a `docker-compose.yml` file with something like:

```yml
version: '2'
services:
  hydro-kernel-gateway:
    build: .
    ports:
      - "8888:8888"
```

- The `docker-compose.yml` file has a port mapping using the port exposed in the `Dockerfile` and used in the `jupyter kernelgateway` command

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

- Now start (and build) your container with `docker-compose`:

```bash
docker-compose up -d
```

- Check the name of your running container with:

```bash
docker-compose ps
```

#### Connect Atom

Now you need to connect Atom to your setup. Follow the section [**Connect Atom**](#connect-atom-1) below.

### Example Docker kernel gateway

Follow this if you need to customize a Docker image you already have. For example, for a web project.

If you only need a simple environment in where to run Python commands with Hydrogen inside a Docker container, follow the section above: [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway).

#### Dockerfile

- Create a `Dockerfile`
- Install `jupyter_kernel_gateway` in your `Dockerfile`
- Expose the gateway port, in this example it will be `8888`:

```Dockerfile
FROM python:2.7

# Remove in production
RUN pip install jupyter_kernel_gateway
EXPOSE 8888
```

#### Run Docker Container with Docker commands

**Note**: alternatively, see below for `docker-compose` instructions.

- Build your container:

```bash
docker build -t hydro .
```

- Run your container mapping the port of the gateway
- Give your container a name
- Make it run an infinite loop that just keeps the container alive:

```bash
docker run -d -p 8888:8888 --name hydro  hydro bash -c "while true; do sleep 10; done"
```

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

- Execute an interactive bash session in your running container:

```bash
docker exec -it hydro bash
```

- From that interactive session, start the gateway
- Specify the IP `0.0.0.0` to make your container listen to public connections
- Specify the port that you exposed in your `Dockerfile`:

```bash
jupyter kernelgateway --ip=0.0.0.0 --port=8888
```

#### Run Docker Container with Docker Compose

- Create a `docker-compose.yml` file with something like:

```yml
version: '2'
services:
  hydro:
    build: .
    ports:
      - "8888:8888"
    command: bash -c "while true; do sleep 10; done"
```

- The `docker-compose.yml` file has a port mapping using the port exposed in the `Dockerfile` and used in the `jupyter kernelgateway` command
- The `command` overrides the default `CMD` in the `Dockerfile` (if there was one) and executes an infinite loop that would just keep the container alive

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

- Now start (and build) your container with `docker-compose`:

```bash
docker-compose up -d
```

- Check the name of your running container with:

```bash
docker-compose ps
```

- Execute an interactive bash session in your running container (use the name from above), e.g.:

```bash
docker exec -it myproject_hydro_1 bash
```

- From that interactive session, start the gateway
- Specify the IP `0.0.0.0` to make your container listen to public connections
- Specify the port that you exposed in your `Dockerfile`:

```bash
jupyter kernelgateway --ip=0.0.0.0 --port=8888
```

### Connect Atom

- Go to the settings in Atom with: `ctrl-shift-p` and type `Settings View: Open`
- Go to the "Packages" section
- Type `Hydrogen` and go to package settings
- In the section "List of kernel gateways to use" add settings for the container your created
- Use a `name` that you can remind when running Hydrogen
- In the `baseUrl` section use the host or IP that you use to access your Docker containers:
  - If you are using Docker Toolbox in Windows or Mac (or Docker for Windows, Docker for Mac), as it will be running in a virtual machine, the IP (host) would probably be like: `192.168.99.100`, you can read about it and check the `docker-machine ip default` command [in the official Docker docs](https://docs.docker.com/machine/get-started/#/run-containers-and-experiment-with-machine-commands)
  - If you are using Docker in a Linux machine and you are running Atom in that same machine you can just use `localhost` as the host of your `baseUrl`
- For example, a possible configuration for Docker Toolbox in Windows or Mac could be:

```JSON
[{"name": "Docker Toolbox", "options": {"baseUrl": "http://192.168.99.100:8888"}}]
```

- In Atom, open a Python file, e.g. `main.py`
- Connect to the kernel you just configured: `ctrl-shift-p` and type: `Hydrogen: Connect To Remote Kernel`
- Select the kernel gateway you configured, e.g. `Docker Toolbox`
- Select the "type of kernel" to run, there will just be the option `Python 2` or `Python 3`
- Then select the line or block of code that you want to execute inside of your container
- Run the code with: `ctrl-shift-p` and type: `Hydrogen: Run`

### Testing it

You can test that it is actually working by installing a package in your container that you don't have locally and using it inside your container (from your Atom editor).

- For example, install the Python package `markdown` in your `Dockerfile`:

```Dockerfile
FROM python:2.7

RUN pip install markdown

# Remove in production
RUN pip install jupyter_kernel_gateway
EXPOSE 8888
```

**Note**: If you followed the [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway) section, your `Dockerfile` will look different. Just make sure you add a line with:

```Dockerfile
RUN pip install markdown
```

- Follow all the instructions above, and use a Python file that has:

```python
import markdown
markdown.version
```

- Select the code and run it with: `ctrl-shift-p` and type `Hydrogen: Run`, you will see the code executed inline like:

```python
import markdown [✓]
markdown.version ['2.6.6']
```

### Terminate the connection and container

- To terminate a running kernel gateway you can "kill" it as any Linux process with `ctrl-c`

- If you followed the [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway) section, it will just work.

But, if you are using the general instructions (for a custom Docker image), because of the way Jupyter Kernel Gateway creates sub-processes and due to the fact that you are running in a Docker container, the actual kernel process will still be running.

- Before exiting the terminal, find the still running (Python) kernel process with:

```bash
ps -fA
```

- You will get something like:

```
root@6d09f8fee132:/# ps -fA
UID        PID  PPID  C STIME TTY          TIME CMD
root         1     0  0 00:21 ?        00:00:00 bash -c while true; do sleep 10; done
root        10     0  0 00:22 ?        00:00:00 bash
root        23     0  0 00:22 ?        00:00:00 /usr/local/bin/python2 -m ipykernel -f /root/.local/share/jupyter/runtime/kernel-95baef8a-6427-4415-bc95-e02dc74e4ebb.js
root        77     1  0 00:28 ?        00:00:00 sleep 10
root        78    10  0 00:28 ?        00:00:00 ps -fA
```

- Kill the `ipykernel` process by killing all the `python` processes:

```bash
pkill python
```

- Now you can exit the interactive terminal with:

```bash
exit
```

## Custom kernel connection

**Hydrogen** also supports using a custom kernel connection file for each project. It could be used to connect to "remote" environments as Docker, a remote computer, etc. But the method described above using [**kernel gateways**](#remote-kernels-via-kernel-gateways) is less error prone and simpler to apply in more cases.

The recommended way of connecting to remote kernels is now using [**kernel gateways** as described above](#remote-kernels-via-kernel-gateways). But if you still need to use a custom kernel connection file you can [read the **Custom kernel connection** guide here](https://github.com/nteract/hydrogen/blob/master/KERNEL_CONNECTION.md).


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
