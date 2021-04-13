import { CompositeDisposable } from "atom";
import React from "react";
import { reactFactory, KERNEL_MONITOR_URI } from "../utils";
type store = typeof import("../store").default;
import KernelMonitor from "../components/kernel-monitor";
export default class KernelMonitorPane {
  element = document.createElement("div");
  disposer = new CompositeDisposable();

  constructor(store: store) {
    this.element.classList.add("hydrogen");
    reactFactory(
      <KernelMonitor store={store} />,
      this.element,
      null,
      this.disposer
    );
  }

  getTitle = () => "Hydrogen Kernel Monitor";
  getURI = () => KERNEL_MONITOR_URI;
  getDefaultLocation = () => "bottom";
  getAllowedLocations = () => ["bottom", "left", "right"];

  destroy() {
    this.disposer.dispose();
    this.element.remove();
  }
}
