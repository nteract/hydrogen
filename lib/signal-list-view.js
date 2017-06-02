/* @flow */

import SelectListView from "atom-select-list";
import _ from "lodash";

import WSKernel from "./ws-kernel";
import kernelManager from "./kernel-manager";
import { log } from "./utils";
import store from "./store";

export type KernelCommand = {
  command: string,
  payload: ?Kernelspec
};

export default class SignalListView {
  basicCommands: Array<Object>;
  onConfirmed: ?(command: KernelCommand) => void;
  panel: ?atom$Panel;
  previouslyFocusedElement: ?HTMLElement;
  selectListView: SelectListView;
  switchCommands: Array<Object>;
  wsKernelCommands: Array<Object>;

  constructor() {
    this.basicCommands = [
      { name: "Interrupt", value: "interrupt-kernel" },
      { name: "Restart", value: "restart-kernel" },
      { name: "Shut Down", value: "shutdown-kernel" }
    ];

    this.wsKernelCommands = [
      { name: "Rename session for", value: "rename-kernel" },
      { name: "Disconnect from", value: "disconnect-kernel" }
    ];

    this.switchCommands = [{ name: "Switch to", value: "switch-kernel" }];
    this.onConfirmed = null;
    this.selectListView = new SelectListView({
      itemsClassList: ["mark-active"],
      items: [],
      filterKeyForItem: item => item.name,
      elementForItem: item => {
        const element = document.createElement("li");
        element.textContent = item.name;
        return element;
      },
      didConfirmSelection: item => {
        log("Selected command:", item);
        if (this.onConfirmed) this.onConfirmed(item);
        this.cancel();
      },
      didCancelSelection: () => this.cancel(),
      emptyMessage: "No running kernels for this file type."
    });
  }

  _mapCommands(commands: Array<Object>, kernelSpec: Kernelspec) {
    return commands.map(command => ({
      name: `${command.name} ${kernelSpec.display_name} kernel`,
      command: command.value,
      payload: command.value === "switch-kernel" ? kernelSpec : null
    }));
  }

  async toggle() {
    if (this.panel != null) {
      this.cancel();
    }

    const grammar = store.grammar;
    const kernel = store.kernel;
    let listItems = [];
    if (!kernel) return;

    if (kernel instanceof WSKernel) {
      listItems = this._mapCommands(
        _.union(this.basicCommands, this.wsKernelCommands),
        kernel.kernelSpec
      );
    } else {
      const otherKernels = kernelManager.getAllKernelSpecsForGrammar(
        grammar,
        kernelSpecs => _.without(kernelSpecs, kernel.kernelSpec)
      );

      if (otherKernels) {
        listItems = _.union(
          this._mapCommands(this.basicCommands, kernel.kernelSpec),
          _.flatMap(otherKernels, otherKernel =>
            this._mapCommands(this.switchCommands, otherKernel)
          )
        );
      } else {
        listItems = this._mapCommands(this.basicCommands, kernel.kernelSpec);
      }
    }
    await this.selectListView.update({ items: listItems });
    this.attach();
  }

  attach() {
    this.previouslyFocusedElement = document.activeElement;
    if (this.panel == null)
      this.panel = atom.workspace.addModalPanel({ item: this.selectListView });
    this.selectListView.focus();
    this.selectListView.reset();
  }

  destroy() {
    this.cancel();
    return this.selectListView.destroy();
  }

  cancel() {
    if (this.panel != null) {
      this.panel.destroy();
    }
    this.panel = null;
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }
}
