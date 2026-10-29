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
| Decoded structs hold their hidden fields in private fields of a class, not `Object.defineProperties`: a face's first shaping takes a quarter less time (#4, `src/restructure.js`; on upstream's master of 2026-10-28, 23.3 ms against 17.5 for SourceSansPro, the median of fifteen fresh processes) | Not offered. The change belongs in [restructure](https://github.com/foliojs/restructure)'s `Struct#_setup` ([sidorares/ntk#437](https://github.com/sidorares/ntk/issues/437)) |
| `fontkit.setBrotliDecompressor` hands a build what decompresses a WOFF2, so a browser build that runs where there is a native Brotli can use it. Data that does not decompress to the size the table directory gives is an error (#5, #6, `src/WOFF2Font.js`) | Not offered yet. The Node build's own native Brotli, which was the rest of #5, is upstream's now |
| The browser build in one file as well, `dist/browser-module.mjs`, for a dependent that carries the build itself rather than installing it. ntk does (`rolldown.config.ts`) | Fork only |

It also has, from upstream's master, what fontkit has not released since
2.0.4. Three of those were the fork's patches until upstream took them:

- variations of fonts in WOFF and WOFF2 containers, the fork's #1, as
  [foliojs/fontkit#411](https://github.com/foliojs/fontkit/pull/411);
- a feature the caller asks for applies to every glyph, the fork's #7, as
  [foliojs/fontkit#294](https://github.com/foliojs/fontkit/pull/294), and
  `layout()` leaves the features object it is handed as it was, as
  [#371](https://github.com/foliojs/fontkit/pull/371);
- the Node build decompresses with the runtime's zlib.

When upstream releases a version with everything in the table, the fork has
done its job: point the dependent back at `fontkit` on npm.

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
built, not committed. npm builds a git dependency on every install, the
bundler and all the devDependencies with it (18 s measured, with parcel);
Bun installs it unbuilt, and `import 'fontkit'` then fails. The tarball is
what `npm publish` would have uploaded, and installs like any package.
