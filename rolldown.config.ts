import { defineConfig } from 'rolldown';

const external = [
  'fs',
  'restructure',
  'dfa',
  'fflate',
  'unicode-properties',
  'unicode-trie',
  'brotli/decompress.js',
];

function createConfig(platform: 'node' | 'browser') {
  return defineConfig({
    platform,
    input: {
      index: platform === 'node' ? 'src/node.js' : 'src/index.js',
      core: 'src/core.js',
      'formats/TTFFont': 'src/TTFFont.js',
      'formats/WOFFFont': 'src/WOFFFont.js',
      'formats/WOFF2Font': 'src/WOFF2Font.js',
      'formats/TrueTypeCollection': 'src/TrueTypeCollection.js',
      'formats/DFont': 'src/DFont.js',
    },
    external,
    preserveEntrySignatures: 'allow-extension',
    transform: {
      target:
        platform === 'node'
          ? ['node22']
          : ['firefox115', 'safari16', 'chrome120'],
    },
    output: {
      format: 'esm',
      dir: `dist/${platform}`,
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/[name]-[hash].js',
      minifyInternalExports: false,
      cleanDir: true,
    },
  });
}

// The windowkit fork's: the browser build in one file, which a dependent
// can carry as it is. ntk does (see WINDOWKIT.md).
const singleFile = defineConfig({
  platform: 'browser',
  input: 'src/index.js',
  external,
  transform: { target: ['firefox115', 'safari16', 'chrome120'] },
  output: { format: 'esm', file: 'dist/browser-module.mjs' },
});

export default [createConfig('node'), createConfig('browser'), singleFile];
