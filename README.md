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
- A shared `xs` / `sm` / `md` / `lg` size scale (`ControlSize`) across the
  interactive controls — buttons, inputs, dropdown selectors, date fields,
  segmented controls, switches, and list rows. `xs` is the dense 26px size.
- Touch surfaces: inside a `TouchSurface`, the controls and list rows give each
  target at least 44 by 44px, whatever their size. An optional compact text
  scale serves dense surfaces.
- App shell parts: link buttons and link tabs with current-page state, neutral
  and urgent notices, page and panel empty states, menus drawn open in place
  with a phone menu sheet, and a controlled panel resize handle.
- Themeable visual tokens so consumers can use their own brand primary color,
  with four shipped presets — the accounting default and Juno, each in a light
  and a dark variant. Every component reads its colors from the tokens, so dark
  mode is a preset swap rather than a per-component opt-in.
- A shared, calm focus glow across every control. On web the library's
  stylesheet paints it from CSS `:focus-visible`, so server-rendered and static
  HTML keeps the same keyboard affordance before hydration — or with no
  JavaScript at all. Native keeps its platform focus behavior. One
  `focusIndicator` setting — on the theme for every control, or per instance —
  picks the glow (`ring`), the browser outline on the control's visible box
  (`outline`), or no focus styling at all (`none`) for a control embedded in a
  surface that shows focus itself.
- Portaled, anchored web date/dropdown/popover overlays, each placed by its
  own measured size so it flips above its trigger rather than being clipped,
  with content-sized selector menus and z-index escape hatches, plus
  touch-friendly native date sheets.
- Stacked web dialogs with focus control for the top dialog, ordered focus
  return, a page scroll lock, and live toast feedback, plus native dialogs and
  bottom sheets.
- Platform files shared by Expo, React Native, and two web renderers: the
  library's own DOM backend by default, or `react-native-web` for an app that
  draws its own screens with it.
- Focused unit tests, browser interaction tests, and package export checks.
- Storybook previews for visual review on same-repository non-release PRs.
- Release-please release PRs and npm trusted publishing for `@firna/ui`.

## User-Facing Interface

The package name is `@firna/ui`. Public exports are available from:

- `@firna/ui` for all public components and helpers.
- [`@firna/ui/animated-border`](src/animated-border/README.md) for the animated comet-trail border that traces a
  rounded-rectangle perimeter to highlight an element, in a single color or a
  two-color brand gradient.
- [`@firna/ui/avatar`](src/avatar/README.md) for the themed initials avatar (circle or rounded square).
- [`@firna/ui/badge`](src/badge/README.md) for the themed status badge pill with tone, variant, and
  size variants.
- [`@firna/ui/button`](src/button/README.md) for the themed button with tone, size, and block variants,
  and a `role` that re-points it at another single-activation role (`checkbox`,
  `menuitem`, `radio`, `switch`, `tab`) with the state that role must carry — so
  a tab or checkbox keeps the shared focus glow instead of being hand-rolled.
- [`@firna/ui/calendar`](src/calendar/README.md) for the full event calendar (month, week, day, and agenda
  views, recurring events, and drag-to-create).
- [`@firna/ui/chart`](src/chart/README.md) for the interactive chart family — bar, line, area,
  sparkline, stat tile, donut, gauge, bullet, funnel, matrix heatmap, scatter,
  bubble, histogram, waterfall and small multiples — built from this library's
  own primitives and `react-native-svg`, with no charting dependency. Every
  chart ships a keyboard-navigable hit layer, a hover/scrub readout and an
  accessible data-table twin.
- [`@firna/ui/data-grid`](src/data-grid/README.md) for the editable Airtable/Notion-style data grid
  (cell-range selection, keyboard nav, virtualized infinite scroll, typed
  editable cells, column menus, and a responsive card stack).
- [`@firna/ui/date`](src/date/README.md) for single-date and date-range fields.
- [`@firna/ui/drag-select`](src/drag-select/README.md) for rubber-band selection of rows and tiles: a
  provider that can wrap one list or every page of an app shell, the
  `useDragSelectableOptions` page hook, target and state hooks, controlled
  (`selectedIds`) or uncontrolled selection, a selection scope per page,
  configurable start rules and an ignore marker, edge auto-scroll, a custom
  box through `renderMarquee`, and geometry helpers. The gesture runs on
  web; native keeps the selection state.
- [`@firna/ui/dropdown`](src/dropdown/README.md) for dropdown menu, selector, combobox, layer helpers, and
  selector trigger refs for imperative focus after async form hydration.
- [`@firna/ui/empty-state`](src/empty-state/README.md) for page and panel empty states with a heading level
  supplied by the caller.
