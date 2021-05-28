import {
  TextEditor,
  CompositeDisposable,
  Disposable,
  Point,
  Grammar,
  Dock,
} from "atom";
import React from "react";
import ReactDOM from "react-dom";
import findKey from "lodash/findKey";
import os from "os";
import path from "path";
import Config from "./config";
import store from "./store";
import type { Message } from "./hydrogen";
import type { KernelspecMetadata } from "@nteract/types";

export const INSPECTOR_URI = "atom://hydrogen/inspector";
export const WATCHES_URI = "atom://hydrogen/watch-sidebar";
export const OUTPUT_AREA_URI = "atom://hydrogen/output-area";
export const KERNEL_MONITOR_URI = "atom://hydrogen/kernel-monitor";
export const NO_EXECTIME_STRING = "Not available";
export function reactFactory(
  reactElement: React.ReactElement<React.ComponentProps<any>, any>,
  domElement: HTMLElement,
  additionalTeardown?: ((...args: Array<any>) => any) | null | undefined,
  disposer: CompositeDisposable = store.subscriptions
) {
  ReactDOM.render(reactElement, domElement);
  const disposable = new Disposable(() => {
    ReactDOM.unmountComponentAtNode(domElement);
    if (typeof additionalTeardown === "function") {
      additionalTeardown();
    }
  });
  disposer.add(disposable);
}
export function focus(item: unknown | null | undefined) {
  if (item && typeof item === "object") {
    const editorPane = atom.workspace.paneForItem(item);
    if (editorPane) {
      editorPane.activate();
    }
  }
}
export async function openOrShowDock(
  URI: string
): Promise<void | null | undefined> {
  // atom.workspace.open(URI) will activate/focus the dock by default
  // dock.toggle() or dock.show() will leave focus wherever it was
  // this function is basically workspace.open, except it
  // will not focus the newly opened pane
  let dock = atom.workspace.paneContainerForURI(URI);

  if (dock && typeof dock.show === "function") {
    // If the target item already exist, activate it and show dock
    const pane = atom.workspace.paneForURI(URI);
    if (pane) {
      pane.activateItemForURI(URI);
    }
    return (dock as Dock).show();
  }

  await atom.workspace.open(URI, {
    searchAllPanes: true,
    activatePane: false,
  });
  dock = atom.workspace.paneContainerForURI(URI);
  return dock && typeof dock.show === "function" ? (dock as Dock).show() : null;
}
export function grammarToLanguage(grammar: Grammar | null | undefined) {
  if (!grammar) {
    return null;
  }
  const grammarLanguage = grammar.name.toLowerCase();
  const mappings = Config.getJson("languageMappings");

  const kernelLanguage = findKey(
    mappings,
    (l) => l.toLowerCase() === grammarLanguage
  );

  return kernelLanguage ? kernelLanguage.toLowerCase() : grammarLanguage;
}

/**
 * Copied from
 * https://github.com/nteract/nteract/blob/master/src/notebook/epics/execute.js#L37
 * Create an object that adheres to the jupyter notebook specification.
 * http://jupyter-client.readthedocs.io/en/latest/messaging.html
 *
 * @param {Object} msg - Message that has content which can be converted to nbformat
 * @returns {Object} FormattedMsg - Message with the associated output type
 */
export function msgSpecToNotebookFormat(message: Message) {
  return Object.assign({}, message.content, {
    output_type: message.header.msg_type,
  });
}

