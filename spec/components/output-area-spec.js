"use babel";

import React from "react";
import Enzyme, { shallow } from "enzyme";

import OutputArea from "../../lib/components/output-area";
import { Store } from "../../lib/store";
import KernelTransport from "../../lib/kernel-transport";
import Kernel from "../../lib/kernel";

describe("Output area component", () => {
  let storeMock, mockKernel, filePath, grammar, editor, component;
  let errorOutput = {
    ename: "NameError",
    evalue: "error message",
    output_type: "error",
    traceback: [
      "\u001b[0;31m---------------------------------------------------------------------------\u001b[0m",
      "\u001b[0;31mNameError\u001b[0m                                 Traceback (most recent call last)",
      '\u001b[0;32m<ipython-input-1-2f58efa4eb0f>\u001b[0m in \u001b[0;36m<module>\u001b[0;34m()\u001b[0m\n\u001b[0;32m----> 1\u001b[0;31m \u001b[0;32mraise\u001b[0m \u001b[0mNameError\u001b[0m\u001b[0;34m(\u001b[0m\u001b[0;34m"Test Error"\u001b[0m\u001b[0;34m)\u001b[0m\u001b[0;34m\u001b[0m\u001b[0m\n\u001b[0m',
      "\u001b[0;31mNameError\u001b[0m: Test Error"
    ]
  };

  let streamOutput = {
    name: "stdout",
    text: " hello",
    output_type: "stream"
  };

  let executeResultOutput = {
    execution_count: 1,
    metadata: {},
    data: {
      "text/plain": "This is a message",
      "text/html": "<div>This <b>is</b> a message</div>"
    },
    output_type: "execute_result"
  };

  beforeAll(() => {
    storeMock = new Store();
    mockKernel = new Kernel(
      new KernelTransport(
        {
          display_name: "Python 3",
          language: "python"
        },
        { name: "python" }
      )
    );
    spyOn(mockKernel, "inspect");

    grammar = atom.grammars.grammarForScopeName("source.python");
    editor = atom.workspace.buildTextEditor();
    editor.setGrammar(grammar);
    filePath = "fake.py";
    spyOn(editor, "getPath").and.returnValue(filePath);

    storeMock.updateEditor(editor);
    storeMock.newKernel(mockKernel, filePath, editor, grammar);
  });

  afterAll(() => {
    storeMock.dispose();
  });

  describe("Copy output feature", () => {
    it("Should copy stream output properly", () => {
      storeMock.kernel.outputStore.appendOutput(streamOutput);
      component = shallow(<OutputArea store={storeMock} />);

      component.find("button.btn.icon.icon-clippy").simulate("click");
      expect(atom.clipboard.read()).toBe(streamOutput.text);
    });

    it("Should copy execution results properly", () => {
      storeMock.kernel.outputStore.appendOutput(executeResultOutput);
      component.find("button.btn.icon.icon-clippy").simulate("click");

      expect(typeof atom.clipboard.read()).toBe("string");
      expect(atom.clipboard.read()).toBe(
        executeResultOutput.data["text/plain"]
      );
    });

    it("Should copy error output properly", () => {
      storeMock.kernel.outputStore.appendOutput(errorOutput);
      component.find("button.btn.icon.icon-clippy").simulate("click");

      expect(typeof atom.clipboard.read()).toBe("string");
      expect(atom.clipboard.read()).toContain(`<ipython-input-1`);
      expect(atom.clipboard.read()).toContain(errorOutput.ename);
    });
  });
});