- [`@firna/ui/heatmap`](src/heatmap/README.md) for the calendar contribution heatmap and its pure layout
  and color-scale helpers.
- [`@firna/ui/input`](src/input/README.md) for the labelled text input, textarea, and bare input
  frame.
- [`@firna/ui/kanban`](src/kanban/README.md) for the horizontally scrolling
  status board that groups records into columns by a single-select field.
- [`@firna/ui/link`](src/link/README.md) for link buttons and link tabs with destinations and
  current-page state.
- [`@firna/ui/list`](src/list/README.md) for the vertical list with between-item separators, optional
  clickable items, link navigation rows, and the `ListItem` row.
- [`@firna/ui/loader`](src/loader/README.md) for the loading indicator family: `Loader` with six
  interchangeable indeterminate shapes (`ring`, `dot-grid`, `dots`, `bars`,
  `blades`, `pulse`), plus `ProgressBar` and `ProgressRing` for work whose total
  is known.
- [`@firna/ui/modal`](src/modal/README.md) for the shared dialog frame with automatic web stacking
  and native modal presentation, plus the public portal, model, and layer helpers.
- [`@firna/ui/notice`](src/notice/README.md) for neutral and urgent notices with body and action slots.
- [`@firna/ui/panel-resize`](src/panel-resize/README.md) for the controlled panel resize handle.
- [`@firna/ui/popover`](src/popover/README.md) for anchored popovers, in-place menus, and phone menu
  sheets.
- [`@firna/ui/radio`](src/radio/README.md) for themed titled radio-option cards.
- [`@firna/ui/rich-text`](src/rich-text/README.md) for the Notion-style block editor with markdown in/out,
  inline formatting, lists/checklists, native keyboard toolbars, and the
  collaboration layer (live carets, tracked changes, comment threads) with its
  `RichTextPresenceBar` and `RichTextCollabRail` surfaces.
