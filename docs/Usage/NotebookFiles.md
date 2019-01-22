# Notebook Import and Export

Hydrogen makes it easy to convert between text files and Jupyter Notebook (`.ipynb`) files. You can both export text files to Jupyter Notebook files and import Jupyter Notebook files as text files. This works for _any programming language_ for which you have a Jupyter kernel installed.

Access the import and export commands by opening the [command palette](https://flight-manual.atom.io/getting-started/sections/atom-basics/#command-palette) with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and searching for **"Hydrogen: Import Notebook"** or **"Hydrogen: Export Notebook"**. You can easily [assign your own keybinding](https://flight-manual.atom.io/using-atom/sections/basic-customization/#customizing-keybindings) to these commands if you'd like.

## Notebook Import

Run **"Hydrogen: Import Notebook"** and select the desired notebook file in the file browser that opens. That's it! The file will be imported into a new Atom tab, using [cell markers](#cell-markers) to delimit the individual code and markdown blocks.

**Note:** The syntax highlighting package for the given programming language must be installed and active.

## Notebook Export

With text like the following, running **"Hydrogen: Export Notebook"** will export code and markdown cells to a Notebook file of your choosing.
```py
# %%
print('Hello, world!')
# %% markdown
# A **Markdown** cell!
```

### Cell Markers

A cell marker is a special inline comment that defines the lines that begin each cell. The inline comment must start with the comment character registered in the language's grammar file.

- Python: `#`
- R: `#`
- Julia: `#`
- Javascript: `//`
- C++: `//`
- Stata: `//`
- Matlab: `%`

#### Code Cells

After the comment character, you need to add one space plus any of the following markers on the same line:

- `%%`
- `<codecell>`
- `In[]` (you can have any number of digits or spaces in the brackets)

For example, the following text corresponds to three code cells in a Python file
```py
# %%
print('Hello, world!')
# <codecell>
print('foo')
# In[1]
print('bar')
```

These are the same cell markers used by [**"Hydrogen: Run Cell"**](GettingStarted.md#hydrogen-run-cell).

#### Markdown Cells

You can also create cells with [Markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)-formatted text. Just as for code cells, there are a range of allowed markers to delimit the start of a markdown cell:

- `%% md`
- `%% [md]`
- `%% markdown`
- `%% [markdown]`
- `<md>`
- `<markdown>`

Each line of text in the cell's body should be prefixed by the language's comment character. Any common leading whitespace in the cell will be stripped, so the body text can include a space after the comment symbol without having leading whitespace in the output and with indented lists keeping their structure.

For example, here are two markdown cells in a Python file
```
# %% [markdown]
# _italic text_
# **bold text**
# <markdown>
# - Indented
#     - Lists
```

the two cells would be exported without any common leading whitespace as
```md
_italic text_
**bold text**
```
and
```md
- Indented
    - Lists
```

#### Raw Cells

Hydrogen doesn't support the export of [raw cells](https://nbformat.readthedocs.io/en/latest/format_description.html#raw-nbconvert-cells) at this time.
