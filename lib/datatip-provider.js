/* @flow */

import { Range, Point } from "atom";

import { getRow } from "./code-manager";
import { js_idx_to_char_idx } from "./utils";

class DatatipProvider {
  async datatip(editor, bufferPosition, mouthEvent) {
    let { row, cursorPosition } = bufferPosition;
    const code = getRow(editor, row);
    const identifierEnd = code ? code.slice(cursorPosition).search(/\W/) : -1;
    if (identifierEnd !== -1) {
      cursorPosition += identifierEnd;
    }
    cursorPosition = js_idx_to_char_idx(cursorPosition, code);

    return {
      range: new Range(new Point(0, 0), new Point(0, 5)),
      markedStrings: [`This is test \`code\``]
    };
  }

  validForScope(scopeName) {
    return true;
  }

  providerName() {
    return "Hydrogen";
  }

  priority() {
    return 1;
  }

  // grammarScopes() {
  //
  // }
}

export default new DatatipProvider();
