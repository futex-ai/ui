# Shared UI Package Protocol

The test, build, release, CI, and preview requirements of the `@firna/ui`
package. The [shared UI component protocol](shared-ui-components.md) holds the
package boundary and links every other page.

## Test And Build Contract

- Pure helpers for placement, navigation, close policy, and layer ordering must
  have unit tests.
- Component source contracts that protect web/native boundaries must have tests.
- Browser interaction tests must cover opening, keyboard navigation, outside
  dismissal, segmented selection, switch toggling, table row press (click and
  keyboard), focus retention/restoration, pointer-versus-keyboard focus-ring
  modality, focused-control disable/re-enable, async modal-form handoff to its
  first hydrated field, portal layering for dropdowns, comboboxes, and web
  modals, the date calendar's flip above a field near the viewport bottom, and
  a measured list's selected option staying in view once it is clamped.
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
- Every primitive a consumer is expected to import directly must have its own
  subpath, not the package root alone. This includes the shared focus-glow
  primitive (`./focusRing`, mirroring `./theme`): a consumer that imports every
  component by subpath would otherwise pull the whole barrel through Metro just
  to wire a focus ring onto its own control. Custom controls spread the hook's
  `focusRingProps`, include `focusRingVariables` in the painted host style, and
  use `target: "descendant"` / `"parent"` when focus and paint live on different
  elements. They pass their `focusIndicator` through the `indicator` option and
  gate any focus-only decoration of their own on the returned `indicator`.
  `focusRingStyleFor` remains the explicit inline-style escape hatch.
- release-please owns release PR creation, changelog updates, npm metadata
  version updates, `vX.Y.Z` Git tags, and GitHub releases.
- release-please must use the `node` release type so release PRs update
  `CHANGELOG.md`, `package.json`, and `package-lock.json` together.
- Generated release PRs must be normalized by the release workflow before they
  are considered ready for merge: the workflow checks out the release PR branch,
  runs the repository formatter, and pushes a bot commit only when formatting
  changed generated files.
- Ordinary pushes to `main` must not publish npm packages; publishing must only
  run when release-please reports that a GitHub release was created from a
  merged release PR, or when a maintainer manually dispatches a publish retry
  for an existing `vX.Y.Z` tag.
- npm publishing must run in the same workflow invocation that creates the
  GitHub release so it does not depend on a separate `release` event emitted by
  `GITHUB_TOKEN`.
- That workflow must remain at `.github/workflows/release-plz.yml` unless the
  npm trusted-publisher configuration is updated at the same time; npm validates
  the configured workflow filename during `npm publish`.
- The same workflow must expose a manual retry path that checks out an existing
  release tag and runs the same verification and npm publish steps without
  creating a new GitHub release.
- npm publishing must use npm trusted publishing with `id-token: write` and
  must guard against republishing an already-published version.
- Scoped package publishing must use public access.

## CI And Preview Contract

- Storybook deployments use Cloudflare Pages.
- The Cloudflare Pages project name is `futex-ui-storybook`.
- The stable main Storybook deploy uses the Cloudflare Pages production branch
  `main` and the default production URL
  `https://futex-ui-storybook.pages.dev`, unless a custom domain is added later.
- Same-repository non-release PR Storybook previews deploy the static Storybook
  build to Cloudflare Pages with branch name `pr-<number>`, producing a
  predictable preview URL such as
  `https://pr-123.futex-ui-storybook.pages.dev`.
- Every PR must run `cargo xtask check` after dependency installation. The
  xtask check runs the JavaScript verification suite: formatting, unit tests,
  typecheck, package build, package tarball smoke test, Storybook build, and
  browser interaction tests.
- The main branch must publish a stable default Storybook deployment.
- Every same-repository non-release PR must publish an isolated Storybook
  preview deployment.
- Release Please PRs, identified by a `release-please--` head branch or an
  `autorelease:` label, must skip the Storybook preview deploy job because they
  only update release metadata for changes already previewed in source PRs.
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
  user avatars, a month event calendar, a data table with clickable rows,
  centered web modal, bottom-sheet web modal, toast tones and an action toast,
  default accounting theme, and alternate primary color theme.
- Storybook previews must also include each part of the
  [app shell parts protocol](app-shell-parts.md): the `xs` size, compact text,
  a touch surface, link buttons, link tabs, navigation rows, both notice tones,
  page and panel empty states, a menu open in place and its phone sheet, and
  the panel resize handle.
- Storybook navigation must keep each example family in its own top-level
  folder, currently `AnimatedBorder/Examples`, `Avatar/Examples`,
  `Badge/Examples`, `Button/Examples`, `Calendar/Examples`, `Chart/BarChart`,
  `Chart/Comparison`, `Chart/Foundations`, `Chart/LineChart`, `Chart/Palette`,
  `Chart/PartToWhole`, `Chart/SmallMultiples`, `Chart/StatTile`,
  `DataGrid/Examples`, `Date/Examples`, `Drag Select/Examples`,
  `Dropdown/Examples`, `Empty state/Examples`, `Focus ring/Examples`,
  `Heatmap/Examples`, `Input/Examples`, `Kanban/Examples`, `Link/Examples`,
  `List/Examples`, `Loader/Examples`, `Modal/Examples`, `Notice/Examples`,
  `Panel resize/Examples`, `Popover/Examples`, `Primitives/Examples`,
  `Primitives/Interaction`, `Primitives/Layout`, `Primitives/Scrolling`,
  `Radio/Examples`, `RichText/Examples`, `RichText/Collaboration`,
  `Segmented/Examples`, `Sheet/Examples`, `Skeleton/Examples`,
  `SortableList/Examples`, `Spinner/Examples`, `Status dot/Examples`,
  `Switch/Examples`, `Table/Examples`, `Theme/Examples`, `Timeline/Examples`,
  `Toast/Examples`, `Touch surface/Examples`, `Typography/Examples`,
  `Video editor/Examples`, and `Workflow/Examples`.
- Each new family of the app shell parts keeps its own top-level folder by the
  same rule.
