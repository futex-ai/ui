# Shared UI Component Library Protocol

## Status

Implemented contract for the dropdown, segmented control, and modal extraction.

## Purpose

This repository provides shared React Native and React Native Web UI primitives
for Futex apps. The first consumers are the accounting app and the Juno app.
The first shared component families are the dropdown components, segmented
control patterns, and web modal components currently implemented in the
accounting app.

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
- Include the field label in selector accessible names when a visual label is
  supplied, so repeated selectors remain distinguishable to assistive
  technology.
- Preserve no-match empty rows even when combobox footers are present.
- Keep input-backed comboboxes on a non-modal web portal so text inputs retain
  focus while results are open.
- Keep dropdown and combobox portal layers above modal surfaces.
- Preserve native-safe fallbacks for Expo platform resolution.

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

## Layering Contract

- Ordinary content sits below dropdowns and modal portals.
- Modal backdrop sits below modal surface.
- Dropdowns and comboboxes opened inside modals sit above modal surfaces.
- Layer tokens must be exported so consumers can align adjacent overlays
  without hard-coded numeric z-index values.

## Test And Build Contract

- Pure helpers for placement, navigation, close policy, and layer ordering must
  have unit tests.
- Component source contracts that protect web/native boundaries must have tests.
- Browser interaction tests must cover opening, keyboard navigation, outside
  dismissal, segmented selection, focus retention/restoration, and portal
  layering for dropdowns, comboboxes, and web modals.
- The package must typecheck and build before it is used by accounting or Juno.
- After package build/tests pass, smoke-test at least one local web route or
  harness that opens a dropdown, a combobox, and a modal, and toggles a
  segmented control.

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
  browser interaction tests, typecheck, package build, and Storybook build.
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
  control variants, centered web modal, bottom-sheet web modal, default
  accounting theme, and alternate primary color theme.
- Storybook navigation must keep dropdown, segmented control, and modal
  examples in separate top-level folders, currently `Dropdown/Examples`,
  `Segmented/Examples`, and `Modal/Examples`.

## Non-Goals

- Migrating accounting or Juno imports in this package extraction change.
- Replacing native iOS or Android modal/sheet/picker behavior.
- Adding app-specific mutations, data fetching, routing, or screen state.
- Adding a broad design system beyond the copied dropdown, segmented control,
  and modal families.
