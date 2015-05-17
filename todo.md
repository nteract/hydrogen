# To do

## Current

- [ ] show a message if trying to run code in unsupported language
- [ ] add dependencies / describe them in readme:
    - [ ] brew: `pkg-config`, `zeromq`
    - [x] node: `lodash`, `zmq`, `atom-space-pen-views`

## Soon

- [ ] expandable/shrinkable multiline
    - maybe open the results in a new editor?
- [ ] clipboard button on multiline bubbles


## Someday

- [ ] support interactive HTML widgets like Gadfly
    - or anything else that uses scripts (itorch.Plot)
- [ ] something with the introspection API
- [ ] make bubbles not go over tabs


## Done
- [x] start kernels based on file type
- [x] find and execute the current/preceding block
- [x] insert placeholder UI on run command
    - [x] add ID to execute request metadata to identify corresponding UI
    - [x] update UI when messages received with that ID
- [x] add a setup function with a callback to building kernels/configs
- [x] find a free port automatically
- [x] error styling
- [x] image support
- [x] figure out how to completely destroy views
- [x] fix clicking through relative-positioned bubbles
- [x] support more kinds of images
- [x] figure out what to do with stderr
    - not really "solved", but IPython just swallows it
- [x] status spinner and checkmark (in status bar?)
- [x] shut down kernel and ports
- [x] listen for active editor change and swap status bar component
- [x] close button on larger results
- [x] ensure support for other languages
- [x] UI in status bar to shut down/interrupt/restart
- [x] command to clear all the bubbles
- [x] make restarting the kernel clear all the bubbles
- [x] destroy existing bubbles on line before adding a new one
- [x] remove all the passing around of editors in `atom-repl`, use `@editor`
- [x] test if pane is an editor in `updateCurrentEditor`
- [x] python support
- [x] make `kernel-configs` if it doesn't exist
- [x] make close button colors work for dark-on-light themes
- [x] autocomplete+ provider
