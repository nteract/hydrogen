### Hydrogen doesn't show my results.

There are a number of possible causes and solutions:

- If the result bubble only shows check marks (see issues
  [#61](https://github.com/nteract/hydrogen/issues/61),
  [#68](https://github.com/nteract/hydrogen/issues/68),
  [#73](https://github.com/nteract/hydrogen/issues/73),
  [#88](https://github.com/nteract/hydrogen/issues/88),
  [#298](https://github.com/nteract/hydrogen/issues/298)):

  - caused by missing `libzmq3-dev` and solved by running
    `sudo apt-get install libzmq3-dev` (see [this
    comment](https://github.com/nteract/hydrogen/issues/298#issuecomment-226405723));

  - solved by upgrading the `jupyter` version (see [this
    comment](https://github.com/nteract/hydrogen/issues/88#issuecomment-136761769) );

- If the spinner in the result bubble never stops (see issue
  [#53](https://github.com/nteract/hydrogen/issues/53)): This is issue hasn't
  been seen recently. Please, post in issue
  [#53](https://github.com/nteract/hydrogen/issues/53) the details of your
  installation.

### No kernel for language X found, but I have a kernel for that language.

Currently, a recent version of Jupyter is required for Hydrogen to detect the
available kernels automatically. Users can set kernels manually using the
Hydrogen settings. See
[this section](https://github.com/nteract/hydrogen#debian-8-and-ubuntu-1604-lts)
in the [README](README.md) for more details.
