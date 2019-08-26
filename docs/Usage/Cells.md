 # Cells
 
Cells are of three types − Code, Markdown and Raw.

#### Code Cells
A code cell allows you to edit and write new code. The programming language you use depends on the [Kernel](../Installation.md#kernels) you chose to use.

When the cell is run (See [Hydrogen: Run Cell](GettingStarted.md#hydrogen-run-cell)), the text is sent as code to the file's kernel, which will run the code. The results that are returned are then displayed inline or optionally in the **Output Area**. Output however could be of many forms not just text. For example, you can output [graphs/plots](Examples.md#static-plots) or [HTML](Examples.md#html).

#### Markdown Cells
These cells contain text formatted using [**Common Markdown**](https://www.markdownguide.org/cheat-sheet/). All kinds of formatting features are available like making text bold and italic, displaying ordered or unordered list, rendering tabular contents etc. Markdown cells are especially useful to provide documentation to the computational process.

#### Raw Cells
*Currently Not Supported*


## How to create Cells in Hydrogen
To create cells in Hydrogen, use **cell markers**. If you already have cells from a **Jupyter Notebook** (``.ipynb`` file) that you would like to import, read how to [Import Notebooks](NotebookFiles.md#notebook-import).

### Cell Markers

A cell marker is a special inline comment that defines the lines that begin each cell. The inline comment must start with the comment character registered in the language's grammar file.

- Python: `#`
- R: `#`
- Julia: `#`
- Javascript: `//`
- C++: `//`
- Stata: `//`
- Matlab: `%`


### Example Definitions

#### Code Cells

Code cells are defined, by adding the following markers, after the comment character specific to the language you are using.

##### Markers:
- `%% codecell`
- `<codecell>`
- `In[]` (you can have any number of charaters inside the brackets (empty also works))

For example, the following text corresponds to three code cells in a Python file
```py
# %% codecell
print('Hello, world!')
# <codecell>
print('foo')
# In[1]
print('bar')
```
The equivalent code in JavaScript will be
```js
// %% codecell
print('Hello, world!');
// <codecell>
print('foo');
// In[1]
print('bar');
```

#### Markdown Cells

Just as for code cells](#code-cells), there are a range of allowed markers to delimit the start of a markdown cell:

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
<br>

##### To see how to import and export notebooks with Hydrogen visit [Notebook Import and Export](NotebookFiles.md#notebook-import-and-export)
