"use babel";

import React from "react";
import Enzyme, { shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

Enzyme.configure({ adapter: new Adapter() });

import { Store } from "../../../lib/store";
import KernelTransport from "../../../lib/kernel-transport";
import Kernel from "../../../lib/kernel";
import { StatusBar } from "../../../lib/services/consumed/status-bar";

describe("Status Bar Component", () => {
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

  describe("Status bar config", () => {
    let editor, kernel, store;
    beforeEach(() => {
      store = new Store();
      editor = atom.workspace.buildTextEditor();
      spyOn(editor, "getPath").and.returnValue("foo.py");
      spyOn(editor, "getGrammar").and.returnValue("python");
      store.updateEditor(editor);
      kernel = new Kernel(
        new KernelTransport({
          display_name: "Kernel Language Display Name",
          language: "python"
        })
      );
      store.newKernel(kernel, store.filePath, store.editor, store.grammar);
      kernel.setExecutionState("idle");
    });
    it("hides the component based on config setting", () => {
      expect(store.kernel).toBeDefined();
      const component = shallow(<StatusBar store={store} onClick={() => {}} />);

      // the status bar is enabled by default
      expect(component.text()).toBe("Kernel Language Display Name | idle");

      // disable the status bar
      store.setConfigValue("Hydrogen.statusBarDisable", true);
      expect(component.text()).toBe("");

      // re-enable the status bar
      store.setConfigValue("Hydrogen.statusBarDisable", false);
      expect(component.text()).toBe("Kernel Language Display Name | idle");
    });
  });
});
