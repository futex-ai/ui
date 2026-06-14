# ui

Shared UI component library for Futex React Native and React Native Web
surfaces. The first consumers are the accounting app and the Juno app.

## Key Features

- Shared dropdown, selector, combobox, segmented control, radio card, switch,
  button, labelled input, modal, and avatar primitives.
- A shared `sm` / `md` / `lg` size scale (`ControlSize`) for buttons and inputs.
- Themeable visual tokens so consumers can use their own brand primary color.
- Expo and React Native Web compatible platform files.
- Focused unit tests, browser interaction tests, and package export checks.
- Storybook previews for visual review on every PR.

## User-Facing Interface

The package name is `@futex/ui`. Public exports are available from:

- `@futex/ui` for all public components and helpers.
- `@futex/ui/avatar` for the themed circular initials avatar.
- `@futex/ui/button` for the themed button with tone, size, and block variants.
- `@futex/ui/dropdown` for dropdown, selector, combobox, and layer helpers.
- `@futex/ui/input` for the labelled text input and bare input frame.
- `@futex/ui/modal` for web modal frame, portal, model, and layer helpers.
- `@futex/ui/radio` for themed titled radio-option cards.
- `@futex/ui/segmented` for themed single-select segmented controls.
- `@futex/ui/switch` for themed binary on/off switches.
- `@futex/ui/theme` for `SharedUiThemeProvider`, default accounting-style
  tokens, the Juno token preset, and `createSharedUiTheme`.

## Developer Get Started

```bash
npm ci
npm test
npm run typecheck
npm run build
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
Storybook is built to `storybook-static`.

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
  `Avatar/Examples`, `Button/Examples`, `Date/Examples`, `Dropdown/Examples`,
  `Input/Examples`, `Modal/Examples`, `Popover/Examples`, `Radio/Examples`,
  `Segmented/Examples`, `Switch/Examples`, and `Theme/Examples`.
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
- Modal components: [src/modal/README.md](src/modal/README.md)
- Radio card component: [src/radio/README.md](src/radio/README.md)
- Segmented control component:
  [src/segmented/README.md](src/segmented/README.md)
- Switch component: [src/switch/README.md](src/switch/README.md)
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
