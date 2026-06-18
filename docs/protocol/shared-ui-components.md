# Shared UI Component Library Protocol

## Status

Implemented contract for the dropdown, drag-select, segmented control, radio
card, switch, button, modal, toast, and avatar extraction, including the shared
control-size scale for buttons and inputs.

## Purpose

This repository provides shared React Native and React Native Web UI primitives
for Firna apps. The first consumers are the accounting app and the Juno app.
The first shared component families are the dropdown components, drag-select
provider, segmented control patterns, radio-option cards, switch primitive, web
modal components, transient notification toasts, and the circular user avatar
currently implemented in the accounting app.

## Package Boundary

- The library must not import from consumer-local aliases such as `@/theme`,
  `@/forms/focusRing`, screen modules, route modules, or app-specific state.
- Consumer apps provide data, callbacks, labels, and theme overrides.
- The library owns component presentation, keyboard behavior, focus treatment,
  portal behavior, layering, and pure interaction helpers.
- `react`, `react-native`, `react-native-web`, `react-dom`, and
  `lucide-react-native` are external peer/runtime dependencies, not copied app
  code.

## Theming Contract

- The library ships a default theme matching the accounting component colors.
- Consumers can override brand-sensitive tokens through a shared theme provider
  or theme creation helper.
- At minimum, the theme must expose primary color tokens:
  `primary`, `primaryDeep`, `primarySoft`, and `primaryBorder`.
- Shared semantic tokens must also cover surface, text, muted text, borders,
  danger, warning, radii, and fonts so copied components do not depend on a
  consumer theme module.
- Focus rings use the active theme primary color.
- Consumer theme overrides must be shallow and predictable; unspecified tokens
  fall back to the default shared theme.

## Segmented Control Contract

The segmented control family covers compact single-select controls where all
options remain visible. This includes accounting's report-style pill tabs and
the Profit & loss income-source filter pills.

Required behavior:

- Render one selected value from a small option set.
- Expose `radiogroup` and `radio` accessibility roles, with checked and
  disabled state on every segment.
- Support the outline variant used for filter pills and the pill-track variant
  used for tab-like report switches.
- Support equal-width segments and content-sized wrapping filter pills.
- Use shared theme tokens for selected backgrounds, selected text, borders,
  disabled opacity, labels, hint text, and validation text.
- Keep labels, required state, hints, and validation errors available without
  depending on consumer-local form components.

## Switch Contract

The switch family covers compact binary settings where surrounding rows or form
fields own the visible label.

Required behavior:

- Render a 40px by 24px track with an 18px knob that moves between off and on
  positions.
- Expose `switch` accessibility semantics with checked and disabled state.
- Keep the touch target at least 44px on native and web even though the visible
  track is smaller.
- Treat missing `onValueChange` as a read-only disabled control.
- Use shared theme tokens for off track color, on track color, disabled opacity,
  and pill radius.
- Keep a `trackStyle` override available for non-default surfaces without
  requiring consumers to fork the component.

## Radio Card Contract

The radio card family covers titled, card-shaped single-select options where the
supporting body copy is part of the option label.

Required behavior:

- Render a title, optional body copy, and a circular checked indicator.
- Expose `radio` accessibility semantics with checked and disabled state.
- Treat missing `onPress` as a read-only disabled option.
- Allow consumers to place related cards under their own labelled `radiogroup`.
- Use shared theme tokens for selected backgrounds, selected borders, dot
  colors, text, disabled opacity, fonts, radii, and focus treatment.

## Button Contract

The button family covers the pressable actions that the accounting mockups model
as `.btn`: primary calls to action, neutral secondary actions, low-emphasis
ghost actions, and destructive danger actions.

Required behavior:

- Render a labelled button with an optional leading icon tinted to match the
  label color.
- Support the primary (filled), secondary (surface + border, the default), ghost
  (no fill or border), and danger (rose border + label) tones.
- Support a full-width block variant for stacked form actions and bottom sheets.
- Expose `button` accessibility semantics with a disabled state, and treat a
  missing press handler as a read-only disabled control.
- Own the shared focus ring and hide the browser's default outline.
- Use shared theme tokens for fills, borders, label colors, disabled opacity,
  fonts, and radii, and size with the shared control-size scale.

## Control Size Contract

Interactive controls share one size scale so a form can size its fields and
their buttons from a single vocabulary.

Required behavior:

- Expose `sm`, `md` (default), and `lg` sizes through a shared `ControlSize`
  type used by the button and the input/field.
- The button scales its height, horizontal padding, label type scale, and icon
  with the size.
- The input/field scales its box height, padding, input text, and prefix /
  suffix / clear icons with the size, while keeping the label, hint, and error
  messages at a constant scale.
