# Installation

Hydrogen requires **[Atom](https://atom.io/)** `1.20.0+` and **[kernels](#kernels)** for the languages you intend to use Hydrogen with.

To install Hydrogen run `apm install hydrogen` or search for *Hydrogen* in the Install pane of the Atom settings.

If you are using Linux 32-bit follow the installation instructions [here](Troubleshooting.md).

**NOTE:**

`apm` seems to have a bit of issue in the latest version `1.23.0-beta1`. If you get an error that starts with:
```
fs.js:640
  return binding.open(pathModule._makeLong(path), stringToFlags(flags), mode);
                 ^

Error: ENOENT: no such file or directory
```
we recommend you to install `Hydrogen` via console command: `apm install hydrogen`.

## Kernels

Checkout [nteract.io/kernels](https://nteract.io/kernels) for instructions on how to install the most popular kernels.

Tested and works with:

- [IPython](http://ipython.org/)
- [IRkernel](https://github.com/IRkernel/IRkernel) `0.4+` requires [`language-r`](https://atom.io/packages/language-r) or similar
- [IJulia](https://github.com/JuliaLang/IJulia.jl)
- [iTorch](https://github.com/facebook/iTorch)
- [IJavascript](https://github.com/n-riesco/ijavascript)
- [jupyter-nodejs](https://github.com/notablemind/jupyter-nodejs)
- [IElixir](https://github.com/pprzetacznik/IElixir)
- [Almond (previously called jupyter-scala)](https://github.com/almond-sh/almond)
- [kotlin-jupyter](https://github.com/ligee/kotlin-jupyter)
- [stata-kernel](https://github.com/kylebarron/stata_kernel)

But it _should_ work with any [kernel](https://github.com/jupyter/jupyter/wiki/Jupyter-kernels). If you are using Hydrogen with another kernel please add it to this list or [post an issue](https://github.com/nteract/hydrogen/issues) if anything is broken!

<img src="https://cloud.githubusercontent.com/assets/13285808/16931386/048f056e-4d41-11e6-8563-3baa8ed84371.png">

Note that if you install a new kernel, you'll need to run **Hydrogen: Update Kernels** for Hydrogen to find it. For performance reasons, Hydrogen only looks for available kernels when it first starts.

# Troubleshooting

We have a [troubleshooting guide](Troubleshooting.md)! It's pretty sparse at the
moment, so please share with us the resolution to any rough spots that you find.
