# Development

These sections extend the [root README](../README.md).

## Type checks

`npm run typecheck` resolves the native files of the platform seam;
`npm run typecheck:web` re-runs the same program against the `.web` siblings
(`tsconfig.web.json` sets `moduleSuffixes`), which is the resolution every web
consumer and the emitted declarations use. Both are part of `npm run verify`.

## Built declarations

`npm run test:dist` re-runs the declaration guard in
`tests/unit/distDeclarations.test.ts` against build output. `npm test` includes
it too, but it skips there on a clean checkout because `dist` does not exist
yet, so `npm run verify` runs it again right after `npm run build` — that is
the run that actually proves `dist/node` names no `react-native`.

## Complete check

Run the full JavaScript verification suite with:

```bash
cargo xtask check
```

## AI review

Run the same read-only AI review wrapper used by the accounting repo with:

```bash
cargo xtask review
```

## Mockup catalogue

The [mockup catalogue](mockups/README.md) draws the library parts in use,
at phone and desktop sizes. Run it locally with:

```bash
npm run mockups:serve   # serve the catalogue and watch edits
npm run mockups:check   # type-check, then build in strict mode
```

`npm run mockups:check` writes the build to `.context/mockups/static/`.
`npm run verify` and CI do not run the mockup commands.

## Browser tests and package smoke test

Browser interaction tests start Storybook through Playwright with file watching
disabled by `STORYBOOK_DISABLE_WATCH=1`, so workspace writes cannot reload test
pages. A reused development server keeps live reload but ignores `.context/`.
Storybook is built to `storybook-static`. `npm run test:package` builds a
packed tarball, installs it into temporary consumers, imports every public
package subpath with Node's native ESM resolver, typechecks those subpaths with
TypeScript's NodeNext resolver, and then verifies the same subpaths through a
Vite build.

## Accessibility sweep

The axe accessibility gate discovers every Storybook story at runtime and
splits the sorted story list into sixteen deterministic shards. Playwright runs
those shards across its workers so the complete sweep does not depend on one
long-running test. `UPDATE_A11Y_BASELINE=1 npm run test:browser -- a11y.spec.ts`
uses one serial sweep instead, ensuring `axe-baseline.json` has a single writer.

## Story snapshots

The story snapshot sweep (`tests/browser/snapshots.spec.ts`) is the visual and
ARIA regression gate. It discovers the same story list at runtime, renders every
story alone in a fresh 900x600 context (`deviceScaleFactor: 1`, reduced motion,
forced light scheme, `en-US`, UTC), and pins two baselines per story: a
full-viewport PNG and an ARIA snapshot of the rendered document. It runs in four
shards. Re-record after an intentional visual change with
either of:

```bash
npx playwright test snapshots --update-snapshots   # four shards, faster
SNAPSHOT_UPDATE=1 npx playwright test snapshots    # one serial sweep
```

Baselines live in `tests/browser/snapshots.spec.ts-snapshots/` as
`<story-id>-linux.png` and `<story-id>.aria.yml`. **The screenshots are
Linux-only.** CI and the development VM both run Linux; macOS rasterizes text
differently, so a macOS checkout will see whole-suite pixel diffs and must never
re-record them. ARIA snapshots carry no platform suffix, because an
accessibility tree does not depend on the rasterizer. A newly added story has no
baseline, and CI runs Playwright in its default `missing` mode, which writes the
file and then fails; record the two new files on Linux with the same command and
commit them alongside the story.

## Storybook fonts

So that every Linux machine rasterizes the same glyphs, Storybook bundles its
own fonts through `.storybook/fonts.ts`: Inter for `theme.fonts.sans`, JetBrains
Mono registered as `Menlo` for `theme.fonts.mono`, the same Inter files
registered as `Segoe UI` for the system stack the primitives give text a
component leaves unstyled, and two Noto subsets as in-family fallbacks for the arrows,
maths relations and symbols (⌘ ★ ✓ ✕ braille) none of those faces carry. These
are Storybook devDependencies only — the published package ships no fonts and
consumers are unaffected.

## Storybook prop docgen

Storybook's prop docgen is switched off (`typescript: { reactDocgen: false }`).
Its importer resolves module specifiers without the `.web` preference, so it
follows every story's `src/primitives` import to the native file and into
`react-native`'s Flow source, which it cannot parse; it only survives by
rewriting that path to `react-native-web/dist/index.js` when that package is
installed. Nothing here reads docgen output — no story declares `args` or
`argTypes`, there is no autodocs tag or `.mdx` file, and both suites render
`iframe.html` — so the option is off and `react-native-web` is not installed at
all. `.storybook/main.ts` carries the note.

## Snapshot opt-outs

Stories that cannot be pinned — a `requestAnimationFrame` loop that ignores
reduced motion, or an accessibility tree that is legitimately empty — are listed
with a one-line reason in `tests/browser/snapshotOptOuts.ts`, which is the only
place an opt-out may be declared.

## Storybook port

Playwright uses `STORYBOOK_PORT` when set, then Conductor's workspace-specific
`CONDUCTOR_PORT`, and otherwise port `6006`. This lets browser checks run safely
alongside previews from parallel workspaces.

## Package export map

The package export map intentionally separates runtime targets:

- The standard `import` condition points at `dist/node/**`, where relative ESM
  specifiers include explicit `.js` files and web platform files are selected
  when they exist. Because the platform seam's `.web` files delegate to the
  library's own DOM backend, `lucide-react`, and DOM SVG, this tree never
  imports `react-native`, `react-native-web`, `react-native-svg`, or
  `lucide-react-native` at runtime — `react-native-web` is not a peer
  dependency at all, and `npm run test:package` proves the packed build bundles
  with only `react`, `react-dom` and `lucide-react` installed.
- Type declarations also point at `dist/node/**`, where relative declaration
  specifiers use NodeNext-compatible `.js` paths. They are emitted by a second,
  web-resolution `tsc` pass (`tsconfig.build.web.json`) and typed from the
  seam's own vendored declarations in `src/primitives/types`, so nothing under
  `dist/node` mentions `react-native`. The build drops every native module a
  `.web` sibling shadows from that tree for the same reason.
- The `react-native` condition points at `dist/**`, preserving extensionless
  specifiers so Metro and React Native platform resolution can choose native or
  web files.
