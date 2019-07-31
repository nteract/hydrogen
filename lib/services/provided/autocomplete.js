/* @flow */

import _ from "lodash";
import { ansiToText } from "anser";

import { log, char_idx_to_js_idx } from "../../utils";
import type { Store } from "../../store";

type CompleteReply = {
  matches: Array<string>,
  cursor_start: number,
  cursor_end: number,
  metadata?: {
    _jupyter_types_experimental?: Array<{
      start?: number,
      end?: number,
      text: string,
      type?: string
    }>
  }
};

const iconHTML = `<img src='${__dirname}/../../../static/logo.svg' style='width: 100%;'>`;

const regexes = {
  // pretty dodgy, adapted from http://stackoverflow.com/a/8396658
  r: /([^\d\W]|[.])[\w.$]*$/,

  // adapted from http://stackoverflow.com/q/5474008
  python: /([^\d\W]|[\u00A0-\uFFFF])[\w.\u00A0-\uFFFF]*$/,

  // adapted from http://php.net/manual/en/language.variables.basics.php
  php: /[$a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/
};

function parseCompletions(results: CompleteReply, prefix: string) {
  const { matches, metadata } = results;
  let { cursor_start, cursor_end } = results;
  cursor_start = char_idx_to_js_idx(cursor_start, prefix);
  cursor_end = char_idx_to_js_idx(cursor_end, prefix);

  if (metadata && metadata._jupyter_types_experimental) {
    const comps = metadata._jupyter_types_experimental;
    if (comps.length > 0 && comps[0].text) {
      return _.map(comps, match => {
        const text = match.text;
        const replacementPrefix =
          match.start && match.end
            ? prefix.slice(match.start, match.end)
            : prefix.slice(cursor_start, cursor_end);
        const replacedText =
          (match.start && match.end
            ? prefix.slice(0, match.start)
            : prefix.slice(0, cursor_start)) + text;
        const type = match.type;
        return {
          text,
          replacementPrefix,
          replacedText,
          iconHTML: !type || type === "<unknown>" ? iconHTML : undefined,
          type
        };
      });
    }
  }

  const replacementPrefix = prefix.slice(cursor_start, cursor_end);

  return _.map(matches, match => {
    const text = match;
    const replacedText = prefix.slice(0, cursor_start) + text;
    return {
      text,
      replacementPrefix,
      replacedText,
      iconHTML
    };
  });
}

export function provideAutocompleteResults(
  store: Store
): atom$AutocompleteProvider {
  const autocompleteProvider = {
    selector: ".source",
    disableForSelector: ".comment",

    // The default provider has an inclusion priority of 0.
    inclusionPriority: 1,

    // The default provider has a suggestion priority of 1.
    get suggestionPriority() {
      return atom.config.get("Hydrogen.autocompleteSuggestionPriority");
    },

    // It won't suppress providers with lower priority.
    excludeLowerPriority: false,

    // Required: Return a promise, an array of suggestions, or null.
    getSuggestions({ editor, bufferPosition, prefix }) {
      if (!atom.config.get("Hydrogen.autocomplete")) return null;

      const kernel = store.kernel;
      if (!kernel || kernel.executionState !== "idle") return null;

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
      if (prefix.trimRight().length < prefix.length) return null;

      let minimumWordLength = atom.config.get(
        "autocomplete-plus.minimumWordLength"
      );
      if (typeof minimumWordLength !== "number") {
        minimumWordLength = 3;
      }

      if (prefix.trim().length < minimumWordLength) return null;

      log("autocompleteProvider: request:", line, bufferPosition, prefix);

      return new Promise(resolve =>
        kernel.complete(prefix, results => {
          return resolve(parseCompletions(results, prefix));
        })
      );
    },

    getSuggestionDetailsOnSelect({
      text,
      replacementPrefix,
      replacedText,
      iconHTML,
      type
    }) {
      if (!atom.config.get("Hydrogen.showInspectorResultInAutocomplete"))
        return null;

      const kernel = store.kernel;
      if (!kernel || kernel.executionState !== "idle") return null;

      return new Promise(resolve => {
        kernel.inspect(replacedText, replacedText.length, ({ data, found }) => {
          if (!found || !data["text/plain"]) resolve(null);
          resolve({
            text,
            replacementPrefix,
            replacedText,
            iconHTML,
            type,
            description: ansiToText(data["text/plain"])
          });
        });
      });
    }
  };

  return autocompleteProvider;
}
