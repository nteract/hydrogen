"use babel";

import { reduceOutputs } from "../../lib/components/result-view/index";

// Adapted from https://github.com/nteract/nteract/blob/master/test/renderer/reducers/document-spec.js#L33
describe("reduceOutputs", () => {
  it("puts new outputs at the end by default", () => {
    const outputs = [
      { output_type: "stream", name: "stdout", text: "Woo" },
      {
        output_type: "error",
        ename: "well",
        evalue: "actually",
        traceback: []
      }
    ];
    const newOutputs = reduceOutputs(outputs, {
      output_type: "display_data",
      data: {},
      metadata: {}
    });

    expect(newOutputs).toEqual([
      { output_type: "stream", name: "stdout", text: "Woo" },
      {
        output_type: "error",
        ename: "well",
        evalue: "actually",
        traceback: []
      },
      {
        output_type: "display_data",
        data: {},
        metadata: {}
      }
    ]);
  });

  it("handles the case of a single stream output", () => {
    const outputs = [{ name: "stdout", text: "hello", output_type: "stream" }];
    const newOutputs = reduceOutputs(outputs, {
      name: "stdout",
      text: " world",
      output_type: "stream"
    });

    expect(newOutputs).toEqual([
      { name: "stdout", text: "hello world", output_type: "stream" }
    ]);
  });

  it("merges streams of text", () => {
    let outputs = [];

    outputs = reduceOutputs(outputs, {
      name: "stdout",
      text: "hello",
      output_type: "stream"
    });
    expect(outputs).toEqual([
      { name: "stdout", text: "hello", output_type: "stream" }
    ]);

    outputs = reduceOutputs(outputs, {
      name: "stdout",
      text: " world",
      output_type: "stream"
    });
    expect(outputs).toEqual([
      { name: "stdout", text: "hello world", output_type: "stream" }
    ]);
  });
});
