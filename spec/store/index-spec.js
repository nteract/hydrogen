"use babel";

import { CompositeDisposable } from "atom";
import { isObservableMap, isObservable, isComputed } from "mobx";
import store from "./../../lib/store";

describe("Store initialize", () => {
  it("should correctly initialize store", () => {
    expect(store.subscriptions instanceof CompositeDisposable).toBeTruthy();
    expect(isObservableMap(store.startingKernels)).toBeTruthy();
    expect(isObservableMap(store.runningKernels)).toBeTruthy();
    expect(isObservable(store, "editor")).toBeTruthy();
    expect(isObservable(store, "grammar")).toBeTruthy();
    expect(isComputed(store, "kernel")).toBeTruthy();
  });
});

describe("Store", () => {
  beforeEach(() => {
    store.subscriptions = new CompositeDisposable();
    store.startingKernels = new Map();
    store.runningKernels = new Map();
    store.editor = null;
    store.grammar = null;
  });

  describe("setGrammar", () => {
    it("should set grammar and determine language and current kernel", () => {
      const editor = atom.workspace.buildTextEditor();
      const grammar = editor.getGrammar();
      expect(grammar.name).toBe("Null Grammar");
      expect(store.editor).toBeNull();
      store.setGrammar(editor);
      expect(store.grammar).toBe(grammar);

      const currentKernel = {
        kernelSpec: { language: "null grammar" }
      };
      const notCurrentKernel = {
        kernelSpec: { language: "mock grammar" }
      };

      const runningKernels = {
        "current kernel": currentKernel,
        "not current kernel": notCurrentKernel
      };
      for (let kernelLanguage of Object.keys(runningKernels)) {
        const kernel = runningKernels[kernelLanguage];
        store.runningKernels.set(kernelLanguage, kernel);
      }
      expect(Object.keys(store.runningKernels.toJS()).sort()).toEqual(
        Object.keys(runningKernels).sort()
      );
      expect(store.kernel.kernelSpec.language).toBe(
        currentKernel.kernelSpec.language
      );
    });

    it("should set grammar to null if editor is null", () => {
      store.setGrammar(null);
      expect(store.grammar).toBeNull();
    });

    it("should set grammar to null if editor is undefined", () => {
      store.setGrammar(undefined);
      expect(store.grammar).toBeNull();
    });

    it("should set non multi language grammar", () => {
      const grammar = { scopeName: "source.python", name: "Python" };
      const editor = { getGrammar: () => grammar };

      store.setGrammar(editor);
      expect(store.grammar).toEqual(grammar);
      expect(store.grammar.name.toLowerCase()).toBe("python");
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
      expect(store.grammar.name.toLowerCase()).toBe("python");
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
      expect(store.grammar.name.toLowerCase()).toBe("github markdown");
    });
  });

  it("should add new kernel and reset starting kernel indicator", () => {
    const kernelSpec = {
      language: "null grammar",
      display_name: "null grammar"
    };
    const kernel = {
      language: "null grammar",
      foo: "bar",
      kernelSpec: kernelSpec
    };
    const { display_name } = kernelSpec;

    store.startKernel(display_name);
    expect(store.startingKernels.get(display_name)).toBeTruthy();

    store.newKernel(kernel);
    expect(store.startingKernels.get(display_name)).toBeUndefined();

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
    store.deleteKernel("foo");
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
    expect(store.grammar.name.toLowerCase()).toBe("null grammar");
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
