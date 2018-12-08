"use babel";

import { CompositeDisposable } from "atom";

const PANES = ["inspector", "kernel-monitor", "output-area", "watches"];
const utils = require("../lib/utils");

describe("Panes", () => {
  PANES.map(file => {
    describe(file, () => {
      let pane;
      beforeEach(() => {
        spyOn(utils, "reactFactory");
        const Pane = require("../lib/panes/" + file);
        pane = new Pane();
      });
      it("should correctly initialize", () => {
        expect(pane.element instanceof HTMLElement).toBe(true);
        expect(pane.disposer instanceof CompositeDisposable).toBe(true);
        // Be more specific:
        expect(utils.reactFactory).toHaveBeenCalled();
        expect(typeof pane.getTitle()).toBe("string");
        expect(typeof pane.getURI()).toBe("string");
        expect(typeof pane.getDefaultLocation()).toBe("string");
        expect(Array.isArray(pane.getAllowedLocations())).toBe(true);
      });
      it("should corectly destroy", () => {
        spyOn(pane.disposer, "dispose");
        spyOn(pane.element, "remove");
        pane.destroy();
        expect(pane.disposer.dispose).toHaveBeenCalled();
      });
    });
  });
});
