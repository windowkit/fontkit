import * as fontkit from 'fontkit';
import * as browserBuild from '../dist/browser-module.mjs';
import assert from 'assert';
import { execFileSync } from 'child_process';
import fs from 'fs';
import zlib from 'zlib';

// Every WOFF2 in test/data
const files = [
  'Mada/Mada-VF.woff2',
  'fonttest/TestGVARFour.woff2',
  'fonttest/TestGVAROne.untransformed.woff2',
  'fonttest/TestGVAROne.woff2',
  'fonttest/AdobeVFPrototype-Subset.woff2',
  'SourceSansPro/SourceSansPro-Regular.ttf.woff2',
  'SourceSansPro/SourceSansPro-Regular.woff2',
  'SourceSansPro/SourceSansPro-Regular.otf.woff2'
].map(file => new URL(`data/${file}`, import.meta.url));

function decompressed(font) {
  font._decompress();
  return font.stream.buffer;
}

describe('WOFF2 decompression', function () {
  it('gives the same tables in a build for Node, with the runtime\'s Brotli, as brotli.js does', function () {
    for (let file of files) {
      let buffer = fs.readFileSync(file);
      let native = decompressed(fontkit.create(buffer));
      let js = decompressed(browserBuild.create(buffer));
      assert.ok(Buffer.from(native).equals(Buffer.from(js)), file.pathname);
      // a Uint8Array, as brotli.js returns: a Buffer's slice() would be a view
      assert.equal(Object.getPrototypeOf(native), Uint8Array.prototype, file.pathname);
    }
  });

  it('does not load brotli.js in a build for Node', function () {
    for (let build of ['module.mjs', 'main.cjs']) {
      let source = fs.readFileSync(new URL(`../dist/${build}`, import.meta.url), 'utf8');
      assert.ok(!source.includes('brotli/'), build);
    }

    // nor anything else that does, in a process that reads a WOFF2
    let script = `
      import { createRequire } from 'module';
      const fontkit = await import('fontkit');
      const font = fontkit.openSync(${JSON.stringify(files[6].pathname)});
      font.layout('Handgloves').glyphs.forEach(glyph => glyph.path);
      const loaded = Object.keys(createRequire(import.meta.url).cache);
      console.log(JSON.stringify(loaded.filter(path => path.includes('/brotli/'))));
    `;
    let out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8'
    });
    assert.deepEqual(JSON.parse(out), []);
  });

  it('throws on data that does not decompress, in either build', function () {
    let buffer = Buffer.from(fs.readFileSync(files[6]));
    let at = fontkit.create(buffer)._dataPos + 2000;
    for (let i = 0; i < 8; i++) {
      buffer[at + i] ^= 0xa5;
    }

    for (let build of [fontkit, browserBuild]) {
      let font = build.create(buffer);
      assert.throws(() => font.getGlyph(1).path, err => {
        assert.match(err.message, /^Error decoding compressed data in WOFF2: ./);
        assert.ok(err.cause, 'the decoder\'s own error rides along');
        return true;
      });
    }
  });

  it('takes a decompressor from outside, in either build, and hands back the one it replaces', function () {
    let buffer = fs.readFileSync(files[6]);
    for (let build of [fontkit, browserBuild]) {
      let calls = 0;
      let previous = build.setBrotliDecompressor((data, size) => {
        calls++;
        return previous(data, size);
      });
      try {
        build.create(buffer)._decompress();
        assert.equal(calls, 1);
      } finally {
        assert.notEqual(build.setBrotliDecompressor(previous), previous);
      }
      build.create(buffer)._decompress();
      assert.equal(calls, 1, 'and the default is back');

      assert.throws(() => build.setBrotliDecompressor(null), TypeError);
    }
  });

  it('gives a browser build handed the runtime\'s Brotli the tables brotli.js does', function () {
    let native = (buffer, size) => {
      let bytes = zlib.brotliDecompressSync(buffer, { maxOutputLength: Math.max(size, 1) });
      return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length);
    };
    for (let file of files) {
      let buffer = fs.readFileSync(file);
      let js = Buffer.from(decompressed(browserBuild.create(buffer)));
      let previous = browserBuild.setBrotliDecompressor(native);
      try {
        assert.ok(Buffer.from(decompressed(browserBuild.create(buffer))).equals(js), file.pathname);
      } finally {
        browserBuild.setBrotliDecompressor(previous);
      }
    }
  });

  it('throws on data of another size than the table directory gives', function () {
    let buffer = fs.readFileSync(files[6]);
    // short, long, and none at all: Deno's zlib answers a corrupt stream so
    for (let length of [-1, +1, null]) {
      let previous = fontkit.setBrotliDecompressor((data, size) => new Uint8Array(length === null ? 0 : size + length));
      try {
        assert.throws(() => fontkit.create(buffer)._decompress(), {
          message: /^Error decoding compressed data in WOFF2: \d+ bytes, where the table directory gives \d+$/
        });
      } finally {
        fontkit.setBrotliDecompressor(previous);
      }
    }
  });
});
