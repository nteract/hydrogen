"use babel";

import WatchStore from "../../lib/store/watch";

describe("WatchStore", () => {
  it("class WatchStore", () => {
    describe("getCode", () => {
      it("checks for getCode function", () => {
        //setCode to some string
        setCode("foo");
        expect(getCode()).toEqual("foo");
      });
    });
  });
});
