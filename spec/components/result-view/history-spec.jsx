"use babel";

import React from "react";
import Enzyme, { shallow, mount } from "enzyme";

import History from "../../../dist/components/result-view/history";
import OutputStore from "../../../dist/store/output";

describe("History", () => {
  let fakeOutput, outputStore, component;
  beforeEach(() => {
    atom.config.set(`Hydrogen.wrapOutput`, false);
    fakeOutput = {
      output_type: "display_data",
      data: {
        "text/html": "<p>This is some HTML that <b>WILL</b> render</p>",
        "text/plain": "This is some plain text that WILL NOT render",
      },
      metadata: {},
    };
    outputStore = new OutputStore();
    outputStore.index = 0;
    outputStore.outputs = [fakeOutput, fakeOutput];
    component = mount(<History store={outputStore} />);
  });

  it("should render and display the current output", () => {
    expect(component.type()).not.toBeNull();
    expect(component.text()).toContain("1/2");
  });

  it("should change the index when the arrows are clicked", () => {
    component.find(".icon-chevron-right").simulate("click");
    expect(outputStore.index).toBe(1);
    component.find(".icon-chevron-left").simulate("click");
    expect(outputStore.index).toBe(0);
  });
});
