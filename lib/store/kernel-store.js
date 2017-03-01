'use babel';

import { observable } from 'mobx';
import { grammarToLanguage } from './../utils';

export default class KernelStore {
  @observable executionState = 'loading'

  constructor(kernelClass) {
    this.kernelClass = kernelClass;
    this.kernelSpec = kernelClass.kernelSpec;
    this.name = grammarToLanguage(kernelClass.grammar);
    this.displayName = kernelClass.kernelSpec.display_name;
  }
}
