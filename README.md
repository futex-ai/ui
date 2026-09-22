# ui

Shared UI component library for Firna React Native and web surfaces. The first consumers are the accounting app and the Juno app.

## Key Features

- Shared dropdown menu, selector, combobox, drag-select, segmented control,
  radio card, switch, spinner, loaders (six indeterminate shapes plus
  determinate progress bar and ring), button, labelled input/textarea,
  data table,
  editable data grid (Airtable/Notion-style),
  a from-scratch interactive chart family (bar, line, area, sparkline, stat
  tile, donut, gauge, bullet, funnel, matrix heatmap, scatter, histogram,
  waterfall, small multiples) on a colourblind-validated palette,
  cross-platform block rich-text editor with canonical markdown and a
  collaboration layer (live carets, tracked changes, comment threads),
  modal, toast provider/controller, avatar, status badge, animated comet-trail
  border, calendar heatmap, full event-calendar (month/week/day/agenda,
  recurring events, drag-to-create), branching workflow-builder step-graph
  primitives, a multi-track editing timeline with pro clip edits, and the
  video-editor panels that surround it (program monitor, transport, level
  meter, media bin, property inspector, effects rack, keyframe editor, export
  dialog).
- A shared `sm` / `md` / `lg` size scale (`ControlSize`) across the interactive
  controls — buttons, inputs, dropdown selectors, date fields, segmented
  controls, and switches.
- Themeable visual tokens so consumers can use their own brand primary color,
  with four shipped presets — the accounting default and Juno, each in a light
  and a dark variant. Every component reads its colors from the tokens, so dark
  mode is a preset swap rather than a per-component opt-in.
- A shared, calm focus glow across every control. On web the DOM backend paints
  it from CSS `:focus-visible`, so server-rendered and static HTML keeps the same
  keyboard affordance before hydration — or with no JavaScript at all. Native
  keeps its platform focus behavior. Disable the glow globally with
  `focusRing: false` or per instance with `disableFocusRing`; both are deliberate
  opt-outs that restore the browser outline on the control's visible box.
- Portaled, anchored web date/dropdown/popover overlays with viewport-aware,
  content-sized selector menus and z-index escape hatches, plus touch-friendly
  native date sheets.
- Platform files shared by Expo, React Native, and the library's own DOM
  backend on web.
- Focused unit tests, browser interaction tests, and package export checks.
- Storybook previews for visual review on same-repository non-release PRs.
- Release-please release PRs and npm trusted publishing for `@firna/ui`.

## User-Facing Interface

The package name is `@firna/ui`. Public exports are available from:

- `@firna/ui` for all public components and helpers.
- `@firna/ui/animated-border` for the animated comet-trail border that traces a
  rounded-rectangle perimeter to highlight an element, in a single color or a
  two-color brand gradient.
- `@firna/ui/avatar` for the themed initials avatar (circle or rounded square).
- `@firna/ui/badge` for the themed status badge pill with tone, variant, and
  size variants.
- `@firna/ui/button` for the themed button with tone, size, and block variants,
  and a `role` that re-points it at another single-activation role (`checkbox`,
  `menuitem`, `radio`, `switch`, `tab`) with the state that role must carry — so
  a tab or checkbox keeps the shared focus glow instead of being hand-rolled.
- `@firna/ui/calendar` for the full event calendar (month, week, day, and agenda
  views, recurring events, and drag-to-create).
- `@firna/ui/chart` for the interactive chart family — bar, line, area,
  sparkline, stat tile, donut, gauge, bullet, funnel, matrix heatmap, scatter,
  bubble, histogram, waterfall and small multiples — built from this library's
  own primitives and `react-native-svg`, with no charting dependency. Every
  chart ships a keyboard-navigable hit layer, a hover/scrub readout and an
  accessible data-table twin.
- `@firna/ui/data-grid` for the editable Airtable/Notion-style data grid
  (cell-range selection, keyboard nav, virtualized infinite scroll, typed
  editable cells, column menus, and a responsive card stack).
- `@firna/ui/date` for single-date and date-range fields.
- `@firna/ui/drag-select` for web drag-selection providers, target hooks, and
  geometry helpers.
