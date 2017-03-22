'use babel';

import ReactDOM from 'react-dom';
import { CompositeDisposable } from 'atom';

import { reactFactory, grammarToLanguage } from './../lib/utils';

describe('grammarToLanguage', () => {
  expect(grammarToLanguage({ name: 'Kernel Name' })).toEqual('kernel name');
  expect(grammarToLanguage(null)).toBeNull();
  expect(grammarToLanguage(undefined)).toBeNull();
});

describe('reactFactory', () => {
  const compDisposable = new CompositeDisposable();
  spyOn(compDisposable, 'add').andCallThrough();
  spyOn(ReactDOM, 'render');
  spyOn(ReactDOM, 'unmountComponentAtNode');
  const teardown = jasmine.createSpy('teardown');

  reactFactory('reactElement', 'domElement', teardown, compDisposable);

  expect(ReactDOM.render).toHaveBeenCalledWith('reactElement', 'domElement');
  expect(compDisposable.add).toHaveBeenCalled();

  expect(ReactDOM.unmountComponentAtNode).not.toHaveBeenCalled();
  expect(teardown).not.toHaveBeenCalled();
  compDisposable.dispose();
  expect(ReactDOM.unmountComponentAtNode).toHaveBeenCalledWith('domElement');
  expect(teardown).toHaveBeenCalled();
});
