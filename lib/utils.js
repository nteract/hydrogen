'use babel';

import { Disposable } from 'atom';
import ReactDOM from 'react-dom';

import defaultDisposer from './store/disposer';

export function reactFactory(reactElement, domElement, additionalTeardown = () => {},
  disposer = defaultDisposer) {
  ReactDOM.render(reactElement, domElement);

  const disposable = new Disposable(() => {
    ReactDOM.unmountComponentAtNode(domElement);
    additionalTeardown();
  });

  disposer.add(disposable);
}

export function grammarToLanguage(grammar) {
  return (grammar) ? grammar.name.toLowerCase() : null;
}

const markupGrammars = new Set(['source.gfm']);

export function isMultilanguageGrammar(grammar) {
  return markupGrammars.has(grammar.scopeName);
}

/* eslint-disable no-console */
export function log(...message) {
  if (atom.inDevMode() || atom.config.get('Hydrogen.debug')) {
    console.debug('Hydrogen:', ...message);
  }
}
