'use babel';

import { CompositeDisposable } from 'atom';
import { isObservableMap, isObservable } from 'mobx';
import store from './../lib/store';

describe('Store initialize', () => {
  it('should correctly initialize store', () => {
    expect(store.subscriptions instanceof CompositeDisposable).toBeTruthy();
    expect(isObservableMap(store.runningKernels)).toBeTruthy();
    expect(isObservable(store, 'editor')).toBeTruthy();
    expect(store.grammar).toBeUndefined();
    expect(store.kernel).toBeUndefined();
    expect(store.language).toBeNull();
  });
});

describe('Store', () => {
  beforeEach(() => {
    store.subscriptions = new CompositeDisposable();
    store.runningKernels = new Map();
    store.editor = null;
    store.grammar = null;
  });

  it('should set grammar and determine language and current kernel', () => {
    const editor = atom.workspace.buildTextEditor();
    store.runningKernels.set('null grammar', 'current kernel');
    store.runningKernels.set('mock grammar', 'not current kernel');
    store.setGrammar(editor);
    expect(store.grammar).toBe(editor.getGrammar());
    expect(store.language).toBe('null grammar');
    expect(store.kernel).toBe('current kernel');
  });

  it('should add new kernel', () => {
    const kernel = { language: 'null grammar', foo: 'bar' };
    store.newKernel(kernel);
    expect(store.runningKernels.size).toBe(1);
    expect(store.runningKernels.get('null grammar')).toBe(kernel);
  });

  it('should delete kernel', () => {
    store.runningKernels.set('lang1', 'foo');
    store.runningKernels.set('lang2', 'bar');
    expect(store.runningKernels.size).toBe(2);
    store.deleteKernel('lang1');
    expect(store.runningKernels.size).toBe(1);
    expect(store.runningKernels.get('lang2')).toBe('bar');
  });

  it('should update editor', () => {
    expect(store.editor).toBeNull();
    const editor = atom.workspace.buildTextEditor();
    store.updateEditor(editor);
    expect(store.editor).toBe(editor);
  });

  it('should dispose kernels and subscriptions', () => {
    spyOn(store.subscriptions, 'dispose');
    const kernel1 = jasmine.createSpyObj('kernel1', ['destroy']);
    const kernel2 = jasmine.createSpyObj('kernel2', ['destroy']);
    store.runningKernels.set('lang1', kernel1);
    store.runningKernels.set('lang2', kernel2);
    store.dispose();
    expect(store.runningKernels.size).toBe(0);
    expect(kernel1.destroy).toHaveBeenCalled();
    expect(kernel2.destroy).toHaveBeenCalled();
    expect(store.subscriptions.dispose).toHaveBeenCalled();
  });
});
