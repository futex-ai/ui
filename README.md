# ui

Shared UI component library for Firna React Native and React Native Web
surfaces. The first consumers are the accounting app and the Juno app.

## Key Features

- Shared dropdown menu, selector, combobox, drag-select, segmented control,
  radio card, switch, spinner, loaders (six indeterminate shapes plus
  determinate progress bar and ring), button, labelled input/textarea,
  data table,
  editable data grid (Airtable/Notion-style),
  cross-platform block rich-text editor with canonical markdown,
  modal, toast provider/controller, avatar, status badge, animated comet-trail
  border, calendar heatmap, full event-calendar (month/week/day/agenda,
  recurring events, drag-to-create), and branching workflow-builder step-graph
  primitives.
- A shared `sm` / `md` / `lg` size scale (`ControlSize`) across the interactive
  controls — buttons, inputs, dropdown selectors, date fields, segmented
  controls, and switches.
- Themeable visual tokens so consumers can use their own brand primary color,
  with four shipped presets — the accounting default and Juno, each in a light
  and a dark variant. Every component reads its colors from the tokens, so dark
  mode is a preset swap rather than a per-component opt-in.
- A shared, calm focus glow across every control, disable-able globally via the
  theme's `focusRing: false` flag or per instance with a `disableFocusRing` prop
  (both fall back to the browser's default focus outline so keyboard focus stays
  visible).
- Portaled, anchored web date/dropdown/popover overlays with z-index escape
  hatches, plus touch-friendly native date sheets.
- Expo and React Native Web compatible platform files.
- Focused unit tests, browser interaction tests, and package export checks.
- Storybook previews for visual review on same-repository non-release PRs.
- Release-please release PRs and npm trusted publishing for `@firna/ui`.

## User-Facing Interface

The package name is `@firna/ui`. Public exports are available from:

- `@firna/ui` for all public components and helpers.
- `@firna/ui/animated-border` for the animated comet-trail border that traces a
  rounded-rectangle perimeter to highlight an element, in a single color or a
  two-color brand gradient.
- `@firna/ui/avatar` for the themed circular initials avatar.
- `@firna/ui/badge` for the themed status badge pill with tone, variant, and
  size variants.
- `@firna/ui/button` for the themed button with tone, size, and block variants.
- `@firna/ui/calendar` for the full event calendar (month, week, day, and agenda
  views, recurring events, and drag-to-create).
- `@firna/ui/data-grid` for the editable Airtable/Notion-style data grid
  (cell-range selection, keyboard nav, virtualized infinite scroll, typed
  editable cells, column menus, and a responsive card stack).
- `@firna/ui/date` for single-date and date-range fields.
- `@firna/ui/drag-select` for web drag-selection providers, target hooks, and
  geometry helpers.
- `@firna/ui/dropdown` for dropdown menu, selector, combobox, and layer helpers.
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
  inline formatting, lists/checklists, and native keyboard toolbars.
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
- `@firna/ui/focusRing` for `useFocusRing` and `focusRingStyleFor` — the shared
  focus-glow primitive every control uses. Pass `disableFocusRing` to a single
  control to drop only that instance's glow; both paths fall back to the
  browser's default focus outline so keyboard focus stays visible (WCAG 2.4.7).
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

Consumers must provide the peer dependencies listed in `package.json`: React,
React DOM, React Native, React Native Web, React Native SVG, and
lucide-react-native.

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
npm run build
npm run test:package
npm run storybook
npm run storybook:build
npm run test:browser
```

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

Playwright uses `STORYBOOK_PORT` when set, then Conductor's workspace-specific
`CONDUCTOR_PORT`, and otherwise port `6006`. This lets browser checks run safely
alongside previews from parallel workspaces.

The package export map intentionally separates runtime targets:

- The standard `import` condition points at `dist/node/**`, where relative ESM
  specifiers include explicit `.js` files and web platform files are selected
  when they exist.
- Type declarations also point at `dist/node/**`, where relative declaration
  specifiers use NodeNext-compatible `.js` paths.
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
  `Radio/Examples`, `RichText/Examples`,
  `Segmented/Examples`, `SortableList/Examples`, `Spinner/Examples`,
  `Switch/Examples`, `Table/Examples`, `Theme/Examples`, and `Toast/Examples`.
- Required repository variable: `CLOUDFLARE_ACCOUNT_ID`.
- Required repository secret: `CLOUDFLARE_PAGES_API_TOKEN` or
  `CLOUDFLARE_API_TOKEN`.

## Key Code Jumping Points

- Shared theme boundary: [src/theme.tsx](src/theme.tsx)
- Animated border component:
  [src/animated-border/README.md](src/animated-border/README.md)
- Avatar component: [src/avatar/README.md](src/avatar/README.md)
- Badge component: [src/badge/README.md](src/badge/README.md)
- Shared control-size scale: [src/controlSize.ts](src/controlSize.ts)
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
- Switch component: [src/switch/README.md](src/switch/README.md)
- Table component: [src/table/README.md](src/table/README.md)
- Toast component: [src/toast/README.md](src/toast/README.md)
- Workflow builder component: [src/workflow/README.md](src/workflow/README.md)
- Browser tests: [tests/browser/storybook.spec.ts](tests/browser/storybook.spec.ts)
- Repository automation: [xtask/README.md](xtask/README.md)
- Shared component protocol:
  [docs/protocol/shared-ui-components.md](docs/protocol/shared-ui-components.md)
- Consumer migration handoff: [docs/consumer-migration.md](docs/consumer-migration.md)
- Active and completed implementation plans: [plans/README.md](plans/README.md)

## Related Repositories

- Accounting consumer/source components:
  `/Users/calummoore/projects/futex/accounting`
- Juno consumer:
  `/Users/calummoore/projects/futex/juno`
