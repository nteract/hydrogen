"use babel";

import React from "react";
import { shallow } from "enzyme";

import ResultViewComponent from "../../../lib/components/result-view/result-view";

describe("ResultViewComponent", () => {
  beforeEach(() => {
    atom.config.set(`Hydrogen.wrapOutput`, false);
  });

  it("should render", () => {
    const mockStore = {
      index: 0,
      outputs: [{}, {}],
      status: "",
      executionCount: 0,
      position: {
        lineHeight: 0,
        lineLength: 0,
        editorWidth: 0,
        charWidth: 0
      }
    };

    const mockKernel = {};

    const destroy = () => {};

    const component = shallow(
      <ResultViewComponent
        store={mockStore}
        kernel={mockKernel}
        destroy={destroy}
        showResult={true}
      />
    );

    expect(component.type()).not.toBeNull();
  });

  it("should destroy itself when x is clicked.", () => {
    const mockStore = {
      index: 0,
      outputs: [{}, {}],
      status: "",
      executionCount: 0,
      position: {
        lineHeight: 0,
        lineLength: 0,
        editorWidth: 0,
        charWidth: 0
      }
    };

    const mockKernel = {};

    const destroy = jasmine.createSpy("destroy");

    const component = shallow(
      <ResultViewComponent
        store={mockStore}
        kernel={mockKernel}
        destroy={destroy}
        showResult={true}
      />
    );

    component.find(".icon-x").simulate("click");
    expect(destroy).toHaveBeenCalled();
  });
});
