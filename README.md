# ui

Shared UI component library for Firna React Native and React Native Web
surfaces. The first consumers are the accounting app and the Juno app.

## Key Features

- Shared dropdown menu, selector, combobox, drag-select, segmented control,
  radio card, switch, button, labelled input, modal, toast, avatar, and calendar
  heatmap primitives.
- A shared `sm` / `md` / `lg` size scale (`ControlSize`) across the interactive
  controls — buttons, inputs, dropdown selectors, date fields, segmented
  controls, and switches.
- Themeable visual tokens so consumers can use their own brand primary color.
- High-layer date, dropdown, and popover overlays with z-index escape hatches
  for custom consumer stacking contexts.
- Expo and React Native Web compatible platform files.
- Focused unit tests, browser interaction tests, and package export checks.
- Storybook previews for visual review on every PR.
- Release-plz release PRs and npm trusted publishing for `@firna/ui`.

## User-Facing Interface

The package name is `@firna/ui`. Public exports are available from:

- `@firna/ui` for all public components and helpers.
- `@firna/ui/avatar` for the themed circular initials avatar.
- `@firna/ui/button` for the themed button with tone, size, and block variants.
- `@firna/ui/date` for single-date and date-range fields.
- `@firna/ui/drag-select` for web drag-selection providers, target hooks, and
  geometry helpers.
- `@firna/ui/dropdown` for dropdown menu, selector, combobox, and layer helpers.
- `@firna/ui/heatmap` for the calendar contribution heatmap and its pure layout
  and color-scale helpers.
- `@firna/ui/input` for the labelled text input and bare input frame.
- `@firna/ui/modal` for web modal frame, portal, model, and layer helpers.
- `@firna/ui/popover` for generic anchored popovers.
- `@firna/ui/radio` for themed titled radio-option cards.
- `@firna/ui/segmented` for themed single-select segmented controls.
- `@firna/ui/switch` for themed binary on/off switches.
- `@firna/ui/theme` for `SharedUiThemeProvider`, default accounting-style
  tokens, the Juno token preset, and `createSharedUiTheme`.
- `@firna/ui/toast` for the toast provider, the `useToast` hook, and transient
  notification toasts.

## Installation

```bash
npm install @firna/ui
```

Consumers must provide the peer dependencies listed in `package.json`: React,
React DOM, React Native, React Native Web, React Native SVG, and
lucide-react-native.

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

- release-plz opens and updates the release PR for `@firna/ui`.
- Generated release PR files are normalized with
  `cargo xtask prepare-release-pr`, which syncs npm metadata and formats the
  changelog before CI validates the branch.
- When release-plz reports no release PR changes, the workflow exits
  successfully without checking out a release branch or syncing npm metadata.
- The release flow uses `release_always = true` so squash-merged release PRs
  still trigger the `vX.Y.Z` tag, GitHub release, and npm publish flow. The
  automatic release path first verifies that the `main` commit is associated
  with a `release-plz-*` PR, so ordinary pushes do not create releases or
  publish npm packages.
- The release job checks out the repository default branch, then attaches the
  target commit SHA to that local branch before running release-plz. This keeps
  release-plz on a branch with an `origin/main` upstream while still releasing
  the exact push commit or manual recovery commit.
- If release-plz reports no new release after a merged release PR has already
  bumped the Cargo version, the workflow creates the missing GitHub release
  from the checked-out `firna-ui-release` version and changelog section.
- npm publishing runs in the same release-plz workflow invocation that prepares
  the GitHub release, using npm trusted publishing. The publish job syncs
  `package.json` and `package-lock.json` from the Cargo version before
  verification and publishing. The npm package must configure this repository
  and `.github/workflows/release-plz.yml` as the trusted publisher, with allowed
  action `npm publish`.
- The release-plz workflow can also be manually dispatched with `publish_ref`
  set to a checked `vX.Y.Z` tag if the automatic publish job needs to be
  retried.
- To recover a missed automatic release, manually dispatch the workflow with
  `release_ref` set to the missed release PR merge commit SHA. The workflow
  still verifies that the commit came from a `release-plz-*` PR before creating
  the GitHub release and publishing npm.
- Scoped npm packages default to private, so `publishConfig.access` is set to
  `public`.

## Storybook Deployments

- Main branch Storybook deploys to Cloudflare Pages project
  `futex-ui-storybook`.
- Main URL: `https://futex-ui-storybook.pages.dev`.
- PR previews deploy to Cloudflare branch `pr-<number>`.
- PR preview URL shape:
  `https://pr-<number>.futex-ui-storybook.pages.dev`.
- PR previews are posted through a sticky comment marked
  `<!-- futex-ui-storybook-preview -->`.
- Closing a same-repository PR marks the sticky comment inactive and attempts
  to delete aliased preview deployments for that PR branch; if Cloudflare
  cleanup cannot complete safely, the comment reports the retained reason.
- Storybook examples are grouped under one top-level folder per family:
  `Avatar/Examples`, `Button/Examples`, `Date/Examples`,
  `Drag Select/Examples`, `Dropdown/Examples`, `Heatmap/Examples`,
  `Input/Examples`, `Modal/Examples`, `Popover/Examples`, `Radio/Examples`,
  `Segmented/Examples`, `Switch/Examples`, `Theme/Examples`, and
  `Toast/Examples`.
- Required repository variable: `CLOUDFLARE_ACCOUNT_ID`.
- Required repository secret: `CLOUDFLARE_PAGES_API_TOKEN` or
  `CLOUDFLARE_API_TOKEN`.

## Key Code Jumping Points

- Shared theme boundary: [src/theme.tsx](src/theme.tsx)
- Avatar component: [src/avatar/README.md](src/avatar/README.md)
- Shared control-size scale: [src/controlSize.ts](src/controlSize.ts)
- Button component: [src/button/README.md](src/button/README.md)
- Input component: [src/input/README.md](src/input/README.md)
- Dropdown components: [src/dropdown/README.md](src/dropdown/README.md)
- Drag-select components:
  [src/drag-select/README.md](src/drag-select/README.md)
- Heatmap component: [src/heatmap/README.md](src/heatmap/README.md)
- Modal components: [src/modal/README.md](src/modal/README.md)
- Radio card component: [src/radio/README.md](src/radio/README.md)
- Segmented control component:
  [src/segmented/README.md](src/segmented/README.md)
- Switch component: [src/switch/README.md](src/switch/README.md)
- Toast component: [src/toast/README.md](src/toast/README.md)
- Browser tests: [tests/browser/storybook.spec.ts](tests/browser/storybook.spec.ts)
- Repository automation: [xtask/README.md](xtask/README.md)
- Release metadata crate:
  [crates/firna-ui-release/README.md](crates/firna-ui-release/README.md)
- Shared component protocol:
  [docs/protocol/shared-ui-components.md](docs/protocol/shared-ui-components.md)
- Consumer migration handoff: [docs/consumer-migration.md](docs/consumer-migration.md)
- Active and completed implementation plans: [plans/README.md](plans/README.md)

## Related Repositories

- Accounting consumer/source components:
  `/Users/calummoore/projects/futex/accounting`
- Juno consumer:
  `/Users/calummoore/projects/futex/juno`
