

<!-- Start lib/plugin-api/hydrogen-provider.js -->

## HydrogenProvider

Version: 1.3.0

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

## registerTransform(transform, key)

Registers a new transform for `display_data` and `execute_result` outputs.

* If the provided key already exists, no change will be made.
* `undefined` is returned if the registry fails.
* A `Symbol(react.element)` is returned else-wise.

The following keys are registered by default:
`["vega3", "vega2", "plotly", "vegalite2", "vegalite1", "json", "js", "html", "markdown", "latex", "svg", "gif", "jpeg", "png", "plain"]`
It is recommended you don't delete those, since custom transforms will take priority in displaying.

### Params:

* **String** *key*
* **Function | Class<any>** *transform*
   * **Note:** This must be compatible with `React.createElement(transform)`.
   * **Note:** You must set your `defaultProps` to have a `mediaType`.
      * **Ex:** `defaultProps = { mediaType: "text/markdown"}`.
   * **Note:** Data is passed in via a prop called `data`.

### Return:
* **Symbol(react.element) | undefined** *transform for key*

## unregisterTransform(key)

Unregisters a transform for `display_data` and `execute_result` outputs.
* `false` is returned if the key does not exist.
* `true` is returned else-wise.

### Params:

* **String** *key*

### Return:
* **Boolean** *didKeyExist*


--------

<!-- End lib/plugin-api/hydrogen-provider.js -->

<!-- Start lib/plugin-api/hydrogen-kernel.js -->

## HydrogenKernel

The `HydrogenKernel` class wraps Hydrogen's internal representation of kernels
and exposes a small set of methods that should be usable by plugins.

## language

The language of the kernel, as specified in its kernelspec.

## displayName

The display name of the kernel, as specified in its kernelspec.

## addMiddleware(middleware)

Add a kernel middleware, which allows intercepting and issuing commands to
the kernel.

If the methods of a `middleware` object are added/modified/deleted after
`addMiddleware` has been called, the changes will take effect immediately.

### Params:

* **HydrogenKernelMiddleware** *middleware*

## onDidDestroy(Callback)

Calls your callback when the kernel has been destroyed.

### Params:

* **Function** *Callback*

## getConnectionFile()

Get the [connection file](http://jupyter-notebook.readthedocs.io/en/latest/examples/Notebook/Connecting%20with%20the%20Qt%20Console.html) of the kernel.

### Return:

* **String** Path to connection file.

<!-- End lib/plugin-api/hydrogen-kernel.js -->
