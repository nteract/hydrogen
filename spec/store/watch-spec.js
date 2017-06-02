"use babel";

import WatchStore from "../../lib/store/watch";

describe("WatchStore", () => {
  let store;
  beforeEach(() => {
    store = new WatchStore({
      executeWatch: (code, callback) => callback("result")
    });
  });
  describe("run", () => {
    it("checks for non-empty string", () => {
      store.getCode = () => "foo";
      spyOn(store.kernel, "executeWatch").and.callThrough();
      spyOn(store.outputStore, "appendOutput");
      store.run();
      expect(store.kernel.executeWatch).toHaveBeenCalledWith(
        "foo",
        jasmine.any(Function)
      );
      expect(store.outputStore.appendOutput).toHaveBeenCalledWith("result");
    });
    it("checks for empty string function", () => {
      store.getCode = () => "";
      spyOn(store.kernel, "executeWatch").and.callThrough();
      spyOn(store.outputStore, "appendOutput");
      store.run();
      expect(store.kernel.executeWatch).not.toHaveBeenCalled();
      expect(store.outputStore.appendOutput).not.toHaveBeenCalled();
    });
  });
  describe("setCode", () => {
    it("checks for foo to be set to code", () => {
      //setCode to some string
      spyOn(store.editor, "setText");
      store.setCode("foo");
      expect(store.editor.setText).toHaveBeenCalledWith("foo");
    });
  });
  describe("getCode", () => {
    it("checks if it gets the right string", () => {
      //setCode to some string
      store.setCode("foo");
      expect(store.getCode()).toEqual("foo");
    });
  });
  describe("focus", () => {
    it("checks for function call", () => {
      spyOn(store.editor.element, "focus");
      store.focus();
      expect(store.editor.element.focus).toHaveBeenCalled();
    });
  });
});
