# ui

Shared UI component library for Firna React Native and React Native Web
surfaces. The first consumers are the accounting app and the Juno app.

## Key Features

- Shared dropdown, selector, combobox, segmented control, radio card, switch,
  and modal primitives.
- Themeable visual tokens so consumers can use their own brand primary color.
- Expo and React Native Web compatible platform files.
- Focused unit tests, browser interaction tests, and package export checks.
- Storybook previews for visual review on every PR.
- Release-plz release PRs and npm trusted publishing for `@firna/ui`.

## User-Facing Interface

The package name is `@firna/ui`. Public exports are available from:

- `@firna/ui` for all public components and helpers.
- `@firna/ui/date` for single-date and date-range fields.
- `@firna/ui/dropdown` for dropdown, selector, combobox, and layer helpers.
- `@firna/ui/input` for shared input frames and labelled inputs.
- `@firna/ui/modal` for web modal frame, portal, model, and layer helpers.
- `@firna/ui/popover` for generic anchored popovers.
- `@firna/ui/radio` for themed titled radio-option cards.
- `@firna/ui/segmented` for themed single-select segmented controls.
- `@firna/ui/switch` for themed binary on/off switches.
- `@firna/ui/theme` for `SharedUiThemeProvider`, default accounting-style
  tokens, the Juno token preset, and `createSharedUiTheme`.

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
package subpath with Node's native ESM resolver, and then verifies the same
subpaths through a Vite build.

The package export map intentionally separates runtime targets:

- The standard `import` condition points at `dist/node/**`, where relative ESM
  specifiers include explicit `.js` files and web platform files are selected
  when they exist.
- The `react-native` condition points at `dist/**`, preserving extensionless
  specifiers so Metro and React Native platform resolution can choose native or
  web files.

## Package Releases

- release-plz opens and updates the release PR for `@firna/ui`.
- The release flow uses `release_always = false`; ordinary pushes to `main`
  update the release PR but do not publish npm versions.
- Merging the release PR lets release-plz create the `vX.Y.Z` tag and GitHub
  release.
- npm publishing runs in the same release-plz workflow invocation that creates
  the GitHub release, using npm trusted publishing. The npm package must
  configure this repository and `.github/workflows/release-plz.yml` as the
  trusted publisher, with allowed action `npm publish`.
- The release-plz workflow can also be manually dispatched with `publish_ref`
  set to a checked `vX.Y.Z` tag if the automatic publish job needs to be
  retried.
- Scoped npm packages default to private, so `publishConfig.access` is set to
  `public`.

## Storybook Deployments

- Main branch Storybook deploys to Cloudflare Pages project
  `firna-ui-storybook`.
- Main URL: `https://firna-ui-storybook.pages.dev`.
- PR previews deploy to Cloudflare branch `pr-<number>`.
- PR preview URL shape:
  `https://pr-<number>.firna-ui-storybook.pages.dev`.
- PR previews are posted through a sticky comment marked
  `<!-- firna-ui-storybook-preview -->`.
- Closing a same-repository PR marks the sticky comment inactive and attempts
  to delete aliased preview deployments for that PR branch; if Cloudflare
  cleanup cannot complete safely, the comment reports the retained reason.
- Storybook examples are grouped under `Dropdown/Examples`, `Modal/Examples`,
  and `Theme/Examples`.
- Required repository variable: `CLOUDFLARE_ACCOUNT_ID`.
- Required repository secret: `CLOUDFLARE_PAGES_API_TOKEN` or
  `CLOUDFLARE_API_TOKEN`.

## Key Code Jumping Points

- Shared theme boundary: [src/theme.tsx](src/theme.tsx)
- Dropdown components: [src/dropdown/README.md](src/dropdown/README.md)
- Modal components: [src/modal/README.md](src/modal/README.md)
- Radio card component: [src/radio/README.md](src/radio/README.md)
- Segmented control component:
  [src/segmented/README.md](src/segmented/README.md)
- Switch component: [src/switch/README.md](src/switch/README.md)
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
