"use babel";

import ReactDOM from "react-dom";
import { CompositeDisposable } from "atom";

import {
  reactFactory,
  grammarToLanguage,
  isMultilanguageGrammar,
  getEmbeddedScope
} from "./../lib/utils";

describe("utils", () => {
  describe("grammarToLanguage", () => {
    it("should return null if no rammar given", () => {
      expect(grammarToLanguage()).toBeNull();
      expect(grammarToLanguage(null)).toBeNull();
      expect(grammarToLanguage(undefined)).toBeNull();
    });

    it("should return language from grammar", () => {
      expect(grammarToLanguage({ name: "Kernel Name" })).toEqual("kernel name");
    });

    it("should return respect languageMappings", () => {
      atom.config.set(
        "Hydrogen.languageMappings",
        `{"Kernel Language": "Grammar Language"}`
      );
      expect(grammarToLanguage({ name: "Grammar Language" })).toEqual(
        "kernel language"
      );
      expect(grammarToLanguage({ name: "Kernel Language" })).toEqual(
        "kernel language"
      );
      atom.config.set("Hydrogen.languageMappings", "");
    });
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
