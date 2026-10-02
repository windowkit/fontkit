# The windowkit fork of fontkit

[fontkit](https://github.com/foliojs/fontkit) with the fixes
[ntk](https://github.com/sidorares/ntk) needs before upstream has released
them. It is not published to npm. A release is a tarball on GitHub, and a
dependent names its URL:

```json
"fontkit": "https://github.com/windowkit/fontkit/releases/download/v2.0.4-windowkit.1/fontkit-2.0.4-windowkit.1.tgz"
```

## What it carries

| Patch | Upstream |
| --- | --- |
| `getVariation()` for fonts in WOFF and WOFF2 containers (#1) | [foliojs/fontkit#389](https://github.com/foliojs/fontkit/pull/389) |
| Decoded structs hold their hidden fields in private fields of a class, not `Object.defineProperties`: a face's first shaping takes a third less time (#4, `src/restructure.js`) | Not offered. The change belongs in [restructure](https://github.com/foliojs/restructure)'s `Struct#_setup` ([sidorares/ntk#437](https://github.com/sidorares/ntk/issues/437)) |
| Builds for Chrome 91 rather than 70, so those private fields stay native instead of being compiled to WeakMaps (#4) | Fork only |
| A WOFF2 is decompressed by the runtime's own Brotli in the builds for Node, which then do not load brotli.js and its 756 KB static dictionary; the browser builds keep brotli.js, and `fontkit.setBrotliDecompressor` hands them a native one. Data that does not decompress to the size the directory gives is an error (#5, #6) | Not offered yet |

When upstream releases a version with everything in this table, the fork
has done its job: point the dependent back at `fontkit` on npm.

## Cutting a release

```bash
git tag v2.0.4-windowkit.2   # <upstream version>-windowkit.<n>
git push origin v2.0.4-windowkit.2
```

`.github/workflows/release.yml` builds, runs the tests, and attaches
`fontkit-2.0.4-windowkit.2.tgz` to a GitHub release of the tag. The version
comes from the tag and is written into the tarball only: `package.json` on
master stays upstream's, so merging upstream does not conflict there.

## Taking upstream's changes

```bash
git fetch upstream
git merge upstream/master
```

then a release as above, with upstream's version in the tag if it moved.

## Why a tarball

A `github:windowkit/fontkit#<sha>` dependency has no `dist/`, which is
built, not committed. npm builds a git dependency on every install, parcel
and all the devDependencies with it (18 s measured); Bun installs it
unbuilt, and `import 'fontkit'` then fails. The tarball is what
`npm publish` would have uploaded, and installs like any package.
