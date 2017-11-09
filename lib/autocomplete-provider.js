/* @flow */

import _ from "lodash";
import { log } from "./utils";
import store from "./store";

type Autocomplete = {
  editor: atom$TextEditor,
  bufferPosition: atom$Point,
  prefix: string
};

type CompleteReply = {
  matches: Array<string>,
  cursor_start: number,
  cursor_end: number,
  metadata?: {
    _jupyter_types_experimental?: Array<{
      start?: number,
      end?: number,
      text?: string,
      type?: string
    }>
  }
};

const iconHTML = `<img src='${
  __dirname
}/../static/logo.svg' style='width: 100%;'>`;

const regexes = {
  // pretty dodgy, adapted from http://stackoverflow.com/a/8396658
  r: /([^\d\W]|[.])[\w.$]*$/,

  // adapted from http://stackoverflow.com/q/5474008
  python: /([^\d\W]|[\u00A0-\uFFFF])[\w.\u00A0-\uFFFF]*$/,

  // adapted from http://php.net/manual/en/language.variables.basics.php
  php: /[$a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/
};

function parseCompletions(results: CompleteReply, prefix: string) {
  const { matches, cursor_start, cursor_end, metadata } = results;

  if (metadata && metadata._jupyter_types_experimental) {
    const comps = metadata._jupyter_types_experimental;
    if (
      comps.length > 0 &&
      comps[0].text != null &&
      comps[0].start != null &&
      comps[0].end != null
    ) {
      return _.map(comps, match => ({
        text: match.text,
        replacementPrefix: prefix.slice(match.start, match.end),
        type: match.type,
        iconHTML:
          !match.type || match.type === "<unknown>" ? iconHTML : undefined
      }));
    }
  }

  const replacementPrefix = prefix.slice(cursor_start, cursor_end);

  return _.map(matches, match => ({
    text: match,
    replacementPrefix,
    iconHTML
  }));
}

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
    getSuggestions({
      editor,
      bufferPosition,
      prefix
    }: Autocomplete): Promise<Array<Object>> | null {
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

      let minimumWordLength = atom.config.get(
        "autocomplete-plus.minimumWordLength"
      );
      if (typeof minimumWordLength !== "number") {
        minimumWordLength = 3;
      }

      if (prefix.trim().length < minimumWordLength) {
        return null;
      }

      log("autocompleteProvider: request:", line, bufferPosition, prefix);

      return new Promise(resolve =>
        kernel.complete(prefix, (results: CompleteReply) => {
          return resolve(parseCompletions(results, prefix));
        })
      );
    }
  };

  return autocompleteProvider;
}
