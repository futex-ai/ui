# Shared UI Component Library Protocol

## Status

Implemented contract for the dropdown, drag-select, segmented control, radio
card, switch, spinner, loader, animated border, button, list, data table,
workflow builder, modal, toast,
avatar, status badge, rich-text editor, and event-calendar extraction,
including the shared control-size scale for buttons, inputs, and textareas.

## Purpose

This repository provides shared React Native and web UI primitives for Firna
apps. The first consumers are the accounting app and the Juno app.
The first shared component families are the dropdown components, drag-select
provider, segmented control patterns, radio-option cards, switch primitive, data
table, workflow-builder step graph, modal components, transient notification
toasts, and the circular user avatar currently implemented in the accounting
app, plus labelled text inputs and textareas for shared forms.

## Package Boundary

- The library must not import from consumer-local aliases such as `@/theme`,
  `@/forms/focusRing`, screen modules, route modules, or app-specific state.
- Consumer apps provide data, callbacks, labels, and theme overrides.
- The library owns component presentation, keyboard behavior, focus treatment,
  portal behavior, layering, and pure interaction helpers.
- `react`, `react-native`, `react-dom`, `react-native-svg`,
  `lucide-react-native`, and `lucide-react` are external peer/runtime
  dependencies, not copied app code. A web-only consumer needs just `react`,
  `react-dom`, and `lucide-react`.
- Components never import `react-native`, `react-native-svg`, or a Lucide
  package directly. They import from `src/primitives`, whose native and `.web`
  files pick the backend: native delegates to `react-native`, and web renders
  through the library's own DOM backend, so the web build depends on neither
  `react-native` nor `react-native-web` at runtime. A unit test enforces the
  rule and keeps the two export lists in sync.

## Contract Pages

The requirements of each component family are on these pages. Each heading
below links to the page that holds its requirements.

- [Theming](shared-ui-theming.md): tokens, presets, contrast, and focus
  indicators.
- [Controls](shared-ui-controls.md): segmented controls, switches, radio
  cards, buttons, control sizes, inputs, and date fields.
- [Indicators](shared-ui-indicators.md): spinners, loaders, animated borders,
  avatars, badges, and status dots.
- [Data views](shared-ui-data-views.md): calendars, heatmaps, lists, tables,
  kanban boards, and workflow builders.
- [Overlays](shared-ui-overlays.md): dropdowns and toasts.
- [Package](shared-ui-package.md): tests, builds, releases, CI, and Storybook
  previews.
- [App shell parts](app-shell-parts.md): the `xs` size, compact text, touch
  surfaces, links, notices, empty states, menus, and panel resizing.
- The [web overlays](web-overlays.md), [rich-text editor](rich-text-editor.md),
  and [drag select](drag-select.md) protocols cover their own areas.

## Rich Text Editor Contract

The rich-text editor's cross-platform markdown, block-editing, mobile toolbar,
and accessibility behavior is specified separately in
[rich-text-editor.md](rich-text-editor.md). Its multi-user presentation layer —
live carets, tracked changes, and comment threads — is specified in
[rich-text-collaboration.md](rich-text-collaboration.md).

## Theming Contract

See the [theming page](shared-ui-theming.md#theming-contract).

## Segmented Control Contract

See the [controls page](shared-ui-controls.md#segmented-control-contract).

## Switch Contract

See the [controls page](shared-ui-controls.md#switch-contract).

## Spinner Contract

See the [indicators page](shared-ui-indicators.md#spinner-contract).

## Loader Contract

See the [indicators page](shared-ui-indicators.md#loader-contract).

## Animated Border Contract

See the [indicators page](shared-ui-indicators.md#animated-border-contract).

## Radio Card Contract

See the [controls page](shared-ui-controls.md#radio-card-contract).

## Button Contract

See the [controls page](shared-ui-controls.md#button-contract).

## Control Size Contract

See the [controls page](shared-ui-controls.md#control-size-contract).

## Input Contract

See the [controls page](shared-ui-controls.md#input-contract).

## Avatar Contract

See the [indicators page](shared-ui-indicators.md#avatar-contract).

## Badge Contract

See the [indicators page](shared-ui-indicators.md#badge-contract).

## Status Dot Contract

See the [indicators page](shared-ui-indicators.md#status-dot-contract).

## Date Contract

See the [controls page](shared-ui-controls.md#date-contract).

## Calendar Contract

See the [data views page](shared-ui-data-views.md#calendar-contract).

## Heatmap Contract

See the [data views page](shared-ui-data-views.md#heatmap-contract).

## List Contract

See the [data views page](shared-ui-data-views.md#list-contract).

## Table Contract

See the [data views page](shared-ui-data-views.md#table-contract).

## Kanban Contract

See the [data views page](shared-ui-data-views.md#kanban-contract).

## Dropdown Contract

See the [overlays page](shared-ui-overlays.md#dropdown-contract).

## Drag Select Contract

The drag-select family gives web rubber-band selection to repeated rows,
tiles, and similar targets. One provider can wrap one list or a whole app
shell, and a page sets the options of the nearest provider with
`useDragSelectableOptions`. Native renders the same provider and selection
state, but has no drag gesture. The requirements are in
[drag-select.md](drag-select.md): targets and hooks, option precedence, the
start rules, the gesture, auto-scroll, the box and the wrapper, and native
behavior. Controlled and uncontrolled selection and the selection scope are
in [drag-select-selection.md](drag-select-selection.md). The option
defaults, the state, the helpers, and the library gesture surfaces are in
[drag-select-api.md](drag-select-api.md).

## Modal Contract

Dialog behavior, web stacking, focus, and native presentation follow the
[modal contract](web-overlays.md#modal-contract).

## Toast Contract

See the [overlays page](shared-ui-overlays.md#toast-contract).

## Workflow Builder Contract

See the [data views page](shared-ui-data-views.md#workflow-builder-contract).

## Layering Contract

Overlay order, backdrops, and public layer tokens follow the
[layering contract](web-overlays.md#layering-contract).

## Test And Build Contract

See the [package page](shared-ui-package.md#test-and-build-contract).

## Package Release Contract

See the [package page](shared-ui-package.md#package-release-contract).

## CI And Preview Contract

See the [package page](shared-ui-package.md#ci-and-preview-contract).

## Non-Goals

- Migrating accounting or Juno imports in this package extraction change.
- Replacing platform modality or native OS pickers and action sheets.
- Adding app-specific mutations, data fetching, routing, or screen state.
- Adding a broad design system beyond the families that Firna apps share.
  Conductive decision 119 puts the [app shell parts](app-shell-parts.md) in
  scope.
