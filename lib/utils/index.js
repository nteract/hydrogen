'use babel';

export function grammarToLanguage(grammar) {
  return (grammar) ? grammar.name.toLowerCase() : null;
}

const markupGrammars = new Set(['source.asciidoc', 'source.gfm']);

export function isMultilanguageGrammar(grammar) {
  return markupGrammars.has(grammar.scopeName);
}
