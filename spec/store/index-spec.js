"use babel";

import { CompositeDisposable } from "atom";
import { isObservableMap, isObservable, isComputed } from "mobx";
import store from "./../../lib/store";
import Kernel from "./../../lib/kernel";
import MarkerStore from "./../../lib/store/markers";

describe("Store initialize", () => {
  it("should correctly initialize store", () => {
    expect(store.subscriptions instanceof CompositeDisposable).toBeTruthy();
    expect(store.markers instanceof MarkerStore).toBeTruthy();
    expect(store.runningKernels).toEqual(new Set());
    expect(isObservableMap(store.startingKernels)).toBeTruthy();
    expect(isObservable(store.kernelMapping)).toBeTruthy();
    expect(isObservable(store, "editor")).toBeTruthy();
    expect(isObservable(store, "grammar")).toBeTruthy();
    expect(isComputed(store, "kernel")).toBeTruthy();
  });
});

describe("Store", () => {
  beforeEach(() => {
    store.subscriptions = new CompositeDisposable();
    store.startingKernels = new Map();
    store.runningKernels = new Set();
    store.kernelMapping = {};
    store.editor = null;
    store.grammar = null;
  });

  describe("setGrammar", () => {
    it("should set grammar", () => {
      const editor = atom.workspace.buildTextEditor();
      const grammar = editor.getGrammar();
      expect(grammar.name).toBe("Null Grammar");
      expect(store.editor).toBeNull();
      store.setGrammar(editor);
      expect(store.grammar).toBe(grammar);
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

  describe("startKernel", () => {
    it("should add display name to startingKernels", () => {
      const display_name = "null grammar";
      expect(store.startingKernels.get(display_name)).toBeFalsy();
      store.startKernel(display_name);
      expect(store.startingKernels.get(display_name)).toBeTruthy();
    });
  });

  describe("newKernel", () => {
    it("should store kernel", () => {
      const editor = { getGrammar: () => ({ scopeName: "source.python" }) };
      const kernel = { kernelSpec: { display_name: "Python 3" } };
      spyOn(store.startingKernels, "delete");

      store.newKernel(kernel, "foo.py", editor);
      expect(store.kernelMapping).toEqual({ "foo.py": kernel });
      expect(store.runningKernels).toEqual(new Set([kernel]));
      expect(store.startingKernels.delete).toHaveBeenCalledWith("Python 3");
    });

    it("should store kernel for multilanguage file", () => {
      const editor = { getGrammar: () => ({ scopeName: "source.gfm" }) };
      const kernel = { kernelSpec: { display_name: "Python 3" } };
      spyOn(store.startingKernels, "delete");

      store.newKernel(kernel, "foo.md", editor, { name: "python" });
      expect(store.kernelMapping).toEqual({ "foo.md": { python: kernel } });
      expect(store.runningKernels).toEqual(new Set([kernel]));
      expect(store.startingKernels.delete).toHaveBeenCalledWith("Python 3");
    });
  });

  describe("deleteKernel", () => {
    it("should delete kernel", () => {
      const kernel1 = new Kernel({
        display_name: "Python 3",
        language: "python"
      });
      const kernel2 = new Kernel({
        display_name: "Python 3",
        language: "python"
      });
      const kernel3 = new Kernel({
        display_name: "JS",
        language: "Javascript"
      });

      store.runningKernels = new Set([kernel1, kernel2, kernel3]);
      store.kernelMapping = {
        "foo.py": kernel1,
        "bar.py": kernel1,
        "baz.py": kernel2,
        "foo.md": { python: kernel1, javascript: kernel3 }
      };

      store.deleteKernel(kernel1);

      expect(store.kernelMapping).toEqual({
        "baz.py": kernel2,
        "foo.md": { javascript: kernel3 }
      });
      expect(store.runningKernels).toEqual(new Set([kernel2, kernel3]));
    });
  });

  describe("updateEditor", () => {
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
  });

  describe("dispose", () => {
    it("should dispose kernels and subscriptions", () => {
      spyOn(store.subscriptions, "dispose");
      spyOn(store.markers, "clear");
      const kernel1 = jasmine.createSpyObj("kernel1", ["destroy"]);
      const kernel2 = jasmine.createSpyObj("kernel2", ["destroy"]);
      store.runningKernels.add(kernel1);
      store.runningKernels.add(kernel2);
      store.dispose();
      expect(store.runningKernels).toEqual(new Set());
      expect(store.kernelMapping).toEqual({});
      expect(kernel1.destroy).toHaveBeenCalled();
      expect(kernel2.destroy).toHaveBeenCalled();
      expect(store.subscriptions.dispose).toHaveBeenCalled();
      expect(store.markers.clear).toHaveBeenCalled();
    });
  });

  describe("get filePath", () => {
    it("should return null if no editor", () => {
      expect(store.filePath).toBeNull();
    });

    it("should return file path", () => {
      store.editor = { getPath: () => "foo.py" };
      expect(store.filePath).toBe("foo.py");
    });
  });

  describe("get kernel", () => {
    it("should return null if no editor", () => {
      expect(store.kernel).toBeNull();
    });

    it("should return null if editor isn't saved", () => {
      store.editor = { getPath: () => {} };
      expect(store.kernel).toBeNull();
    });

    it("should return kernel", () => {
      store.editor = { getPath: () => "foo.py" };
      const kernel = new Kernel({
        display_name: "Python 3",
        language: "python"
      });
      store.kernelMapping = { "foo.py": kernel };
      expect(store.kernel).toEqual(kernel);
    });

    it("should return null if no kernel for file", () => {
      store.editor = { getPath: () => "foo.py" };
      const kernel = new Kernel({
        display_name: "Python 3",
        language: "python"
      });
      store.kernelMapping = { "bar.py": kernel };
      expect(store.kernel).toBeUndefined();
    });

    it("should return null if no kernel for file", () => {
      store.editor = { getPath: () => "foo.md" };
      const kernel = new Kernel({
        display_name: "Python 3",
        language: "python"
      });
      store.kernelMapping = { "foo.md": { python: kernel } };
      store.grammar = { name: "python" };
      expect(store.kernel).toEqual(kernel);
    });
  });
});