- `md` preserves the established defaults (the 38px button and the 40px input
  box) so existing call sites are unchanged when no size is supplied.

## Avatar Contract

The avatar family covers the compact circular initials badge used to represent a
person or entity.

Required behavior:

- Render a circular disc with one or two initials centered on it.
- Drive the diameter, the circular radius, and the initials' font size from a
  single `size` prop so every avatar scales proportionally.
- Support a solid tone (primary-filled disc with white initials) and a soft tone
  (soft-tinted disc with deep-primary initials).
- Use shared theme tokens for the disc backgrounds, the initials' color, and the
  initials' font, with no consumer-local theme imports.
- Accept an optional accessible name and a container style override without
  requiring consumers to fork the component.
- Accept an optional initials color override so consumer-provided palette discs
  can keep matching palette-specific foreground colors.

## Date Contract

The date family covers single-date fields and start–end ranges built from two
independent single-date inputs.

Required behavior:

- Use ISO `YYYY-MM-DD` as the canonical value with `""` as the unset sentinel,
  and render the display as `D Mon YYYY`.
- Render an identical styled trigger on every platform and resolve only the
  opened picker per platform: an editable type-or-pick text input plus anchored
  calendar popover on web, and a tap-to-pick calendar sheet on native.
- Clamp selections and typed values to the inclusive `min`/`max` bounds.
- Validate range ordering, surfacing an error when the start is after the end,
  while still allowing each endpoint to hold any date independently.
- Offer an opt-in (`clearable`, off by default) clear affordance that, once a
  value is set, resets the value to the unset sentinel without clamping and closes
  the picker; range endpoints clear independently. The clear control is a
  labelled, focusable button, distinct from the decorative calendar icon.
- Lift the open field root (and the range row) above following form content so
  the calendar escapes sibling stacking contexts.
- Keep day cells, navigation buttons, and the clear button labelled for
  assistive technology, and include the field label in those accessible names.

## Heatmap Contract

The heatmap family covers the calendar contribution grid: a date range laid out
as columns of weeks with per-day intensity coloring, month labels along the top,
and an optional weekday gutter and intensity legend.

Required behavior:

- Take an inclusive ISO `YYYY-MM-DD` start/end range plus a sparse list of
  per-date values, and lay it out as column-major weeks (one column per week,
  one row per weekday) padded so the grid stays rectangular.
- Resolve the layout from pure, timezone-safe, unit-tested helpers that never
  read the current date, returning an empty grid for an invalid or reversed
  range.
- Place a short month label above the column where each month's in-range days
  begin, detecting the transition from in-range days so a leading partial week
  is not mislabeled with the previous month.
- Map each day's value to an ordered intensity ramp through ascending
  lower-bound thresholds, deriving even bands from the data's max value by
  default and honoring explicit thresholds for an absolute scale, with a
  distinct empty color for days with no value.
- Drive the cell size, gap, and corner radius, the color ramp and empty color,
  the week start, and the month / weekday / legend chrome from props with
  sensible defaults.
- Use shared theme tokens for the default ramp, the empty cell, and the label
  colors instead of consumer-local theme imports.
- Label each in-range cell for assistive technology, hide padding cells from it,
  and make cells focusable, pressable buttons when a press handler is supplied.

## Dropdown Contract

The dropdown family covers three related surfaces:

- Button-backed selectors and action menus.
- Read-only selector-shaped controls.
- Input-backed combobox popovers and chip multi-selects.

Required behavior:

- Measure an anchor and render a portal surface that escapes ordinary page
  stacking contexts.
- Place below the trigger when space permits, flip above near the viewport
  bottom, and clamp max height.
- Support keyboard navigation, disabled row skipping, Enter selection, Escape
  close, hover active state, outside pointer close, loading/empty rows, section
  headers, dividers, footers, secondary text, right-side content, and danger or
  warning row tones.
- Keep the keyboard-active option scrolled into the visible list viewport when
  navigation moves through long dropdown or combobox lists.
- Include the field label in selector accessible names when a visual label is
  supplied, so repeated selectors remain distinguishable to assistive
  technology.
- Preserve no-match empty rows even when combobox footers are present.
- Keep input-backed comboboxes on a non-modal web portal so text inputs retain
  focus while results are open.
- Provide an action-menu wrapper that owns the trigger anchor, controlled or
  uncontrolled open state, portal/list composition, and default close-after-row
  selection behavior for common trigger-backed menus.
- Offer selectable trigger gestures (press, hover, long-press, context menu) on
  the action-menu wrapper, resolving hover and context-menu behavior per
  platform and keeping press available where a gesture is unavailable.
