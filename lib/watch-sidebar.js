'use babel';

import { $ } from 'atom-space-pen-views';
import { CompositeDisposable } from 'atom';
import _ from 'lodash';

import WatchView from './watch-view';
import WatchesPicker from './watches-picker';

export default class WatchSidebar {
  constructor(kernel) {
    this.resizeStarted = this.resizeStarted.bind(this);
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeSidebar = this.resizeSidebar.bind(this);
    this.kernel = kernel;
    this.element = document.createElement('div');
    this.element.classList.add('hydrogen', 'watch-sidebar');

    const toolbar = document.createElement('div');
    toolbar.classList.add('toolbar');

    const languageDisplay = document.createElement('div');
    languageDisplay.classList.add('language', 'icon', 'icon-eye');
    languageDisplay.innerText = this.kernel.kernelSpec.display_name;

    const toggleButton = document.createElement('button');
    toggleButton.classList.add('btn', 'icon', 'icon-remove-close');
    toggleButton.onclick = () => {
      const editor = atom.workspace.getActiveTextEditor();
      const editorView = atom.views.getView(editor);
      atom.commands.dispatch(editorView, 'hydrogen:toggle-watches');
    };

    const tooltips = new CompositeDisposable();
    tooltips.add(atom.tooltips.add(toggleButton, { title: 'Toggle Watch Sidebar' }));

    this.watchesContainer = document.createElement('div');
    _.forEach(this.watchViews, watch => this.watchesContainer.appendChild(watch.element));

    const buttonGroup = document.createElement('div');
    buttonGroup.classList.add('btn-group');
    const addButton = document.createElement('button');
    addButton.classList.add('btn', 'btn-primary', 'icon', 'icon-plus');
    addButton.innerText = 'Add watch';
    addButton.onclick = () => this.addWatch();

    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-error', 'icon', 'icon-trashcan');
    removeButton.innerText = 'Remove watch';
    removeButton.onclick = () => this.removeWatch();

    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('watch-resize-handle');
    $(resizeHandle).on('mousedown', this.resizeStarted);

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
    if (!watch || watch.getCode().replace(/\s/g, '') !== '') {
      watch = new WatchView(this.kernel);
      this.watchViews.push(watch);
      this.watchesContainer.appendChild(watch.element);
    }
    return watch;
  }

  addWatch() {
    this.createWatch().inputElement.element.focus();
  }

  addWatchFromEditor() {
    const watchText = atom.workspace.getActiveTextEditor().getSelectedText();
    if (!watchText) {
      this.addWatch();
    } else {
      this.createWatch().setCode(watchText).run();
    }
    this.show();
  }

  removeWatch() {
    const watches = (this.watchViews.map((v, k) => ({
      name: v.getCode(),
      value: k,
    })));
    WatchesPicker.onConfirmed = (item) => {
      this.watchViews[item.value].destroy();
      this.watchViews.splice(item.value, 1);
    };
    WatchesPicker.setItems(watches);
    WatchesPicker.toggle();
  }

  run() {
    if (this.visible) {
      _.forEach(this.watchViews, watchView => watchView.run());
    }
  }

  resizeStarted() {
    $(document).on('mousemove', this.resizeSidebar);
    $(document).on('mouseup', this.resizeStopped);
  }

  resizeStopped() {
    $(document).off('mousemove', this.resizeSidebar);
    $(document).off('mouseup', this.resizeStopped);
  }

  resizeSidebar({ pageX, which }) {
    if (which !== 1) this.resizeStopped();

    const width = $(document.body).width() - pageX;
    this.element.style.width = `${width - 10}px`;
  }

  show() {
    this.element.classList.remove('hidden');
    this.visible = true;
  }

  hide() {
    this.element.classList.add('hidden');
    this.visible = false;
  }
}
