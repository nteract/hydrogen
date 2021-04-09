import { CompositeDisposable } from "atom";
import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import Display from "./display";
import type OutputStore from "../../store/output";

function RangeSlider({ outputStore }) {
  const {
    index: storeIndex,
    setIndex: setStoreIndex,
    incrementIndex,
    decrementIndex,
    outputs,
  } = outputStore;
  const sliderRef: {
    current: HTMLDivElement | null | undefined;
  } = useRef();
  useEffect(() => {
    const disposer = new CompositeDisposable();
    disposer.add(
      // $FlowFixMe
      atom.commands.add(sliderRef.current, "core:move-left", () =>
        decrementIndex()
      ), // $FlowFixMe
      atom.commands.add(sliderRef.current, "core:move-right", () =>
        incrementIndex()
      )
    );
    return () => disposer.dispose();
  }, []);

  function onIndexChange(e) {
    const newIndex = Number(e.target.value);
    setStoreIndex(newIndex);
  }

  return (
    <div className="slider" ref={sliderRef}>
      <div className="current-output">
        <span
          className="btn btn-xs icon icon-chevron-left"
          onClick={(e) => decrementIndex()}
        />
        <span>
          {storeIndex + 1}/{outputs.length}
        </span>
        <span
          className="btn btn-xs icon icon-chevron-right"
          onClick={(e) => incrementIndex()}
        />
      </div>
      <input
        className="input-range"
        max={outputs.length - 1}
        min="0"
        id="range-input"
        onChange={onIndexChange}
        type="range"
        value={storeIndex}
      />
    </div>
  );
}

const History = observer(({ store }: { store: OutputStore }) => {
  const output = store.outputs[store.index];
  return output ? (
    <div className="history output-area">
      <RangeSlider outputStore={store} />
      <div
        className="multiline-container native-key-bindings"
        tabIndex={-1}
        style={{
          fontSize: atom.config.get(`Hydrogen.outputAreaFontSize`) || "inherit",
        }}
        hydrogen-wrapoutput={atom.config.get(`Hydrogen.wrapOutput`).toString()}
      >
        <Display output={output} />
      </div>
    </div>
  ) : null;
});
export default History;
