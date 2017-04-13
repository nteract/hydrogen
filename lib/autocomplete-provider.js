/* @flow */

import _ from "lodash";
import { log } from "./utils";
import store from "./store";

type Autocomplete = {
  editor: atom$TextEditor,
  bufferPosition: atom$Point,
  prefix: string
};

const iconHTML = `<img src='${__dirname}/../static/logo.svg' style='width: 100%;'>`;

const regexes = {
  // pretty dodgy, adapted from http://stackoverflow.com/a/8396658
  r: /([^\d\W]|[.])[\w.$]*$/,

  // adapted from http://stackoverflow.com/q/5474008
  python: /([^\d\W]|[\u00A0-\uFFFF])[\w.\u00A0-\uFFFF]*$/,

  // adapted from http://php.net/manual/en/language.variables.basics.php
  php: /[$a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/
};

export default function() {
  const autocompleteProvider = {
    selector: ".source",
    disableForSelector: ".comment, .string",

    // `excludeLowerPriority: false` won't suppress providers with lower
    // priority.
    // The default provider has a priority of 0.
    inclusionPriority: 1,
    excludeLowerPriority: false,

    // Required: Return a promise, an array of suggestions, or null.
    getSuggestions({ editor, bufferPosition, prefix }: Autocomplete) {
      const kernel = store.kernel;

      if (!kernel || kernel.executionState !== "idle") {
        return null;
      }

      const line = editor.getTextInBufferRange([
        [bufferPosition.row, 0],
        bufferPosition
      ]);

      const regex = regexes[kernel.language];
      if (regex) {
        prefix = _.head(line.match(regex)) || "";
      } else {
        prefix = line;
      }

      // return if cursor is at whitespace
      if (prefix.trimRight().length < prefix.length) {
        return null;
      }

      if (prefix.trim().length < 3) {
        return null;
      }

      log("autocompleteProvider: request:", line, bufferPosition, prefix);

      return new Promise(resolve =>
        kernel.complete(prefix, ({ matches, cursor_start, cursor_end }) => {
          const replacementPrefix = prefix.slice(cursor_start, cursor_end);

          matches = _.map(matches, match => ({
            text: match,
            replacementPrefix,
            iconHTML
          }));

          return resolve(matches);
        })
      );
    }
  };

  return autocompleteProvider;
}