- Keep dropdown and combobox portal layers above modal surfaces.
- Preserve native-safe fallbacks for Expo platform resolution.

## Drag Select Contract

The drag-select family covers web-only rubber-band selection for repeated rows,
tiles, and similar rendered targets. Native platforms receive a safe provider
fallback but no drag gesture.

Required behavior:

- Register selectable targets by stable id through a hook-owned ref.
- Measure registered target bounds on drag start and select every enabled target
  whose measured bounds intersect the marquee box on pointer up.
- Require pointer movement to meet a provider-configurable minimum drag
  distance before live matching, marquee rendering, or final selection starts.
  The default minimum is `4px`; `0` starts selection immediately after movement,
  negative values clamp to `0`, and non-finite values fall back to the default.
- Expose final selected ids, selected target metadata, selected count, live
  matching ids, live matching target metadata, and live matching count through
  hooks.
- Treat selected target metadata as a snapshot captured when selection finishes;
  consumers that need live target data should map selected ids through their own
  current data source.
- Provide a provider-level selection-change callback and a hook-level listener
  for components that need side effects when selection changes.
- Allow the marquee badge copy to be customized from the live matching count,
  ids, and target metadata.
- Render the web marquee through a body-level portal using shared theme primary
  colors, radii, and a shared layer token that clears modal and dropdown
  surfaces while allowing an explicit provider override.
- Ignore touch drags and nested form/menu/link controls while allowing a
  selectable target root to start the drag.
- Keep the pure geometry helpers exported and covered by unit tests.
- Preserve a native-safe fallback for Expo platform resolution.

## Modal Contract

The modal family is a web modal frame, not a native modal replacement.

Required behavior:

- Render web dialogs through a `document.body` portal.
- Provide backdrop, surface, title, optional subtitle, close control, scrollable
  body, footer slot, size variants, and center or bottom-sheet placement.
- Support close policy for Escape, backdrop press, close button, request close,
  non-dismissible flows, and busy/disabled close states.
- Move focus into the modal on open, trap Tab focus inside the modal while it is
  open, and restore previous focus on close.
- Use accessible dialog labeling and close labels.
- Provide native-safe fallback files that return `null` rather than replacing
  iOS or Android native sheets, action sheets, OS pickers, or platform modals.

## Toast Contract

The toast family covers transient, non-blocking notifications driven from an
imperative API rather than rendered declaratively at a call site.

Required behavior:

- Provide a `ToastProvider` that owns a capped, ordered queue and publishes an
  imperative API (`toast`, `dismiss`, `dismissAll`) through a `useToast` hook;
  the hook must throw when used outside a provider.
- `toast()` must return an id usable with `dismiss`, default the tone to `info`,
  and default the auto-dismiss delay to the provider default while accepting a
  per-toast `duration` override and a `null`/non-positive duration for sticky
  toasts.
- Cap simultaneously visible toasts at a provider-configurable `max` (default 4)
  by dropping the oldest entries.
- Render toasts in a viewport pinned to one of six placements (top/bottom ×
  left/center/right), with the newest toast nearest the pinned edge, through a
  `document.body` portal with `position: fixed` on web and an
  absolutely-positioned, `pointerEvents="box-none"` overlay on native.
- Auto-dismiss each toast after its resolved duration and pause the countdown
  while the pointer or keyboard focus is over the toast.
- Carry tone (`info`, `success`, `warning`, `error`) as a left accent strip,
  leading icon, and screen-reader semantics: errors announce assertively with
  the `alert` role, other tones politely with the `status` role.
- Support an optional action button that runs its handler and then dismisses the
  toast, and an optional close control that dismisses only its own toast.
- Use shared theme tokens for the surface, border, accent colors, text, fonts,
  and radii, with no consumer-local theme imports.
- Float the toast viewport above modal surfaces, nested overlays, and the
  consent banner, and export the layer token for consumers.

## Layering Contract

- Ordinary content sits below dropdowns and modal portals.
- Modal backdrop sits below modal surface.
- Dropdowns and comboboxes opened inside modals sit above modal surfaces.
- The toast viewport sits above modal surfaces, nested dropdown/combobox
  overlays, and the cookie-consent banner.
- Date calendar popovers, dropdown portals, and generic popovers use a high
  default overlay floor and expose z-index props for consumer-owned stacking
  contexts that sit above the shared defaults.
- Layer tokens must be exported so consumers can align adjacent overlays
  without hard-coded numeric z-index values.

## Test And Build Contract

- Pure helpers for placement, navigation, close policy, and layer ordering must
  have unit tests.
