/* @flow */

import { Range, Point } from "atom";
import React from "react";
import { RichMedia, Media } from "@nteract/outputs";

import { Markdown } from "./../../../components/result-view/markdown";
import { getRow } from "./../../../code-manager";
import store from "./../../../store";
import { js_idx_to_char_idx } from "./../../../utils";

class DatatipProvider {
  providerName = "Hydrogen";
  priority = 1;

  async datatip(
    editor: atom$TextEditor,
    bufferPosition: atom$Point,
    mouseEvent: MouseEvent
  ) {
    const kernel = store.kernel;

    // If there is no running kernel for this editor, do nothing
    if (!kernel) return null;

    // If the scope at `bufferPosition` is not valid code scope, do nothing
    const scopes = editor
      .scopeDescriptorForBufferPosition(bufferPosition)
      .getScopesArray();
    const nonCodeScope = scopes.find(scope => {
      return scope.search("comment") > -1 || scope.search("string") > -1;
    });
    if (nonCodeScope) return null;

    const { row, column } = bufferPosition;
    const code = getRow(editor, row);
    if (!code) return null;

    let cursorPositionStart = column;
    let cursorPositionEnd = column;
    const identifierEnd = code.slice(column).search(/\W/);
    if (identifierEnd !== -1) cursorPositionEnd += identifierEnd;
    cursorPositionStart = js_idx_to_char_idx(cursorPositionStart, code);
    cursorPositionEnd = js_idx_to_char_idx(cursorPositionEnd, code);

    return new Promise((resolve, reject) => {
      kernel.inspect(code, cursorPositionEnd, result => {
        const { data, found } = result;
        if (
          !found ||
          (!data["text/html"] && !data["text/markdown"] && !data["text/plain"])
        ) {
          reject(null);
        } else {
          resolve({
            range: new Range(
              new Point(row, cursorPositionStart),
              new Point(row, cursorPositionEnd)
            ),
            component: () => (
              <div
                className="hydrogen datatip"
                style={{
                  fontSize:
                    atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit"
                }}
              >
                <RichMedia data={data}>
                  <Media.HTML />
                  <Markdown />
                  <Media.Plain />
                </RichMedia>
              </div>
            )
          });
        }
      });
    });
  }
}

export default new DatatipProvider();
