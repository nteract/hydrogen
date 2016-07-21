### I'm using Anaconda Python and Hydrogen doesn't show my results.

This may be a mismatch between Anaconda's `libzmq` and the system one. See [@ChrisIS' excellent comment](https://github.com/willwhitney/hydrogen/issues/73#issuecomment-120300995) for more information and a couple of possible solutions.

### No kernel for language X found, but I have a kernel for that language.

Hydrogen uses the grammar name to find the correct kernel. Some grammars (e.g. "Python Django" or "shell script") have names that don't properly correspond to their kernel. Here's an example of what this looks like: https://github.com/willwhitney/hydrogen/issues/151

To tell Hydrogen what kernel to use for a given grammar name, you can define a mapping in the Hydrogen package settings.
