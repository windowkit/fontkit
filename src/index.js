import brotli from 'brotli/decompress.js';
import { registerFormat, create, defaultLanguage, setDefaultLanguage } from './base';
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

// A WOFF2 is decompressed by brotli.js, a Brotli decoder in JavaScript
setBrotliDecompressor(brotli);

export { setBrotliDecompressor } from './WOFF2Font';
export * from './base';