- `@firna/ui/dropdown` for dropdown menu, selector, combobox, layer helpers, and
  selector trigger refs for imperative focus after async form hydration.
- `@firna/ui/heatmap` for the calendar contribution heatmap and its pure layout
  and color-scale helpers.
- `@firna/ui/input` for the labelled text input, textarea, and bare input
  frame.
- `@firna/ui/list` for the vertical list with between-item separators, optional
  clickable items, and the `ListItem` row.
- `@firna/ui/loader` for the loading indicator family: `Loader` with six
  interchangeable indeterminate shapes (`ring`, `dot-grid`, `dots`, `bars`,
  `blades`, `pulse`), plus `ProgressBar` and `ProgressRing` for work whose total
  is known.
- `@firna/ui/modal` for web modal frame, portal, model, and layer helpers.
- `@firna/ui/popover` for generic anchored popovers.
- `@firna/ui/radio` for themed titled radio-option cards.
- `@firna/ui/rich-text` for the Notion-style block editor with markdown in/out,
  inline formatting, lists/checklists, native keyboard toolbars, and the
  collaboration layer (live carets, tracked changes, comment threads) with its
  `RichTextPresenceBar` and `RichTextCollabRail` surfaces.
- `@firna/ui/segmented` for themed single-select segmented controls.
- `@firna/ui/sortable-list` for the drag-and-drop sortable list (pointer +
  keyboard reordering, an optional start/end grab handle, and vertical or
  horizontal flow), plus the `SortableGroups` coordinator that lets several
  lists exchange items — stacked as sections or laid out as a board — reporting
  each move with its source and destination group.
