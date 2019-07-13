/* @flow */

import React from "react";
import { observer } from "mobx-react";
import Display from "./display";
import Slider from "react-rangeslider";

import type OutputStore from "../../store/output";

const counterStyle = {
  position: "absolute",
  pointerEvents: "none",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)"
};

const History = observer(({ store }: { store: OutputStore }) => {
  const output = store.outputs[store.index];
  return output ? (
    <div className="history">
      <div className="slider">
        <div
          className="btn btn-xs icon icon-chevron-left"
          style={{ position: "absolute", left: "0px" }}
          onClick={store.decrementIndex}
        />
        <Slider
          min={0}
          max={store.outputs.length - 1}
          value={store.index}
          onChange={store.setIndex}
          tooltip={false}
        />
        <div style={counterStyle}>
          {store.index + 1}/{store.outputs.length}
        </div>
        <div
          className="btn btn-xs icon icon-chevron-right"
          style={{ position: "absolute", right: "0px" }}
          onClick={store.incrementIndex}
        />
      </div>
      <div
        className="multiline-container native-key-bindings"
        tabIndex="-1"
        style={{
          fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit"
        }}
        hydrogen-wrapoutput={atom.config.get(`Hydrogen.wrapOutput`).toString()}
      >
        <Display output={output} />
      </div>
    </div>
  ) : null;
});

export default History;
