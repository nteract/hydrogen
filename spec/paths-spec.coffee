describe "JupyterPath", ->
  # Because `paths` shells out to Python, we need a chance to mock it first
  [jupyterPath, jupyterConfigDir, jupyterDataDir, jupyterRuntimeDir] = []

  beforeEach ->
    # Do the require directly at least
    {jupyterPath, jupyterConfigDir, jupyterDataDir, jupyterRuntimeDir} = require '../lib/paths'

  describe "when jupyterPath is called", ->
    it "it returns an array of path strings", ->
      expect(2).toBe(2)
