'use babel';

export default class StatusView {

  constructor(language) {
    this.language = language;
    this.element = document.createElement('a');

    this.element.textContent = `${this.language}: starting`;
  }


  setStatus(status) {
    this.element.textContent = `${this.language}: ${status}`;
  }


  destroy() {
    this.element.textContent = '';
    this.element.remove();
  }
}
