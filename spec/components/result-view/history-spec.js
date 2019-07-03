"use babel";

import React from "react";
import Enzyme, { shallow } from "enzyme";

import History from "../../../lib/components/result-view/history";

describe("History", () => {
  beforeEach(() => {
    atom.config.set(`Hydrogen.wrapOutput`, false);
  });

  it("should render and display the current output", () => {
    const mockStore = {
      index: 0,
      outputs: [{}, {}]
    };

    const component = shallow(<History store={mockStore} />);
    expect(component.type()).not.toBeNull();
    expect(component.text()).toContain("1/2");
  });

  it("should change the index when the arrows are clicked", () => {
    const mockStore = {
      index: 0,
      outputs: [{}, {}],
      setIndex: v => {
        mockStore.index = v;
      },
      incrementIndex: () => {
        mockStore.index++;
      },
      decrementIndex: () => {
        mockStore.index--;
      }
    };

    const component = shallow(<History store={mockStore} />);
    component.find(".icon-chevron-right").simulate("click");
    expect(mockStore.index).toBe(1);
    component.find(".icon-chevron-left").simulate("click");
    expect(mockStore.index).toBe(0);
  });
});
