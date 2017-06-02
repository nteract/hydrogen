"use babel";

import WatchStore from "../../lib/store/watch";

describe("WatchStore", () => {
  let store;
  beforeEach(() => {
    store = new WatchStore({});
  });
  describe("run", () => {
    it("checks for @action run function", () => {
      store.setCode("foo");
      const code = store.getCode();
      store.kernel = {
        executeWatch: (code, callback) => callback("result")
      };
      spyOn(store.outputStore, "appendOutput");
      store.run();
      expect(store.outputStore.appendOutput).toHaveBeenCalled();
    });
  });
  describe("setCode", () => {
    it("checks for setCode function", () => {
      //setCode to some string
      spyOn(store.editor, "setText");
      store.setCode("foo");
      expect(store.editor.setText).toHaveBeenCalledWith("foo");
    });
  });
  describe("getCode", () => {
    it("checks for getCode function", () => {
      //setCode to some string
      store.setCode("foo");
      expect(store.getCode()).toEqual("foo");
    });
  });
  describe("focus", () => {
    it("checks for focus function", () => {
      spyOn(store.editor.element, "focus");
      store.focus();
      expect(store.editor.element.focus).toHaveBeenCalled();
    });
  });
});
