'use babel';

export function grammarToLanguage(grammar) {
  return (grammar) ? grammar.name.toLowerCase() : null;
}

export function editorToLanguage(editor) {
  return (editor) ? grammarToLanguage(editor.getGrammar()) : null;
}
