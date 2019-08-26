# Usage

Hydrogen provides a selection of commands for running code. Press <kbd>⌘-⇧-P</kbd> (On Windows press <kbd>ctrl-⇧-P</kbd> instead) to open the Command Palette and type "hydrogen" and they will come up.

## "Hydrogen: Run"
There are two ways to tell Hydrogen which code in your file to run.

1. **Selected code:** If you have code selected when you hit Run, Hydrogen will run exactly that code.
2. **Current block:** With no code selected, Hydrogen will try to find the complete block that's on or before the current line.

    - If the line you're on is already a complete expression (like `s = "abracadabra"`), Hydrogen will run just that line.

    - If the line you're on is the start of a block like a `for` loop, Hydrogen will run the whole block.

    - If the line you're on is blank, Hydrogen will run the first block above that line.

It's easiest to see these interactions visually:

![execute](https://cloud.githubusercontent.com/assets/13285808/20360915/a16efcba-ac03-11e6-9d5c-3489b3c3c85f.gif)

**"Hydrogen: Run And Move Down"** will run the code as described above and move the cursor to the next executable line.

If your code starts getting cluttered up with results, run **"Hydrogen: Clear Results"** to remove them all at once.

## "Hydrogen: Run Cell"
Cells are an easy way to separate your code. To learn more about them visit [Cells](Cells.md). 

#### Example:
<img width=280 src="https://cloud.githubusercontent.com/assets/13285808/17094174/e8ec17b8-524d-11e6-9140-60b43e073619.png">

When you place the cursor inside a cell and hit **"Hydrogen: Run Cell"**, Hydrogen will execute this cell. The command **"Hydrogen: Run Cell And Move Down"** will move the cursor to the next cell after execution.

See [**Notebook Export**](NotebookFiles.md#notebook-export) for more details about exporting your Hydrogen Cells as a Jupyter Notebook.

## "Hydrogen: Run All" and "Hydrogen: Run All Above"
These commands will run all code inside the editor or all code above the cursor.

## "Hydrogen: Toggle Output Area"
An external output area can be used to display output instead of the inline result view.
The output can be displayed either in a scrolling view or a sliding history.

<img width=560 src=https://user-images.githubusercontent.com/13436188/31737963-799d2ad2-b449-11e7-9b4c-78e51851e204.gif>

## "Hydrogen: Clear Result"

Remove results at current cursor line or current lines within a selection.

## "Hydrogen: Toggle Watches"

After you've run some code with Hydrogen, you can use the **"Hydrogen: Toggle Watches"** command from the Command Palette to open the watch expression sidebar. Whatever code you write in watch expressions will be re-run after each time you send that kernel any other code.

![watch](https://cloud.githubusercontent.com/assets/13285808/20361086/4434ab3e-ac04-11e6-8298-1fb925de4e78.gif)

**IMPORTANT:** Be careful what you put in your watch expressions. If you write code that mutates state in a watch expression, that code will get run after every execute command and likely result in some _extremely confusing_ bugs.


You can re-run the watch expressions by using the normal run shortcut (<kbd>⌘-↩</kbd> or <kbd>ctrl-↩</kbd> in Windows by default) inside a watch expression's edit field.

## Completion

Receive completions from the running kernel:

<img width="416" src="https://cloud.githubusercontent.com/assets/13285808/14108987/35d17fae-f5c0-11e5-9c0b-ee899387f4d9.png">

## "Hydrogen: Toggle Inspector"

You can use the **"Hydrogen: Toggle Inspector"** command from the Command Palette to get metadata from the kernel about the object under the cursor.

<img width="770" src="https://cloud.githubusercontent.com/assets/13285808/14108719/d72762bc-f5be-11e5-8188-32725e3d2726.png">

## "Hydrogen: Interrupt Kernel", "Hydrogen: Restart Kernel" and "Hydrogen-Shutdown Kernel"

Sometimes things go wrong. Maybe you've written an infinite loop, maybe the kernel has crashed, or maybe you just want to clear the kernel's namespace. Use the Command Palette to **interrupt** (think <kbd>Ctrl-C</kbd> in a REPL), **restart** or **shutdown** the kernel.

You can also invoke these commands by clicking on the kernel status in the status bar. It looks like this:

<img src="https://cloud.githubusercontent.com/assets/13285808/16894732/e4e5b4de-4b5f-11e6-8b8e-facf17a7c6c4.png" width=300>

## "Hydrogen: Toggle Kernel Monitor"

You can open the kernel monitor via **"Hydrogen: Toggle Kernel Monitor"** and monitor various information about all running kernels like kernel status, execution count:

<img alt="monitor" src="https://user-images.githubusercontent.com/40514306/57442351-c5ba0f00-7286-11e9-8559-0b1d14b3ab92.png">

Additionally you can interrupt/restart/shutdown a kernel via clicking icon in the `Managements` column, and jump to a file by clicking link in the `Files` column.

## Multiple kernels inside one rich document

If you are working in a markup file that supports highlighted code blocks, we can handle multiple kernels per file. This way you can write your documentation, readme or paper together with your code while retaining the interactivity of Hydrogen.

<img src="https://cloud.githubusercontent.com/assets/13285808/24365090/0af6a91c-1315-11e7-92c6-849031bf9f6a.gif" height=350>

We support
[markdown](https://github.com/burodepeper/language-markdown),
[gfm](https://github.com/atom/language-gfm),
[asciidoc](https://github.com/asciidoctor/atom-language-asciidoc),
[reStructuredText](https://github.com/Lukasa/language-restructuredtext),
[Pweave](https://github.com/mpastell/language-weave),
[Weave.jl](https://github.com/mpastell/language-weave) and
[knitr](https://github.com/christophergandrud/language-knitr/).
