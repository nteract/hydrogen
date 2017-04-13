"use babel";

import { CompositeDisposable } from "atom";
import { isObservableMap, isObservable, isComputed } from "mobx";
import store from "./../lib/store";

describe("Store initialize", () => {
  it("should correctly initialize store", () => {
    expect(store.subscriptions instanceof CompositeDisposable).toBeTruthy();
    expect(isObservableMap(store.runningKernels)).toBeTruthy();
    expect(isObservable(store, "editor")).toBeTruthy();
    expect(isObservable(store, "grammar")).toBeTruthy();
    expect(isComputed(store, "kernel")).toBeTruthy();
    expect(isComputed(store, "language")).toBeTruthy();
  });
});

describe("Store", () => {
  beforeEach(() => {
    store.subscriptions = new CompositeDisposable();
    store.runningKernels = new Map();
    store.editor = null;
    store.grammar = null;
  });

  describe("setGrammar", () => {
    it("should set grammar and determine language and current kernel", () => {
      const editor = atom.workspace.buildTextEditor();
      store.runningKernels.set("null grammar", "current kernel");
      store.runningKernels.set("mock grammar", "not current kernel");
      store.setGrammar(editor);
      expect(store.grammar).toBe(editor.getGrammar());
      expect(store.language).toBe("null grammar");
      expect(store.kernel).toBe("current kernel");
    });

    it("should set grammar to null if editor is undefined", () => {
      store.setGrammar(null);
      expect(store.grammar).toBeNull();
      store.setGrammar(undefined);
      expect(store.grammar).toBeNull();
    });

    it("should set non multi language grammar", () => {
      const grammar = { scopeName: "source.python", name: "Python" };
      const editor = { getGrammar: () => grammar };

      store.setGrammar(editor);
      expect(store.grammar).toEqual(grammar);
      expect(store.language).toBe("python");
    });

    it("should set multi language grammar inside code block", () => {
      const editor = {
        getGrammar: () => {
          return { scopeName: "source.gfm", name: "GitHub Markdown" };
        },
        getCursorBufferPosition: () => {},
        scopeDescriptorForBufferPosition: () => {
          return {
            getScopesArray: () => [
              "source.gfm",
              "markup.code.python.gfm",
              "source.embedded.python"
            ]
          };
        }
      };

      const pythonGrammar = { scopeName: "source.python", name: "Python" };
      spyOn(atom.grammars, "grammarForScopeName").and.returnValue(
        pythonGrammar
      );

      store.setGrammar(editor);
      expect(store.grammar).toEqual(pythonGrammar);
      expect(store.language).toBe("python");
    });

    it("should set multi language grammar outside code block", () => {
      const grammar = { scopeName: "source.gfm", name: "GitHub Markdown" };
      const editor = {
        getGrammar: () => grammar,
        getCursorBufferPosition: () => {},
        scopeDescriptorForBufferPosition: () => {
          return {
            getScopesArray: () => ["source.gfm", "markup.code.python.gfm"]
          };
        }
      };

      store.setGrammar(editor);
      expect(store.grammar).toEqual(grammar);
      expect(store.language).toBe("github markdown");
    });
  });

  it("should add new kernel", () => {
    const kernel = { language: "null grammar", foo: "bar" };
    store.newKernel(kernel);
    expect(store.runningKernels.size).toBe(1);
    expect(store.runningKernels.get("null grammar").language).toBe(
      "null grammar"
    );
    expect(store.runningKernels.get("null grammar").foo).toBe("bar");
  });

  it("should delete kernel", () => {
    store.runningKernels.set("lang1", "foo");
    store.runningKernels.set("lang2", "bar");
    expect(store.runningKernels.size).toBe(2);
    store.deleteKernel("lang1");
    expect(store.runningKernels.size).toBe(1);
    expect(store.runningKernels.get("lang2")).toBe("bar");
  });

  it("should update editor", () => {
    spyOn(store, "setGrammar").and.callThrough();
    expect(store.editor).toBeNull();
    const editor = atom.workspace.buildTextEditor();
    store.updateEditor(editor);
    expect(store.editor).toBe(editor);
    expect(store.setGrammar).toHaveBeenCalledWith(editor);
    expect(store.grammar).toBe(editor.getGrammar());
    expect(store.language).toBe("null grammar");
  });

  it("should dispose kernels and subscriptions", () => {
    spyOn(store.subscriptions, "dispose");
    const kernel1 = jasmine.createSpyObj("kernel1", ["destroy"]);
    const kernel2 = jasmine.createSpyObj("kernel2", ["destroy"]);
    store.runningKernels.set("lang1", kernel1);
    store.runningKernels.set("lang2", kernel2);
    store.dispose();
    expect(store.runningKernels.size).toBe(0);
    expect(kernel1.destroy).toHaveBeenCalled();
    expect(kernel2.destroy).toHaveBeenCalled();
    expect(store.subscriptions.dispose).toHaveBeenCalled();
  });
});
