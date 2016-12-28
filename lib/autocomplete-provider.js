'use babel';

import _ from 'lodash';

import getRobustGrammar from './robust-grammar';

const iconHTML = `<img src='${__dirname}/../static/logo.svg' style='width: 100%;'>`;

const regexes = {
  // pretty dodgy, adapted from http://stackoverflow.com/a/8396658
  r: /([^\d\W]|[.])[\w.$]*$/,

  // adapted from http://stackoverflow.com/q/5474008
  python: /([^\d\W]|[\u00A0-\uFFFF])[\w.\u00A0-\uFFFF]*$/,

  // adapted from http://php.net/manual/en/language.variables.basics.php
  php: /[$a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/,
};


export default function (kernelManager) {
  const autocompleteProvider = {
    selector: '.source',
    disableForSelector: '.comment, .string',

    // `excludeLowerPriority: false` won't suppress providers with lower
    // priority.
    // The default provider has a priority of 0.
    inclusionPriority: 1,
    excludeLowerPriority: false,

    // Required: Return a promise, an array of suggestions, or null.
    getSuggestions({ editor, bufferPosition, prefix }) {
      const grammar = getRobustGrammar(editor);
      const language = kernelManager.getLanguageFor(grammar);
      const kernel = kernelManager.getRunningKernelFor(language);
      if (!kernel) {
        return null;
      }

      const line = editor.getTextInRange([
        [bufferPosition.row, 0],
        bufferPosition,
      ]);

      const regex = regexes[language];
      if (regex) {
        prefix = _.head(line.match(regex)) || '';
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

      console.log('autocompleteProvider: request:',
        line, bufferPosition, prefix);

      return new Promise(resolve =>
        kernel.complete(prefix, ({ matches, cursor_start, cursor_end }) => {
          const replacementPrefix = prefix.slice(cursor_start, cursor_end);

          matches = _.map(matches, match =>
            ({
              text: match,
              replacementPrefix,
              iconHTML,
            }),
          );

          return resolve(matches);
        }),
      );
    },
  };

  return autocompleteProvider;
}
