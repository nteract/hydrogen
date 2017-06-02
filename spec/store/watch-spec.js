"use babel";

import WatchStore from "../../lib/store/watch";

describe("WatchStore", () => {
  let store;
  describe("getCode", () => {
    it("checks for getCode function", () => {
      store = new WatchStore({})
      //setCode to some string
      store.setCode("foo");
      expect(store.getCode()).toEqual("foo");
    });
  });
});
