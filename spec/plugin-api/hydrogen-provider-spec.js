"use babel";

import HydrogenProvider from "./../../lib/plugin-api/hydrogen-provider";
import Hydrogen from "./../../lib/main";
import transformManager from "./../../lib/components/transforms";
import Markdown from "./../../lib/components/transforms/markdown";

describe("Hydrogen Provider", () => {
  const plugin = Hydrogen.provideHydrogen();
  it("should create a valid provider", () => {
    expect(plugin instanceof HydrogenProvider).toBeTruthy();
  });

  describe("registerTransform", () => {
    it("should add a new transform", () => {
      expect(plugin.registerTransform(Markdown, "mark")).toBeTruthy();
      expect(transformManager.transforms.has("mark")).toBeTruthy();
      expect(transformManager.transforms.get("mark").type).toEqual(Markdown);
    });

    it("should not override an existing transform", () => {
      expect(plugin.registerTransform(Markdown, "svg")).toBeTruthy();
      expect(transformManager.transforms.get("svg").type).not.toEqual(Markdown);
    });
  });

  describe("unregisterTransform", () => {
    it("should remove a transform", () => {
      expect(plugin.unregisterTransform("mark")).toBeTruthy();
      expect(!transformManager.transforms.has("mark")).toBeTruthy();
    });

    it("should return false for non-existent key", () => {
      //Previously a transform
      expect(!plugin.unregisterTransform("mark")).toBeTruthy();
      //Never a transform
      expect(!plugin.unregisterTransform("non-existent")).toBeTruthy();
    });
  });
});
