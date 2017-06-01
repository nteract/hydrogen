# Installation

For all systems, you'll need

- [Atom](https://atom.io/) `1.17.0+`
- [Jupyter](http://jupyter.org): If you have Python and conda or pip setup, install the notebook directly with `conda install jupyter` or `pip install jupyter`.

You can now run `apm install hydrogen` or search for *Hydrogen* in the Install pane of the Atom settings.

If you are using Linux 32-bit follow the installation instructions [here](Troubleshooting.md).

## Kernels

Tested and works with:

- [IPython](http://ipython.org/)
- [IJulia](https://github.com/JuliaLang/IJulia.jl)
- [iTorch](https://github.com/facebook/iTorch)
- [IJavascript](https://github.com/n-riesco/ijavascript)
- [jupyter-nodejs](https://github.com/notablemind/jupyter-nodejs)
- [IRkernel](https://github.com/IRkernel/IRkernel) `0.4+` requires [`language-r`](https://atom.io/packages/language-r) or similar
- [IElixir](https://github.com/pprzetacznik/IElixir)
- [jupyter-scala](https://github.com/alexarchambault/jupyter-scala)

But it _should_ work with any [kernel](https://github.com/jupyter/jupyter/wiki/Jupyter-kernels). If you are using Hydrogen with another kernel please add it to this list or [post an issue](https://github.com/nteract/hydrogen/issues) if anything is broken!

<img src="https://cloud.githubusercontent.com/assets/13285808/16931386/048f056e-4d41-11e6-8563-3baa8ed84371.png">

Note that if you install a new kernel, you'll need to run **Hydrogen: Update Kernels** for Hydrogen to find it. For performance reasons, Hydrogen only looks for available kernels when it first starts.

# Troubleshooting

We have a [troubleshooting guide](Troubleshooting.md)! It's pretty sparse at the
moment, so please share with us the resolution to any rough spots that you find.
