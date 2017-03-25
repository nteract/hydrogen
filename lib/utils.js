/* @flow */

import { Disposable } from 'atom';
import ReactDOM from 'react-dom';

import store from './store';

export function reactFactory(
  reactElement: React$Element<any>,
  domElement: HTMLElement,
  additionalTeardown: Function = () => {},
  disposer: atom$CompositeDisposable = store.subscriptions,
) {
  ReactDOM.render(reactElement, domElement);

  const disposable = new Disposable(() => {
    ReactDOM.unmountComponentAtNode(domElement);
    additionalTeardown();
  });

  disposer.add(disposable);
}

export function grammarToLanguage(grammar: ?atom$Grammar) {
  return grammar ? grammar.name.toLowerCase() : null;
}

const markupGrammars = new Set([
  'source.gfm',
  'source.asciidoc',
  'text.restructuredtext',
  'text.tex.latex.knitr',
  'text.md',
]);

export function isMultilanguageGrammar(grammar: atom$Grammar) {
  return markupGrammars.has(grammar.scopeName);
}

/* eslint-disable no-console */
export function log(...message: Array<any>) {
  if (atom.inDevMode() || atom.config.get('Hydrogen.debug')) {
    console.debug('Hydrogen:', ...message);
  }
}
