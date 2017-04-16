/* @flow */

import { Disposable } from "atom";
import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import os from "os";
import path from "path";

import Config from "./config";
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
  if (!grammar) return null;
  const grammarLanguage = grammar.name.toLowerCase();

  const mappings = Config.getJson("languageMappings");
  const kernelLanguage = _.findKey(
    mappings,
    l => l.toLowerCase() === grammarLanguage
  );

  return kernelLanguage ? kernelLanguage.toLowerCase() : grammarLanguage;
}

/**
 * Copied from https://github.com/nteract/nteract/blob/master/src/notebook/epics/execute.js#L37
 * Create an object that adheres to the jupyter notebook specification.
 * http://jupyter-client.readthedocs.io/en/latest/messaging.html
 *
 * @param {Object} msg - Message that has content which can be converted to nbformat
 * @return {Object} formattedMsg  - Message with the associated output type
 */
export function msgSpecToNotebookFormat(message: Message) {
  return Object.assign({}, message.content, {
    output_type: message.header.msg_type
  });
}

const markupGrammars = new Set([
  "source.gfm",
  "source.asciidoc",
  "text.restructuredtext",
  "text.tex.latex.knitr",
  "text.md",
  "source.weave.noweb",
  "source.weave.md",
  "source.pweave.noweb",
  "source.pweave.md"
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

export function getEditorDirectory(editor: atom$TextEditor) {
  const editorPath = editor.getPath();
  return editorPath ? path.dirname(editorPath) : os.homedir();
}
/* eslint-disable no-console */
export function log(...message: Array<any>) {
  if (atom.inDevMode() || atom.config.get("Hydrogen.debug")) {
    console.trace("Hydrogen:", ...message);
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
