import zlib from 'zlib';
import { registerFormat, create, defaultLanguage, setDefaultLanguage } from './base';
import { open, openSync } from './fs';
import TTFFont from './TTFFont';
import WOFFFont from './WOFFFont';
import WOFF2Font, { setBrotliDecompressor } from './WOFF2Font';
import TrueTypeCollection from './TrueTypeCollection';
import DFont from './DFont';

// Register font formats
registerFormat(TTFFont);
registerFormat(WOFFFont);
registerFormat(WOFF2Font);
registerFormat(TrueTypeCollection);
registerFormat(DFont);

// A WOFF2 is decompressed by the runtime's own Brotli: Node has had it since
// 10.16, Bun since 1.1.8, and Deno has it too. It is several times as fast as
// brotli.js, which a build for Node then does not load at all.
setBrotliDecompressor((buffer, size) => {
  if (typeof zlib.brotliDecompressSync !== 'function') {
    throw new Error('fontkit reads WOFF2 with the Brotli in node:zlib, which this runtime does not have (Node 10.16, Bun 1.1.8 and Deno have it)');
  }
  let bytes = zlib.brotliDecompressSync(buffer, { maxOutputLength: Math.max(size, 1) });
  // A Uint8Array, as brotli.js returns: a Buffer's slice() is a view, not a copy
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length);
});

export * from './base';
export * from './fs';
