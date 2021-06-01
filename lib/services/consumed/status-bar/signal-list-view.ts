import { Panel } from "atom";
import SelectListView from "atom-select-list";
import WSKernel from "../../../ws-kernel";
import { log, setPreviouslyFocusedElement } from "../../../utils";
import type { Store } from "../../../store";

const basicCommands = [
  {
    name: "Interrupt",
    value: "interrupt-kernel",
  },
  {
    name: "Restart",
    value: "restart-kernel",
  },
  {
    name: "Shut Down",
    value: "shutdown-kernel",
  },
];
const wsKernelCommands = [
  {
    name: "Rename session for",
    value: "rename-kernel",
  },
  {
    name: "Disconnect from",
    value: "disconnect-kernel",
  },
];

interface SelectListItem {
  name: string;
  command: string;
}
export default class SignalListView {
  panel: Panel | null | undefined;
  previouslyFocusedElement: HTMLElement | null | undefined;
  selectListView: SelectListView;
  store: Store | null | undefined;
  handleKernelCommand: ((...args: Array<any>) => any) | null | undefined;

  constructor(store: Store, handleKernelCommand: (...args: Array<any>) => any) {
    this.store = store;
    this.handleKernelCommand = handleKernelCommand;
    this.selectListView = new SelectListView({
      itemsClassList: ["mark-active"],
      items: [] as SelectListItem[],
      filterKeyForItem: (item: SelectListItem) => item.name,
      elementForItem: (item: SelectListItem) => {
        const element = document.createElement("li");
        element.textContent = item.name;
        return element;
      },
      didConfirmSelection: (item: SelectListItem) => {
        log("Selected command:", item);
        this.onConfirmed(item);
        this.cancel();
      },
      didCancelSelection: () => this.cancel(),
      emptyMessage: "No running kernels for this file type.",
    });
  }

  onConfirmed(kernelCommand: { command: string }) {
    if (this.handleKernelCommand) {
      this.handleKernelCommand(kernelCommand, this.store);
    }
  }

  async toggle() {
    if (this.panel != null) {
      this.cancel();
    }

    if (!this.store) {
      return;
    }
    const kernel = this.store.kernel;
    if (!kernel) {
      return;
    }
    const commands =
      kernel.transport instanceof WSKernel
        ? [...basicCommands, ...wsKernelCommands]
        : basicCommands;
    const listItems = commands.map((command) => ({
      name: `${command.name} ${kernel.kernelSpec.display_name} kernel`,
      command: command.value,
    }));
    await this.selectListView.update({
      items: listItems,
    });
    this.attach();
  }

  attach() {
    setPreviouslyFocusedElement(this);
    if (this.panel == null) {
      this.panel = atom.workspace.addModalPanel({
        item: this.selectListView,
      });
    }
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
