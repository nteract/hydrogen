path = require('path')

describe "JupyterPath", ->
  # Because `paths` shells out to Python, we need a chance to mock it first
  [jupyterPath, jupyterConfigDir, jupyterDataDir, jupyterRuntimeDir] = []

  beforeEach ->
    # Do the require directly at least
    {jupyterPath, jupyterConfigDir, jupyterDataDir, jupyterRuntimeDir} = require '../lib/paths'

  describe "when jupyterPath is called", ->
    it "it returns an array of path strings", ->
      kernelspecs = jupyterPath()
      for kernelspec in kernelspecs
        expect(typeof(kernelspec)).toBe('string')

        parsed = path.parse(kernelspec)

        expect(parsed.root).toBe('/')
        expect(parsed.dir)

  describe "when jupyterPath is called with kernels", ->
    it "has 'kernels' at the end of each path", ->
      kernelspecs = jupyterPath('kernels')
      for kernelspec in kernelspecs
        parsed = path.parse(kernelspec)
        expect(parsed.base).toBe('kernels')
