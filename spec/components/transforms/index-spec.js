"use babel";

import React from "react";

import PlotlyTransform from "@nteract/transform-plotly";
import transformManager from "./../../../lib/components/transforms";
import Markdown from "./../../../lib/components/transforms/markdown";

describe("Transforms", () => {
  it("should contain default transforms", () => {
    expect(Array.from(transformManager.transforms.keys())).toEqual([
      "vega3",
      "vega2",
      "plotly",
      "vegalite2",
      "vegalite1",
      "json",
      "js",
      "html",
      "markdown",
      "latex",
      "svg",
      "gif",
      "jpeg",
      "png",
      "plain"
    ]);
  });

  describe("addTransform", () => {
    it("should add a new transform", () => {
      expect(transformManager.addTransform(<Markdown />, "mark")).toBeTruthy();
      expect(transformManager.transforms.has("mark")).toBeTruthy();
      expect(transformManager.transforms.get("mark").type).toEqual(Markdown);
    });

    it("should not override an existing transform", () => {
      expect(transformManager.addTransform(<Markdown />, "svg")).toBeTruthy();
      expect(transformManager.transforms.get("svg").type).not.toEqual(Markdown);
    });
  });

  describe("deleteTransform", () => {
    it("should remove a transform", () => {
      expect(transformManager.deleteTransform("mark")).toBeTruthy();
      expect(!transformManager.transforms.has("mark")).toBeTruthy();
    });

    it("should return false for non-existent key", () => {
      //Previously a transform
      expect(!transformManager.deleteTransform("mark")).toBeTruthy();
      //Never a transform
      expect(!transformManager.deleteTransform("non-existent")).toBeTruthy();
    });
  });

  describe("components", () => {
    it("should return array of react elements only", () => {
      let allReactElements = true;
      for (let element of transformManager.components) {
        if (element.$$typeof != Symbol.for("react.element")) {
          allReactElements = false;
          break;
        }
      }
      expect(allReactElements).toBeTruthy();
    });
  });
});