- `@firna/ui/rnw` for `resolveFirnaRnwFile`, the rule of the
  [React Native Web route](#react-native-web-route), and `firnaIconNames`, the
  [Lucide icon names](#lucide-icon-names) that each subpath can draw.
- [`@firna/ui/segmented`](src/segmented/README.md) for themed single-select segmented controls.
- [`@firna/ui/sheet`](src/sheet/README.md) for the modal bottom sheet that hosts
  a form, a menu list, or a picker behind one controlled API.
- [`@firna/ui/skeleton`](src/skeleton/README.md) for content-shaped loading
  placeholders: a shimmering bar and circle, a row and column group, and the
  pulse provider that sweeps a whole skeleton off one animation.
- [`@firna/ui/sortable-list`](src/sortable-list/README.md) for the drag-and-drop sortable list (pointer +
  keyboard reordering, an optional start/end grab handle, and vertical or
  horizontal flow), plus the `SortableGroups` coordinator that lets several
  lists exchange items — stacked as sections or laid out as a board — reporting
  each move with its source and destination group.
- [`@firna/ui/spinner`](src/spinner/README.md) for the themed indeterminate spinning loading indicator.
- [`@firna/ui/status-dot`](src/status-dot/README.md) for the small themed status
  dot that signals state beside a label and can pulse while the state is live.
- [`@firna/ui/switch`](src/switch/README.md) for themed binary on/off switches.
- [`@firna/ui/table`](src/table/README.md) for the data table with optional headers and clickable rows.
- `@firna/ui/theme` for `SharedUiThemeProvider`, default accounting-style
  tokens, the Juno token preset, the `darkSharedUiTheme` and
  `junoDarkSharedUiTheme` dark presets, the `SharedUiScheme` type,
  `createSharedUiTheme(overrides, base)`, and the theme-wide `focusIndicator`
  (`SharedUiThemeProvider theme={{ focusIndicator: "outline" }}` swaps every
  control's focus glow for the browser outline at once). See
  [Theming](https://github.com/futex-ai/ui/blob/main/docs/theming.md) for the dark-mode contract and
  [Focus indicators](https://github.com/futex-ai/ui/blob/main/docs/focus-indicators.md) for the focus modes.
- `@firna/ui/focusRing` for `useFocusRing`, `focusRingStyleFor`,
  `focusRingCssVariablesFor`, and `focusRingDomPropsFor`. See the
  [focus indicators guide](https://github.com/futex-ai/ui/blob/main/docs/focus-indicators.md#custom-controls)
  for custom controls.
- [`@firna/ui/timeline`](src/timeline/README.md) for the multi-track editing
  timeline: the ruler, lanes, clips, and playhead of a video or audio editor.
- [`@firna/ui/toast`](src/toast/README.md) for the toast provider, the `useToast` hook, the
  `toastController` method API, and transient notification toasts including
  card and solid variants with optional custom leading icons.
- [`@firna/ui/touch-surface`](src/touch-surface/README.md) for `TouchSurface` and `useTouchSurface`, which
  mark and read surfaces with 44px control targets.
- [`@firna/ui/typography`](src/typography/README.md) for text roles, `TextScaleProvider`, `useTextScale`,
  and the per-text `scale` override.
- [`@firna/ui/video-editor`](src/video-editor/README.md) for the video-editor
  panels around the timeline: program monitor, transport, level meter, media
  bin, property inspector, effects rack, keyframe editor, and export dialog.
- [`@firna/ui/workflow`](src/workflow/README.md) for the branching workflow builder — a step-graph canvas
  (color-coded nodes, tinted edge labels, forks, legend, add-step) for
  constructing automation workflows.

## Installation

```bash
npm install @firna/ui
```

All platform packages are optional peer dependencies. Install the set for your
target:

- **Web only (Vite, Next.js, any DOM bundler):** `react`, `react-dom`, and
  `lucide-react` — that is the whole web peer set. No `react-native` and no
  `react-native-web` install, and no bundler alias is needed: the `import`
  condition resolves to `dist/node`, where every primitive renders through the
  library's own DOM backend. That holds for types too — the web build's
  declarations are self-contained, so even a strict TypeScript consumer
  installs nothing extra.
- **Expo / React Native (iOS, Android, and web):** `react`, `react-dom`,
  `react-native`, `react-native-svg`, `lucide-react-native`, and
  `lucide-react`. On iOS and Android, Metro's `react-native` condition resolves
  `dist/**`, and Metro picks the native file of each module there. Expo web
  resolves the `import` condition instead, so it loads `dist/node`, as a
  web-only app does. A bare React Native app gets its Metro config from
  `@react-native/metro-config`, which asserts `react-native` on every
  platform. So on web it resolves `dist/**`, and Metro picks the `.web` files
  there. In both cases, Firna draws on web through its DOM backend, also when
  the app's own screens draw with `react-native-web`. To draw Firna with
  `react-native-web` too, take the
  [React Native Web route](#react-native-web-route).
- **Optional on native:** `@gorhom/bottom-sheet`, `react-native-gesture-handler`,
  and `react-native-reanimated` power the native bottom sheet.

Every component reaches the platform through `src/primitives`, a small set of
modules with a native file and a `.web` sibling: React Native primitives
(`react-native` on native; the library's own DOM backend on web), SVG
(`react-native-svg` on
native, DOM `<svg>` on web), and icons (`lucide-react-native` on native,
`lucide-react` on web). Icon props accept `IconComponent`, a type both Lucide
packages' icons satisfy, so a consumer passes whichever matches their
platform. On the React Native Web route, all three use their native packages
on web too.

### React Native Web route

An app that draws its own screens with `react-native-web` (RNW), such as an
Expo web app, can draw Firna with RNW too. Its pages then load one renderer,
not two. The app does what every RNW app does. On web, it aliases
`react-native` to `react-native-web`. It installs `react-native-svg` and
`lucide-react-native`, or aliases them. `react-native-web` is not a peer
dependency. The
[package protocol](https://github.com/futex-ai/ui/blob/main/docs/protocol/shared-ui-package.md#react-native-web-contract)
names the supported versions.

The app then applies Firna's rule in each tool that resolves Firna's modules.
`@firna/ui/rnw` exports the rule as `resolveFirnaRnwFile(fromFile, request)`:

- `fromFile` is the absolute path of the importing file. `request` is the
  specifier as that file writes it.
- The function returns the absolute path of the file that the RNW route loads
  in place of the web file, or `null`. On `null`, the tool resolves the
  request as usual.
- It returns a path only for a request from inside Firna's `dist` that names
  one of Firna's platform modules. So the app keeps no list of Firna's
  modules, also after a Firna update adds one.

With the rule, Firna's React Native primitives come from RNW, its SVG from
`react-native-svg`, and its icons from `lucide-react-native`. Firna then loads
no module of its DOM backend.

Metro, in `metro.config.js`:

```js
const { resolveFirnaRnwFile } = require("@firna/ui/rnw");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const file =
    platform === "web"
      ? resolveFirnaRnwFile(context.originModulePath, moduleName)
      : null;
  return file
    ? { type: "sourceFile", filePath: file }
    : context.resolveRequest(context, moduleName, platform);
};
```

When the config already has a `resolveRequest`, call that function in place of
`context.resolveRequest`.

An esbuild plugin:

```js
import { resolveFirnaRnwFile } from "@firna/ui/rnw";

const firnaRnw = {
  name: "firna-rnw",
  setup(build) {
    build.onResolve({ filter: /^\./ }, (args) => {
      const file = resolveFirnaRnwFile(args.importer, args.path);
      return file ? { path: file } : undefined;
    });
  },
};
```

A Node module hook:

```js
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveFirnaRnwFile } from "@firna/ui/rnw";

export async function resolve(specifier, context, nextResolve) {
  const file = context.parentURL?.startsWith("file:")
    ? resolveFirnaRnwFile(fileURLToPath(context.parentURL), specifier)
    : null;
  return file
    ? { url: pathToFileURL(file).href, shortCircuit: true }
    : nextResolve(specifier, context);
}
```

### Lucide icon names

An app that limits the Lucide icons in its bundle can read `firnaIconNames`
from `@firna/ui/rnw`. It has one entry for each public subpath, such as
`"@firna/ui/list"`. Each entry is `{ web, native }`: the Lucide icon names that
the subpath can draw on web and on native. The build generates the lists, so
they match each release. On the React Native Web route, Firna draws the `web`
icons with `lucide-react-native`.

## Theming

See the [theming guide](https://github.com/futex-ai/ui/blob/main/docs/theming.md).

### Focus indicators

See the [focus indicators guide](https://github.com/futex-ai/ui/blob/main/docs/focus-indicators.md).

### Web focus CSS and server rendering

See the [focus indicators guide](https://github.com/futex-ai/ui/blob/main/docs/focus-indicators.md#web-focus-css-and-server-rendering).

### Chart colors

See the [theming guide](https://github.com/futex-ai/ui/blob/main/docs/theming.md#chart-colors).

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

The [development guide](https://github.com/futex-ai/ui/blob/main/docs/development.md)
explains each check, the complete `cargo xtask check` gate, the AI review
wrapper, the mockup catalogue, the browser and snapshot suites, and the package
export map.

## Package Releases

See the [releases and deployments guide](https://github.com/futex-ai/ui/blob/main/docs/releases.md#package-releases).

## Storybook Deployments

See the [releases and deployments guide](https://github.com/futex-ai/ui/blob/main/docs/releases.md#storybook-deployments).

## Key Code Jumping Points

- Platform seam (React Native, SVG, icons): [src/primitives](src/primitives)
- Shared theme boundary: [src/theme.tsx](src/theme.tsx)
- Component family READMEs: each family entry under
  [User-Facing Interface](#user-facing-interface) links its README.
- Shared control-size scale: [src/controlSize.ts](src/controlSize.ts)
- Touch surface marker and its 44px target size:
  [src/touchSurface.tsx](src/touchSurface.tsx), and the touch metrics in
  [src/touchMetrics.ts](src/touchMetrics.ts)
- Shared focus-glow primitive: [src/focusRing.ts](src/focusRing.ts), its
  marker spellings in [src/focusRingHost.ts](src/focusRingHost.ts), and the
  CSS rules in [src/primitives/webStylesheet.ts](src/primitives/webStylesheet.ts)
- Guides:
  [theming](https://github.com/futex-ai/ui/blob/main/docs/theming.md),
  [focus indicators](https://github.com/futex-ai/ui/blob/main/docs/focus-indicators.md),
  [development](https://github.com/futex-ai/ui/blob/main/docs/development.md),
  and
  [releases and deployments](https://github.com/futex-ai/ui/blob/main/docs/releases.md)
- Browser tests: [tests/browser/](tests/browser/), one Playwright spec for each
  component family
- Story visual/ARIA snapshot sweep:
  [tests/browser/snapshots.spec.ts](tests/browser/snapshots.spec.ts)
- Repository automation: [xtask/README.md](xtask/README.md)
- Shared component protocol and its linked pages:
  [docs/protocol/shared-ui-components.md](docs/protocol/shared-ui-components.md)
- App shell parts protocol, for the `xs` size, compact text, touch surfaces,
  links, notices, empty states, menus, and panel resizing:
  [docs/protocol/app-shell-parts.md](docs/protocol/app-shell-parts.md)
- Mockup catalogue: [docs/mockups/README.md](docs/mockups/README.md)
- Web overlays protocol:
  [docs/protocol/web-overlays.md](docs/protocol/web-overlays.md)
- Rich-text collaboration protocol:
  [docs/protocol/rich-text-collaboration.md](docs/protocol/rich-text-collaboration.md)
- Drag select protocol: [docs/protocol/drag-select.md](docs/protocol/drag-select.md),
  its [selection rules](docs/protocol/drag-select-selection.md), and its
  [option reference](docs/protocol/drag-select-api.md)
- Consumer migration handoff: [docs/consumer-migration.md](docs/consumer-migration.md)

## Related Repositories

- Accounting consumer/source components:
  `/Users/calummoore/projects/futex/accounting`
- Juno consumer:
  `/Users/calummoore/projects/futex/juno`
