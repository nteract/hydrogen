"use babel";

import { CompositeDisposable, Point } from "atom";
import { isObservableMap, isObservableProp, isComputedProp } from "mobx";
import store, { Store } from "./../../lib/store";
import KernelTransport from "./../../lib/kernel-transport";
import Kernel from "./../../lib/kernel";
import MarkerStore from "./../../lib/store/markers";

import { getEmbeddedScope } from "../../lib/utils";
const commutable = require("@nteract/commutable");
import { waitAsync } from "../helpers/test-utils";

describe("Store initialize", () => {
  it("should correctly initialize store", () => {
    expect(store.subscriptions instanceof CompositeDisposable).toBeTruthy();
    expect(store.markers instanceof MarkerStore).toBeTruthy();
    expect(store.runningKernels).toEqual([]);
    expect(isObservableMap(store.startingKernels)).toBeTruthy();
    expect(isObservableMap(store.kernelMapping)).toBeTruthy();
    expect(isObservableProp(store, "editor")).toBeTruthy();
    expect(isObservableProp(store, "grammar")).toBeTruthy();
    expect(isComputedProp(store, "kernel")).toBeTruthy();
    expect(isComputedProp(store, "notebook")).toBeTruthy();
  });
});

describe("Store", () => {
  beforeEach(() => {
    store.subscriptions = new CompositeDisposable();
    store.startingKernels = store.kernelMapping = new Map();
    store.runningKernels = [];
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
      expect(store.grammar).toEqual(grammar);
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
        getCursorBufferPosition: () => new Point(0, 0),
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
      expect(store.kernelMapping.size).toBe(1);
      expect(store.kernelMapping.get("foo.py")).toEqual(kernel);
      expect(store.runningKernels).toEqual([kernel]);
      expect(store.startingKernels.delete).toHaveBeenCalledWith("Python 3");
    });

    it("should store kernel for multilanguage file", () => {
      const editor = { getGrammar: () => ({ scopeName: "source.gfm" }) };
      const kernel = { kernelSpec: { display_name: "Python 3" } };
      const kernel2 = { kernelSpec: { display_name: "Javascript" } };
      spyOn(store.startingKernels, "delete");

      store.newKernel(kernel, "foo.md", editor, { name: "python" });
      expect(store.kernelMapping.size).toBe(1);
      expect(store.kernelMapping.get("foo.md").toJS()).toEqual(
        new Map([["python", kernel]])
      );
      expect(store.runningKernels).toEqual([kernel]);
      expect(store.startingKernels.delete).toHaveBeenCalledWith("Python 3");

      store.newKernel(kernel2, "foo.md", editor, { name: "javascript" });
      expect(store.kernelMapping.size).toBe(1);
      expect(store.kernelMapping.get("foo.md").toJS()).toEqual(
        new Map([["python", kernel], ["javascript", kernel2]])
      );

      expect(store.runningKernels).toEqual([kernel, kernel2]);
      expect(store.startingKernels.delete).toHaveBeenCalledWith("Javascript");
    });
  });

  describe("deleteKernel", () => {
    it("should delete kernel", () => {
      const kernel1 = new Kernel(
        new KernelTransport(
          {
            display_name: "Python 3",
            language: "python"
          },
          { name: "python" }
        )
      );
      const kernel2 = new Kernel(
        new KernelTransport(
          {
            display_name: "Python 3",
            language: "python"
          },
          { name: "python" }
        )
      );
      const kernel3 = new Kernel(
        new KernelTransport(
          {
            display_name: "JS",
            language: "Javascript"
          },
          { name: "javascript" }
        )
      );

      store.runningKernels = [kernel1, kernel2, kernel3];
      store.kernelMapping = new Map([
        ["foo.py", kernel1],
        ["bar.py", kernel1],
        ["baz.py", kernel2],
        ["foo.md", new Map([["python", kernel1], ["javascript", kernel3]])]
      ]);

      const kernelFiles = new Set(["foo.py", "bar.py", "foo.md"]);
      expect(new Set(store.getFilesForKernel(kernel1))).toEqual(kernelFiles);
      expect(store.kernelMapping.size).toBe(4);
      store.deleteKernel(kernel1);
      expect(store.kernelMapping.size).toBe(2);
      expect(store.kernelMapping.get("baz.py")).toEqual(kernel2);
      expect(store.kernelMapping.get("foo.md").toJS()).toEqual(
        new Map([["javascript", kernel3]])
      );
      expect(store.runningKernels).toEqual([kernel2, kernel3]);
    });
  });

  describe("getFilesForKernel", () => {
    it("should return files related to kernel", () => {
      const kernel1 = new Kernel(
        new KernelTransport(
          {
            display_name: "Python 3",
            language: "python"
          },
          { name: "python" }
        )
      );
      const kernel2 = new Kernel(
        new KernelTransport(
          {
            display_name: "Python 3",
            language: "python"
          },
          { name: "python" }
        )
      );

      const kernel3 = new Kernel(
        new KernelTransport(
          {
            display_name: "JS",
            language: "Javascript"
          },
          { name: "javascript" }
        )
      );

      store.kernelMapping = new Map([
        ["foo.py", kernel1],
        ["bar.py", kernel1],
        ["baz.py", kernel2],
        ["foo.md", new Map([["python", kernel1], ["javascript", kernel2]])]
      ]);

      expect(store.getFilesForKernel(kernel1)).toEqual([
        "foo.py",
        "bar.py",
        "foo.md"
      ]);
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
      expect(store.grammar).toEqual(editor.getGrammar());
      expect(store.grammar.name.toLowerCase()).toBe("null grammar");
    });
  });

  describe("dispose", () => {
    it("should dispose kernels and subscriptions", () => {
      spyOn(store.subscriptions, "dispose");
      spyOn(store.markers, "clear");
      const kernel1 = jasmine.createSpyObj("kernel1", ["destroy"]);
      const kernel2 = jasmine.createSpyObj("kernel2", ["destroy"]);
      store.runningKernels = [kernel1, kernel2];
      store.dispose();
      expect(store.runningKernels.length).toEqual(0);
      expect(store.kernelMapping.size).toBe(0);
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

  describe("get notebook", () => {
    let editor;
    beforeEach(
      waitAsync(async () => {
        editor = atom.workspace.buildTextEditor();
        await atom.packages.activatePackage("language-python");
        editor.setGrammar(atom.grammars.grammarForScopeName("source.python"));
      })
    );

    it("should return null if no editor", () => {
      expect(store.notebook).toBeNull();
    });

    it("should return an empty notebook for empty file", () => {
      store.updateEditor(editor);
      // Build a notebook with one code cell.
      const nb = commutable.emptyNotebook;
      expect(store.notebook).toEqual(commutable.toJS(nb));
    });

    it("should return a fully-fledged notebook when the file isn't empty", () => {
      const source1 = 'print("Hola World! I <3 ZMQ!")';
      const source2 = "2 + 2";
      editor.setText(`# %%\n${source1}\n# %%\n${source2}\n`);
      store.updateEditor(editor);
      const codeCell1 = commutable.emptyCodeCell.set("source", source1);
      const codeCell2 = commutable.emptyCodeCell.set("source", source2);
      // The outputted notebook will have three cells because currently a cell
      // is always created before the first `# %%`
      let nb = commutable.appendCellToNotebook(
        commutable.emptyNotebook,
        codeCell1
      );
      nb = commutable.appendCellToNotebook(nb, codeCell2);
      expect(store.notebook).toEqual(commutable.toJS(nb));
    });

    it("should export markdown to markdown cells", () => {
      const source1 = 'print("Hola World! I <3 ZMQ!")';
      const source2 = "2 + 2";
      editor.setText(`# %%\n${source1}\n# %% markdown\n${source2}\n`);
      store.updateEditor(editor);
      const codeCell = commutable.emptyCodeCell.set("source", source1);
      const markdownCell = commutable.emptyMarkdownCell.set("source", source2);
      // The outputted notebook will have three cells because currently a cell
      // is always created before the first `# %%`
      let nb = commutable.appendCellToNotebook(
        commutable.emptyNotebook,
        codeCell
      );
      nb = commutable.appendCellToNotebook(nb, markdownCell);
      expect(store.notebook).toEqual(commutable.toJS(nb));
    });
  });

  describe("get kernel", () => {
    it("should return null if no editor", () => {
      expect(store.kernel).toBeNull();
    });

    it("should return null if no kernel is associated with the editor", () => {
      store.editor = { getPath: () => {} };
      expect(store.kernel).toBeNull();
    });

    it("should return kernel", () => {
      const editor = atom.workspace.buildTextEditor();
      spyOn(editor, "getPath").and.returnValue("foo.py");
      store.updateEditor(editor);
      const kernel = new Kernel(
        new KernelTransport({
          display_name: "Python 3",
          language: "python"
        })
      );
      store.kernelMapping = new Map([["foo.py", kernel]]);
      expect(store.kernel).toEqual(kernel);
    });

    it("should return null if no kernel for editor", () => {
      store.editor = { getPath: () => "foo.py" };
      const kernel = new Kernel(
        new KernelTransport({
          display_name: "Python 3",
          language: "python"
        })
      );
      store.kernelMapping = new Map([["bar.py", kernel]]);
      expect(store.kernel).toBeNull();
    });

    it("should return the correct kernel for multilanguage files", () => {
      store.updateEditor({
        getPath: () => "foo.md",
        getGrammar: () => {
          return { name: "python" };
        }
      });
      const kernel = new Kernel(
        new KernelTransport({
          display_name: "Python 3",
          language: "python"
        })
      );
      store.kernelMapping = new Map([
        ["foo.md", new Map([["python", kernel]])]
      ]);
      expect(store.kernel).toEqual(kernel);
    });
  });

  describe("global mode", () => {
    let mockStore, kernelSpec, grammar, editor1, editor2, kernel1;

    beforeEach(() => {
      atom.config.set("Hydrogen.globalMode", true);
      mockStore = new Store();
      kernelSpec = { language: "python", display_name: "Python 3" };
      grammar = {
        scopeName: "source.python",
        name: "Python"
      };

      editor1 = atom.workspace.buildTextEditor();
      editor2 = atom.workspace.buildTextEditor();
      spyOn(editor1, "getPath").and.returnValue("foo.py");
      spyOn(editor2, "getPath").and.returnValue("bar.py");
      spyOn(editor1, "getGrammar").and.returnValue(grammar);
      spyOn(editor2, "getGrammar").and.returnValue(grammar);
      kernel1 = new Kernel(new KernelTransport(kernelSpec, grammar));
    });

    afterEach(() => {
      atom.config.set("Hydrogen.globalMode", false);
    });

    it("should use the same kernel if two files have the same grammar", () => {
      mockStore.updateEditor(editor1);
      mockStore.newKernel(kernel1, editor1.getPath(), editor1);
      expect(mockStore.kernel).toEqual(kernel1);

      mockStore.updateEditor(editor2);
      expect(mockStore.kernel).toEqual(kernel1);

      // store should still keep track of all filePaths
      expect(mockStore.filePaths).toEqual(["foo.py", "bar.py"]);
      expect(mockStore.getFilesForKernel(mockStore.kernel)).toEqual([
        "foo.py",
        "bar.py"
      ]);
    });
  });
});
