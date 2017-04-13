"use babel";

import React from "react";
import { shallow } from "enzyme";

import store from "../../lib/store";
import StatusBar from "../../lib/components/status-bar";

describe("Status Bar", () => {
  it("should render status bar and call onClick if clicked", () => {
    const mockStore = {
      kernel: { displayName: "Foo Kernel", executionState: "idle" }
    };
    const onClick = jasmine.createSpy("onClick");
    const component = shallow(
      <StatusBar store={mockStore} onClick={onClick} />
    );
    component.find("a").simulate("click");
    expect(component.type()).not.toBeNull();
    expect(component.text()).toBe("Foo Kernel | idle");
    expect(onClick).toHaveBeenCalled();
  });

  it("should return empty if kernel is undefined", () => {
    const mockStore = { kernel: undefined };
    const component = shallow(
      <StatusBar store={mockStore} onClick={() => {}} />
    );
    expect(component.type()).toBeNull();
    expect(component.text()).toBe("");
  });

  it("should update status correctly", () => {
    spyOn(StatusBar.prototype, "render").and.callThrough();
    const kernel = {
      language: "null grammar",
      displayName: "Null Kernel",
      executionState: "starting"
    };
    const component = shallow(<StatusBar store={store} onClick={() => {}} />);
    // empty
    expect(StatusBar.prototype.render).toHaveBeenCalledTimes(1);
    expect(component.type()).toBeNull();
    expect(component.text()).toBe("");
    // with kernel
    store.updateEditor(atom.workspace.buildTextEditor());
    store.newKernel(kernel);
    expect(StatusBar.prototype.render).toHaveBeenCalledTimes(2);
    expect(component.text()).toBe("Null Kernel | starting");
    // doesn't update if switched to editor with same grammar
    store.updateEditor(atom.workspace.buildTextEditor());
    expect(StatusBar.prototype.render).toHaveBeenCalledTimes(2);
    // update execution state
    store.kernel.executionState = "idle";
    expect(StatusBar.prototype.render).toHaveBeenCalledTimes(3);
    expect(component.text()).toBe("Null Kernel | idle");
    // reset store
    store.runningKernels = new Map();
  });
});
