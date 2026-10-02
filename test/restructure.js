import * as fontkit from 'fontkit';
import assert from 'assert';
import fs from 'fs';
import * as restructure from 'restructure';
import * as local from '../src/restructure.js';

describe('decoded structs', function () {
  let font = fontkit.openSync(new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url));

  it('should keep the hidden fields out of keys and JSON', function () {
    let keys = Object.keys(font.hhea);
    for (let hidden of ['parent', '_startOffset', '_currentOffset', '_length']) {
      assert(!keys.includes(hidden), hidden);
    }
    for (let key in font.hhea) {
      assert(!key.startsWith('_') && key !== 'parent', key);
    }
    assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(font.hhea))), keys);
    assert.deepEqual(Object.keys(Object.assign({}, font.hhea)), keys);
  });

  it('should read the hidden fields', function () {
    let head = font.head;
    assert.equal(head.parent, font);
    assert.equal(head._startOffset, font.directory.tables.head.offset);
    assert.equal(head._length, font.directory.tables.head.length);
    assert.equal(head._currentOffset, 54);
  });

  it('should refuse a write to a read-only hidden field', function () {
    assert.throws(() => { font.head.parent = null; }, TypeError);
    assert.throws(() => { font.head._startOffset = 0; }, TypeError);
    assert.equal(font.head.parent, font);
  });

  it('should read the hidden fields of a copy as undefined', function () {
    // what the clone package makes, and subsets copy maxp, head and hhea with
    let copy = Object.create(Object.getPrototypeOf(font.maxp));
    assert.equal(copy.parent, undefined);
    assert.equal(copy._startOffset, undefined);
  });

  it('should re-export everything restructure exports', function () {
    assert.deepEqual(Object.keys(local).filter(k => k !== 'DecodedStruct').sort(), Object.keys(restructure).sort());
    for (let name of Object.keys(restructure)) {
      if (name !== 'Struct' && name !== 'VersionedStruct') {
        assert.equal(local[name], restructure[name], name);
      }
    }
  });

  it('should declare every struct with the local Struct', function () {
    let src = new URL('../src/', import.meta.url);
    let files = fs.readdirSync(src, { recursive: true }).filter(f => f.endsWith('.js') && f !== 'restructure.js');
    let direct = files.filter(f => {
      let text = fs.readFileSync(new URL(f, src), 'utf8');
      return /\br\.(Struct|VersionedStruct)\b/.test(text) && /import \* as r from 'restructure'/.test(text);
    });
    assert.deepEqual(direct, []);
  });
});
