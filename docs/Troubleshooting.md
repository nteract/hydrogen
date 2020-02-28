# Troubleshooting

## Debugging Guide

Sometimes unexpected things happen.
In this case, please, open an [Issue](https://github.com/nteract/hydrogen/issues) and make sure to include the version of Hydrogen and Atom you are running. You can get this information by running `atom --version` from the command line.

Please, also include the output or a screenshot of the debug messages. To access the debug messages follow these steps:

1. Open the Settings tab by pressing (`ctrl-,`), select the Hydrogen package (`Packages --> Hydrogen`), and tick `Enable Debug Messages`:
![hydrogen-settings](https://cloud.githubusercontent.com/assets/6199391/23463294/df273cf2-fe88-11e6-95e3-0be765973035.png)

2. Open the developer tools (`View --> Developer --> Toggle Developer Tools` or via `shift-ctrl-i`/`cmd-alt-i`):
![open-dev-tools](https://cloud.githubusercontent.com/assets/6199391/23463624/27db48fc-fe8a-11e6-8f68-f0159bc26362.png)

3. Select the Console tab to see the debug logs and run the code causing the issue:
![dev-tools](https://cloud.githubusercontent.com/assets/6199391/23463305/e4750a9a-fe88-11e6-906e-d19ab90ac309.png)

## Common Issues

### Installation fails on Linux 32-bit

At the moment we don't ship prebuilts for 32-bit Linux. Hence you'll need some additional toolling to build from source:

- `python` (`v2.7` recommended, `v3.x.x` is not supported for building Hydrogen)
- `make`
- A proper C/C++ compiler toolchain, like [GCC](https://gcc.gnu.org/)

Use your distribution's package manager to install.

If your default `python` is 3.x, you need to run instead `PYTHON=python2.7 apm install hydrogen` or change the default version for `apm` with `apm config set python $(which python2.7)` beforehand. You can still use 3.x versions of Python in Hydrogen, but it will only build with 2.x due to a [longstanding issue with `gyp`](https://bugs.chromium.org/p/gyp/issues/detail?id=36).

### No kernel for grammar XXX found

Hydrogen requires a Kernel to run code. Checkout [nteract.io/kernels](https://nteract.io/kernels) for instructions on how to install the most popular kernels.

Atom won't pick up kernels inside a virtualenv unless Atom is launched as `atom .` within the virtualenv. The alternative is to [create a kernel specifically for a virtualenv](http://www.alfredo.motta.name/create-isolated-jupyter-ipython-kernels-with-pyenv-and-virtualenv/).

#### No kernel for grammar `Python` found error on Mac OS

First off, make sure that you run
```
python3 -m pip install ipykernel
python3 -m ipykernel install --user
```
and
```
jupyter --paths
```
shows IPython kernels you want to use.

Even after the above steps have been done successfully, if Hydrogen still keeps complaining the "No kernel for grammar `Python` found" error on Mac OS, [this workaround](https://github.com/nteract/hydrogen/issues/1074#issuecomment-514080192) may help you solve it.

### Hydrogen doesn't show my results.

Again, there are a number of possible causes and solutions:

- If the result bubble only shows check marks (see issues
  [#61](https://github.com/nteract/hydrogen/issues/61),
  [#68](https://github.com/nteract/hydrogen/issues/68),
  [#73](https://github.com/nteract/hydrogen/issues/73),
  [#88](https://github.com/nteract/hydrogen/issues/88)):

  - solved by upgrading the `jupyter` version (see [this
    comment](https://github.com/nteract/hydrogen/issues/88#issuecomment-136761769) );

- If Hydrogen doesn't output any results for Atom version < 1.13 (see issue
  [#326](https://github.com/nteract/hydrogen/issues/326)), check that you haven't disabled
  `Use Shadow DOM` under `Settings > Editor`. This option should be enabled.

- If the spinner in the result bubble never stops (see issue
  [#53](https://github.com/nteract/hydrogen/issues/53)): This is issue hasn't
  been seen recently. Please, post in issue
  [#53](https://github.com/nteract/hydrogen/issues/53) the details of your
  installation.
  
  ## Hydrogen stopped working after updating Atom
  Whenever your Atom is upgraded, the Hydrogen package needs to be rebuilt. Atom should prompt you to rebuild Hydrogen after upgrading. In case it doesn't, you can manually rebuild Hydrogen from the Panel that opens when executing `Incompatible Packages: View` via the [command palette](https://flight-manual.atom.io/getting-started/sections/atom-basics/#command-palette). 
  
  You can also access this Panel by clicking on the tiny red bug icon at the bottom right of Atom.
  
  ![fullscreen-tiny-bug](https://user-images.githubusercontent.com/10860657/38326862-1c5b9cac-3804-11e8-9c08-7d020650288e.png)
  ![tiny-bug](https://user-images.githubusercontent.com/32625394/38327162-2bfa86a6-380d-11e8-8ff5-aab77393a834.png)
  
  In case the Atom GUI `Rebuild Packages` button doesn't work, you can try running `apm rebuild hydrogen` (to rebuild) or `apm install hydrogen` (to reinstall) in the package directory then restarting Atom to resolve.




## Setting environment variables on Windows


### Hydrogen fails to import modules:
If hydrogen works for standard libraries but you encounter `ModuleNotFoundError: No module named 'your_package'` for custom installed packages, check that the path of the kernel you are using is the one specified in the windows `PATH`. Especially when using virtual environments like `virtualenv` and `anaconda` ensure that the corresponding python executables are set in the windows path. 

To add the path, enter `where python` in the windows command line and chose the apporiate entry. Then, add it manually to the windows `PATH`, similarly as detailed below for the standard python path.


### Hydrogen does not recognize python:

On Windows if Python is not added to your environment variables, Hydrogen won't be able to locate your Python installations (`No kernel specs found`).

![Kernel specs not found](https://preview.ibb.co/jw40ta/Screenshot_40.png)

To solve this problem you need to add Python to your systems environment variables. This can be done in 2 ways:

- During Python installation
- Manually adding in the Environment variables

#### During Python installation:

While installing Python check *Add Python to environment variables*. It will do the rest of work for you!

![Python setup Wizard](https://preview.ibb.co/d8w8eF/Screenshot_48.png)


If you already have Python installed then you may not need to uninstall it just follow the steps:

- Go to the *Uninstall or Change a Program* Menu
- Select your Python version
- Click on the *Uninstall/Change* button
- Select *Modify* from the appeared menu
- Click on *Next*
- Check mark *Add python to environment variables*
- And finish the installation process

![Adding python to system environment variables](https://d2mxuefqeaa7sj.cloudfront.net/s_72AB4F9B801403E4852A7178F94F1BB891F67B88E721FB948C0DB4747940E7E2_1504306245381_Uninstall.gif)

#### Manually adding Python to Environment variables:

You can also add Python to the environment variables manually

  - In *Control Panel* search for *environment variables*
  - Click on *Edit system environment variables*
  - Click on *Environment variables*
  - From the *System variables* tab select *Path* and click on *Edit*
  - Click on *New* and add `C:\Program Files\Python36\Scripts\`
  - Click on *New* again and add `C:\Program Files\Python36\`
  - Click on *OK* to finish, now your problem is fixed!

![Adding environment Variables manually](https://media.giphy.com/media/xT9IgpHU1lZEoVxQFW/giphy.gif)


You should see something like this,

![Result](https://d2mxuefqeaa7sj.cloudfront.net/s_72AB4F9B801403E4852A7178F94F1BB891F67B88E721FB948C0DB4747940E7E2_1504306452541_test.gif)
