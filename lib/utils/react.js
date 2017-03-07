'use babel';

import { Disposable } from 'atom';
import ReactDOM from 'react-dom';

import defaultDisposer from '../store/disposer';

export default function reactFactory(reactElement, domElement, additionalTeardown = () => {},
  disposer = defaultDisposer) {
  ReactDOM.render(reactElement, domElement);

  const disposable = new Disposable(() => {
    ReactDOM.unmountComponentAtNode(domElement);
    additionalTeardown();
  });

  disposer.add(disposable);
}
