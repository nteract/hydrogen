/* @flow */

import { Disposable, Point } from "atom";
import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import os from "os";
import path from "path";

import Config from "./config";
import store from "./store";

export const INSPECTOR_URI = "atom://hydrogen/inspector";
export const WATCHES_URI = "atom://hydrogen/watch-sidebar";
export const OUTPUT_AREA_URI = "atom://hydrogen/output-area";
export const KERNEL_MONITOR_URI = "atom://hydrogen/kernel-monitor";

export function reactFactory(
  reactElement: React$Element<any>,
  domElement: HTMLElement,
  additionalTeardown: ?Function,
  disposer: atom$CompositeDisposable = store.subscriptions
) {
  ReactDOM.render(reactElement, domElement);

  const disposable = new Disposable(() => {
    ReactDOM.unmountComponentAtNode(domElement);
    if (typeof additionalTeardown === "function") additionalTeardown();
  });

  disposer.add(disposable);
}

export function focus(item: ?mixed) {
  if (item) {
    const editorPane = atom.workspace.paneForItem(item);
    if (editorPane) editorPane.activate();
  }
}

export async function openOrShowDock(URI: string): Promise<?void> {
  // atom.workspace.open(URI) will activate/focus the dock by default
  // dock.toggle() or dock.show() will leave focus wherever it was

  // this function is basically workspace.open, except it
  // will not focus the newly opened pane
  let dock = atom.workspace.paneContainerForURI(URI);
  if (dock) return dock.show();

  await atom.workspace.open(URI, {
    searchAllPanes: true,
    activatePane: false
  });
  dock = atom.workspace.paneContainerForURI(URI);
  return dock ? dock.show() : null;
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

/**
 * A very basic converter for supporting jupyter messaging protocol v4 replies
 */
export function msgSpecV4toV5(message: Message) {
  switch (message.header.msg_type) {
    case "pyout":
      message.header.msg_type = "execute_result";
      break;
    case "pyerr":
      message.header.msg_type = "error";
      break;
    case "stream":
      if (!message.content.text) message.content.text = message.content.data;
      break;
  }
  return message;
}

const markupGrammars = new Set([
  "source.gfm",
  "source.asciidoc",
  "text.restructuredtext",
  "text.tex.latex.knitr",
  "text.md",
  "source.weave.noweb",
  "source.weave.md",
  "source.weave.latex",
  "source.weave.restructuredtext",
  "source.pweave.noweb",
  "source.pweave.md",
  "source.pweave.latex",
  "source.pweave.restructuredtext"
]);

export function isMultilanguageGrammar(grammar: atom$Grammar) {
  return markupGrammars.has(grammar.scopeName);
}

export function kernelSpecProvidesGrammar(
  kernelSpec: Kernelspec,
  grammar: ?atom$Grammar
) {
  if (!grammar || !grammar.name || !kernelSpec || !kernelSpec.language) {
    return false;
  }
  const grammarLanguage = grammar.name.toLowerCase();
  const kernelLanguage = kernelSpec.language.toLowerCase();
  if (kernelLanguage === grammarLanguage) {
    return true;
  }

  const mappedLanguage = Config.getJson("languageMappings")[kernelLanguage];
  if (!mappedLanguage) {
    return false;
  }

  return mappedLanguage.toLowerCase() === grammarLanguage;
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

export function getEditorDirectory(editor: ?atom$TextEditor) {
  if (!editor) return os.homedir();
  const editorPath = editor.getPath();
  return editorPath ? path.dirname(editorPath) : os.homedir();
}

export function log(...message: Array<any>) {
  if (atom.config.get("Hydrogen.debug")) {
    console.debug("Hydrogen:", ...message);
  }
}

export function renderDevTools(enableLogging: boolean) {
  if (!atom.devMode) return;
  try {
    const devTools = require("mobx-react-devtools");
    const div = document.createElement("div");
    document.getElementsByTagName("body")[0].appendChild(div);
    devTools.setLogEnabled(enableLogging);
    ReactDOM.render(<devTools.default noPanel />, div);
  } catch (e) {
    log("Could not enable dev tools", e);
  }
}

export function hotReloadPackage() {
  const packName = "Hydrogen";
  const packPath = atom.packages.resolvePackagePath(packName);
  if (!packPath) return;
  const packPathPrefix = packPath + path.sep;
  const zeromqPathPrefix =
    path.join(packPath, "node_modules", "zeromq") + path.sep;

  console.info(`deactivating ${packName}`);
  atom.packages.deactivatePackage(packName);
  atom.packages.unloadPackage(packName);

  // Delete require cache to re-require on activation.
  // But except zeromq native module which is not re-requireable.
  const packageLibsExceptZeromq = filePath =>
    filePath.startsWith(packPathPrefix) &&
    !filePath.startsWith(zeromqPathPrefix);

  Object.keys(require.cache)
    .filter(packageLibsExceptZeromq)
    .forEach(filePath => delete require.cache[filePath]);

  atom.packages.loadPackage(packName);
  atom.packages.activatePackage(packName);
  console.info(`activated ${packName}`);
}

export function rowRangeForCodeFoldAtBufferRow(
  editor: atom$TextEditor,
  row: number
) {
  if (parseFloat(atom.getVersion()) < 1.22) {
    return editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
  } else {
    // $FlowFixMe
    const range = editor.tokenizedBuffer.getFoldableRangeContainingPoint(
      new Point(row, Infinity)
    );

    return range ? [range.start.row, range.end.row] : null;
  }
}

export const EmptyMessage = () => {
  return (
    <ul className="background-message centered">
      <li>No output to display</li>
    </ul>
  );
};
