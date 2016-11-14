'use babel';

import CodeManager from '../lib/code-manager';

describe('CodeManager', () => {
  let CM = null;
  beforeEach(() => {
    CM = new CodeManager();
    CM.editor = atom.workspace.buildTextEditor();
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
    beforeEach(() => spyOn(CM, 'normalizeString'));

    afterEach(() => expect(CM.normalizeString).toHaveBeenCalled());

    it('getRow', () => {
      spyOn(CM.editor, 'lineTextForBufferRow');
      CM.getRow(123);
      expect(CM.editor.lineTextForBufferRow).toHaveBeenCalledWith(123);
    });

    it('getRows', () => {
      spyOn(CM.editor, 'getTextInBufferRange');
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
      expect(CM.editor.getTextInBufferRange).toHaveBeenCalledWith(range);
    });

    it('getTextInRange', () => {
      spyOn(CM.editor, 'getTextInBufferRange');
      CM.getTextInRange([1, 2], [3, 4]);
      expect(CM.editor.getTextInBufferRange)
        .toHaveBeenCalledWith([
          [1, 2],
          [3, 4],
        ]);
    });

    it('getSelectedText', () => {
      spyOn(CM.editor, 'getSelectedText');
      CM.getSelectedText();
      expect(CM.editor.getSelectedText).toHaveBeenCalled();
    });
  });
});
