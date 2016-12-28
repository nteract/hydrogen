'use babel';

export default function(editor) {
  const markupGrammars = new Set([ 'source.asciidoc', 'source.gfm' ]);
  if (typeof editor === 'undefined') {
    editor = atom.workspace.getActiveTextEditor();
  }
  const topLevelGrammar = editor.getGrammar();
  if (markupGrammars.has(topLevelGrammar.scopeName)) {
    const allScopes = editor.scopeDescriptorForBufferPosition(
        editor.getCursorBufferPosition());
    const scopes =
        allScopes.scopes.filter(s => s.indexOf('source.embedded.') === 0);

    if (scopes.length === 0) {
      return topLevelGrammar;
    }
    const scope = scopes[0].replace('.embedded', '');

    return atom.grammars.grammarForScopeName(scope);
  }

  return topLevelGrammar;
}
