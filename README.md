# Hydrogen <img src="https://cdn.rawgit.com/nteract/hydrogen/17eda245/static/animate-logo.svg" alt="hydrogen animated logo" height="50px" align="right" />

[![slack in](https://slackin-nteract.now.sh/badge.svg)](https://slackin-nteract.now.sh)
[![Greenkeeper badge](https://badges.greenkeeper.io/nteract/hydrogen.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/nteract/hydrogen.svg?branch=master)](https://travis-ci.org/nteract/hydrogen)

Hydrogen is an interactive coding environment that supports Python, R, JavaScript and [other Jupyter kernels](https://github.com/jupyter/jupyter/wiki/Jupyter-kernels).

Checkout our [Documentation](https://nteract.gitbooks.io/hydrogen/) and [Medium blog post](https://medium.com/nteract/hydrogen-interactive-computing-in-atom-89d291bcc4dd) to see what you can do with Hydrogen.

![hero](https://cloud.githubusercontent.com/assets/13285808/20360886/7e03e524-ac03-11e6-9176-37677f226619.gif)

## Contents
1. [Background](#background)
2. [Features](#features)
3. [Plugins for Hydrogen](#plugins-for-hydrogen)
4. [How it works](#how-it-works)
5. [Why "Hydrogen"?](#why-hydrogen)
6. [Contributing](#contributing)
7. [Changelog](#changelog)
8. [License](#license)

## Background

Hydrogen was inspired by Bret Victor's ideas about the power of instantaneous feedback and the design of [Light Table](http://lighttable.com/). Running code inline and in real time is a more natural way to develop. By bringing the interactive style of Light Table to the rock-solid usability of Atom, Hydrogen makes it easy to write code the way you want to.

You also may be interested in our latest project – [nteract](https://github.com/nteract/nteract) – a desktop application that wraps up the best of the web based Jupyter notebook.


## Features

- execute a line, selection, or block at a time
- rich media support for plots, images, and video
- watch expressions let you keep track of variables and re-run snippets after every change
- completions from the running kernel, just like autocomplete in the Chrome dev tools
- code can be inspected to show useful information provided by the running kernel
- one kernel per language (so you can run snippets from several files, all in the same namespace)
- interrupt or restart the kernel if anything goes wrong
- use a custom kernel connection (for example to run code inside Docker), read more in the "Custom kernel connection (inside Docker)" section

## [Documentation](https://nteract.gitbooks.io/hydrogen/)

- [Installation](https://nteract.gitbooks.io/hydrogen/docs/Installation.html)
- [Usage](https://nteract.gitbooks.io/hydrogen/docs/Usage/GettingStarted.html)
  - [Getting started](https://nteract.gitbooks.io/hydrogen/docs/Usage/GettingStarted.html)
  - [Examples](https://nteract.gitbooks.io/hydrogen/docs/Usage/Examples.html)
  - [Remote Kernels](https://nteract.gitbooks.io/hydrogen/docs/Usage/RemoteKernelConnection.html)
- [Troubleshooting Guide](https://nteract.gitbooks.io/hydrogen/docs/Troubleshooting.html)

## Plugins for Hydrogen

Hydrogen has support for plugins. Feel free to add your own to the list:
- [Hydrogen Launcher](https://github.com/lgeiger/hydrogen-launcher)

If you are interested in building a plugin take a look at our [plugin API documentation](https://nteract.gitbooks.io/hydrogen/docs/PluginAPI.md).

## How it works

Hydrogen implements the [messaging protocol](http://jupyter-client.readthedocs.io/en/latest/messaging.html) for [Jupyter](https://jupyter.org/). Jupyter (formerly IPython) uses ZeroMQ to connect a client (like Hydrogen) to a running kernel (like IJulia or iTorch). The client sends code to be executed to the kernel, which runs it and sends back results.

## Why "Hydrogen"?

Hydrogen atoms make up 90% of Jupiter by volume.

Plus, it was easy to make a logo.

## Contributing

Thanks for taking the time to contribute. Take a look at our [Contributing Guide](https://github.com/nteract/hydrogen/blob/master/CONTRIBUTING.md) to get started.

## Changelog

Every release is documented on the [GitHub Releases page](https://github.com/nteract/hydrogen/releases).

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/nteract/hydrogen/blob/master/LICENSE.md) file for details

**[⬆ back to top](#contents)**
