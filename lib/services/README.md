<!-- Start lib\services\index.js -->

# Hydrogen <img src="https://cdn.rawgit.com/nteract/hydrogen/17eda245/static/animate-logo.svg" alt="hydrogen animated logo" height="50px" align="right" />

## Services API

The [Atom Services API](https://flight-manual.atom.io/behind-atom/sections/interacting-with-other-packages-via-services/) is a way for Atom packages to interact with each other. Hydrogen both provides and consumes _services_ to add additional features to itself. `./lib/services` is our container folder for anything that functions through the [Atom Services API](https://flight-manual.atom.io/behind-atom/sections/interacting-with-other-packages-via-services/). If the service is considered a _provided service_, then it is located inside of `./lib/services/provided`. If the service, however, is considered a _consumed service_, then it is located inside of `./lib/services/consumed`.

### Consumed Services

- [Status Bar Tile: `status-bar`](./consumed/status-bar/status-bar.js)
  - This allows us to add kernel controls to the status bar.
- [Autocomplete For Any Editor: `autocomplete-plus`](./consumed/autocomplete.js)
  - This allows us to add autocomplete to things like watches.

### Provided Services

- [Autocomplete Results: `autocomplete-plus`](./provided/autocomplete.js)
  - This allows us to provide autocomplete results that are similar to jupyter's tab completion.

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/nteract/hydrogen/blob/master/LICENSE.md) file for details.

<!-- End lib\services\index.js -->
