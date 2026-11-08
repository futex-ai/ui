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
- A shared, calm focus glow across every control. On web the DOM backend paints
  it from CSS `:focus-visible`, so server-rendered and static HTML keeps the same
  keyboard affordance before hydration — or with no JavaScript at all. Native
  keeps its platform focus behavior. One `focusIndicator` setting — on the theme
  for every control, or per instance — picks the glow (`ring`), the browser
  outline on the control's visible box (`outline`), or no focus styling at all
  (`none`) for a control embedded in a surface that shows focus itself.
- Portaled, anchored web date/dropdown/popover overlays, each placed by its
  own measured size so it flips above its trigger rather than being clipped,
  with content-sized selector menus and z-index escape hatches, plus
  touch-friendly native date sheets.
- Stacked web dialogs with focus control for the top dialog, ordered focus
  return, a page scroll lock, and live toast feedback, plus native dialogs and
  bottom sheets.
- Platform files shared by Expo, React Native, and the library's own DOM
  backend on web.
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
  CSS rules in [src/primitives/dom/css.ts](src/primitives/dom/css.ts)
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
