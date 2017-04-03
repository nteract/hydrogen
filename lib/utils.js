/* @flow */

import { Disposable } from "atom";
import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import store from "./store";

export function reactFactory(
  reactElement: React$Element<any>,
  domElement: HTMLElement,
  additionalTeardown: Function = () => {},
  disposer: atom$CompositeDisposable = store.subscriptions
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
  "source.gfm",
  "source.asciidoc",
  "text.restructuredtext",
  "text.tex.latex.knitr",
  "text.md"
]);

export function isMultilanguageGrammar(grammar: atom$Grammar) {
  return markupGrammars.has(grammar.scopeName);
}

export function getEmbeddedScope(
  editor: atom$TextEditor,
  position: atom$Point
): ?string {
  const scopes = editor
    .scopeDescriptorForBufferPosition(position)
    .getScopesArray();
  return _.find(scopes, s => s.indexOf("source.embedded.") === 0);
}

/* eslint-disable no-console */
export function log(...message: Array<any>) {
  if (atom.inDevMode() || atom.config.get("Hydrogen.debug")) {
    console.debug("Hydrogen:", ...message);
  }
}

export function renderDevTools() {
  if (atom.inDevMode() || atom.config.get("Hydrogen.debug")) {
    try {
      const devTools = require("mobx-react-devtools");
      const div = document.createElement("div");
      document.getElementsByTagName("body")[0].appendChild(div);
      devTools.setLogEnabled(true);
      ReactDOM.render(<devTools.default noPanel />, div);
    } catch (e) {
      log("Could not enable dev tools", e);
    }
  }
}
