'use babel';

import * as CM from '../lib/code-manager';
import store from '../lib/store';

describe('CodeManager', () => {
  beforeEach(() => {
    store.updateEditor(atom.workspace.buildTextEditor());
  });

  describe('Convert line endings', () => {
    it('should replace CRLF and CR with LF line endings', () => {
      const string = 'foo\nbar';
      expect(CM.normalizeString('foo\nbar')).toEqual(string);
      expect(CM.normalizeString('foo\r\nbar')).toEqual(string);
      expect(CM.normalizeString('foo\rbar')).toEqual(string);
    });
  });

  describe('Get code', () => {
    // normalizeString should be called
    // beforeEach(() => spyOn(CM, 'normalizeString'));
    // afterEach(() => expect(CM.normalizeString).toHaveBeenCalled());

    it('getRow', () => {
      spyOn(store.editor, 'lineTextForBufferRow');
      CM.getRow(123);
      expect(store.editor.lineTextForBufferRow).toHaveBeenCalledWith(123);
    });

    it('getRows', () => {
      spyOn(store.editor, 'getTextInBufferRange');
      CM.getRows(1, 10);
      const range = {
        start: {
          row: 1,
          column: 0,
        },
        end: {
          row: 10,
          column: 9999999,
        },
      };
      expect(store.editor.getTextInBufferRange).toHaveBeenCalledWith(range);
    });

    it('getTextInRange', () => {
      spyOn(store.editor, 'getTextInBufferRange');
      CM.getTextInRange([1, 2], [3, 4]);
      expect(store.editor.getTextInBufferRange)
        .toHaveBeenCalledWith([
          [1, 2],
          [3, 4],
        ]);
    });

    it('getSelectedText', () => {
      spyOn(store.editor, 'getSelectedText');
      CM.getSelectedText();
      expect(store.editor.getSelectedText).toHaveBeenCalled();
    });
  });
});
