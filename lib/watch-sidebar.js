/* @flow */

import { CompositeDisposable } from "atom";
import _ from "lodash";
import SelectListView from "atom-select-list";

import type Kernel from "./kernel";
import WatchView from "./watch-view";
import store from "./store";

export default class WatchSidebar {
  element: HTMLElement;
  kernel: Kernel;
  resizeSidebar: Function;
  resizeStarted: Function;
  resizeStopped: Function;
  visible: boolean;
  watchesContainer: HTMLElement;
  watchViews: Array<WatchView>;

  constructor(kernel: Kernel) {
    this.resizeStarted = this.resizeStarted.bind(this);
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeSidebar = this.resizeSidebar.bind(this);
    this.kernel = kernel;
    this.element = document.createElement("div");
    this.element.classList.add("hydrogen", "watch-sidebar");

    const toolbar = document.createElement("div");
    toolbar.classList.add("toolbar", "block");

    const languageDisplay = document.createElement("div");
    languageDisplay.classList.add("language", "icon", "icon-eye");
    languageDisplay.innerText = this.kernel.kernelSpec.display_name;

    const toggleButton = document.createElement("button");
    toggleButton.classList.add("btn", "icon", "icon-remove-close");
    toggleButton.onclick = () => {
      if (!store.editor) return;
      const editor = store.editor;
      const editorView = atom.views.getView(editor);
      atom.commands.dispatch(editorView, "hydrogen:toggle-watches");
    };

    const tooltips = new CompositeDisposable();
    tooltips.add(
      atom.tooltips.add(toggleButton, { title: "Toggle Watch Sidebar" })
    );

    this.watchesContainer = document.createElement("div");
    _.forEach(this.watchViews, watch =>
      this.watchesContainer.appendChild(watch.element)
    );

    const buttonGroup = document.createElement("div");
    buttonGroup.classList.add("btn-group");
    const addButton = document.createElement("button");
    addButton.classList.add("btn", "btn-primary", "icon", "icon-plus");
    addButton.innerText = "Add watch";
    addButton.onclick = () => this.addWatch();

    const removeButton = document.createElement("button");
    removeButton.classList.add("btn", "btn-error", "icon", "icon-trashcan");
    removeButton.innerText = "Remove watch";
    removeButton.onclick = () => this.removeWatch();

    const resizeHandle = document.createElement("div");
    resizeHandle.classList.add("watch-resize-handle");
    resizeHandle.addEventListener("mousedown", this.resizeStarted);

    toolbar.appendChild(languageDisplay);
    toolbar.appendChild(toggleButton);
    buttonGroup.appendChild(addButton);
    buttonGroup.appendChild(removeButton);

    this.element.appendChild(toolbar);
    this.element.appendChild(this.watchesContainer);
    this.element.appendChild(buttonGroup);
    this.element.appendChild(resizeHandle);

    this.kernel.addWatchCallback(() => this.run());

    this.watchViews = [];
    this.addWatch();

    this.hide();
    atom.workspace.addRightPanel({ item: this.element });
  }

  createWatch() {
    let watch = _.last(this.watchViews);
    if (!watch || watch.getCode().replace(/\s/g, "") !== "") {
      watch = new WatchView(this.kernel);
      this.watchViews.push(watch);
      this.watchesContainer.appendChild(watch.element);
    }
    return watch;
  }

  addWatch() {
    this.createWatch().focus();
  }

  addWatchFromEditor() {
    if (!store.editor) return;
    const watchText = store.editor.getSelectedText();
    if (!watchText) {
      this.addWatch();
    } else {
      const watch = this.createWatch();
      watch.setCode(watchText);
      watch.run();
    }
    this.show();
  }

  removeWatch() {
    const watches = this.watchViews
      .map((v, k) => ({
        name: v.getCode(),
        value: k
      }))
      .filter(obj => obj.value !== 0 || obj.name !== "");

    const watchesPicker = new SelectListView({
      items: watches,
      elementForItem: watch => {
        const element = document.createElement("li");
        element.textContent = watch.name || "<empty>";
        return element;
      },
      didConfirmSelection: watch => {
        this.watchViews[watch.value].destroy();
        this.watchViews.splice(watch.value, 1);
        modalPanel.destroy();
        watchesPicker.destroy();
        if (this.watchViews.length === 0) this.addWatch();
        else if (previouslyFocusedElement) previouslyFocusedElement.focus();
      },
      filterKeyForItem: watch => watch.name,
      didCancelSelection: () => {
        modalPanel.destroy();
        if (previouslyFocusedElement) previouslyFocusedElement.focus();
        watchesPicker.destroy();
      },
      emptyMessage: "There are no watches to remove!"
    });
    const previouslyFocusedElement = document.activeElement;
    const modalPanel = atom.workspace.addModalPanel({
      item: watchesPicker
    });
    watchesPicker.focus();
  }

  run() {
    if (this.visible) {
      _.forEach(this.watchViews, watchView => watchView.run());
    }
  }

  resizeStarted() {
    document.addEventListener("mousemove", this.resizeSidebar);
    document.addEventListener("mouseup", this.resizeStopped);
  }

  resizeStopped() {
    // HACK: Dispatch a window resize Event for the slider history to recompute
    window.dispatchEvent(new Event("resize"));
    document.removeEventListener("mousemove", this.resizeSidebar);
    document.removeEventListener("mouseup", this.resizeStopped);
  }

  resizeSidebar({ pageX, which }: { pageX: number, which: number }) {
    if (which !== 1) this.resizeStopped();

    if (!document.body) return;
    const width = document.body.clientWidth - pageX;
    this.element.style.width = `${width}px`;
  }

  show() {
    this.element.classList.remove("hidden");
    this.visible = true;
  }

  hide() {
    this.element.classList.add("hidden");
    this.visible = false;
  }
}
