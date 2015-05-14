# To do

## Current

- [ ] python support
- [ ] make bubbles not go over tabs
- [ ] show a message if trying to run code in unsupported language


## Soon

- [ ] expandable/shrinkable multiline
    - maybe open the results in a new editor?
- [ ] clipboard button on multiline bubbles


## Someday

- [ ] support interactive HTML widgets like Gadfly
    - or anything else that uses scripts (itorch.Plot)
- [ ] autocomplete+ provider



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
