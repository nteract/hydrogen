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

### Debian 8 and Ubuntu 16.04 LTS

Unfortunately, the versions of IPython provided in Debian's and Ubuntu's
repositories are rather old and Hydrogen is unable to detect the kernel specs
installed in your machine. To workaround this issue, Hydrogen provides the
setting `KernelSpec`, where the user can declare the kernel specs manually.
Find the `KernelSpec` setting in the Atom GUI by going to the Settings pane,
click Packages, search for Hydrogen, and click the Hydrogen Settings button.

Below is an example `KernelSpec` for IPython 2 and 3:

```json
{
  "kernelspecs": {
    "python2": {
      "spec": {
        "display_name": "Python 2",
        "language": "python",
        "argv": ["python2.7", "-m", "ipykernel", "-f", "{connection_file}"],
        "env": {}
      }
    },
    "python3": {
      "spec": {
        "display_name": "Python 3",
        "language": "python",
        "argv": ["python3.4", "-m", "ipykernel", "-f", "{connection_file}"],
        "env": {}
      }
    }
  }
}
```

### Installation fails on Linux 32-bit

At the moment we don't ship prebuilts for 32-bit Linux. Hence you'll need some additional toolling to build from source:

- `python` (`v2.7` recommended, `v3.x.x` is not supported for building Hydrogen)
- `make`
- A proper C/C++ compiler toolchain, like [GCC](https://gcc.gnu.org/)

Use your distribution's package manager to install.

If your default `python` is 3.x, you need to run instead `PYTHON=python2.7 apm install hydrogen` or change the default version for `apm` with `apm config set python $(which python2.7)` beforehand. You can still use 3.x versions of Python in Hydrogen, but it will only build with 2.x due to a [longstanding issue with `gyp`](https://bugs.chromium.org/p/gyp/issues/detail?id=36).

### No kernel for language X found, but I have a kernel for that language.

Currently, a recent version of Jupyter is required for Hydrogen to detect the
available kernels automatically. Users can set kernels manually using the
Hydrogen settings. See
[this section](https://github.com/nteract/hydrogen#debian-8-and-ubuntu-1604-lts)
in the [README](README.md) for more details.

Atom won't pick up kernels inside a virtualenv unless Atom is launched as `atom .` within the virtualenv. The alternative is to [create a kernel specifically for a virtualenv](http://www.alfredo.motta.name/create-isolated-jupyter-ipython-kernels-with-pyenv-and-virtualenv/).


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

# Setting environment variables on Windows

## problem:

In windows if python is not added to environment variables, you will get this `No kernel specs found` problem.

![Kernel specs not found](https://preview.ibb.co/jw40ta/Screenshot_40.png)

## Solution:

To solve this problem you just need to add python to your systems environment variables, and this can be done in 2 ways :

- During python installation
- Manually adding in the Environment variables
# By python installation:

While installing python just check mark the Add python to environment variables, It will do the rest of work for you!

![python setup Wizard](https://preview.ibb.co/d8w8eF/Screenshot_48.png)


If you already have python installed then you may not need to uninstall it just follow the steps:

- Go to Uninstall or Change a Program Menu
- Select your python version
- Click on the Uninstall/Change button
- Select Modify from the appeared menu
- Click on Next
- Check mark Add python to environment variables
- And finish the installation Process

![Adding python to system environment variables](https://d2mxuefqeaa7sj.cloudfront.net/s_72AB4F9B801403E4852A7178F94F1BB891F67B88E721FB948C0DB4747940E7E2_1504306245381_Uninstall.gif)

# Manually adding Python to Environment variables:

You can also add python to the environment variables manually

  - In Control Panel search for environment variables
  - Click on Edit system environment variables
  - Click on Environment variables...
  - From system, variables tab select path and click on Edit...
  - Click on New and add `C:\Program Files\Python36\Scripts\`
  - Click on New again and add `C:\Program Files\Python36\`
  - click on OK to finish, now your problem is fixed!

![Adding environment Variables manually](https://media.giphy.com/media/xT9IgpHU1lZEoVxQFW/giphy.gif)


You should see something like this,

![Result](https://d2mxuefqeaa7sj.cloudfront.net/s_72AB4F9B801403E4852A7178F94F1BB891F67B88E721FB948C0DB4747940E7E2_1504306452541_test.gif)
