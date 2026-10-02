# The windowkit fork of fontkit

[fontkit](https://github.com/foliojs/fontkit) with fixes that are offered
upstream and not released there yet. It is not published to npm. A release
is a tarball on GitHub, and an application names its URL:

```json
"fontkit": "https://github.com/windowkit/fontkit/releases/download/v2.0.4-windowkit.1/fontkit-2.0.4-windowkit.1.tgz"
```

## Who can depend on it: an application, not a library

npm 12 fetches no dependency named by a URL, or by a git ref, unless told
to: `allow-remote` and `allow-git` default to `none`. An application can
say so for its own dependencies, with `allow-remote=root` in its `.npmrc`,
and then the line above works in its `dependencies`. As an `overrides`
entry, replacing the fontkit a library depends on, it takes
`allow-remote=all` (tried with npm 12.1.0: `root` refuses it). A published
library cannot depend on the tarball at all: its dependency is a dependency
of a dependency to whoever installs it, which only `all` lets through, and
that is the installing application's to set.

[ntk](https://github.com/sidorares/ntk) found this out. 8.17.2 depended on
the tarball, its publish job failed in `npm ci` with `EALLOWREMOTE`, and
the version never reached the registry. ntk depends on fontkit from npm
again and does what it needed the fork for by itself
(sidorares/ntk#485). So nothing depends on this fork today: it is where the
upstream pull requests below come from, and a build to point an application
at while they wait.

## What it carries

| Patch | Upstream |
| --- | --- |
| `getVariation()` for fonts in WOFF and WOFF2 containers (#1) | [foliojs/fontkit#389](https://github.com/foliojs/fontkit/pull/389) |
| Decoded structs hold their hidden fields in private fields of a class, not `Object.defineProperties`: a face's first shaping takes a third less time (#4, `src/restructure.js`) | Not offered. The change belongs in [restructure](https://github.com/foliojs/restructure)'s `Struct#_setup` ([sidorares/ntk#437](https://github.com/sidorares/ntk/issues/437)) |
| Builds for Chrome 91 rather than 70, so those private fields stay native instead of being compiled to WeakMaps (#4) | Fork only |

When upstream releases a version with everything in this table, the fork
has done its job.

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

## Why a tarball and not a git dependency

A `github:windowkit/fontkit#<sha>` dependency has no `dist/`, which is
built, not committed. npm builds a git dependency on every install, parcel
and all the devDependencies with it (18 s measured), where it fetches one
at all (`allow-git`, above); Bun installs it unbuilt, and `import 'fontkit'`
then fails. The tarball is what `npm publish` would have uploaded.