- `@firna/ui/spinner` for the themed indeterminate spinning loading indicator.
- `@firna/ui/switch` for themed binary on/off switches.
- `@firna/ui/table` for the data table with optional headers and clickable rows.
- `@firna/ui/theme` for `SharedUiThemeProvider`, default accounting-style
  tokens, the Juno token preset, the `darkSharedUiTheme` and
  `junoDarkSharedUiTheme` dark presets, the `SharedUiScheme` type,
  `createSharedUiTheme(overrides, base)`, and the global `focusRing` switch
  (`SharedUiThemeProvider theme={{ focusRing: false }}` disables every control's
  focus glow at once). See [Theming](#theming) for the dark-mode contract.
- `@firna/ui/focusRing` for `useFocusRing`, `focusRingStyleFor`, and
  `focusRingCssVariablesFor`. Library controls use the hook's CSS marker as the
  canonical web paint path; `focused` and `focusVisible` remain available for
  non-painting interaction state. Custom controls spread `focusRingProps` on
  the painted host and include `focusRingVariables` in its style.
  `focusRingStyleFor` keeps the explicit inline glow escape hatch for
  caller-owned local style sheets. Pass `disableFocusRing` to one control, or
  set the theme's `focusRing: false`, to omit the CSS marker and restore the
  browser outline (WCAG 2.4.7).
- `@firna/ui/toast` for the toast provider, the `useToast` hook, the
  `toastController` method API, and transient notification toasts including
  card and solid variants with optional custom leading icons.
- `@firna/ui/workflow` for the branching workflow builder — a step-graph canvas
  (color-coded nodes, tinted edge labels, forks, legend, add-step) for
  constructing automation workflows.

## Installation

```bash
npm install @firna/ui
```

All platform packages are optional peer dependencies; install the set for
your target:

- **Web only (Vite, Next.js, any DOM bundler):** `react`, `react-dom`, and
  `lucide-react` — that is the whole web peer set. No `react-native` and no
  `react-native-web` install, and no bundler alias is needed: the `import`
  condition resolves to `dist/node`, where every primitive renders through the
  library's own DOM backend. That holds for types too — the web build's
  declarations are self-contained, so even a strict TypeScript consumer
  installs nothing extra.
- **Expo / React Native (iOS, Android, and Expo web):** `react`, `react-dom`,
  `react-native`, `react-native-svg`, `lucide-react-native`, and
  `lucide-react`. Metro's `react-native` condition resolves `dist/**`, where
  platform files pick native or web implementations per file. An Expo web app
  keeps whatever `react-native-web` its own React Native code needs; the
  library's `.web` files resolve to the DOM backend there too and never reach
  for it.
- **Optional on native:** `@gorhom/bottom-sheet`, `react-native-gesture-handler`,
  and `react-native-reanimated` power the native bottom sheet.

Every component reaches the platform through `src/primitives`, a small set of
modules with a native file and a `.web` sibling: React Native primitives
(`react-native` on native; the library's own DOM backend on web), SVG
(`react-native-svg` on
native, DOM `<svg>` on web), and icons (`lucide-react-native` on native,
`lucide-react` on web). Icon props accept `IconComponent`, a type both Lucide
packages' icons satisfy, so a consumer passes whichever matches their
platform.

## Theming

Four presets ship, all built from the same semantic token set:
`defaultSharedUiTheme` and `junoSharedUiTheme` (light), `darkSharedUiTheme` and
`junoDarkSharedUiTheme` (dark). Pass one to `SharedUiThemeProvider`, or brand it
first with `createSharedUiTheme(overrides, base)` — the second argument picks
the preset to extend, so a dark brand tint stays dark:

```tsx
const brandDark = createSharedUiTheme(
  { colors: { primary: "#8fb3ff" } },
  darkSharedUiTheme,
);
```

Two token-level rules make dark mode work without per-component branching:

- **`colors.onSolid`** is the text/icon color on solid accent fills (the solid
  badge, the primary button, the dropdown's active row, the calendar "today"
  disc, the switch knob at the on-position…). It is white in the light themes
  and the near-black page ink-well in the dark ones.
- **Solid fills invert.** In the dark presets the `*Deep` tokens become _light_
  accents and `onSolid` darkens, so every existing token relationship
  (deep-on-soft, deep-as-fill, the heatmap ramp's ordering) keeps working
  unchanged. Every documented WCAG 2.1 — 1.4.3/1.4.11 pair is pinned by unit
  tests across all four presets, and every dark Storybook story is swept by axe.

`theme.scheme` (`"light" | "dark"`) is available for the rare physical-metaphor
case, but components should read colors from tokens rather than branch on it.

### Web focus CSS and server rendering

On web, `SharedUiThemeProvider` adds a boxless (`display: contents`) DOM boundary
that serializes the active theme's focus variables around its children:

- `--firna-focus-ring-color` — `colors.primary` composed at the standard `0.35`
  alpha, for example `rgba(79, 120, 100, 0.35)` in the default theme.
- `--firna-focus-ring-width` — the standard `4px` halo width.

Controls repeat those variables on their marked host when needed, so a
per-control `color`, `width`, or `alpha` passed to `useFocusRing` wins locally.
The DOM backend's attribute-based `:focus-visible` rules read the variables;
inset hosts carry a second attribute, and forced-colors mode replaces the shadow
with a `2px solid Highlight` outline. The rules do not animate.

Server-rendered and static pages must emit `domBackendCss` in `<head>` before
their own stylesheets. Emitting the variables there as a `:root` fallback makes
the first paint complete even outside a provider boundary; the provider also
serializes them inline, so `renderToStaticMarkup` output remains self-contained:

```tsx
import {
  defaultSharedUiTheme,
  domBackendCss,
  focusRingCssVariablesFor,
} from "@firna/ui";

const focusVariables = focusRingCssVariablesFor(
  defaultSharedUiTheme.colors.primary,
);
const focusVariableCss = `:root{${Object.entries(focusVariables)
  .map(([name, value]) => `${name}:${value}`)
  .join(";")}}`;

<head>
  <style>{`${domBackendCss}\n${focusVariableCss}`}</style>
  {/* Consumer stylesheets come after this style. */}
</head>;
```

Later consumer rules can override the focus treatment at equal specificity.
`focusRing: false` is not required for static rendering; it is now purely an
opt-out for consumers that want the browser default or supply their own focus
treatment.

### Chart colors

`theme.charts` carries the data-visualization scales used by `@firna/ui/chart`,
each encoding exactly one job: `series` (identity — 8 slots, assigned in order
and never cycled), `sequential` (magnitude), `ordinal` (ordered marks),
`diverging` (polarity, with a neutral grey midpoint) and `status` (reserved
state, never handed out as a series color). The chart furniture — `grid`,
`axis`, `label`, `surface`, `deemphasis` — derives from the theme's own
neutrals, so all four presets stay in sync with nothing maintained by hand.

`createSharedUiTheme` resolves `charts` from `scheme` and `colors`, so a theme
built through it never supplies one. Values you set explicitly are carried
forward when that theme is extended.

**`scheme` and `colors` must agree.** `createSharedUiTheme({ scheme: "dark" })`
alone yields a dark-schemed theme still wearing the _light_ palette — the dark
series steps then paint on a white surface and several drop below their
contrast floor. Extend a dark preset instead:
`createSharedUiTheme(overrides, darkSharedUiTheme)`. Before charts, `scheme`
only affected a few physical-metaphor sites; it now selects whole color scales,
so the mismatch matters much more than it used to.

The slot **order** is the colorblind-safety mechanism, not a cosmetic choice —
it was picked by enumerating all 40,320 orderings and keeping only those that
clear the gates on every shipped surface. Re-order it and you must re-validate:

```sh
node scripts/validate-chart-palette.mjs           # report the shipped palette
node scripts/validate-chart-palette.mjs --derive  # re-run the enumeration
```

`tests/unit/chartPalette.test.ts` pins every measured number, so a token edit
that regresses the palette fails the suite rather than shipping quietly.

The library does **not** detect the OS setting — the provider stays free of a
`react-native` import so it can be loaded by the node test runner and the
package-smoke stubs. Consumers own that wiring:

```tsx
import { useColorScheme } from "react-native";
import {
  darkSharedUiTheme,
  defaultSharedUiTheme,
  SharedUiThemeProvider,
} from "@firna/ui/theme";

function App() {
  const scheme = useColorScheme();
  return (
    <SharedUiThemeProvider
      theme={scheme === "dark" ? darkSharedUiTheme : defaultSharedUiTheme}
    >
      {/* … */}
    </SharedUiThemeProvider>
  );
}
```

## Developer Get Started

```bash
npm ci
npm test
npm run typecheck
npm run typecheck:web
npm run build
npm run test:dist
npm run test:package
npm run storybook
npm run storybook:build
npm run test:browser
```

`npm run typecheck` resolves the native files of the platform seam;
`npm run typecheck:web` re-runs the same program against the `.web` siblings
(`tsconfig.web.json` sets `moduleSuffixes`), which is the resolution every web
consumer and the emitted declarations use. Both are part of `npm run verify`.

`npm run test:dist` re-runs the declaration guard in
`tests/unit/distDeclarations.test.ts` against build output. `npm test` includes
it too, but it skips there on a clean checkout because `dist` does not exist
yet, so `npm run verify` runs it again right after `npm run build` — that is
the run that actually proves `dist/node` names no `react-native`.

Run the full JavaScript verification suite with:

```bash
cargo xtask check
```

Run the same read-only AI review wrapper used by the accounting repo with:

```bash
cargo xtask review
```

Browser interaction tests start Storybook automatically through Playwright.
Storybook is built to `storybook-static`. `npm run test:package` builds a
packed tarball, installs it into temporary consumers, imports every public
package subpath with Node's native ESM resolver, typechecks those subpaths with
TypeScript's NodeNext resolver, and then verifies the same subpaths through a
Vite build.

The axe accessibility gate discovers every Storybook story at runtime and
splits the sorted story list into four deterministic shards. Playwright runs
those shards across its workers so the complete sweep does not depend on one
long-running test. `UPDATE_A11Y_BASELINE=1 npm run test:browser -- a11y.spec.ts`
uses one serial sweep instead, ensuring `axe-baseline.json` has a single writer.

The story snapshot sweep (`tests/browser/snapshots.spec.ts`) is the visual and
ARIA regression gate. It discovers the same story list at runtime, renders every
story alone in a fresh 900x600 context (`deviceScaleFactor: 1`, reduced motion,
forced light scheme, `en-US`, UTC), and pins two baselines per story: a
full-viewport PNG and an ARIA snapshot of the rendered document. It runs in four
shards like the axe sweep. Re-record after an intentional visual change with
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

So that every Linux machine rasterizes the same glyphs, Storybook bundles its
own fonts through `.storybook/fonts.ts`: Inter for `theme.fonts.sans`, JetBrains
Mono registered as `Menlo` for `theme.fonts.mono`, the same Inter files
registered as `Segoe UI` for the system stack the primitives give text a
component leaves unstyled, and two Noto subsets as in-family fallbacks for the arrows,
maths relations and symbols (⌘ ★ ✓ ✕ braille) none of those faces carry. These
are Storybook devDependencies only — the published package ships no fonts and
consumers are unaffected.

Storybook's prop docgen is switched off (`typescript: { reactDocgen: false }`).
Its importer resolves module specifiers without the `.web` preference, so it
follows every story's `src/primitives` import to the native file and into
`react-native`'s Flow source, which it cannot parse; it only survives by
rewriting that path to `react-native-web/dist/index.js` when that package is
installed. Nothing here reads docgen output — no story declares `args` or
`argTypes`, there is no autodocs tag or `.mdx` file, and both suites render
`iframe.html` — so the option is off and `react-native-web` is not installed at
all. `.storybook/main.ts` carries the note.

Stories that cannot be pinned — a `requestAnimationFrame` loop that ignores
reduced motion, or an accessibility tree that is legitimately empty — are listed
with a one-line reason in `tests/browser/snapshotOptOuts.ts`, which is the only
place an opt-out may be declared.

Playwright uses `STORYBOOK_PORT` when set, then Conductor's workspace-specific
`CONDUCTOR_PORT`, and otherwise port `6006`. This lets browser checks run safely
alongside previews from parallel workspaces.

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

## Package Releases

- Release-please opens and updates the release PR for `@firna/ui` from
  Conventional Commits.
- The release PR updates `CHANGELOG.md`, `package.json`, and
  `package-lock.json` through release-please's `node` release type.
- When release-please creates or updates a release PR, the release workflow
  checks out that generated PR branch, runs `npm run format`, and pushes a
  `chore: format release PR` commit only if the generated files need Prettier
  cleanup.
- Merging the release PR lets release-please create the `vX.Y.Z` tag and GitHub
  release. Ordinary non-release pushes to `main` only update the release PR.
- npm publishing runs in the same `.github/workflows/release-plz.yml` invocation
  that creates the GitHub release, using npm trusted publishing. The npm package
  must configure this repository and `release-plz.yml` as the
  trusted publisher, with allowed action `npm publish`.
- The workflow file keeps the historical `release-plz.yml` filename because npm
  trusted publishing validates the workflow filename configured on npmjs.com.
  The workflow implementation itself uses release-please.
- The workflow falls back to `GITHUB_TOKEN` for release-please, but a
  repository secret named `RELEASE_PLEASE_TOKEN` can be added if release PRs
  need to trigger normal PR checks.
- Before publishing, the release workflow installs dependencies, installs the
  Playwright browser, verifies the release tag matches `package.json`, runs
  `cargo xtask check`, and skips publishing if the version already exists on
  npm.
- If publish fails after the GitHub release was created, manually dispatch the
  release workflow with `publish_ref` set to the existing `vX.Y.Z` tag. The
  retry path checks out that tag and runs the same verification and publish
  steps.
- Scoped npm packages default to private, so `publishConfig.access` is set to
  `public`.

## Storybook Deployments

- Main branch Storybook deploys to Cloudflare Pages project
  `futex-ui-storybook`.
- Main URL: `https://futex-ui-storybook.pages.dev`.
- Same-repository non-release PR previews deploy to Cloudflare branch
  `pr-<number>`.
- PR preview URL shape:
  `https://pr-<number>.futex-ui-storybook.pages.dev`.
- PR previews are posted through a sticky comment marked
  `<!-- futex-ui-storybook-preview -->`.
- Release Please PRs are skipped by the Storybook preview deploy job; their
  component changes were already previewed in the source PRs.
- Closing a same-repository PR marks the sticky comment inactive and attempts
  to delete aliased preview deployments for that PR branch; if Cloudflare
  cleanup cannot complete safely, the comment reports the retained reason.
- Storybook examples are grouped under one top-level folder per family:
  `Avatar/Examples`, `Badge/Examples`, `Button/Examples`, `Calendar/Examples`,
  `Date/Examples`,
  `Drag Select/Examples`, `Dropdown/Examples`, `Heatmap/Examples`,
  `Input/Examples`, `Kanban/Examples`, `List/Examples`, `Loader/Examples`,
  `Modal/Examples`,
  `Popover/Examples`,
  `Radio/Examples`, `RichText/Examples`, `RichText/Collaboration`,
  `Segmented/Examples`, `SortableList/Examples`, `Spinner/Examples`,
  `Status dot/Examples`,
  `Switch/Examples`, `Table/Examples`, `Theme/Examples`, `Timeline/Examples`,
  `Toast/Examples`, and `Video editor/Examples` (whose `Full editor` story
  assembles the whole family into a working editor, in light, dark, and
  compact).
- Required repository variable: `CLOUDFLARE_ACCOUNT_ID`.
- Required repository secret: `CLOUDFLARE_PAGES_API_TOKEN` or
  `CLOUDFLARE_API_TOKEN`.

## Key Code Jumping Points

- Platform seam (React Native, SVG, icons): [src/primitives](src/primitives)
- Shared theme boundary: [src/theme.tsx](src/theme.tsx)
- Animated border component:
  [src/animated-border/README.md](src/animated-border/README.md)
- Avatar component: [src/avatar/README.md](src/avatar/README.md)
- Badge component: [src/badge/README.md](src/badge/README.md)
- Shared control-size scale: [src/controlSize.ts](src/controlSize.ts)
- Shared focus-glow primitive: [src/focusRing.ts](src/focusRing.ts)
- Button component: [src/button/README.md](src/button/README.md)
- Calendar component: [src/calendar/README.md](src/calendar/README.md)
- Input and textarea components: [src/input/README.md](src/input/README.md)
- Kanban component: [src/kanban/README.md](src/kanban/README.md)
- List component: [src/list/README.md](src/list/README.md)
- Loader components: [src/loader/README.md](src/loader/README.md)
- SortableList component: [src/sortable-list/README.md](src/sortable-list/README.md)
- Dropdown components: [src/dropdown/README.md](src/dropdown/README.md)
- Drag-select components:
  [src/drag-select/README.md](src/drag-select/README.md)
- Heatmap component: [src/heatmap/README.md](src/heatmap/README.md)
- Modal components: [src/modal/README.md](src/modal/README.md)
- Radio card component: [src/radio/README.md](src/radio/README.md)
- Rich-text editor: [src/rich-text/README.md](src/rich-text/README.md)
- Segmented control component:
  [src/segmented/README.md](src/segmented/README.md)
- Spinner component: [src/spinner/README.md](src/spinner/README.md)
- Status dot component: [src/status-dot/README.md](src/status-dot/README.md)
- Switch component: [src/switch/README.md](src/switch/README.md)
- Table component: [src/table/README.md](src/table/README.md)
- Timeline component: [src/timeline/README.md](src/timeline/README.md)
- Toast component: [src/toast/README.md](src/toast/README.md)
- Video-editor panels: [src/video-editor/README.md](src/video-editor/README.md)
- Workflow builder component: [src/workflow/README.md](src/workflow/README.md)
- Browser tests: [tests/browser/storybook.spec.ts](tests/browser/storybook.spec.ts)
- Story visual/ARIA snapshot sweep:
  [tests/browser/snapshots.spec.ts](tests/browser/snapshots.spec.ts)
- Repository automation: [xtask/README.md](xtask/README.md)
- Shared component protocol:
  [docs/protocol/shared-ui-components.md](docs/protocol/shared-ui-components.md)
- Rich-text collaboration protocol:
  [docs/protocol/rich-text-collaboration.md](docs/protocol/rich-text-collaboration.md)
- Consumer migration handoff: [docs/consumer-migration.md](docs/consumer-migration.md)
- Active and completed implementation plans: [plans/README.md](plans/README.md)

## Related Repositories

- Accounting consumer/source components:
  `/Users/calummoore/projects/futex/accounting`
- Juno consumer:
  `/Users/calummoore/projects/futex/juno`