/** A very basic converter for supporting jupyter messaging protocol v4 replies */
export function msgSpecV4toV5(message: Message) {
  switch (message.header.msg_type) {
    case "pyout":
      message.header.msg_type = "execute_result";
      break;

    case "pyerr":
      message.header.msg_type = "error";
      break;

    case "stream":
      if (!message.content.text) {
        message.content.text = message.content.data;
      }
      break;
    default: {
      // no conversion needed
    }
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
  "source.pweave.restructuredtext",
  "source.dyndoc.md.stata",
  "source.dyndoc.latex.stata",
]);
export function isMultilanguageGrammar(grammar: Grammar) {
  return markupGrammars.has(grammar.scopeName);
}
export const isUnsavedFilePath = (filePath: string): boolean => {
  return filePath.match(/Unsaved\sEditor\s\d+/) ? true : false;
};
export function kernelSpecProvidesGrammar(
  kernelSpec: KernelspecMetadata,
  grammar: Grammar | null | undefined
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
  editor: TextEditor,
  position: Point
): string | null | undefined {
  const scopes = editor
    .scopeDescriptorForBufferPosition(position)
    .getScopesArray();
  return scopes.find((s) => s.indexOf("source.embedded.") === 0);
}
export function getEditorDirectory(editor: TextEditor | null | undefined) {
  if (!editor) {
    return os.homedir();
  }
  const editorPath = editor.getPath();
  return editorPath ? path.dirname(editorPath) : os.homedir();
}
export function log(...message: Array<any>) {
  if (atom.config.get("Hydrogen.debug")) {
    console.log("Hydrogen:", ...message);
  }
}
export function hotReloadPackage() {
  const packName = "Hydrogen";
  const packPath = atom.packages.resolvePackagePath(packName);
  if (!packPath) {
    return;
  }
  const packPathPrefix = packPath + path.sep;
  const zeromqPathPrefix =
    path.join(packPath, "node_modules", "zeromq") + path.sep;
  log(`deactivating ${packName}`);
  atom.packages.deactivatePackage(packName);
  atom.packages.unloadPackage(packName);

  // Delete require cache to re-require on activation.
  // But except zeromq native module which is not re-requireable.
  const packageLibsExceptZeromq = (filePath) =>
    filePath.startsWith(packPathPrefix) &&
    !filePath.startsWith(zeromqPathPrefix);

  Object.keys(require.cache)
    .filter(packageLibsExceptZeromq)
    .forEach((filePath) => delete require.cache[filePath]);
  atom.packages.loadPackage(packName);
  atom.packages.activatePackage(packName);
  log(`activated ${packName}`);
}
export function rowRangeForCodeFoldAtBufferRow(
  editor: TextEditor,
  row: number
) {
  if (parseFloat(atom.getVersion()) < 1.22) {
    return editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
  } else {
    // $FlowFixMe
    const range = editor.tokenizedBuffer.getFoldableRangeContainingPoint(
      new Point(row, Infinity),
      editor.getTabLength()
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
// TODO: use npm package -- maybe it offers more robust implementation

/**
 * Given a message whose type if `execute_reply`, calculates exection time and
 * returns its string representation.
 *
 * @param {Message} message - A Message object whose type is `execute_reply`
 * @returns {String} - A string representation of the execution time. Returns
 *   `NO_EXECTIME_STRING` if execution time is unavailable.
 */
export function executionTime(message: Message): string {
  if (!message.parent_header.date || !message.header.date) {
    return NO_EXECTIME_STRING;
  }

  const start = Date.parse(message.parent_header.date);
  const end = Date.parse(message.header.date);
  const time = end - start; // milliseconds

  let sec = time / 1000; // seconds

  if (sec < 60) {
    return `${sec.toFixed(3)} sec`;
  }

  let min = (sec - (sec % 60)) / 60;
  sec = Math.round(sec % 60);

  if (min < 60) {
    return `${min} min ${sec} sec`;
  }

  const hour = (min - (min % 60)) / 60;
  min %= 60;
  return `${hour} h ${min} m ${sec} s`;
}
export function js_idx_to_char_idx(js_idx: number, text: string | null) {
  if (text === null) {
    return -1;
  }
  let char_idx = js_idx;

  for (let i = 0; i < text.length && i < js_idx; i++) {
    const char_code = text.charCodeAt(i);

    // check for the first half of a surrogate pair
    if (char_code >= 0xd800 && char_code < 0xdc00) {
      char_idx -= 1;
    }
  }

  return char_idx;
}
export function char_idx_to_js_idx(char_idx: number, text: string | null) {
  if (text === null) {
    return -1;
  }
  let js_idx = char_idx;

  for (let i = 0; i < text.length && i < js_idx; i++) {
    const char_code = text.charCodeAt(i);

    // check for the first half of a surrogate pair
    if (char_code >= 0xd800 && char_code < 0xdc00) {
      js_idx += 1;
    }
  }

  return js_idx;
}

/**
 * Sets the `previouslyFocusedElement` property of the given object to
 * activeElement if it is an HTMLElement
 */
export function setPreviouslyFocusedElement(obj: {
  previouslyFocusedElement: HTMLElement | null | undefined;
}) {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    obj.previouslyFocusedElement = activeElement;
  }
}

/** Make the properties of a type Writable */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/** Make the properties of aexport type Writable recursively */
export type DeepWriteable<T> = {
  -readonly [P in keyof T]: DeepWriteable<T[P]>;
};
