"use babel";

import React from "react";
import Enzyme, { mount, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
const fs = require("fs");

Enzyme.configure({ adapter: new Adapter() });

import { Store } from "../../lib/store";
import KernelTransport from "../../lib/kernel-transport";
import Kernel from "../../lib/kernel";
import KernelMonitor from "../../lib/components/kernel-monitor";
import { waitAsync } from "../helpers/test-utils";

describe("Kernel monitor", () => {
  let store, initialEditor, mocks, filesToDelete, originalTimeoutInterval;
  beforeEach(
    waitAsync(async () => {
      store = new Store();
      mocks = [];
      filesToDelete = [];
      const mockSettings = [
        { debugName: "Kernel1", ext: ".py", grammarName: "python" },
        { debugName: "Kernel2", ext: ".jl", grammarName: "julia" },
        {
          debugName: "Kernel3-unsaved",
          unsaved: true,
          grammarName: "julia",
          ext: ".jl"
        }
      ];

      spyOn(atom.notifications, "addInfo"); // Spied for 'Show kernel spec' link testing

      for (let mockSetting of mockSettings) {
        let { ext, unsaved, debugName, grammarName } = mockSetting;
        const newEditor = await atom.workspace.open();

        const filename = unsaved
          ? `Unsaved Editor ${newEditor.id}`
          : `${debugName}-hydrogen-spec${ext}`;
        if (!unsaved) {
          await newEditor.saveAs(filename);
          filesToDelete.push(newEditor.getPath());
        }
        spyOn(newEditor, "getGrammar").and.returnValue({ name: grammarName });

        store.updateEditor(newEditor);
        const kernel = new Kernel(
          new KernelTransport(
            {
              display_name: `Kernel Displayname: ${debugName}`,
              language: grammarName
            },
            { name: grammarName }
          )
        );
        spyOn(kernel, "interrupt");
        spyOn(kernel, "restart");
        spyOn(kernel, "shutdown");

        store.newKernel(kernel, filename, newEditor, {
          name: grammarName
        });
        kernel.setExecutionState("idle");
        mocks.push({
          editor: newEditor,
          kernel,
          grammarName: grammarName,
          debugName,
          filename
        });
      }

      // since we are using a click event to activate a window
      originalTimeoutInterval = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeoutInterval + 2000;
      // make sure the initialEditor is active at the start of each spec
      initialEditor = await atom.workspace.open(
        "kernel-monitor-spec-initial.py"
      );
    })
  );
  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeoutInterval;
    filesToDelete.forEach(file => fs.unlinkSync(file));
  });

  it("has an 'Show kernel spec' link to show kernel spec within `atom.notifications.addInfo({ detail })`", () => {
    const component = mount(<KernelMonitor store={store} />);

    // title attribute is what provides the hover tooltip "Interupt kernel"
    const kernelSpecLink = component.find('[title="Show kernel spec"]').first();
    kernelSpecLink.simulate("click");
    // Substitute `atom.notifications.addInfo` for `showKernelSpec`,
    // and a kernel spec should be shown within `detail` for readability
    const args = atom.notifications.addInfo.calls.argsFor(0)[1];
    expect(args.hasOwnProperty("detail")).toBe(true);
  });

  it("has an 'Interrupt kernel' button", () => {
    const component = mount(<KernelMonitor store={store} />);

    // title attribute is what provides the hover tooltip "Interupt kernel"
    const interuptButton = component.find('[title="Interrupt kernel"]').first();
    interuptButton.simulate("click");
    expect(store.runningKernels[0].interrupt).toHaveBeenCalledTimes(1);
  });

  it("has an 'Restart kernel' button", () => {
    const component = mount(<KernelMonitor store={store} />);

    // title attribute is what provides the hover tooltip "Interupt kernel"
    const restartButton = component.find('[title="Restart kernel"]').first();
    restartButton.simulate("click");
    expect(store.runningKernels[0].restart).toHaveBeenCalledTimes(1);
  });

  it("has an 'Shutdown kernel' button", () => {
    const component = mount(<KernelMonitor store={store} />);

    // title attribute is what provides the hover tooltip "Interupt kernel"
    const shutdownButton = component.find('[title="Shutdown kernel"]').first();
    shutdownButton.simulate("click");
    expect(store.runningKernels[0].shutdown).toHaveBeenCalledTimes(1);
  });

  it("activates related editor when Jump to file clicked", done => {
    const component = mount(<KernelMonitor store={store} />);
    // spyOn(atom.workspace, "open").and.callThrough();
    const [savedMock, savedMock1, unsavedMock] = mocks;
    const jumpToEditorButtons = component.find('[title="Jump to file"]');
    const jumpToEditorButtonSaved = jumpToEditorButtons.at(0);
    const jumpToEditorButtonUnsaved = jumpToEditorButtons.at(2);

    // When jump button clicked, the active editor will
    // change to the related editor and call done() to complete the test
    let timesClicked = 1;
    let disposer = atom.workspace.onDidChangeActiveTextEditor(activeEditor => {
      if (timesClicked === 1) {
        expect(activeEditor.id).toEqual(unsavedMock.editor.id);
        // increment and call the next click
        timesClicked = 2;
        jumpToEditorButtonSaved.simulate("click");
      }
      // if last call, done() to finish spec and dispose
      else if (timesClicked === 2) {
        expect(activeEditor.id).toEqual(savedMock.editor.id);
        done();
        disposer();
      }
    });
    jumpToEditorButtonUnsaved.simulate("click");
  });
});
