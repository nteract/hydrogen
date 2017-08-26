

<!-- Start lib/plugin-api/hydrogen-provider.js -->

## HydrogenProvider

Version: 1.0.0 

The Plugin API allows you to make Hydrogen awesome.
You will be able to interact with this class in your Hydrogen Plugin using
Atom's [Service API](http://blog.atom.io/2015/03/25/new-services-API.html).

Take a look at our [Example Plugin](https://github.com/lgeiger/hydrogen-example-plugin)
and the [Atom Flight Manual](http://flight-manual.atom.io/hacking-atom/) for
learning how to interact with Hydrogen in your own plugin.

## onDidChangeKernel(Callback)

Calls your callback when the kernel has changed.

### Params:

* **Function** *Callback* 

## getActiveKernel()

Get the `HydrogenKernel` of the currently active text editor.

### Return:

* **Class** `HydrogenKernel`

## getCellRange()

Get the `atom$Range` that will run if `hydrogen:run-cell` is called.
`null` is returned if no active text editor.

### Return:

* **Class** `atom$Range`

--------

<!-- End lib/plugin-api/hydrogen-provider.js -->

<!-- Start lib/plugin-api/hydrogen-kernel.js -->

## HydrogenKernel

The `HydrogenKernel` class wraps Hydrogen's internal representation of kernels
and exposes a small set of methods that should be usable by plugins.

## onDidDestroy(Callback)

Calls your callback when the kernel has been destroyed.

### Params:

* **Function** *Callback* 

## getConnectionFile()

Get the [connection file](http://jupyter-notebook.readthedocs.io/en/latest/examples/Notebook/Connecting%20with%20the%20Qt%20Console.html) of the kernel.

### Return:

* **String** Path to connection file.

<!-- End lib/plugin-api/hydrogen-kernel.js -->

