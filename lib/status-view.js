export default class StatusView {

  constructor(language) {
    this.language = language;
    this.element = document.createElement('div');
    this.element.classList.add('hydrogen');
    this.element.classList.add('status');

    this.element.innerText = `${this.language}: starting`;
  }


  setStatus(status) {
    this.element.innerText = `${this.language}: ${status}`;
  }


  destroy() {
    this.element.innerHTML = '';
    this.element.remove();
  }
}
