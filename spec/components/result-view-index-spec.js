"use babel";

import { reduceOutputs } from "../../lib/components/result-view/index";
import Immutable from "immutable";

// Adapted from https://github.com/nteract/nteract/blob/master/test/renderer/reducers/document-spec.js#L33
describe("reduceOutputs", () => {
  it("puts new outputs at the end by default", () => {
    const outputs = [
      Immutable.Map({ output_type: "stream", name: "stdout", text: "Woo" }),
      Immutable.Map({
        output_type: "error",
        ename: "well",
        evalue: "actually",
        traceback: Immutable.List()
      })
    ];
    const newOutputs = reduceOutputs(outputs, {
      output_type: "display_data",
      data: {},
      metadata: {}
    });

    expect(newOutputs.toString()).toEqual(
      [
        Immutable.Map({ output_type: "stream", name: "stdout", text: "Woo" }),
        Immutable.Map({
          output_type: "error",
          ename: "well",
          evalue: "actually",
          traceback: Immutable.List()
        }),
        Immutable.Map({
          output_type: "display_data",
          data: Immutable.Map(),
          metadata: Immutable.Map()
        })
      ].toString()
    );
  });

  it("handles the case of a single stream output", () => {
    const outputs = [
      Immutable.Map({ name: "stdout", text: "hello", output_type: "stream" })
    ];
    const newOutputs = reduceOutputs(outputs, {
      name: "stdout",
      text: " world",
      output_type: "stream"
    });

    expect(newOutputs.toString()).toEqual(
      [
        Immutable.Map({
          name: "stdout",
          text: "hello world",
          output_type: "stream"
        })
      ].toString()
    );
  });

  it("merges streams of text", () => {
    let outputs = [];

    outputs = reduceOutputs(outputs, {
      name: "stdout",
      text: "hello",
      output_type: "stream"
    });
    expect(outputs.toString()).toEqual(
      [
        Immutable.Map({ output_type: "stream", name: "stdout", text: "hello" })
      ].toString()
    );

    outputs = reduceOutputs(outputs, {
      name: "stdout",
      text: " world",
      output_type: "stream"
    });
    expect(outputs.toString()).toEqual(
      [
        Immutable.Map({
          output_type: "stream",
          name: "stdout",
          text: "hello world"
        })
      ].toString()
    );
  });
});
