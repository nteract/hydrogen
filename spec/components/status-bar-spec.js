"use babel";

import React from "react";
import Enzyme, { shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

Enzyme.configure({ adapter: new Adapter() });

import store from "../../lib/store";
import Kernel from "../../lib/kernel";
import StatusBar from "../../lib/components/status-bar";

describe("Status Bar", () => {
  it("should render status bar and call onClick if clicked", () => {
    const mockStore = {
      kernel: { displayName: "Foo Kernel", executionState: "idle" },
      configMapping: new Map()
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
    const component = shallow(<StatusBar store={store} onClick={() => {}} />);

    // empty
    expect(StatusBar.prototype.render).toHaveBeenCalledTimes(1);
    expect(component.type()).toBeNull();
    expect(component.text()).toBe("");

    const kernel = new Kernel({
      display_name: "Python 3",
      language: "python"
    });
    kernel.executionState = "starting";

    const kernel2 = new Kernel({
      display_name: "Javascript",
      language: "Javascript"
    });
    kernel2.executionState = "idle";

    store.kernelMapping = new Map([
      ["foo.py", kernel],
      ["bar.py", kernel],
      ["foo.js", kernel2]
    ]);

    store.editor = { getPath: () => "foo.py" };

    // FixMe: Enzyme https://github.com/airbnb/enzyme/issues/1184
    component.setState();
    expect(store.kernel.displayName).toBe(kernel.displayName);
    expect(store.kernel.executionState).toBe(kernel.executionState);
    // expect(StatusBar.prototype.render).toHaveBeenCalledTimes(2);
    expect(component.text()).toBe("Python 3 | starting");

    // update execution state
    store.kernel.executionState = "idle";

    // FixMe: Enzyme https://github.com/airbnb/enzyme/issues/1184
    component.setState();
    // expect(StatusBar.prototype.render).toHaveBeenCalledTimes(3);
    expect(component.text()).toBe("Python 3 | idle");

    // doesn't update if switched to editor with same grammar
    store.editor = { getPath: () => "bar.py" };
    // expect(StatusBar.prototype.render).toHaveBeenCalledTimes(3);

    // update kernel
    store.editor = { getPath: () => "foo.js" };

    // FixMe: Enzyme https://github.com/airbnb/enzyme/issues/1184
    component.setState();
    expect(store.kernel.displayName).toBe(kernel2.displayName);
    expect(store.kernel.executionState).toBe(kernel2.executionState);
    // expect(StatusBar.prototype.render).toHaveBeenCalledTimes(4);
    expect(component.text()).toBe("Javascript | idle");
  });

  it("hides the component based on config setting", () => {
    store.setConfigValue("Hydrogen.statusBarDisable", true);
    expect(store.kernel).toBeDefined();
    const component = shallow(<StatusBar store={store} onClick={() => {}} />);

    expect(component.text()).toBe("");
    store.setConfigValue("Hydrogen.statusBarDisable", false);
    expect(component.text()).not.toBe("Javascript | idle");
  });
});

// reset store
store.kernelMapping = new Map();
