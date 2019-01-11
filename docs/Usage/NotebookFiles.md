# Notebook Export

Hydrogen makes it easy to export text files to Jupyter Notebook files (`.ipynb` files).

With text like the following, running **"Hydrogen: Export Notebook"** will export code and markdown cells to a Notebook file of your choosing.
```py
# %%
print('Hello, world!')
# %% markdown
# A **Markdown** cell!
```

## Cell Markers

Use a special inline comment to distinguish the beginning of code cells and markdown cells. The inline comment must start with the comment character registered in the language's grammar file.

- Python: `#`
- R: `#`
- Julia: `#`
- Javascript: `//`
- Stata: `//`

### Code Cells

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

### Markdown Cells

You can also create cells with [Markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)-formatted text. Just as for code cells, there are a range of allowed markers to delimit the start of a markdown cell:

- `%% md`
- `%% [md]`
- `%% markdown`
- `%% [markdown]`
- `<md>`
- `<markdown>`

Each line of text in the cell's body should be prefixed by the language's comment character. Any common leading whitespace in the cell will be stripped, so the body text can include a space after the comment symbol without having leading whitespace in the output and with indented lists keeping their structure.

For example, here are two markdown cells in a Python file
```py
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
```md
- Indented
    - Lists
```

### Raw Cells

Hydrogen doesn't support the export of [raw cells](https://nbformat.readthedocs.io/en/latest/format_description.html#raw-nbconvert-cells) at this time.