- Component source contracts that protect web/native boundaries must have tests.
- Browser interaction tests must cover opening, keyboard navigation, outside
  dismissal, segmented selection, switch toggling, focus retention/restoration,
  and portal layering for dropdowns, comboboxes, and web modals.
- The package must typecheck and build before it is used by accounting or Juno.
- `npm run test:package` must pack the built library, install the tarball into a
  temporary consumer, import every public package subpath with Node's native ESM
  resolver, typecheck those public package subpaths with TypeScript's NodeNext
  resolver, and import the same subpaths through a Vite build.
- After package build/tests pass, smoke-test at least one local web route or
  harness that opens a dropdown, a combobox, and a modal, toggles a segmented
  control and switch, and selects a radio card.

## Package Release Contract

- The public npm package name is `@firna/ui`.
- Standard ESM `import` exports must point at Node-resolvable `dist/node/**`
  files with explicit relative `.js` specifiers.
- Exported `types` entries must point at NodeNext-compatible declarations under
  `dist/node/**`, with explicit relative `.js` specifiers inside declaration
  imports and re-exports.
- The `react-native` export condition must continue to point at the normal
  `dist/**` build so React Native platform resolution can choose platform files.
- release-please owns release PR creation, changelog updates, npm metadata
  version updates, `vX.Y.Z` Git tags, and GitHub releases.
- release-please must use the `node` release type so release PRs update
  `CHANGELOG.md`, `package.json`, and `package-lock.json` together.
- Ordinary pushes to `main` must not publish npm packages; publishing must only
  run when release-please reports that a GitHub release was created from a
  merged release PR.
- npm publishing must run in the same workflow invocation that creates the
  GitHub release so it does not depend on a separate `release` event emitted by
  `GITHUB_TOKEN`.
- npm publishing must use npm trusted publishing with `id-token: write` and
  must guard against republishing an already-published version.
- Scoped package publishing must use public access.

## CI And Preview Contract

- Storybook deployments use Cloudflare Pages.
- The Cloudflare Pages project name is `futex-ui-storybook`.
- The stable main Storybook deploy uses the Cloudflare Pages production branch
  `main` and the default production URL
  `https://futex-ui-storybook.pages.dev`, unless a custom domain is added later.
- PR Storybook previews deploy the static Storybook build to Cloudflare Pages
  with branch name `pr-<number>`, producing a predictable preview URL such as
  `https://pr-123.futex-ui-storybook.pages.dev`.
- Every PR must run `cargo xtask check` after dependency installation. The
  xtask check runs the JavaScript verification suite: formatting, unit tests,
  typecheck, package build, package tarball smoke test, Storybook build, and
  browser interaction tests.
- The main branch must publish a stable default Storybook deployment.
- Every PR must publish an isolated Storybook preview deployment.
- The PR Storybook URL must be posted back to the pull request through a sticky
  comment with marker `<!-- futex-ui-storybook-preview -->`, matching the
  preview-comment pattern used by accounting and Juno.
- The sticky comment must be updated on every PR deploy attempt with status,
  preview URL, commit SHA, and workflow run URL.
- PR previews update in place on every new commit by redeploying the same
  `pr-<number>` Cloudflare Pages branch.
- On PR close, the workflow must mark the sticky comment inactive and use the
  Cloudflare Pages API to force-delete aliased non-production deployments for
  the `pr-<number>` branch when that API is available to the workflow; if
  deletion cannot be performed safely, the close workflow must report that the
  preview was retained and include the reason.
- Required Cloudflare configuration is repository variable
  `CLOUDFLARE_ACCOUNT_ID` and repository secret `CLOUDFLARE_PAGES_API_TOKEN` or
  `CLOUDFLARE_API_TOKEN`.
- Storybook previews must include at least the shared dropdown selector,
  dropdown action menu, input-backed combobox, chip multi-select, segmented
  control variants, radio card group, switch toggle, button tones and sizes,
  user avatars, centered web modal, bottom-sheet web modal, toast tones and an
  action toast, default accounting theme, and alternate primary color theme.
- Storybook navigation must keep each example family in its own top-level
  folder, currently `Avatar/Examples`, `Button/Examples`, `Date/Examples`,
  `Dropdown/Examples`, `Heatmap/Examples`, `Input/Examples`, `Modal/Examples`,
  `Popover/Examples`, `Radio/Examples`, `Segmented/Examples`, `Switch/Examples`,
  `Theme/Examples`, and `Toast/Examples`.

## Non-Goals

- Migrating accounting or Juno imports in this package extraction change.
- Replacing native iOS or Android modal/sheet/picker behavior.
- Adding app-specific mutations, data fetching, routing, or screen state.
- Adding a broad design system beyond the copied dropdown, segmented control,
  and modal families.
