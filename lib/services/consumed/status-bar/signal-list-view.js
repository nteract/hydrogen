/* @flow */

import SelectListView from "atom-select-list";

import type { Store } from "./../../../store";
import WSKernel from "./../../../ws-kernel";
import { log } from "./../../../utils";

const basicCommands = [
  { name: "Interrupt", value: "interrupt-kernel" },
  { name: "Restart", value: "restart-kernel" },
  { name: "Shut Down", value: "shutdown-kernel" }
];

const wsKernelCommands = [
  { name: "Rename session for", value: "rename-kernel" },
  { name: "Disconnect from", value: "disconnect-kernel" }
];

export class SignalListView {
  store: Store;
  panel: ?atom$Panel;
  previouslyFocusedElement: ?HTMLElement;
  selectListView: SelectListView;

  constructor(store: Store, handleKernelCommand: Function) {
    this.store = store;
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
        handleKernelCommand(item);
        this.cancel();
      },
      didCancelSelection: () => this.cancel(),
      emptyMessage: "No running kernels for this file type."
    });
  }

  async toggle() {
    if (this.panel != null) {
      this.cancel();
      return;
    }

    const { kernel } = this.store;
    if (!kernel) {
      this.cancel();
      return;
    }

    const commands =
      kernel.transport instanceof WSKernel
        ? [...basicCommands, ...wsKernelCommands]
        : basicCommands;

    const listItems = commands.map(command => ({
      name: `${command.name} ${kernel.kernelSpec.display_name} kernel`,
      command: command.value
    }));

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
