# Shared Dropdown And Modal Library

## Status

Active.

## Goal

Copy the accounting dropdown and modal component families into this repo as the
first shared UI library components, then make them package-safe and themeable
for both accounting and Juno. The first implementation should prepare this repo
as the source of truth; accounting and Juno import migrations are a later step.

## Investigation Summary

The source components live under:

- `/Users/calummoore/projects/futex/accounting/ts/app/src/components/dropdown`
- `/Users/calummoore/projects/futex/accounting/ts/app/src/components/modal`

Accounting already has focused docs and tests for these components:

- Dropdown docs: `ts/app/src/components/dropdown/README.md`
- Modal docs: `ts/app/src/components/modal/README.md`
- Dropdown tests: `ts/app/src/__tests__/dropdown.test.ts`
- Combobox tests: `ts/app/src/__tests__/combobox.test.ts`
- Modal tests: `ts/app/src/__tests__/webModal.test.ts`

Important findings:

- The dropdown family includes button-backed selectors/action menus,
  read-only selectors, input-backed combobox popovers, and a chip multi-select.
- The web dropdown and combobox paths use non-modal DOM portals so hover and
  input focus remain stable.
- The native dropdown path still uses a React Native `Modal` fallback.
- The web modal is deliberately web-only and has native-safe fallback files.
- Dropdowns and comboboxes must layer above modal surfaces.
- The accounting code imports app-local `@/theme` and `@/forms/focusRing`, so
  the shared package needs its own theme and focus-ring boundary.
- `DropdownSelector.tsx` is 280 lines and `WebModalFrame.web.tsx` is 261 lines;
  adding package theming may require splitting them to stay comfortably under
  the repo's preferred file-size target.

## Assumptions And Questions

- Assumption: the package name can be chosen during scaffolding. Suggested
  default: `@futex/ui`.
- Assumption: accounting's current sage theme becomes the library default.
- Assumption: Juno primarily needs primary color overrides, not a distinct
  layout or interaction contract.
- Question: should the first package expose only stable high-level components,
  or also low-level helpers such as `dropdownPlacement` and layer constants?
  Recommendation: export low-level helpers that consumers already need for
  tests or adjacent overlay alignment.
- Question: should the package be consumed through workspace source imports at
  first or built package artifacts? Recommendation: start with built package
  artifacts plus source maps so accounting and Juno do not depend on internal
  source layout.
- Question: should Storybook preview hosting use Cloudflare or the
  `internal-498318` GCP project? Recommendation: use whichever matches the
  existing accounting/Juno automation most closely, and document the chosen
  provider before implementation.

## Scope Decisions

- Copy the accounting implementations first, then remove accounting-only
  imports and app-specific assumptions.
- Build a small package boundary rather than a full design-system redesign.
- Keep React Native and React Native Web compatibility.
- Keep the dropdown, combobox, and modal boundaries separate.
- Add a theme provider and default theme in this package instead of requiring
  consumers to match accounting's `@/theme` shape.
- Preserve accounting behavior through copied tests before making consumer
  import changes.

## Non-Goals

- Updating accounting or Juno to import from this package in this plan.
- Replacing native iOS/Android modal, sheet, action sheet, or OS picker flows.
- Adding app-specific data fetching, routing, mutations, or screen state.
- Reworking visual design beyond theme token extraction and primary-color
  adaptability.

## Milestone 1: Contract And Package Scaffold

Summary: establish the package boundary and development commands before moving
component code.

- [x] Investigate the accounting dropdown and modal source components.
- [x] Add a protocol doc for the initial shared component contract.
- [ ] Confirm package name and export style, defaulting to `@futex/ui` unless
  the repo already establishes another convention.
- [ ] Inspect Juno's current UI tokens and package setup to confirm peer
  dependency and theme compatibility.
- [ ] Add TypeScript package scaffolding with source, tests, build output, and
  package exports.
- [ ] Declare React, React Native, React Native Web, React DOM, and icon
  dependency boundaries.
- [ ] Add initial README instructions for install, build, test, and local smoke
  usage.
