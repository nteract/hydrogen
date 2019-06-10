"use babel";

import React from "react";
import Enzyme, { mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import Display, {
  isTextOutputOnly,
  supportedMediaTypes
} from "../../lib/components/result-view/display";

Enzyme.configure({ adapter: new Adapter() });

const testOutput = {
  output_type: "display_data",
  data: {
    "text/html": "<p>This is some HTML that <b>WILL</b> render</p>",
    "text/plain": "This is some plain text that WILL NOT render"
  },
  metadata: {}
};

describe("Display output", () => {
  const wrapper = mount(<Display output={testOutput} />);
  it("renders the richest supported output", () => {
    expect(wrapper.find("Plain").exists()).toEqual(false);
    expect(wrapper.find("HTML").exists()).toEqual(true);
  });
});

describe("textOutputOnly", () => {
  let plainBundle = {
    "text/plain": "I'm very plain",
    "text/output-not-supported": "This should be ignored"
  };
  let richerBundle = {
    "text/plain": "I'm very plain",
    "text/html": "<div>I am a little <b>richer</b>!</div>"
  };
  it("should return true if text is the richest supported output", () => {
    expect(isTextOutputOnly(plainBundle)).toEqual(true);
    expect(isTextOutputOnly(richerBundle)).toEqual(false);
  });
});
