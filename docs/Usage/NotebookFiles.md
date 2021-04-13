# Notebook Import and Export

Hydrogen makes it easy to convert between text files and Jupyter Notebook (`.ipynb`) files. You can both export text files to Jupyter Notebook files and import Jupyter Notebook files as text files. This works for _any programming language_ for which you have a Jupyter kernel installed.

Access the import and export commands by opening the [command palette](https://flight-manual.atom.io/getting-started/sections/atom-basics/#command-palette) with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and searching for **"Hydrogen: Import Notebook"** or **"Hydrogen: Export Notebook"**. You can easily [assign your own keybinding](https://flight-manual.atom.io/using-atom/sections/basic-customization/#customizing-keybindings) to these commands if you'd like.

## Notebook Import

Run **`Hydrogen: Import Notebook`** and select the desired notebook file in the file browser that opens. That's it! The file will be imported into a new Atom tab as a new file, using [Cell Markers](Cells.md#cell-markers) to delimit the individual code and markdown blocks. If you also wish to view your previous cell results, then make sure **"Enable Import of Notebook Results"** is checked in Hydrogen's package settings.

**Note:** In order for Hydrogen to automatically find the corresponding syntax highlighting package for a given programming language, your notebook file must contain the proper metadata and your grammar package of choice must be installed and active.

## Notebook Export

With text like the following, running **"Hydrogen: Export Notebook"** will export code and markdown cells to a Notebook file of your choosing.

```py
# %%
print('Hello, world!')
# %% markdown
# A **Markdown** cell!
```

**Note:** Exporting results is currently not supported.

##### To see how to define cells in Hydrogen visit [Cells](Cells.md)
