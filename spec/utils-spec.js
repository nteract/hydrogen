"use babel";

import ReactDOM from "react-dom";
import { CompositeDisposable } from "atom";
import os from "os";
import path from "path";

import {
  reactFactory,
  grammarToLanguage,
  isMultilanguageGrammar,
  getEmbeddedScope,
  getEditorDirectory
} from "./../lib/utils";

describe("utils", () => {
  it("grammarToLanguage", () => {
    expect(grammarToLanguage({ name: "Kernel Name" })).toEqual("kernel name");
    expect(grammarToLanguage(null)).toBeNull();
    expect(grammarToLanguage(undefined)).toBeNull();
  });

  it("reactFactory", () => {
    const compDisposable = new CompositeDisposable();
    spyOn(compDisposable, "add").andCallThrough();
    spyOn(ReactDOM, "render");
    spyOn(ReactDOM, "unmountComponentAtNode");
    const teardown = jasmine.createSpy("teardown");

    reactFactory("reactElement", "domElement", teardown, compDisposable);

    expect(ReactDOM.render).toHaveBeenCalledWith("reactElement", "domElement");
    expect(compDisposable.add).toHaveBeenCalled();

    expect(ReactDOM.unmountComponentAtNode).not.toHaveBeenCalled();
    expect(teardown).not.toHaveBeenCalled();
    compDisposable.dispose();
    expect(ReactDOM.unmountComponentAtNode).toHaveBeenCalledWith("domElement");
    expect(teardown).toHaveBeenCalled();
  });

  it("isMultilanguageGrammar", () => {
    expect(
      isMultilanguageGrammar(atom.workspace.buildTextEditor().getGrammar())
    ).toBe(false);
    expect(isMultilanguageGrammar({ scopeName: "source.gfm" })).toBe(true);
    expect(isMultilanguageGrammar({ scopeName: "source.asciidoc" })).toBe(true);
  });

  describe("getEditorDirectory", () => {
    it("should return the directory of the current file", () => {
      const filePath = "/directory/file.txt";
      const editor = { getPath: () => filePath };
      expect(getEditorDirectory(editor)).toBe(path.dirname(filePath));
    });

    it("should return the home directory if file isn't saved", () => {
      const editor = { getPath: () => undefined };
      expect(getEditorDirectory(editor)).toBe(os.homedir());
    });
  });

  it("getEmbeddedScope", () => {
    const editor = {
      scopeDescriptorForBufferPosition: () => {
        return {
          getScopesArray: () => [
            "text.md",
            "fenced.code.md",
            "source.embedded.python"
          ]
        };
      }
    };
    spyOn(editor, "scopeDescriptorForBufferPosition").andCallThrough();
    const scope = getEmbeddedScope(editor, "position");
    expect(scope).toEqual("source.embedded.python");
    expect(editor.scopeDescriptorForBufferPosition).toHaveBeenCalledWith(
      "position"
    );
  });
});