- [ ] Run the initial package build/typecheck command.

## Milestone 2: Copy Dropdown And Modal Components

Summary: copy accounting components and tests while preserving current behavior.

- [ ] Copy dropdown source files, README content, and focused dropdown tests.
- [ ] Copy modal source files, README content, and focused modal tests.
- [ ] Preserve platform-specific `.web.tsx` and native fallback files.
- [ ] Replace accounting alias imports with package-local modules.
- [ ] Export public dropdown, combobox, modal, model, and layer APIs from stable
  package entrypoints.
- [ ] Split files that would exceed the preferred 300-line limit after package
  adaptation.
- [ ] Run copied unit/source-contract tests and fix failures.

## Milestone 3: Theme And Focus Adaptation

Summary: make the copied components brand-adaptable for accounting and Juno.

- [ ] Add a package-owned default theme matching accounting's current component
  colors.
- [ ] Add a theme provider, theme creation helper, and documented override
  shape.
- [ ] Replace hard-coded accounting theme reads with the shared theme hook or
  helper.
- [ ] Move focus-ring helpers into the package and bind focus color to the
  active theme primary token.
- [ ] Add tests for default theme fallback, primary color overrides, and focus
  ring color selection.
- [ ] Add a small local usage fixture or example that renders accounting-default
  and alternate-primary variants.

## Milestone 4: CI, Browser Tests, And Storybook

Summary: add automated PR confidence checks and deployable visual review
surfaces before consumers migrate to the package.

- [ ] Add PR CI checks for install, formatting or linting, unit tests,
  typecheck, package build, browser interaction tests, and Storybook build.
- [ ] Add browser interaction tests for dropdown open/close, keyboard
  navigation, outside dismissal, combobox input focus retention, modal focus
  restoration, and dropdown-over-modal layering.
- [ ] Add Storybook stories for dropdown selector, dropdown action menu,
  input-backed combobox, chip multi-select, centered web modal, bottom-sheet web
  modal, accounting-default theme, and alternate-primary theme.
- [ ] Add a stable main-branch Storybook deployment.
- [ ] Add per-PR Storybook preview deployment.
- [ ] Post the PR Storybook link back to the pull request as a visible comment,
  check summary, deployment status, or equivalent link, matching the
  accounting/Juno workflow.
- [ ] Choose Cloudflare or the `internal-498318` GCP project for Storybook
  hosting and document the provider, deployment naming, update behavior, and
  cleanup behavior.
- [ ] Document local commands for running Storybook and browser interaction
  tests in the README.

## Milestone 5: Verification And Smoke Coverage

Summary: prove the package is usable before consumers migrate to it.

- [ ] Run the full package test suite.
- [ ] Run the package typecheck.
- [ ] Run the package build.
- [ ] Run browser interaction tests.
- [ ] Run Storybook build.
- [ ] Run a local smoke test that opens a dropdown selector, input-backed
  combobox, and web modal in a browser or render harness.
- [ ] If this repo has Cargo tooling by then, run `cargo fmt --all -- --check`,
  `cargo clippy --all-targets --all-features`, and `cargo xtask check`; if it
  does not, document that Cargo checks are unavailable and list the package
  checks that were run.
- [ ] Update README and protocol docs with any behavior discovered during
  implementation.
- [ ] Run `git add -A`, commit the completed work using Conventional Commits,
  and push the branch.
- [ ] After the push, run `cargo xtask review` if available; otherwise document
  the blocker and review the diff manually against `origin/main`.
- [ ] Report every review finding without automatically fixing it, including
  severity, context, impact, solution options, and a recommended option.

## Milestone 6: Consumer Migration Handoff

Summary: prepare accounting and Juno for follow-up work without changing them
in this plan.

- [ ] Document the import migration path for accounting.
- [ ] Document the import migration path for Juno.
- [ ] Record any consumer-specific gaps that should become separate plans.
- [ ] Move this plan from Active to Completed in `plans/README.md` after all
  milestones, checks, smoke tests, push, and review reporting are complete.
